from pathlib import Path
import tempfile
import unittest

from version import stamp, version_code


class VersionTests(unittest.TestCase):
    def test_semantic_order_and_android_bounds(self):
        self.assertEqual(version_code("1.0.0"), 1000001)
        self.assertEqual(version_code("1.0.1"), 1000002)
        self.assertGreater(version_code("1.10.0"), version_code("1.9.999"))
        for invalid in ("1.0", "v1.0.0", "1.0.0-beta", "01.0.0", "1.1000.0", "1.0.1000", "2100.0.0", "1.0.0; echo unsafe"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                version_code(invalid)

    def test_stamp_and_package_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "build.gradle"
            path.write_text('applicationId "org.littlesprouts.learning"\nversionName "1.0"\nversionCode 1\n')
            self.assertEqual(stamp(path, "1.0.0"), 1000001)
            self.assertIn('versionName "1.0.0"', path.read_text())
            self.assertIn('versionCode 1000001', path.read_text())
            self.assertEqual(stamp(path, "1.0.0"), 1000001)
            path.write_text('applicationId "other.app"\nversionName "1.0"\nversionCode 1')
            with self.assertRaises(ValueError):
                stamp(path, "1.0.0")


if __name__ == "__main__":
    unittest.main()
