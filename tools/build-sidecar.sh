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
// Phones and tablets: touch sticks and buttons the game reads as a controller (lib/touch-controls.mjs).
// Left thumb steers; the big buttons are go, brake, and back on the road. It runs before the game
// module itself, so the game sees the touch controller from its first frame.
const touch = "<script type=\"module\">import { attachTouchGamepad } from \"/lib/touch-controls.mjs?v=touch3\"; attachTouchGamepad({ buttons: [{ button: \"rt\", label: \"🚀\", slot: 0 }, { button: \"lt\", label: \"🛑\", slot: 2 }, { button: \"y\", label: \"↩️\", slot: 1 }], hints: { move: \"Steer\" }, tint: \"#f0b83f\" });</script>";
if (!html.includes("device-tier-boot.js")) {
  html = html.includes("<head>")
    ? html.replace("<head>", "<head>\n    " + tier)
    : tier + html;
}
if (!html.includes("touch-controls.mjs")) {
  html = html.includes("<head>") ? html.replace("<head>", "<head>\n    " + touch) : touch + html;
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
