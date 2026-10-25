#!/bin/sh
# Build one self-booting game into sidecars/<id>/ so nginx can serve it
# beside Little Sprouts. The rally is the first guest. Another game can
# reuse this by passing its repo, destination, and URL base.
set -eu
dest="${1:-sidecars/rally}"
base="${2:-/sidecars/rally/}"
repo="${3:-https://github.com/jason-c-dev/backroad-rally.git}"
case "$dest" in
  /*) ;;
  *) dest="$(pwd)/$dest" ;;
esac
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git clone --depth 1 "$repo" "$tmp/src"
cd "$tmp/src"
npm ci
npx vite build --base "$base"
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const page = "dist/index.html";
let html = readFileSync(page, "utf8");
const tag = "<script src=\"/sidecar-guest.js?v=mix-level\"></script>";
if (!html.includes(tag)) {
  html = html.includes("</body>") ? html.replace("</body>", tag + "</body>") : html + tag;
  writeFileSync(page, html);
}
'
if [ -f LICENSE ]; then cp LICENSE dist/LICENSE; fi
rm -rf "$dest"
mkdir -p "$(dirname "$dest")"
cp -a dist "$dest"
