"""Read the disposable macOS runner's audio route and test a short output tone."""
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import time
import wave

directory = Path(sys.argv[1])
report = {}
try:
    devices = subprocess.run(["system_profiler", "SPAudioDataType", "-json"],
                             capture_output=True, text=True, timeout=30, check=False)
    (directory / "sprouts-host-audio.json").write_text(devices.stdout)
    report["deviceInspectionExit"] = devices.returncode
    report["devices"] = json.loads(devices.stdout) if devices.stdout.strip() else None
except (OSError, ValueError, subprocess.TimeoutExpired) as error:
    report["deviceInspectionError"] = str(error)

tone = directory / "sprouts-host-audio-probe.wav"
with wave.open(str(tone), "wb") as output:
    rate = 44100
    output.setparams((1, 2, rate, 0, "NONE", "not compressed"))
    output.writeframes(b"".join(struct.pack("<h", round(3000 * math.sin(2 * math.pi * 440 * i / rate)))
                                for i in range(rate // 4)))

started = time.monotonic()
try:
    played = subprocess.run(["afplay", str(tone)], capture_output=True, text=True, timeout=15, check=False)
    report["playback"] = {"exit": played.returncode, "stderr": played.stderr[-1500:],
                          "seconds": round(time.monotonic() - started, 3)}
    ready = played.returncode == 0
except (OSError, subprocess.TimeoutExpired) as error:
    report["playback"] = {"error": str(error), "seconds": round(time.monotonic() - started, 3)}
    ready = False

(directory / "sprouts-host-audio-probe.json").write_text(json.dumps(report, indent=2))
level = "notice" if ready else "warning"
message = "Short host output tone completed." if ready else "Host output tone failed or timed out; native simulator playback may be blocked by the runner audio route."
print(f"::{level} title=macOS host audio probe::{message}")
print(json.dumps(report, indent=2))
# This is a prerequisite diagnostic, not a replacement for the native Safari test.
# Never change permissions, install drivers, or turn a failed playback test green.
