"""Open the fixture after a cold simulator boot without hiding playback failures."""
import json
from pathlib import Path
import subprocess
import sys
import time

simulator, url, directory = sys.argv[1:4]
report_path = Path(directory) / "sprouts-safari-startup.json"
attempts = []


def run(arguments, timeout):
    started = time.monotonic()
    try:
        result = subprocess.run(arguments, capture_output=True, text=True, timeout=timeout, check=False)
        return {"exit": result.returncode, "stdout": result.stdout[-2000:],
                "stderr": result.stderr[-2000:], "seconds": round(time.monotonic() - started, 3)}
    except subprocess.TimeoutExpired:
        return {"exit": None, "error": "command-timeout", "seconds": round(time.monotonic() - started, 3)}


def save():
    report_path.write_text(json.dumps({"simulator": simulator, "url": url, "attempts": attempts}, indent=2))


def annotation(level, message):
    message = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::{level} title=iPhone Safari startup::{message}", flush=True)


for number in range(1, 4):
    # A cold MobileSafari launch can time out while its first-run processes
    # initialize. Starting it explicitly lets the following URL request reuse it.
    launch = run(["xcrun", "simctl", "launch", simulator, "com.apple.mobilesafari"], 30)
    opened = run(["xcrun", "simctl", "openurl", simulator, url], 45)
    attempts.append({"number": number, "launch": launch, "openurl": opened})
    save()
    if opened["exit"] == 0:
        annotation("notice", f"Fixture URL opened on attempt {number}; XCTest still must verify actual playback.")
        sys.exit(0)
    annotation("warning", f"URL launch attempt {number} failed: {json.dumps(opened, separators=(',', ':'))}")
    if number < 3:
        time.sleep(3)

annotation("error", "Safari could not open the fixture after three attempts. Native speech is unverified; see the startup report.")
sys.exit(1)
