"""Check signing continuity and publish/verify a stable GitHub APK release."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from version import version_code

REPO = "mitchelldawkinsjr/little-sprouts"
API = f"https://api.github.com/repos/{REPO}/releases/latest"
ASSET = "little-sprouts-fire-hd8-release.apk"


def latest():
    try:
        with urlopen(Request(API, headers={"Accept": "application/vnd.github+json", "User-Agent": "LittleSprouts-release"}), timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise


def run(*args):
    return subprocess.check_output(args, text=True).strip()


version = sys.argv[1]
previous = latest()
metadata = json.loads(Path("fire-apk-verification.json").read_text())
if previous:
    old_version = previous["tag_name"].removeprefix("v")
    if version_code(version) <= version_code(old_version):
        raise SystemExit("Release version must increase")
    asset = next((a for a in previous["assets"] if a["name"] == ASSET), None)
    if not asset:
        raise SystemExit("Latest stable release has no APK to establish signing continuity; review the existing release before publishing")
    if asset:
        with tempfile.TemporaryDirectory() as directory:
            subprocess.run(["gh", "release", "download", previous["tag_name"], "--repo", REPO,
                            "--pattern", ASSET, "--dir", directory], check=True)
            apk = Path(directory) / ASSET
            if asset.get("digest") != "sha256:" + hashlib.sha256(apk.read_bytes()).hexdigest():
                raise SystemExit("Previous APK digest is absent or invalid")
            import re
            certs = run(os.environ["ANDROID_HOME"] + "/build-tools/35.0.0/apksigner", "verify", "--print-certs", str(apk))
            old = re.search(r"Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)", certs)
            if not old or old[1].lower() != metadata["signingCertificateSha256"]:
                raise SystemExit("Signing key changed: refuse to publish an incompatible update")

if sys.argv[2] == "publish":
    subprocess.run(["gh", "release", "create", version, ASSET, "fire-apk-verification.json", "--repo", REPO,
                    "--target", os.environ["GITHUB_SHA"], "--latest", "--title", f"Little Sprouts Fire {version}",
                    "--notes", "Signed Fire tablet update. Android installation approval is required. See fire-apk-verification.json for version, checksum, and signing certificate."], check=True)
    release = latest()
    if not release or release["tag_name"] != version or release["draft"] or release["prerelease"]:
        raise SystemExit("Public /releases/latest did not return the new stable release")
    asset = next(a for a in release["assets"] if a["name"] == ASSET)
    if asset.get("digest") != "sha256:" + metadata["sha256"]:
        raise SystemExit("Published APK digest differs from the verified signed APK")
    print(json.dumps({"url": release["html_url"], "version": version, "digest": asset["digest"]}))
else:
    print("Signing continuity and version checks passed; no release published")
