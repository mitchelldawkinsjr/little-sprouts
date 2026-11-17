#!/usr/bin/env bash
set -euo pipefail
umask 077
keystore=$(mktemp "$RUNNER_TEMP/sprouts-keystore.XXXXXX.jks")
aligned=$(mktemp "$RUNNER_TEMP/sprouts-aligned.XXXXXX.apk")
trap 'rm -f -- "$keystore" "$aligned"' EXIT
printf '%s' "$KEYSTORE" | base64 --decode > "$keystore"
tools="$ANDROID_HOME/build-tools/35.0.0"
"$tools/zipalign" -f -p 4 .fire-build/android/app/build/outputs/apk/release/app-release-unsigned.apk "$aligned"
"$tools/apksigner" sign --ks "$keystore" --ks-key-alias "$ALIAS" \
  --ks-pass env:PASSWORD --key-pass env:KEY_PASSWORD \
  --out little-sprouts-fire-hd8-release.apk "$aligned"
python3 tools/fire-tablet/verify-apk.py little-sprouts-fire-hd8-release.apk "$VERSION" fire-apk-verification.json
