"""Regressions for the generated Fire Tablet Android project."""
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

            wrapper = root / ".fire-build/android/gradle/wrapper/gradle-wrapper.properties"
            wrapper.parent.mkdir(parents=True)
            wrapper.write_text(
                "distributionBase=GRADLE_USER_HOME\n"
                r"distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-all.zip" "\n"
                "networkTimeout=10000\n"
                "validateDistributionUrl=true\n"
            )
            for _ in range(2):
                subprocess.run([sys.executable, str(tools / "install-updater.py")],
                               cwd=root, check=True, capture_output=True, text=True)
            wrapper_lines = wrapper.read_text().splitlines()
            self.assertCountEqual(wrapper_lines, [
                "distributionBase=GRADLE_USER_HOME",
                "validateDistributionUrl=true",
                r"distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-bin.zip",
                "distributionSha256Sum=f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6",
                "networkTimeout=120000",
            ])
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
            for name in ("android.hardware.camera", "android.hardware.camera.autofocus", "android.hardware.camera.any", "android.hardware.microphone"):
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
