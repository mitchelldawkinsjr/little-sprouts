import unittest
from auto_release import next_patch_version, apk_source_changed, verify_result


class AutoReleaseTests(unittest.TestCase):
    def test_patch_increments_without_decreasing_android_code(self):
        self.assertEqual(next_patch_version("1.0.0"), "1.0.1")
        self.assertEqual(next_patch_version("1.0.998"), "1.0.999")
        self.assertEqual(next_patch_version("1.0.999"), "1.1.0")
        self.assertEqual(next_patch_version("1.999.999"), "2.0.0")
        for invalid in ("v1.0.0", "1.0", "1.0.0-beta", "1.1000.0", "1.0.1000", "01.0.0", "1.0.0; echo hi"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                next_patch_version(invalid)

    def test_skip_docs_workflows_and_tests_but_ship_real_app_assets(self):
        self.assertFalse(apk_source_changed([
            ".github/workflows/fire-tablet-release.yml",
            "docs/screenshots/game.png",
            "README.md",
            "tools/fire-tablet/README.md",
            "tools/fire-tablet/test_version.py",
            "tests/game-discovery.test.mjs",
        ]))
        for name in ("app.js", "style.css", "app/mounts.mjs", "games/maze.js",
                     "sidecars/grass/index.html", "icons/icon-512.png",
                     "tools/fire-tablet/UpdaterPlugin.java", "tools/fire-tablet/stage.py",
                     "tools/build/bundle.mjs", "manifest.webmanifest", "sw.js"):
            with self.subTest(name=name):
                self.assertTrue(apk_source_changed([name]))

    def test_verified_commit_must_be_a_successful_main_push(self):
        sha = "a" * 40
        ok = {"head_sha": sha, "head_branch": "main", "event": "push",
              "status": "completed", "conclusion": "success", "id": 3}
        self.assertTrue(verify_result([ok], sha))
        self.assertIsNone(verify_result([dict(ok, head_sha="b" * 40)], sha))
        self.assertIsNone(verify_result([dict(ok, event="pull_request")], sha))
        self.assertIsNone(verify_result([dict(ok, status="in_progress")], sha))
        self.assertFalse(verify_result([dict(ok, conclusion="failure")], sha))
        self.assertFalse(verify_result([ok, dict(ok, conclusion="failure", id=4)], sha))


if __name__ == "__main__":
    unittest.main()
