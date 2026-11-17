"""Plan a signed Fire APK release after the same main commit deploys and passes CI.

No publication occurs here. The release workflow consumes the validated SHA/version.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from version import version_code

REPO = "mitchelldawkinsjr/little-sprouts"
ROOT = f"https://api.github.com/repos/{REPO}"
APK_DIRS = (
    "app/", "games/", "sidecars/", "lib/", "logic/", "icons/",
    "voice/", "vendor/", "for-parents/", "tools/fire-tablet/", "tools/build/",
)
APK_FILES = {
    "index.html", "app.js", "style.css", "logic.mjs", "sheet.csv",
    "manifest.webmanifest", "sw.js", "tools/static-files.mjs",
}


def next_patch_version(version):
    """Patch releases are monotonic under the existing Android versionCode mapping."""
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version):
        raise ValueError("Latest release tag must be a stable semantic version")
    major, minor, patch = map(int, version.split("."))
    if patch < 999:
        patch += 1
    elif minor < 999:
        minor, patch = minor + 1, 0
    else:
        major, minor, patch = major + 1, 0, 0
    candidate = f"{major}.{minor}.{patch}"
    if version_code(candidate) <= version_code(version):
        raise ValueError("New version must increase Android versionCode")
    return candidate


def apk_source_changed(files):
    """Do not release for docs, automation-only, and test-only changes."""
    return any(
        (path in APK_FILES or path.startswith(APK_DIRS))
        and not path.endswith(".md")
        and not path.startswith("tools/fire-tablet/test_")
        for path in files
    )


def verify_result(runs, sha):
    """Returns True for verified SHA, False for failure, None while awaiting CI."""
    matching = [r for r in runs if r.get("head_sha") == sha
                and r.get("head_branch") == "main" and r.get("event") == "push"]
    if not matching:
        return None
    latest = max(matching, key=lambda r: (r.get("run_attempt", 0), r.get("id", 0)))
    if latest.get("status") != "completed":
        return None
    return latest.get("conclusion") == "success"


def api(path, *, allow_404=False):
    token = os.environ["GH_TOKEN"]
    request = Request(
        ROOT + path,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "LittleSprouts-auto-release",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        if allow_404 and error.code == 404:
            return None
        raise


def current_main_sha():
    return api("/git/ref/heads/main")["object"]["sha"]


def verified_same_commit(sha):
    params = urlencode({"branch": "main", "event": "push", "head_sha": sha, "per_page": 100})
    for attempt in range(45):
        runs = api("/actions/workflows/verify.yml/runs?" + params)["workflow_runs"]
        verdict = verify_result(runs, sha)
        if verdict is not None:
            if not verdict:
                raise RuntimeError(f"Verification failed for {sha}; do not publish an APK")
            return
        if current_main_sha() != sha:
            print("A newer main commit arrived while CI ran; skip outdated APK.")
            return False
        if attempt < 44:
            time.sleep(10)
    raise TimeoutError(f"Timed out waiting for verification of {sha}")


def changed_since(tag, sha):
    # Only trusted, stable release tags are passed to git; checkout fetch-depth is 0.
    if not re.fullmatch(r"v?\d+\.\d+\.\d+", tag):
        raise ValueError("Unexpected published release tag")
    subprocess.run(["git", "rev-parse", "--verify", "refs/tags/" + tag], check=True,
                   capture_output=True, text=True)
    output = subprocess.check_output(
        ["git", "diff", "--name-only", "--no-renames", tag, sha], text=True
    )
    return output.splitlines()


def write_output(**values):
    with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
        for key, value in values.items():
            output.write(f"{key}={value}\n")


def main():
    sha = os.environ["SOURCE_SHA"]
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Invalid deployed SHA")
    if current_main_sha() != sha:
        print("Deployment is no longer main HEAD; do not release stale code.")
        return
    if verified_same_commit(sha) is False:
        return
    previous = api("/releases/latest", allow_404=True)
    if not previous:
        print("No signed baseline release exists. Publish 1.0.0 manually first.")
        return
    tag = previous["tag_name"]
    version = tag.removeprefix("v")
    paths = changed_since(tag, sha)
    if not apk_source_changed(paths):
        print("No packaged app/native changes since the last release; skip APK.")
        return
    candidate = next_patch_version(version)
    if current_main_sha() != sha:
        print("main changed during release planning; skip outdated build.")
        return
    write_output(publish="true", version=candidate, sha=sha)
    print(f"Verified deployed commit {sha}. APK update {version} -> {candidate} planned.")


if __name__ == "__main__":
    main()
