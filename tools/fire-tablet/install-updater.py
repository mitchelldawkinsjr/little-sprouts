"""Apply Little Sprouts patches to the generated Capacitor Android project."""
from pathlib import Path
import xml.etree.ElementTree as ET
root = Path(__file__).resolve().parents[2]
android = root / ".fire-build/android"
wrapper = android / "gradle/wrapper/gradle-wrapper.properties"
# Capacitor generates a fresh wrapper for both APK workflows. Keep its Gradle
# version, but download only the binaries and tolerate slower CI connections.
# Official checksum: https://gradle.org/release-checksums/#v8.11.1
distribution = r"https\://services.gradle.org/distributions/gradle-8.11.1"
settings = {
    "distributionUrl": distribution + "-bin.zip",
    "distributionSha256Sum": "f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6",
    "networkTimeout": "120000",
}
lines = wrapper.read_text(encoding="utf-8").splitlines()
urls = [line.partition("=")[2] for line in lines if line.startswith("distributionUrl=")]
if urls not in ([distribution + "-all.zip"], [settings["distributionUrl"]]):
    raise SystemExit("Unexpected Capacitor Gradle distribution. Review the pinned version and checksum.")
lines = [line for line in lines if line.partition("=")[0] not in settings]
lines.extend(f"{key}={value}" for key, value in settings.items())
wrapper.write_text("\n".join(lines) + "\n", encoding="utf-8")

app = android / "app/src/main"
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
# Capacitor already declares a FileProvider with authority ${applicationId}.fileprovider.
# A second provider using the same FileProvider class causes AndroidX to resolve
# the first provider's authority, breaking getUriForFile for .updates.
# Reuse Capacitor's provider and extend its path mapping for staged updates.
providers = [node for node in application.findall("provider")
             if node.get(attr("authorities")) == "${applicationId}.fileprovider"]
if len(providers) != 1:
    raise SystemExit("Expected exactly one Capacitor FileProvider")
provider = providers[0]
metadata = [node for node in provider.findall("meta-data")
            if node.get(attr("name")) == "android.support.FILE_PROVIDER_PATHS"]
if len(metadata) != 1:
    raise SystemExit("Capacitor FileProvider paths metadata missing")
resource = metadata[0].get(attr("resource"), "")
if not resource.startswith("@xml/"):
    raise SystemExit("Unexpected Capacitor FileProvider path resource")
xml = app / "res/xml"
paths_file = xml / (resource[5:] + ".xml")
if not paths_file.is_file():
    raise SystemExit(f"Capacitor FileProvider paths missing: {paths_file}")
paths_tree = ET.parse(paths_file)
paths_root = paths_tree.getroot()
if paths_root.tag != "paths":
    raise SystemExit("Unexpected Capacitor FileProvider paths root")
if not any(node.tag == "files-path" and node.get("name") == "sprouts_updates"
           for node in paths_root):
    ET.SubElement(paths_root, "files-path", {"name": "sprouts_updates", "path": "updates/"})
    ET.indent(paths_tree, space="    ")
    paths_tree.write(paths_file, encoding="utf-8", xml_declaration=True)
# Remove the legacy duplicate provider if an earlier patch already installed it.
for node in list(application.findall("provider")):
    if node.get(attr("authorities")) == "${applicationId}.updates":
        application.remove(node)
ET.indent(tree, space="    ")
tree.write(manifest, encoding="utf-8", xml_declaration=True)
gradle = android / "app/build.gradle"
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
