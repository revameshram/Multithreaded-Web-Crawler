import threading
import queue
import time
import sqlite3
import logging
from urllib.parse import urlparse, urljoin, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


logger = logging.getLogger(__name__)


def normalize_url(base, link):
    if not link:
        return None

    link = link.strip()
    if not link or link.startswith('#'):
        return None

    joined = urljoin(base, link)
    nofrag, _ = urldefrag(joined)
    parsed = urlparse(nofrag)

    if parsed.scheme not in ('http', 'https'):
        return None
    if not parsed.netloc:
        return None

    scheme = parsed.scheme.lower()
    hostname = parsed.hostname.lower() if parsed.hostname else ''
    port = parsed.port
    if port and not ((scheme == 'http' and port == 80) or (scheme == 'https' and port == 443)):
        netloc = f'{hostname}:{port}'
    else:
        netloc = hostname

    path = parsed.path or '/'
    return parsed._replace(scheme=scheme, netloc=netloc, path=path).geturl()


class Crawler:
    def __init__(self, seeds, max_pages=100, max_depth=2, threads=4, db_path='crawler.db', per_domain=2):
        self.seeds = seeds
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.threads = threads
        self.db_path = db_path
        self.per_domain = per_domain

        self.frontier = queue.Queue()
        self.seen = set()
        self.seen_lock = threading.Lock()
        self.visited = set()
        self.visited_lock = threading.Lock()

        self.domain_locks = {}
        self.domain_locks_lock = threading.Lock()

        self.robots = {}
        self.robots_lock = threading.Lock()

        self.pages_fetched = 0
        self.pages_failed = 0
        self.pages_lock = threading.Lock()
        self.stop_event = threading.Event()
        self.local = threading.local()

        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path, timeout=30)
        c = conn.cursor()
        c.execute('PRAGMA journal_mode=WAL')
        c.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            url TEXT PRIMARY KEY,
            status INTEGER,
            timestamp REAL,
            response_time REAL,
            links TEXT,
            depth INTEGER,
            content_type TEXT,
            error TEXT,
            final_url TEXT
        )
        ''')
        self._ensure_column(c, 'pages', 'depth', 'INTEGER')
        self._ensure_column(c, 'pages', 'content_type', 'TEXT')
        self._ensure_column(c, 'pages', 'error', 'TEXT')
        self._ensure_column(c, 'pages', 'final_url', 'TEXT')
        conn.commit()
        conn.close()

    def _ensure_column(self, cursor, table_name, column_name, column_type):
        cursor.execute(f'PRAGMA table_info({table_name})')
        columns = {row[1] for row in cursor.fetchall()}
        if column_name not in columns:
            cursor.execute(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}')

    def _get_domain_lock(self, domain):
        with self.domain_locks_lock:
            if domain not in self.domain_locks:
                self.domain_locks[domain] = threading.BoundedSemaphore(self.per_domain)
            return self.domain_locks[domain]

    def _get_robots(self, base_url):
        parsed = urlparse(base_url)
        root = f"{parsed.scheme}://{parsed.netloc}"
        with self.robots_lock:
            if root in self.robots:
                return self.robots[root]
            rp = RobotFileParser()
            rp.set_url(urljoin(root, '/robots.txt'))
            try:
                rp.read()
            except Exception:
                # on failure assume allow-all
                rp = None
            self.robots[root] = rp
            return rp

    def _save_page(self, url, status, response_time, links, depth, content_type=None, error=None, final_url=None):
        conn = sqlite3.connect(self.db_path, timeout=30)
        c = conn.cursor()
        now = time.time()
        links_text = '\n'.join(links)
        c.execute(
            '''
            REPLACE INTO pages (
                url, status, timestamp, response_time, links, depth, content_type, error, final_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (url, status, now, response_time, links_text, depth, content_type, error, final_url),
        )
        conn.commit()
        conn.close()

    def _get_session(self):
        session = getattr(self.local, 'session', None)
        if session is None:
            session = requests.Session()
            retry = Retry(
                total=3,
                backoff_factor=0.5,
                status_forcelist=(429, 500, 502, 503, 504),
                allowed_methods=('HEAD', 'GET'),
            )
            adapter = HTTPAdapter(max_retries=retry, pool_connections=self.threads, pool_maxsize=self.threads)
            session.mount('http://', adapter)
            session.mount('https://', adapter)
            session.headers.update({'User-Agent': 'web-crawler/0.2'})
            self.local.session = session
        return session

    def fetch(self, url):
        start = time.time()
        try:
            r = self._get_session().get(url, timeout=(5, 15), allow_redirects=True)
            rt = time.time() - start
            content_type = r.headers.get('Content-Type', '')
            if 'text/html' not in content_type.lower():
                return r.status_code, '', rt, content_type, r.url, 'non-html content skipped'
            return r.status_code, r.text, rt, content_type, r.url, None
        except Exception as e:
            logger.debug('fetch error %s %s', url, e)
            rt = time.time() - start
            return None, None, rt, None, url, str(e)

    def parse_links(self, url, html):
        links = []
        try:
            soup = BeautifulSoup(html, 'lxml')
            for a in soup.find_all('a', href=True):
                href = a['href']
                norm = normalize_url(url, href)
                if norm:
                    links.append(norm)
        except Exception as e:
            logger.debug('parse error %s %s', url, e)
        return list(dict.fromkeys(links))

    def _mark_seen(self, url):
        with self.seen_lock:
            if url in self.seen:
                return False
            self.seen.add(url)
            return True

    def _increment_fetched(self):
        with self.pages_lock:
            self.pages_fetched += 1
            if self.pages_fetched >= self.max_pages:
                self.stop_event.set()

    def _increment_failed(self):
        with self.pages_lock:
            self.pages_failed += 1

    def worker(self):
        while not self.stop_event.is_set():
            try:
                url, depth = self.frontier.get(timeout=3)
            except queue.Empty:
                return

            try:
                if depth > self.max_depth or self.stop_event.is_set():
                    continue

                with self.visited_lock:
                    if url in self.visited:
                        continue
                    self.visited.add(url)

                rp = self._get_robots(url)
                if rp is not None and not rp.can_fetch('*', url):
                    logger.info('disallowed by robots: %s', url)
                    continue

                domain = urlparse(url).netloc
                sem = self._get_domain_lock(domain)
                acquired = sem.acquire(timeout=30)
                if not acquired:
                    logger.debug('could not acquire domain lock for %s', domain)
                    continue

                try:
                    logger.info('fetching [%s] depth=%d', url, depth)
                    status, html, rt, content_type, final_url, error = self.fetch(url)
                    if status is None:
                        self._increment_failed()
                        logger.warning('failed fetch %s', url)
                        self._save_page(url, None, rt, [], depth, content_type=content_type, error=error, final_url=final_url)
                        continue

                    logger.info('fetched [%s] status=%s time=%.3fs', url, status, rt)
                    links = self.parse_links(final_url or url, html) if html else []
                    self._save_page(
                        url,
                        status,
                        rt,
                        links,
                        depth,
                        content_type=content_type,
                        error=error,
                        final_url=final_url,
                    )
                    self._increment_fetched()

                    if self.stop_event.is_set():
                        continue

                    for link in links:
                        if self._mark_seen(link):
                            self.frontier.put((link, depth + 1))
                finally:
                    sem.release()
            finally:
                self.frontier.task_done()

    def run(self):
        for s in self.seeds:
            norm = normalize_url(s, s)
            if norm and self._mark_seen(norm):
                self.frontier.put((norm, 0))

        threads = []
        for _ in range(self.threads):
            t = threading.Thread(target=self.worker, daemon=True)
            t.start()
            threads.append(t)

        # wait for work
        try:
            while any(t.is_alive() for t in threads):
                time.sleep(0.5)
                if self.stop_event.is_set() and self.frontier.empty():
                    break
        except KeyboardInterrupt:
            logger.info('Interrupted, shutting down')
            self.stop_event.set()

        # wait for queue to finish
        self.frontier.join()
