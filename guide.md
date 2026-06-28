# Guide: Running the Web Crawler

This short guide explains how to run the project, what output to expect, and how to verify the crawl completed successfully.

Prerequisites
- Python 3.8+ installed on your machine
- Windows PowerShell (commands below use PowerShell paths)

1) Create and activate the virtual environment

```powershell
python -m venv venv_web_crawler
.\venv_web_crawler\Scripts\Activate.ps1
```

2) Install dependencies

```powershell
python -m pip install -r requirements.txt
```

3) Prepare seeds file
- Edit `seeds.txt` (one URL per line). Example contents:

```
http://example.com
```

4) Run the crawler (example)

```powershell
.\venv_web_crawler\Scripts\python -m crawler.cli --seeds seeds.txt --max-pages 10 --max-depth 2 --threads 4 --per-domain 2 --db crawler.db
```

Flags explained
- `--seeds`: path to seeds file (required)
- `--max-pages`: total pages to fetch before stopping (default 100)
- `--max-depth`: maximum link depth from seeds (default 2)
- `--threads`: number of worker threads (default 4)
- `--per-domain`: max concurrent requests to the same hostname (default 2)
- `--db`: SQLite DB path where results are stored (default `crawler.db`)
- `--verbose`: enables debug logging

What you should see on the console
- Logging lines indicating progress. Example lines:

```
[INFO] fetching [http://example.com] depth=0
[INFO] fetched [http://example.com] status=200 time=0.112s
[INFO] fetching [https://iana.org/domains/example] depth=1
[INFO] fetched [https://iana.org/domains/example] status=200 time=3.3s
```

- If a URL is disallowed by robots.txt you will see:

```
[INFO] disallowed by robots: https://example.org/secret
```

- On failure to fetch a URL you will see a warning:

```
[WARNING] failed fetch https://example.org/somepage
```

How to verify the crawl output (SQLite)

- The crawler writes a `pages` table into the SQLite DB you specified with columns:
  - `url`, `status`, `timestamp`, `response_time`, `links` (newline-separated)
  - `depth`, `content_type`, `error`, `final_url`

- Quick check using Python one-liner (PowerShell):

```powershell
.\venv_web_crawler\Scripts\python -c "import sqlite3;db='crawler.db';conn=sqlite3.connect(db);c=conn.cursor();c.execute('select url,status,response_time from pages');print('\n'.join(f'{r[0]} | {r[1]} | {r[2]}' for r in c.fetchall()));conn.close()"
```

- Expected results for a successful run:
  - You should see lines for each fetched URL with HTTP status (e.g. `200`) and a response time in seconds.
  - The row count should match the number of pages you expect (capped by `--max-pages`).

Example expected behaviour (running with `--max-pages 3` against `example.com`):

```
http://example.com | 200 | 0.11
https://iana.org/domains/example | 200 | 3.33
https://iana.org/ | 200 | 3.39
```

Exit conditions and finish criteria
- The crawler will stop when either:
  - the `--max-pages` limit is reached, OR
  - the frontier (queue) is exhausted (no more discovered URLs within `--max-depth`)

Troubleshooting
- No console output: make sure you enabled the virtualenv and ran the CLI with `--seeds` pointing to a file with at least one URL.
- Empty DB: check that the crawler ran without immediate errors and verify `seeds.txt` contains reachable URLs.
- Slow fetches: remote site latency may be high; try `--threads` increase or run on a faster network.
- Permission errors (Windows): run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` to allow activating the venv script in PowerShell.

Next steps and diagnostics
- To see more detail, rerun with `--verbose`:

```powershell
.\venv_web_crawler\Scripts\python -m crawler.cli --seeds seeds.txt --verbose
```

- To inspect stored links for a given page, query the `links` column in the DB (they are newline-separated).

The project already includes `export_csv.py` if you want a standalone CSV export step.

Repository cleanup
- Temporary demo output files (sample `.db` and `.csv`) were removed from the repository to keep the workspace clean. The crawler writes only to the SQLite DB you provide and will auto-export to CSV if not disabled.
- The crawler now skips non-HTML responses for link extraction and stores the response metadata in the database for later inspection.
