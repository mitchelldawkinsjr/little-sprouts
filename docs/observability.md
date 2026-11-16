# Traffic, diagnostics, and offline delivery

Little Sprouts has three separate signals:

| Signal | Where to look | What it measures |
| --- | --- | --- |
| First-party HTTP traffic | `docker compose -f docker-compose.prod.yml logs --since 1h app` | Fixed route categories, HTTP status, request duration and response bytes. Requests include reloads, bots and service-worker cache fills. They are not visits or unique people. |
| Technical diagnostics | Parent corner locally, private Prometheus `link:5180/metrics` and `link` container logs for opted-in devices | First screen/game-ready timing, script/promise/worker errors, offline pack results and size, and speech fallbacks. |
| GA4 | Realtime and Acquisition reports for the configured web stream | Traffic on the optional informational page for parents and educators only. Does not measure learner visits, activity or offline gameplay. |

## Enable GA4 on the parent/educator landing page

1. Create or choose a dedicated GA4 web stream for `https://grow.360web.cloud/for-parents/`. Turn off Enhanced Measurement, Google signals and ads personalization for this deployment. Do not link an advertising destination or set a user ID. Review the applicable disclosure and privacy settings for the informational page before enabling the stream.
2. In the deployment directory on the VPS, put `SPROUTS_GA4_MEASUREMENT_ID=G-...` in the existing Compose `.env` (excluded from Git and deployment sync). For a different deployed hostname also set `SPROUTS_ORIGIN` to that exact origin without a trailing slash.
3. Recreate the service with `docker compose -f docker-compose.prod.yml up -d`. Open `/for-parents/` in a clean browser. There should be no Google tag request before consent. Opt in and check that the dedicated stream shows a page view in Realtime. Opt back out and verify that a reload does not load the tag. Repeat on the root app and a sidecar. Neither should load the GA tag, even with consent on the informational page.

The request for configuration happens only on the informational page. An unset/invalid ID hides the control and never loads the tag. No Google SDK or Measurement Protocol secret is in the learner app. Page views use a canonical path and an external referrer origin if available. No historical GA data is imported. To see traffic on the learner site, use the first-party HTTP counts.

## Verify production diagnostics

- `curl -fsS https://grow.360web.cloud/healthz` checks nginx and the Node relay. The public `/metrics` returns 404. An existing Prometheus can scrape `link:5180/metrics` by joining the private `little-sprouts_paint` Docker network. For a one-off local read, use `docker compose -f docker-compose.prod.yml exec link wget -qO- http://127.0.0.1:5180/metrics`.
- Diagnostic sharing is off by default. Open Parent corner to see the first-screen time and error count without sharing. Once enabled, the browser retains up to 48 allowlisted numeric signals for up to 24 hours and retries after reconnect. The endpoint validates both origin and schema. It never stores names, profiles, answers, URLs, error text, or persistent device IDs. Opting out clears unsent signals. Counts are best effort, not billing or a user-level event log. They reset on Node restart unless scraped into a time-series store.
- The nginx application access log omits URL queries, IPs, referrers and user agents. This does not reconfigure Nginx Proxy Manager, infrastructure logs or the existing friend relay. Check their retention and configuration separately.
- Keep alerts scoped to failures you can act on. Start with the external `/healthz` probe, the ratio of accepted versus rejected diagnostic batches, JS/worker failures, and the fraction of offline warm attempts that end partial. Treat low-consent sample sizes as directional. The first screen metric is navigation-to-paint opportunity, not Core Web Vitals. Sidecar ready is a guest ready message or iframe load fallback, not FPS.

Example Prometheus panels:

```promql
sum by (signal) (increase(sprouts_diagnostic_events_total[1h]))
histogram_quantile(0.95, sum by (le) (rate(sprouts_app_ready_ms_bucket[1h])))
sum by (result) (increase(sprouts_telemetry_batches_total[1h]))
```

## Performance and offline verification

- First render no longer waits for one HEAD per game. `sidecars.json` is built from real entry pages. The app renders first and adds current sidecars to the shelf. Plain development servers can still fall back to HEAD if the catalog is missing.
- Docker produces one minified startup JS bundle, minified CSS, and precompressed gzip files for compressible assets. Runtime-loaded Reach code, voice generation, Three.js and sidecar worlds stay separate. The Node source server does not need a build step.
- Starter saves core, smaller games and active voices by default. Reach is included when enabled. Use **Parent corner → Speech & offline storage → Save full offline pack** for Backroad rally, Skybound climb, Sky deliveries and Reach. Tidewater fishing remains online-only. Switching to the full pack reuses existing content, and the starter selection does not delete large games already cached. New prompts can still need an already prepared Kokoro model or a device voice.
- The live pre-change manifest had 297.9 MB of raw assets. Filtering the same manifest to its default Heart voice and Opus Rally path yields 261.6 MB for Full and 27.0 MB for Starter without Reach (about 90% less by default, before compression). A locally built Starter measured 27.8 MB after bundling. On a cold local Chromium test, requests before the welcome screen fell from 103 to 8, with zero sidecar HEAD requests. That comparison is a local smoke-test observation, not a production timing benchmark. Full preserves the high-fidelity scenes and is therefore still large.
- For a smoke test, open the app with a clean Chromium profile, with DevTools Network open. First render should use one catalog GET and zero sidecar HEADs. Wait for Starter ready, then switch the browser offline, reload, and open a starter sidecar such as Pebble roll. Verify that Tidewater is not listed offline. Reconnect and test the Full selection separately if the device has capacity.
- Run `node --test tests/*.test.mjs server/*.test.mjs`. To check the production build from a disposable copy of the static tree, use `npm --prefix tools/build ci` then `node tools/build/bundle.mjs /path/to/static-copy` and `node tools/static-files.mjs /path/to/static-copy`. Look at the emitted byte counts and check `Content-Encoding: gzip` on `app.js`, `style.css`, and `offline-files.json`. Never bundle in place in the source checkout. The Verify Little Sprouts workflow guards the initial bundle and Starter pack against size regressions.
- To shrink Full next, profile Backroad rally (~109 MB as shipped including both audio formats), Skybound (~75 MB) and Sky deliveries (~24 MB) first. Compare mesh/texture or audio transcoding against the original visuals and audio on real devices. Precompression only shrinks the HTTP transfer. It does not shrink the original assets stored in Cache Storage.
