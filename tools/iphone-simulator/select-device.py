"""Select an available iPhone from the newest installed iOS Simulator runtime."""
import json
import re
import sys

devices = json.load(sys.stdin)["devices"]
candidates = []
for runtime, rows in devices.items():
    if ".iOS-" not in runtime:
        continue
    version = tuple(map(int, re.findall(r"\d+", runtime.rsplit("iOS-", 1)[1])))
    for row in rows:
        if row.get("isAvailable") and row["name"].startswith("iPhone"):
            candidates.append((version, row["name"], row["udid"]))
if not candidates:
    sys.exit("No available iPhone Simulator. This is a failed device check, not a pass.")
version, name, udid = max(candidates)
print(f"Selected {name}, iOS {'.'.join(map(str, version))}", file=sys.stderr)
print(udid)
