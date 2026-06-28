# Web Crawler (resume / interview project)

This project is a prototype multi-threaded web crawler in Python.

Quickstart

- Create the venv and install deps (PowerShell):

```powershell
python -m venv venv_web_crawler
venv_web_crawler\Scripts\python -m pip install -r requirements.txt
```

- Run the crawler:

```powershell
venv_web_crawler\Scripts\python -m crawler.cli --seeds seeds.txt --max-pages 100 --threads 8
```

Files
- [crawler](crawler) — package with crawler implementation and CLI.
- [requirements.txt](requirements.txt) — Python dependencies.
- [create_venv.ps1](create_venv.ps1) — helper to create venv and install deps on Windows.
