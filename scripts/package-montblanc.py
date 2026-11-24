#!/usr/bin/env python3
"""Package the self-contained skiing game, source data, art and verification scripts."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'artifacts/montblanc-ski.zip'
TARGET.parent.mkdir(exist_ok=True)
with ZipFile(TARGET, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted((ROOT / 'static/games').iterdir()):
        if path.is_file() and path.suffix in {'.js', '.css', '.html', '.svg'}:
            if path.name == 'leaderboard-config.js':
                archive.writestr('static/games/leaderboard-config.js', "window.ARCADE_LEADERBOARD_CONFIG={apiBase:''};\n")
            else:
                archive.write(path, path.relative_to(ROOT))
    for folder in ['static/games/vendor', 'static/games/ski-data']:
        for path in sorted((ROOT / folder).rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(ROOT))
    for name in ['scripts/build-montblanc.py', 'scripts/package-montblanc.py', 'tests/ski-world.test.cjs', 'tests/ski-view.test.mjs']:
        archive.write(ROOT / name, name)
    archive.write(ROOT / 'docs/montblanc-ski.md', 'README.md')
    archive.writestr('static/index.html', '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=games/?game=ski3d"><title>勃朗峰 · 雪境</title>')
    archive.writestr('RUN.txt', 'Run from the extracted folder:\npython3 -m http.server 8080 --directory static\n\nOpen http://localhost:8080/games/?game=ski3d\n\nOptional verification (Node.js):\nnode --test tests/ski-world.test.cjs tests/ski-view.test.mjs\n\nThis standalone export saves scores locally. The homepage project retains its configured online leaderboard.\n')
print(f'{TARGET}: {TARGET.stat().st_size:,} bytes')
