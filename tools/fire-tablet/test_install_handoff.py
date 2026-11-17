"""Regression checks for the native Fire OS package installer handoff.

The Android release CI also compiles the real Java plugin with Gradle; these
checks guard the storage/URI invariants in the generated Capacitor project.
"""
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
PLUGIN = (ROOT / "tools/fire-tablet/UpdaterPlugin.java").read_text()
INSTALLER = (ROOT / "tools/fire-tablet/install-updater.py").read_text()


class InstallerHandoffTests(unittest.TestCase):
    def test_verified_apk_stays_out_of_purgeable_cache_until_installer_can_read_it(self):
        self.assertIn('new File(getContext().getFilesDir(), "updates")', PLUGIN)
        self.assertNotIn("getContext().getCacheDir()", PLUGIN)
        self.assertIn('<files-path name="updates" path="updates/" />', INSTALLER)
        self.assertNotIn("<cache-path", INSTALLER)
        self.assertIn('getContentResolver().openFileDescriptor(uri, "r")', PLUGIN)
        self.assertIn("descriptor.getStatSize() != apk.length()", PLUGIN)
        self.assertIn("apk.getParentFile().getUsableSpace() < requiredFree", PLUGIN)

    def test_user_confirmed_package_install_has_temporary_uri_permissions(self):
        self.assertIn('new Intent(Intent.ACTION_INSTALL_PACKAGE)', PLUGIN)
        self.assertIn('install.setDataAndType(uri, APK_MIME)', PLUGIN)
        self.assertIn('install.setClipData(ClipData.newRawUri(', PLUGIN)
        self.assertIn('Intent.FLAG_GRANT_READ_URI_PERMISSION', PLUGIN)
        self.assertIn("getContext().grantUriPermission(", PLUGIN)
        self.assertIn('install.setAction(Intent.ACTION_VIEW)', PLUGIN)

    def test_untrusted_or_unverified_download_never_reaches_package_installer(self):
        install = PLUGIN.split('@PluginMethod public void install(PluginCall call) {', 1)[1]
        self.assertLess(install.index("UpdatePolicy.trustedUrl(url)"), install.index("launchInstaller(apk);"))
        self.assertLess(install.index("UpdatePolicy.trustedDigest(digest)"), install.index("launchInstaller(apk);"))
        self.assertLess(install.index("APK checksum mismatch"), install.index("launchInstaller(apk);"))
        self.assertLess(install.index("Unexpected APK package"), install.index("launchInstaller(apk);"))
        self.assertLess(install.index("APK signing certificate differs"), install.index("launchInstaller(apk);"))

    def test_stale_update_cleanup_happens_only_after_install(self):
        self.assertIn("code(archived) <= code(installed)", PLUGIN)
        self.assertIn("cleanupInstalledUpdate();", PLUGIN)
        self.assertIn("apk.delete();", PLUGIN)


if __name__ == "__main__":
    unittest.main()
