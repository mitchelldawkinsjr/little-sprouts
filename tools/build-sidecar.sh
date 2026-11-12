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
const tier = "<script src=\"/lib/device-tier-boot.js?v=low-end1\"></script>";
const guest = "<script src=\"/lib/sidecar-guest.js?v=low-end1\"></script>";
if (!html.includes("device-tier-boot.js")) {
  html = html.includes("<head>")
    ? html.replace("<head>", "<head>\n    " + tier)
    : tier + html;
}
if (!html.includes(guest)) {
  html = html.includes("</body>") ? html.replace("</body>", guest + "</body>") : html + guest;
}
writeFileSync(page, html);
'
if [ -f LICENSE ]; then cp LICENSE dist/LICENSE; fi
rm -rf "$dest"
mkdir -p "$(dirname "$dest")"
cp -a dist "$dest"
