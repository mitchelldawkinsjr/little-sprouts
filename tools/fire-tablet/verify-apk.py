"""Verify APK identity, version, launcher resources and its production signature."""
from pathlib import Path
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import zipfile
from PIL import Image

from version import version_code

apk, version, output = sys.argv[1:]
tools = Path(os.environ["ANDROID_HOME"]) / "build-tools/35.0.0"
signed = subprocess.check_output([str(tools / "apksigner"), "verify", "--verbose", "--print-certs", apk], text=True)
print(signed)
if "Android Debug" in signed:
    raise SystemExit("Debug signing is not a production release")
fingerprint = re.search(r"Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)", signed)
if not fingerprint or len(fingerprint[1]) != 64:
    raise SystemExit("Missing signing certificate fingerprint")
badging = subprocess.check_output([str(tools / "aapt"), "dump", "badging", apk], text=True)
expected = f"package: name='org.littlesprouts.learning' versionCode='{version_code(version)}' versionName='{version}'"
if not badging.startswith(expected):
    raise SystemExit("APK package or version does not match release input")
with zipfile.ZipFile(apk) as archive:
    source = hashlib.sha256(Path("icons/icon-512.png").read_bytes()).hexdigest()
    if hashlib.sha256(archive.read("assets/public/icons/icon-512.png")).hexdigest() != source:
        raise SystemExit("Bundled PWA icon differs from canonical source")
    # AAPT may crunch PNGs and add density API qualifiers; compare decoded artwork.
    generated = Path(".fire-build/android/app/src/main/res")
    for path in generated.glob("mipmap-*/ic_launcher*.png"):
        density = path.parent.name
        resource = next(name for name in archive.namelist()
                        if re.fullmatch(r"res/" + density + r"(?:-v[0-9]+)?/" + path.name, name))
        actual = Image.open(io.BytesIO(archive.read(resource))).convert("RGBA")
        expected_image = Image.open(path).convert("RGBA")
        if actual.size != expected_image.size or actual.tobytes() != expected_image.tobytes():
            raise SystemExit(f"Launcher icon mismatch: {path}")
metadata = {
    "package": "org.littlesprouts.learning", "version": version,
    "versionCode": version_code(version), "sha256": hashlib.sha256(Path(apk).read_bytes()).hexdigest(),
    "signingCertificateSha256": fingerprint[1].lower(), "pwaIconSha256": source,
}
Path(output).write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps(metadata))
