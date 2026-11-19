"""Expose native XCTest evidence without changing the test step's exit status."""
import json
import os
from pathlib import Path
import sys


def escaped(message):
    return message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def failure_messages(value):
    messages = []
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {"message", "failureText", "failureMessage", "issueText", "details"} and isinstance(item, str):
                messages.append(item)
            elif isinstance(item, (dict, list)):
                messages.extend(failure_messages(item))
    elif isinstance(value, list):
        for item in value:
            messages.extend(failure_messages(item))
    return messages


summary_path, build_path = map(Path, sys.argv[1:3])
outcome = os.environ.get("SPROUTS_SAFARI_TEST_OUTCOME", "unknown")
summary = {}
if summary_path.is_file():
    try:
        summary = json.loads(summary_path.read_text())
    except (OSError, ValueError) as error:
        print(f"Could not read XCTest summary JSON: {error}")

lines = [f"Native iPhone Safari XCTest step: **{outcome}**."]
if summary:
    result = summary.get("result", "not reported")
    lines.append(f"XCTest result: **{result}**.")
    counts = {key: summary[key] for key in ("passedTests", "failedTests", "skippedTests") if key in summary}
    if counts:
        lines.append(f"Test counts: `{json.dumps(counts, sort_keys=True)}`.")
    if summary.get("devicePlatforms"):
        lines.append(f"Simulator: `{json.dumps(summary['devicePlatforms'], sort_keys=True)}`.")
else:
    lines.append("No XCTest summary was produced. Native playback is unverified for this run.")
lines.append("See the iphone-safari-speech-evidence artifact for the full XCTest result and screenshot.")
print("\n".join(lines))
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as output:
        output.write("\n\n".join(lines) + "\n")

failed = outcome == "failure" or str(summary.get("result", "")).lower() in {"failed", "failure"}
if failed:
    messages = failure_messages(summary.get("testFailures", summary))
    if not messages and build_path.is_file():
        build = build_path.read_text(errors="replace").splitlines()
        selected = [line for line in build if any(word in line.lower() for word in ("error:", "failed", "timed out"))]
        messages = (selected or build)[-10:]
    text = "\n".join(dict.fromkeys(messages)) or "The native Safari test failed before creating an XCTest result or build log."
    print(f"::error title=iPhone Simulator Safari verification failed::{escaped(text[:4000])}")
    if outcome == "success":
        sys.exit(1)
elif outcome == "success":
    if summary.get("passedTests", 0) < 1 or summary.get("failedTests", 0) or summary.get("skippedTests", 0):
        print("::error::Native playback is unverified: require at least one passing XCTest, zero failures and zero skipped tests.")
        sys.exit(1)
    print(f"::notice title=iPhone Simulator Safari verified::{escaped(' '.join(lines[:3]))}")
