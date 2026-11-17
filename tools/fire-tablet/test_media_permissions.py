"""Regressions for Fire Tablet friend QR camera and chirp microphone permissions."""
import shutil
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


SOURCE = Path(__file__).resolve().parent
ANDROID = "{http://schemas.android.com/apk/res/android}"


class FriendMediaPermissionsTests(unittest.TestCase):
    def test_generated_capacitor_manifest_grants_optional_camera_and_mic_permissions(self):
        # The generated Android project is temporary; exercise the real patcher
        # rather than asserting that the source contains a couple of strings.
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            tools = root / "tools/fire-tablet"
            tools.mkdir(parents=True)
            for file in ("install-updater.py", "UpdaterPlugin.java", "UpdatePolicy.java", "SpeechPlugin.java"):
                shutil.copy2(SOURCE / file, tools / file)
            main = root / ".fire-build/android/app/src/main"
            main.mkdir(parents=True)
            manifest = main / "AndroidManifest.xml"
            manifest.write_text('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="org.littlesprouts.learning">
  <uses-permission android:name="android.permission.INTERNET" />
  <application android:label="Little Sprouts" />
</manifest>''')
            gradle = root / ".fire-build/android/app/build.gradle"
            gradle.write_text("// minimal generated test build.gradle\n")

            for _ in range(2):
                subprocess.run([sys.executable, str(tools / "install-updater.py")],
                               cwd=root, check=True, capture_output=True, text=True)
            document = ET.parse(manifest).getroot()
            permissions = [node.get(ANDROID + "name") for node in document.findall("uses-permission")]
            for permission in (
                "android.permission.CAMERA", "android.permission.RECORD_AUDIO",
                "android.permission.MODIFY_AUDIO_SETTINGS",
                "android.permission.ACCESS_NETWORK_STATE", "android.permission.REQUEST_INSTALL_PACKAGES",
            ):
                self.assertEqual(permissions.count(permission), 1, permission)
            self.assertIn("android.permission.INTERNET", permissions)

            features = document.findall("uses-feature")
            for name in ("android.hardware.camera.any", "android.hardware.microphone"):
                found = [node for node in features if node.get(ANDROID + "name") == name]
                self.assertEqual(len(found), 1)
                self.assertEqual(found[0].get(ANDROID + "required"), "false")
            provider = document.find("application/provider")
            self.assertIsNotNone(provider)
            self.assertEqual(provider.get(ANDROID + "grantUriPermissions"), "true")
            activity = main / "java/org/littlesprouts/learning/MainActivity.java"
            self.assertIn("extends BridgeActivity", activity.read_text())
            self.assertIn("registerPlugin(UpdaterPlugin.class)", activity.read_text())
            # The camera/mic prompt is handled by the stock Capacitor 7
            # BridgeWebChromeClient, preserving other Capacitor WebView behaviors.
            self.assertNotIn("setWebChromeClient", activity.read_text())


if __name__ == "__main__":
    unittest.main()
