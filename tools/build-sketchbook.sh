#!/bin/sh
# Build the pinned Sketchbook runtime into the sidecar. Run once while online.
set -eu
root="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
dest="${1:-sidecars/sketchbook/build}"
case "$dest" in /*) ;; *) dest="$(pwd)/$dest";; esac
pin=62f4b7986fd1ce1e4f91daba89ef032c20a6ce55
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
git -C "$temp" init -q
git -C "$temp" fetch -q --depth=1 https://github.com/swift502/Sketchbook.git "$pin"
git -C "$temp" checkout -q --detach FETCH_HEAD
git -C "$temp" apply --unidiff-zero "$root/sketchbook/upstream.patch"
(cd "$temp" && npm ci --ignore-scripts --no-audit --no-fund && NODE_OPTIONS=--openssl-legacy-provider npm run build)
node "$root/sketchbook/prepare-world.mjs" "$temp/build/assets/world.glb" "$temp/build/assets/world-lite.glb"
mkdir -p "$dest/assets"
cp "$temp/build/sketchbook.min.js" "$dest/"
for asset in world-lite boxman car heli airplane; do cp "$temp/build/assets/$asset.glb" "$dest/assets/"; done
