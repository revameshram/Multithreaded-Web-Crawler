import argparse
import logging
import sys
from pathlib import Path

from .crawler import Crawler


def read_seeds(path):
    p = Path(path)
    if not p.exists():
        return []
    return [l.strip() for l in p.read_text().splitlines() if l.strip()]


def main():
    parser = argparse.ArgumentParser(description='Simple multi-threaded crawler')
    parser.add_argument('--seeds', required=True, help='Path to seeds file (one URL per line)')
    parser.add_argument('--max-pages', type=int, default=100, help='Maximum pages to fetch')
    parser.add_argument('--max-depth', type=int, default=2, help='Maximum crawl depth')
    parser.add_argument('--threads', type=int, default=4, help='Worker threads')
    parser.add_argument('--db', default='crawler.db', help='SQLite DB path')
    parser.add_argument('--per-domain', type=int, default=2, help='Maximum concurrent requests per domain')
    parser.add_argument('--verbose', action='store_true', help='Enable debug logging')
    parser.add_argument('--export-out', default=None, help='Automatically export results to CSV path (default: <db>.csv)')
    parser.add_argument('--no-export', action='store_true', help='Disable automatic CSV export after crawl')

    args = parser.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format='[%(levelname)s] %(message)s',
    )
    seeds = read_seeds(args.seeds)
    if not seeds:
        print('No seeds found in', args.seeds)
        sys.exit(1)

    c = Crawler(
        seeds,
        max_pages=args.max_pages,
        max_depth=args.max_depth,
        threads=args.threads,
        db_path=args.db,
        per_domain=args.per_domain,
    )
    c.run()

    # Automatic CSV export (enabled by default). Use --no-export to disable.
    if not args.no_export:
        out = args.export_out
        if not out:
            from pathlib import Path
            out = f"{Path(args.db).stem}.csv"
        try:
            import export_csv
            export_csv.export(args.db, out)
        except Exception as e:
            print('Export to CSV failed:', e)


if __name__ == '__main__':
    main()
