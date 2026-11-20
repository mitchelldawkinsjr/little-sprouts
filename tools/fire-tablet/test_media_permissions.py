"""Regressions for the generated Fire Tablet Android project."""
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


SOURCE = Path(__file__).resolve().parent
ANDROID = "{http://schemas.android.com/apk/res/android}"


class GeneratedAndroidProjectTests(unittest.TestCase):
    def test_generated_project_preserves_media_permissions_and_reuses_file_provider(self):
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
  <application android:label="Little Sprouts">
    <provider android:name="androidx.core.content.FileProvider"
      android:authorities="${applicationId}.fileprovider" android:exported="false"
      android:grantUriPermissions="true">
      <meta-data android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
    </provider>
    <provider android:name="androidx.core.content.FileProvider"
      android:authorities="${applicationId}.updates" android:exported="false"
      android:grantUriPermissions="true" />
  </application>
</manifest>''')
            paths_file = main / "res/xml/file_paths.xml"
            paths_file.parent.mkdir(parents=True)
            paths_file.write_text('''<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
  <external-path name="my_images" path="." />
  <cache-path name="my_cache_images" path="." />
</paths>''')
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
                result = subprocess.run([sys.executable, str(tools / "install-updater.py")],
                                        cwd=root, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
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
            providers = document.findall("application/provider")
            self.assertEqual(len(providers), 1)
            provider = providers[0]
            authority = provider.get(ANDROID + "authorities")
            self.assertEqual(authority, "${applicationId}.fileprovider")
            self.assertEqual(provider.get(ANDROID + "exported"), "false")
            self.assertEqual(provider.get(ANDROID + "grantUriPermissions"), "true")
            metadata = provider.findall("meta-data")
            self.assertEqual(len(metadata), 1)
            self.assertEqual(metadata[0].get(ANDROID + "name"), "android.support.FILE_PROVIDER_PATHS")
            self.assertEqual(metadata[0].get(ANDROID + "resource"), "@xml/file_paths")

            paths = ET.parse(paths_file).getroot()
            self.assertCountEqual([(node.tag, node.get("name"), node.get("path")) for node in paths], [
                ("external-path", "my_images", "."),
                ("cache-path", "my_cache_images", "."),
                ("files-path", "sprouts_updates", "updates/"),
            ])
            plugin = main / "java/org/littlesprouts/learning/UpdaterPlugin.java"
            suffix = authority.removeprefix("${applicationId}")
            self.assertRegex(plugin.read_text(), r'FileProvider\.getUriForFile\(getContext\(\),'
                             r'\s*getContext\(\)\.getPackageName\(\)\s*\+\s*"' + re.escape(suffix) + '"')
            activity = main / "java/org/littlesprouts/learning/MainActivity.java"
            self.assertIn("extends BridgeActivity", activity.read_text())
            self.assertIn("registerPlugin(UpdaterPlugin.class)", activity.read_text())
            # The camera/mic prompt is handled by the stock Capacitor 7
            # BridgeWebChromeClient, preserving other Capacitor WebView behaviors.
            self.assertNotIn("setWebChromeClient", activity.read_text())


if __name__ == "__main__":
    unittest.main()
