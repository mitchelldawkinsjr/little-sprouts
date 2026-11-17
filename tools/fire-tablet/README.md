# Amazon Fire HD 8 Android APK (initial implementation)

This workflow packages the **existing static Little Sprouts app** with Capacitor and produces an installable **debug APK** as a GitHub Actions artifact. It does not require Google Play or Amazon Appstore.

## Build
Open the **Fire Tablet APK** check for the pull request. After it succeeds, download the `little-sprouts-fire-hd8-debug-apk` artifact from the run summary, unzip it, and transfer `little-sprouts-fire-hd8.apk` to the Fire tablet. After the workflow lands on the default branch, you can also run it manually under **Actions → Fire Tablet APK**. Enable **Install unknown apps** for the app used to open the APK, then open it.

## Important limitations / acceptance testing
- This is a first build pipeline, **not yet a verified working Fire HD 8 release**. Check the workflow logs and test on the physical device.
- The repository's game pages and imported assets are copied locally. Audit each game for CDN imports, runtime fetches, WebSockets, online multiplayer and external resources before promising complete offline operation.
- Verify Android System WebView compatibility, WebGL/Three.js performance, touch input, controller input, audio, orientation, and Android Back navigation on Fire OS.
- This is a **debug-signed** APK for sideload testing, not a release-signed production build. Later builds need a stable signing key to support upgrades without uninstalling.
- Some assets may make the APK very large. Inspect the artifact size and consider per-game asset packs before distribution.
- Multiplayer requiring remote services remains online-only; local multiplayer must be tested separately.
- Do not merge until CI builds and at least one HD 8 smoke test passes.
