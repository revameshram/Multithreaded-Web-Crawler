"""Export crawler SQLite `pages` table to CSV.

Usage:
  python export_csv.py --db crawler.db --out pages.csv

Defaults:
  db: crawler.db
  out: pages.csv
"""
import argparse
import sqlite3
import csv
import sys
from pathlib import Path


def export(db_path, out_path, table='pages', limit=None):
    if not Path(db_path).exists():
        print(f'Database not found: {db_path}')
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    q = f'SELECT url, status, timestamp, response_time, links FROM {table}'
    if limit:
        q += f' LIMIT {int(limit)}'

    cur.execute(q)
    rows = cur.fetchall()

    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['url', 'status', 'timestamp', 'response_time', 'links'])
        for r in rows:
            # links is stored as newline-separated text; keep as-is
            writer.writerow([r[0], r[1], r[2], r[3], r[4]])

    conn.close()
    print(f'Wrote {len(rows)} rows to {out_path}')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--db', default='crawler.db', help='SQLite DB path')
    p.add_argument('--out', default='pages.csv', help='Output CSV path')
    p.add_argument('--table', default='pages', help='Table name (default: pages)')
    p.add_argument('--limit', type=int, help='Limit number of rows')
    args = p.parse_args()

    export(args.db, args.out, table=args.table, limit=args.limit)


if __name__ == '__main__':
    main()
