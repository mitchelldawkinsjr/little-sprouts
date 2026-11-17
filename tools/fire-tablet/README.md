# Fire HD 8 APK and Wi-Fi updates

The Android package ID is **`org.littlesprouts.learning`**. The launcher and round/adaptive icons are generated from the PWA's canonical `icons/icon-512.png`. Capacitor dependencies are pinned in this directory's package lock; both workflows copy that lock into the generated `.fire-build` project and use `npm ci`. Android uses Java 21, platform 35 and build tools 35.0.0.

## Production signing setup

Use the existing production keystore and alias if any production build has already been installed. Android updates must keep the same package ID, use the same signing key, and increase versionCode. Never generate a replacement key just to unblock a build. Keep encrypted backups of the keystore, alias and passwords in an organization-controlled vault; loss of the key prevents future in-place updates.

If this is the first production build, create the signing key on a trusted administrator's computer, with interactive passwords (not command-line password arguments):

```sh
keytool -genkeypair -keystore little-sprouts-release.jks -alias little-sprouts \
  -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10000
keytool -list -v -keystore little-sprouts-release.jks -alias little-sprouts
```

Record the certificate's SHA-256 fingerprint in the release records. Do not commit the keystore, passwords or base64 encoding. Configure these repository **Actions secrets** in GitHub Settings → Secrets and variables → Actions:

| Secret | Secure value |
| --- | --- |
| `FIRE_APK_KEYSTORE_BASE64` | Base64 encoding of the existing release keystore |
| `FIRE_APK_KEYSTORE_PASSWORD` | Keystore password |
| `FIRE_APK_KEY_ALIAS` | Alias inside that keystore |
| `FIRE_APK_KEY_PASSWORD` | Private-key password |

For the keystore, an administrator can stream the encoding directly to GitHub from their trusted computer without printing it or writing an encoded file:

```sh
base64 < little-sprouts-release.jks | gh secret set FIRE_APK_KEYSTORE_BASE64 --repo mitchelldawkinsjr/little-sprouts
```

Enter the other three values through the secure GitHub UI or `gh secret set`'s interactive prompt. Do not send values in chat, logs, issues or PR comments. `gh secret list` shows names only, but integrations may lack permission to list them. In that case the release workflow's preflight checks all four values and reports only missing variable names, never values. A failed listing does not prove secrets are absent.

## Build and release

The next version for a repository with no published releases is **1.0.0**, versionCode **1000001**. Versions use `major * 1000000 + minor * 1000 + patch + 1`; minor/patch are limited to 999 and Android's versionCode limit is enforced. Do not change this mapping after production publication. For subsequent releases select the next appropriate semantic version above the latest stable release; do not increment a version just to rerun an unpublished build.

1. Open the code PR. **Fire Tablet APK** runs policy/version tests and compiles debug and unsigned release builds without access to production signing credentials. Its downloadable debug APK is for testing only.
2. Run **Publish Fire Tablet Update**, selecting the PR branch and version `1.0.0`, with **publish unchecked**. This checks secret presence, builds, signs, verifies package/version/icons, and uploads `little-sprouts-fire-production-apk` containing the signed APK plus `fire-apk-verification.json`. It does not create a release. First publication requires comparing the reported certificate fingerprint to the administrator's recorded fingerprint.
3. After the PR is merged and credentials are configured, run the same workflow from **main**, with the same unpublished version and **publish checked**. Publishing is blocked on any other branch. The workflow refuses lower/equal versions or a changed signing certificate compared to the previous published APK.
4. The workflow creates a public, stable, non-prerelease GitHub Release with the exact asset **`little-sprouts-fire-hd8-release.apk`**, explicitly marks it latest, and checks the public `/releases/latest` response and GitHub's `sha256:` asset digest against the verified APK. `fire-apk-verification.json` records package, versionCode, APK SHA-256, signing-certificate SHA-256 and source-icon SHA-256. A failed post-publication check needs investigation; do not claim publication verification until it passes.

Example dispatches (the first only builds/signs; the second publishes after merge):

```sh
gh workflow run fire-tablet-release.yml --ref YOUR_PR_BRANCH -f version=1.0.0 -f publish=false
gh workflow run fire-tablet-release.yml --ref main -f version=1.0.0 -f publish=true
```

`apksigner verify --verbose --print-certs` verifies the APK before publication and rejects Android Debug certificates. The decoded keystore is restricted to a temporary runner file and removed on exit. Workflows reuse the configured key; they never create release keys.

## Native updater behavior

Launch/resume and the update button check the public GitHub latest-release endpoint only on a Wi-Fi network with Internet capability. The updater offers stable semantic versions whose mapped versionCode exceeds the installed app, with the exact asset name, trusted repository download URL and a valid SHA-256 digest. It downloads over HTTPS, checks Wi-Fi throughout, enforces a size limit, verifies the checksum, package ID, higher archive versionCode and the same installed signing certificate, and grants the Android installer read access to the cached APK through a narrowly scoped FileProvider. Invalid downloads are deleted.

The native manifest declares network-state and package-install permissions. If Android requires source approval, the updater opens **Allow from this source** for Little Sprouts and asks the user to retry. Android's package installer requires user confirmation; the updater cannot silently approve installation. Wi-Fi checks run while the app is open, not as an OS background job. PR #17's no-release UI behavior is outside these changes.

Existing **debug-signed** installations cannot accept a production-signed update. Install the first production APK manually after backing up any learner data you need; uninstalling can erase local profiles, stars, saves and offline files. Once production signing is installed, future signed updates should preserve data. Devices must permit unknown-app installation for Little Sprouts, have sufficient free storage, and meet Capacitor's Android 6/API 23 minimum; test against the exact Fire OS/WebView version in use.

## Validation and required physical Fire HD 8 checks

Automated checks:

```sh
node --test tests/*.test.mjs server/*.test.mjs
python3 -m unittest discover -s tools/fire-tablet -p 'test_*.py'
javac -d /tmp/sprouts-updater-tests tools/fire-tablet/UpdatePolicy.java tools/fire-tablet/UpdatePolicyTest.java
java -cp /tmp/sprouts-updater-tests org.littlesprouts.learning.UpdatePolicyTest
```

The Android workflows additionally compile the actual plugin and builds. APK verification checks package/version, signing validity, production certificate, bundled PWA icon and decoded launcher PNG pixels. Cloud/unit/build checks do not establish hardware installation success.

On a physical Fire HD 8:

- Confirm launcher/adaptive artwork matches the PWA; app launches, speech, WebGL games, touch/controller input and Back navigation work on the tablet's WebView.
- Install production version N, publish N+1 with the same key, and check automatic launch/resume and manual update detection on Wi-Fi. Confirm identical/older versions and prereleases are not offered.
- Turn Wi-Fi off before a check and during a download. Verify refusal/abort and no installation; retry successfully on Wi-Fi. Test low storage and interrupted downloads.
- Verify a changed checksum, wrong package, same/older archive versionCode and mismatched signing key are rejected without opening the installer.
- With source permission initially disabled, confirm the Fire OS settings screen opens; allow Little Sprouts, retry, approve installation, reopen the app and verify versionCode and retained learner data. Also test cancelling the installer and retrying.
- Confirm a device already running a debug signature receives the manual-reinstall guidance, and that switching to production is explained before data-destructive uninstalling.

Keep release APK/certificate verification reports and tablet results with the release record. No physical-device result should be reported as passed solely from a workflow or emulator.
