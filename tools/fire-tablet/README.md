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
3. For **manual** releases (especially the first production release), run the workflow from **main** with the desired version and **publish checked**. After the first signed release, normal merged app changes are published automatically following successful deploy and verification. Manual publishing is blocked on any other branch. The workflow refuses lower/equal versions or a changed signing certificate.
4. The workflow creates a public, stable, non-prerelease GitHub Release with the exact asset **`little-sprouts-fire-hd8-release.apk`**, explicitly marks it latest, and checks the public `/releases/latest` response and GitHub's `sha256:` asset digest against the verified APK. `fire-apk-verification.json` records package, versionCode, APK SHA-256, signing-certificate SHA-256 and source-icon SHA-256. A failed post-publication check needs investigation; do not claim publication verification until it passes.

Example dispatches (the first only builds/signs; the second publishes after merge):

```sh
gh workflow run fire-tablet-release.yml --ref YOUR_PR_BRANCH -f version=1.0.0 -f publish=false
gh workflow run fire-tablet-release.yml --ref main -f version=1.0.0 -f publish=true
```

`apksigner verify --verbose --print-certs` verifies the APK before publication and rejects Android Debug certificates. The decoded keystore is restricted to a temporary runner file and removed on exit. Workflows reuse the configured key; they never create release keys.

## Automatic signed updates after a healthy deployment

Once the **first production-signed release** is published and the four signing secrets are configured, merging changes into `main` can publish the next Fire APK automatically:

1. `Deploy to mitch-cloud` deploys the merged `main` commit and checks the VPS container's health.
2. `Publish Fire Tablet Update` starts **only after that push-based deployment succeeds**. The planning job waits for `Verify Little Sprouts` to succeed for the **exact same commit**. Failure, a missing result or a newer `main` commit prevents publication.
3. The planner compares source files with the latest stable release tag. Documentation-only, workflow-only and test-only changes do not create APK releases. Game assets, native updater code and packaged web assets do.
4. The next patch version is calculated from the **latest GitHub Release** (for example, `1.0.0` → `1.0.1`; roll over `1.0.999` → `1.1.0`). The existing signed APK build, policy checks, signing-certificate continuity check and SHA-256 verification still run. Automatic and manual publishing share one concurrency lock.
5. Before publishing, the workflow checks again that `main` still points to the deployed commit. If newer work lands while signing, it refuses to publish a stale APK. The GitHub Release is tagged at the exact deployed commit, not at an unrelated workflow head.

The automation **never creates a first production signing identity** or publishes an unsigned/debug APK. Bootstrap the first production release with the manual instructions above. The manual `workflow_dispatch` remains available for verifying a signed APK without publishing, controlled releases and retries. Monitor failures in [Publish Fire Tablet Update](../../.github/workflows/fire-tablet-release.yml) / GitHub Actions; a failed check will not create an update.

Installed production-signed Fire tablets are offered a new published version when the app starts or resumes on Wi-Fi. Installation still requires the user's approval in Fire OS; the app cannot silently replace itself.

## Native updater behavior

Launch/resume and the update button check the public GitHub latest-release endpoint only on a Wi-Fi network with Internet capability. The updater offers stable semantic versions whose mapped versionCode exceeds the installed app, with the exact asset name, trusted repository download URL and a valid SHA-256 digest. It downloads over HTTPS, checks Wi-Fi throughout, enforces a size limit, verifies the checksum, package ID, higher archive versionCode and the same installed signing certificate, and grants the Android installer read access to the verified APK through a narrowly scoped FileProvider. The file stays in private non-cache storage during installation, with temporary URI permissions (including ClipData) for Fire OS package installers; stale files are removed after a successful update. Invalid downloads are deleted.

The native manifest declares network-state and package-install permissions. If Android requires source approval, the updater opens **Allow from this source** for Little Sprouts and asks the user to retry. Android's package installer requires user confirmation; the updater cannot silently approve installation. Wi-Fi checks run while the app is open, not as an OS background job. PR #17's no-release UI behavior is outside these changes.

Existing **debug-signed** installations cannot accept a production-signed update. Install the first production APK manually after backing up any learner data you need; uninstalling can erase local profiles, stars, saves and offline files. Once production signing is installed, future signed updates should preserve data. Devices must permit unknown-app installation for Little Sprouts, have sufficient free storage, and meet Capacitor's Android 6/API 23 minimum; test against the exact Fire OS/WebView version in use.

## Fire tablet error: "There was a problem parsing the package"

A successful GitHub release and APK signature check do **not** prove that Fire OS received permission to read the staged file. The native updater checks the signed APK checksum, package ID, version and certificate before asking Android's installer to open it, but Fire OS can still report a parse error when the external installer cannot read the app's private copy or when storage/device compatibility is a problem.

The installer handoff now puts updates in `getFilesDir()/updates/` (not Android's purgeable cache), confirms that its FileProvider URI can be opened, and supplies `ClipData` and read grants to the installer. It uses the package-install action with an APK-view fallback, and only removes staged updates after the installed version catches up. This is a **compatibility fix**, not proof that a given Fire OS version works: verify on physical hardware.

**Recovery for an already-installed older APK:** its embedded updater cannot be patched over the air until a newer build can be installed. Without uninstalling Little Sprouts, first try opening the signed APK from the official [GitHub Releases](https://github.com/mitchelldawkinsjr/little-sprouts/releases/latest) in the tablet's Silk browser, download fully, and open it from Downloads. Ensure at least 1 GB free internal storage, allow Silk to install apps if prompted, and keep the existing app installed. If the same parse error occurs for the browser download, inspect Fire OS/API level and use `adb install -r path/to.apk` to retrieve the exact package manager error; do not uninstall to troubleshoot.

If it works from Silk but fails from the in-app updater, the issue is likely the installer handoff. A debug-signed APK cannot update a production-signed installation (and vice versa); a mismatch usually produces an installation/signature error rather than a parsing error. Never delete the existing installation to bypass that mismatch before backing up learner data.

## Reliable spoken prompts

The generated Android project registers `SproutsSpeech` alongside the updater. App prompts use packaged recordings through native MediaPlayer first, then the tablet's native English TextToSpeech engine for other lines or missing recordings. The APK speech path does not rely on a Kokoro model download or WebView `speechSynthesis`. The website keeps its existing browser speech path.

The tablet needs an available English speech engine/voice for prompts that have no recording. Check its English voice data before testing offline. Parent corner reports native voice readiness; playback failures show **Hear it again** instead of silently treating an unfinished line as completed. A selected Kokoro character voice controls included recordings, while dynamic APK prompts use the available native English voice.

The native bridge checks readiness, handles audio focus and activity pauses, bounds initialization/playback waits, cancels stale utterances and releases native resources. Completion requires the player's or speech engine's actual completion callback. Returning to the app can recover an interrupted current prompt; game changes and explicit stops discard stale recovery work. Diagnostic reports use engine/readiness/status codes and never the spoken question text.

Installing a rebuilt APK is required to receive this native plugin. See [the speech guide](../../docs/voice.md#apk-checks-on-a-physical-fire-hd-8) for the Fire HD 8 test matrix, including new prompts offline, repeated game changes, screen lock/resume, missing voice data, audio-focus interruptions, replay and read-aloud off.

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
