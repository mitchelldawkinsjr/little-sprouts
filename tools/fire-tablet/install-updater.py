"""Patch the generated Capacitor Android project with the native Wi-Fi updater."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[2]
app = root / ".fire-build/android/app/src/main"
java = app / "java/org/littlesprouts/learning"
java.mkdir(parents=True, exist_ok=True)
(java / "UpdaterPlugin.java").write_text((root / "tools/fire-tablet/UpdaterPlugin.java").read_text())
(java / "MainActivity.java").write_text("""package org.littlesprouts.learning;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(UpdaterPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
""")
manifest = app / "AndroidManifest.xml"
text = manifest.read_text()
text = text.replace("<application", '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n    <application', 1)
provider = """<provider android:name="androidx.core.content.FileProvider"
 android:authorities="${applicationId}.updates" android:exported="false"
 android:grantUriPermissions="true">
 <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/sprouts_update_paths" />
 </provider>"""
text = text.replace("</application>", provider + "\n</application>", 1)
manifest.write_text(text)
xml = app / "res/xml"
xml.mkdir(parents=True, exist_ok=True)
(xml / "sprouts_update_paths.xml").write_text('<?xml version="1.0" encoding="utf-8"?><paths xmlns:android="http://schemas.android.com/apk/res/android"><cache-path name="updates" path="." /></paths>')
print("Installed native updater")
