"""Stage the existing static app for Capacitor's embedded local server."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[2]
out = root / ".fire-build"
www = out / "www"
www.mkdir(parents=True, exist_ok=True)

# The app is a static site, not a root-level Vite/npm application.
# Preserve relative paths used by game shelves and imported ES modules.
directories = ("sidecars", "vendor", "lib", "app", "logic", "games", "icons", "voice", "for-parents")
for name in directories:
    src = root / name
    if src.is_dir():
        shutil.copytree(src, www / name, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns(".git", "node_modules", "*.map"))

for src in root.iterdir():
    if src.is_file() and src.suffix.lower() in (".html", ".js", ".mjs", ".css", ".csv", ".json", ".webmanifest", ".svg", ".png", ".ico", ".woff", ".woff2"):
        shutil.copy2(src, www / src.name)

if not (www / "index.html").is_file():
    raise SystemExit("Missing index.html")
(out / "capacitor.config.json").write_text('''{
  "appId": "org.littlesprouts.learning",
  "appName": "Little Sprouts",
  "webDir": "www",
  "server": { "androidScheme": "https" },
  "android": { "allowMixedContent": false }
}
''')
print("Staged web assets:", sum(1 for p in www.rglob("*") if p.is_file()))
