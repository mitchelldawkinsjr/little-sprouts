"""Generate Android launcher icons from the PWA's canonical icon."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[2]
source = root / "icons/icon-512.png"
if not source.exists():
    raise SystemExit("PWA icon missing: icons/icon-512.png")
img = Image.open(source).convert("RGBA")
if img.size != (512, 512):
    raise SystemExit(f"Unexpected PWA icon dimensions: {img.size}")
res = root / ".fire-build/android/app/src/main/res"
sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for density, size in sizes.items():
    dest = res / f"mipmap-{density}"
    dest.mkdir(parents=True, exist_ok=True)
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(dest / "ic_launcher.png")
    resized.save(dest / "ic_launcher_round.png")
# Adaptive icon: preserve the original PWA artwork and provide breathing room
# so the system's circular/squircle mask doesn't crop the artwork.
for density, size in sizes.items():
    dest = res / f"mipmap-{density}"
    canvas = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    foreground = img.resize((size, size), Image.Resampling.LANCZOS)
    canvas.alpha_composite(foreground, (size // 2, size // 2))
    canvas.save(dest / "ic_launcher_foreground.png")
values = res / "values"
values.mkdir(parents=True, exist_ok=True)
(values / "sprouts_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?><resources><color name="sprouts_launcher_background">#FAF9F5</color></resources>'
)
adaptive = res / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
for name in ("ic_launcher", "ic_launcher_round"):
    (adaptive / f"{name}.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">'
        '<background android:drawable="@color/sprouts_launcher_background"/>'
        '<foreground android:drawable="@mipmap/ic_launcher_foreground"/>'
        '</adaptive-icon>'
    )
print("Android launcher icons generated from", source)
