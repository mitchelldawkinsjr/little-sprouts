"""Patch the generated Capacitor Android project with the native Wi-Fi updater."""
from pathlib import Path
import xml.etree.ElementTree as ET
root = Path(__file__).resolve().parents[2]
app = root / ".fire-build/android/app/src/main"
java = app / "java/org/littlesprouts/learning"
java.mkdir(parents=True, exist_ok=True)
(java / "UpdaterPlugin.java").write_text((root / "tools/fire-tablet/UpdaterPlugin.java").read_text())
(java / "UpdatePolicy.java").write_text((root / "tools/fire-tablet/UpdatePolicy.java").read_text())
(java / "SpeechPlugin.java").write_text((root / "tools/fire-tablet/SpeechPlugin.java").read_text())
(java / "MainActivity.java").write_text("""package org.littlesprouts.learning;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle savedInstanceState) {
    registerPlugin(UpdaterPlugin.class);
    registerPlugin(SpeechPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
""")
manifest = app / "AndroidManifest.xml"
android_ns = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", android_ns)
attr = lambda name: f"{{{android_ns}}}{name}"
tree = ET.parse(manifest)
document = tree.getroot()
application = document.find("application")
if application is None:
    raise SystemExit("Generated Android manifest has no application")
if not any(action.get(attr("name")) == "android.intent.action.TTS_SERVICE"
           for action in document.findall("queries/intent/action")):
    queries = document.find("queries")
    if queries is None:
        queries = ET.SubElement(document, "queries")
    intent = ET.SubElement(queries, "intent")
    ET.SubElement(intent, "action", {attr("name"): "android.intent.action.TTS_SERVICE"})
# Capacitor 7's BridgeWebChromeClient already prompts at runtime when the
# embedded HTTPS WebView calls getUserMedia. Without Android manifest entries
# that prompt cannot grant the camera (QR scan) or microphone (pairing chirps).
# It also requests MODIFY_AUDIO_SETTINGS alongside RECORD_AUDIO.
media_permissions = (
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS",
)
for permission in ("android.permission.ACCESS_NETWORK_STATE", "android.permission.REQUEST_INSTALL_PACKAGES", *media_permissions):
    entries = [node for node in document.findall("uses-permission") if node.get(attr("name")) == permission]
    if not entries:
        ET.SubElement(document, "uses-permission", {attr("name"): permission})
    for duplicate in entries[1:]:
        document.remove(duplicate)
# Do not mark camera/microphone as required hardware: older Fire devices or
# Wi-Fi-only tablets can still play all games that do not capture media.
for feature in ("android.hardware.camera", "android.hardware.camera.autofocus", "android.hardware.camera.any", "android.hardware.microphone"):
    entries = [node for node in document.findall("uses-feature") if node.get(attr("name")) == feature]
    if not entries:
        entries = [ET.SubElement(document, "uses-feature", {attr("name"): feature})]
    entries[0].set(attr("required"), "false")
    for duplicate in entries[1:]:
        document.remove(duplicate)
providers = [node for node in application.findall("provider")
             if node.get(attr("authorities")) == "${applicationId}.updates"]
if not providers:
    provider = ET.SubElement(application, "provider", {
        attr("name"): "androidx.core.content.FileProvider", attr("authorities"): "${applicationId}.updates",
        attr("exported"): "false", attr("grantUriPermissions"): "true",
    })
    ET.SubElement(provider, "meta-data", {
        attr("name"): "android.support.FILE_PROVIDER_PATHS", attr("resource"): "@xml/sprouts_update_paths",
    })
for duplicate in providers[1:]:
    application.remove(duplicate)
ET.indent(tree, space="    ")
tree.write(manifest, encoding="utf-8", xml_declaration=True)
xml = app / "res/xml"
xml.mkdir(parents=True, exist_ok=True)
(xml / "sprouts_update_paths.xml").write_text('<?xml version="1.0" encoding="utf-8"?><paths xmlns:android="http://schemas.android.com/apk/res/android"><files-path name="updates" path="updates/" /></paths>')
gradle = root / ".fire-build/android/app/build.gradle"
text = gradle.read_text()
if "// Sprouts native audio assets" not in text:
    gradle.write_text(text + """
// Sprouts native audio assets: AssetManager.openFd requires uncompressed recordings.
android {
    androidResources {
        noCompress += ['m4a']
    }
}
""")
print("Installed native updater")
