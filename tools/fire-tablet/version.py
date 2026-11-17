"""Validate a stable release version and stamp the generated Android project."""
from pathlib import Path
import re
import sys


def version_code(version):
    if not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", version):
        raise ValueError("Use a stable semantic version, e.g. 1.0.0")
    major, minor, patch = map(int, version.split("."))
    code = major * 1_000_000 + minor * 1_000 + patch + 1
    if minor > 999 or patch > 999 or code > 2_100_000_000:
        raise ValueError("Version exceeds Android versionCode range")
    return code


def stamp(path, version):
    code = version_code(version)
    text = path.read_text()
    if 'applicationId "org.littlesprouts.learning"' not in text:
        raise ValueError("Unexpected Android package ID")
    text, names = re.subn(r'versionName\s+"[^"]+"', f'versionName "{version}"', text)
    text, codes = re.subn(r'versionCode\s+\d+', f'versionCode {code}', text)
    if names != 1 or codes != 1:
        raise ValueError("Expected one versionName and versionCode")
    path.write_text(text)
    return code


if __name__ == "__main__":
    version = sys.argv[1]
    path = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    print(stamp(path, version) if path else version_code(version))
