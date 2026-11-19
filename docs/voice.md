# Read-aloud voice

Spoken prompts in the main app go through `lib/speech.js`. `app.js` calls `say()`, which calls `speak()`. The Android APK uses the native speech bridge described below; the website uses Kokoro and its browser fallback. Some standalone sidecar pages have their own browser-speech fallback, so test those pages separately from their embedded APK flow.

| File | Job |
|---|---|
| `lib/speech.js` | Public interface. One line at a time, playback, fallback choice, status, and timing logs. |
| `lib/speech-worker.js` | Loads Kokoro (kokoro-js 1.2.1, Kokoro-82M ONNX, `q8` on WASM), generates lines, and keeps the memory and IndexedDB caches. |
| `lib/speech-core.mjs` | Pure logic shared by both, plus the tests: cache keys, PCM checks, engine choice, queue, retries, text clean-up, and voice roles. |
| `tools/fire-tablet/SpeechPlugin.java` | Android-only playback: packaged recordings, English TextToSpeech, audio focus, completion events, timeouts and lifecycle cleanup. |
| `tests/speech.test.mjs` | Node tests. They run the real `lib/speech.js` and `lib/speech-worker.js` against stand-in Worker, Web Audio, and speech objects. |
| `tests/speech-ios.test.mjs` | iPhone gesture gates, delayed speech, recordings, pause, and background recovery with stand-ins. |
| `tools/browser/iphone-speech.mjs` | WebKit and Chromium touch checks with real recording playback and a simulated iOS speech gate. |

## iPhone Safari and the Home Screen app

iOS unlocks browser speech separately from Web Audio. Calling only
`AudioContext.resume()` does not permit `speechSynthesis.speak()` after a file
fetch, cache lookup, or worker message. WebKit can silently ignore that first
delayed speech request without sending an error or start event.

On a trusted `touchend`, `click`, or `keydown`, the shared voice module resumes
Web Audio and sends one empty, muted browser utterance inside the gesture. This
unlocks later questions without speaking extra words or canceling an active
question. Synthetic clicks cannot unlock it. Subsequent gestures also resume a
paused browser speech service; closed Web Audio contexts are recreated. Android
continues to use its native bridge.

The iOS restriction is implemented in WebKit's
[`SpeechSynthesis::speak()`](https://github.com/WebKit/WebKit/blob/7c0987e6939e7e87c5fa4c3e55253d4a57675636/Source/WebCore/Modules/speech/SpeechSynthesis.cpp#L162).
Linux WebKit does not include that iOS-only gate, so the browser test models it
explicitly while using real trusted touch events and real Web Audio. Run:

```sh
npm --prefix tools/browser ci
cd tools/browser
npx playwright install --with-deps webkit
npm run test:iphone
```

CI runs that check with WebKit and Chromium. It decodes and plays a real shipped
AAC recording, then checks delayed questions, paused speech, and failed-question
retry. The Node suite additionally checks background interruptions and stale
completion callbacks.

Before shipping, check audible output on a physical iPhone in both Safari and
the installed Home Screen app: launch a game by tapping, hear a question that
has no included recording, tap Hear it again, answer several questions, lock and
unlock the phone, then return and tap again. Also check included recordings and
Read aloud off. This Linux environment has no Apple iPhone simulator; WebKit
checks cannot verify the device's voice service, speaker, or silent-switch behavior.

## Using it

```js
import { speak, speakAndWait, stop, prefetchSpeech, prepareSpeech, getSpeechStatus, onSpeechStatus } from './lib/speech.js?v=voice-life';

speak('Find the circle.', voiceId);                    // older call shape; resolves like speakAndWait
const { status, engine } = await speakAndWait('What is 7 × 8?', { voiceId, context: 'mathCoach' });
// status: completed | interrupted | failed | skipped.
// engine: native-file | native-tts (APK), kokoro | browser (website), or null

stop();                                                // the current line resolves as interrupted
prefetchSpeech(['Try another one.'], { priority: 'next' });
await prepareSpeech({ onProgress: n => {} });          // a grown-up's tap: retries now, reports download progress
```

`speakAndWait` options (the `fallback` settings apply to the website):

- `fallback: 'not-ready'` is the default for games. While the model is still downloading, a stored line plays in Kokoro and a new one uses the browser voice.
- `fallback: 'on-error'` waits for the download. The Parent corner previews use it.
- `fallback: 'never'` reports `failed` instead of using the browser voice.
- `interrupt: false` returns `skipped` if another line is playing.
- `spell: true` reads letters one at a time.

Every promise settles exactly once. There is only one foreground line at a time. Hiding the tab stops the current line. On the APK, returning to the foreground can retry the interrupted prompt; changing games or explicitly stopping speech clears that recovery candidate. Stale native callbacks cannot finish a newer request.

## Android APK speech

The APK uses **included recording → native Android TextToSpeech** for app prompts. The native bridge plays matching `voice/1/<voice>/<hash>.m4a` clips from the APK's `assets/public` directory through Android MediaPlayer. Other prompts use the tablet's installed English speech engine. A missing or unreadable recording can use native speech. This path does not need Kokoro's model download or WebView `speechSynthesis`.

The selected Kokoro voice still chooses included recordings. Dynamic APK prompts use the tablet's available offline English voice, so their sound can differ from those recordings. Native speech uses the same media-volume stream as game audio. Embedded lesson prompts are routed to the host speech service as well.

The installed English engine and voice data must be available on the tablet. The bridge checks initialization, language support and offline voice availability. Parent corner reports the tablet's voice readiness; a missing English voice asks a grown-up to check the tablet's speech settings. Selecting a Kokoro voice still selects its included recordings, but dynamically generated APK prompts use the available native English voice rather than promising a matching Kokoro character voice.

Native playback has a bounded initialization and start wait, and a completion watchdog. Success is reported only for MediaPlayer's completion callback or Android TextToSpeech's utterance-completion callback. A timeout, missing voice, failed audio focus or playback error is a failure, not a successful silent line. Native audio focus is held for speech and released when it finishes, stops or loses focus. Pausing the activity stops current speech, and destruction releases the native player and speech engine. Returning and replaying recheck the speech path so an earlier engine failure does not permanently disable read-aloud.

The shared speech queue still prevents overlapping prompts, cancels stale work on game changes and ducks game sounds while speech is playing. A failed line shows one accessible message with **Hear it again**, rather than an alert for every engine callback. The retry uses the speech layer's private failed-prompt candidate; diagnostics do not expose the words spoken. Reading off and friend-join hush still prevent playback.

The website keeps its Kokoro/browser path. Its Web Audio completion watchdog treats missing completion as a failure; a suspended context must not be reported as completed, and a closed context is recreated on the next attempt.

## APK checks on a physical Fire HD 8

Build/install the APK containing the native plugin; changing website files alone does not update an already-installed APK. Automated mocks and Android compilation cannot confirm what comes out of the tablet's speaker.

| Scenario | Expected |
|---|---|
| Fresh install, before any voice-model download | Included recordings and a new math/word prompt speak without waiting for Kokoro. |
| Wi-Fi off after installing the tablet's English voice | Both an included recording and a new prompt speak; no model or network voice is required. |
| Switch among learning games and 3D sidecars at least 20 times | Each new question speaks once; Hear it again works without overlapping earlier prompts. |
| Home button, screen lock, or another app interrupts a prompt | Speech stops; returning recovers the current prompt without speaking a prompt from a game already left. |
| Missing English voice/engine, then configure it in tablet settings | A clear message replaces silence; Hear this voice / Hear it again works after the voice is available. |
| Another app owns or interrupts audio focus | No silent success; retry works after returning focus to Little Sprouts. |
| Read-aloud off or join-a-friend hush | No automatic or retry speech leaks through. |
| Rapid Next, Back, game changes and repeated Hear it again | Stale completions do not finish or cancel the current prompt, and speech does not overlap. |

Record Fire model, Fire OS version, WebView version, English engine/voice readiness, whether the failed line used a packaged recording or native speech, and the safe error code. Keep learner names and question text out of shared diagnostic logs.

## When the website's browser voice speaks

| Kokoro state | New line | Line already stored |
|---|---|---|
| Downloading (`idle` / `loading`) | Browser voice (`not-ready`) | Kokoro, from storage |
| `ready`, clip starts within 2 s | Kokoro | Kokoro |
| `ready`, still waiting after 2 s | Browser voice (`stall`). The Kokoro clip is saved when it finishes, so the next time is Kokoro. | — |
| `failed` (download or model error) | Browser voice (`engine-failed`) | Kokoro, from storage |
| `unsupported` (no Worker, WASM, or Web Audio) | Browser voice (`unsupported`) | — |

Other fallback reasons are `synth-error`, `bad-audio` (PCM failed the check), `audio-locked` (audio context still suspended), and `worker-error`. A failed load is retried automatically after 5 s, 30 s, and 2 min, then stops for the visit. Automatic retries only start on the home screen or at the start of a round, never in the middle of one. **Hear this voice** retries right away.

## Worker messages

Requests:

- `INIT`
- `SYNTHESIZE {id, text, voice, speed, cachedOnly}`
- `PREFETCH {items, priority}`
- `CANCEL {id}`
- `CLEAR_CACHE`
- `GET_STATUS`

Replies:

- `READY {loadMs}`
- `PROGRESS {progress}`
- `AUDIO {id?, text, voice, speed, samples, rate, source, synthMs}`
- `ERROR {id?, kind: load | synth | miss | storage}`
- `STATUS {model, cache}`

Only the newest `SYNTHESIZE` can answer. Older ids are dropped, even if their audio finishes later. That audio is still cached. A model load failure is reported once. Prefetched audio without an `id` is also sent to the page, so those lines play even while the worker is busy generating.

## Caching

- Lines that never change (feedback, how-tos, and the other fixed prompts in `bakedLines`) ship as audio files under `voice/1/<voice>/`. They play before Kokoro has downloaded. A missing file falls through to generation. `node tools/bake-voice.mjs` renders them again for every voice; bump `BAKE_VERSION` when the clips change so browsers do not keep the old files.
- Keys are `v4|<model>|q8|<voice>|<speed>|<text>`, so voices, speeds, and model versions never share a clip.
- The page keeps 48 clips. The worker keeps 32 in memory and 160 in IndexedDB (`sprouts-voice`, schema version 3, unchanged).
- Clips with older keys are removed by the first trim of a visit. After that, the least recently heard clips go first.
- A stored clip that fails the PCM check is deleted. The first storage-full error trims to half. A second one turns saving off for the visit.
- Another tab upgrading the database closes this tab's connection instead of blocking it.

Text is cleaned before speaking and before building keys:

- `×` becomes "times", `+` becomes "plus", and `=` becomes "equals".
- `2s` becomes "twos".
- Emoji are removed.
- Mr., Dr., and similar abbreviations are spelled out.

`warm()` on the home screen prefetches the common feedback lines. Starting a word game prefetches that game's prompts for the learner's first 8 sight words. `wordPrompt()` in `app.js` builds both the prefetched and the spoken prompt, so the two can't drift apart. Sidecar games (dirt ride, rally, flight, walk) prefetch each question when it is chosen, a few seconds before its card opens, plus their right and wrong lines.

## Timing and the mix

- `say()` queues: a question waits for the line already playing instead of cutting it off. **Hear it again** cuts in. Leaving a round or starting a game clears the queue.
- Sidecar questions are spoken when the card opens (the guest's `show` message).
- Each Kokoro clip is raised so its loudest point reaches 0.95 (at most 3×). The browser voice plays at full volume.
- While a line is audible, the page sends `{ type: 'duck', on }` to the sidecar. The dirt bike plays at 0.32 and dips to 0.08. `sidecar-guest.js` routes everything a guest sends to the speakers through one gain: 0.4, dipping to 0.12.

## Voice roles

`narrator`, `readingCoach`, and `mathCoach` always use the grown-up's voice. `sportsHost` (`am_michael`) and `gameHost` (`bf_emma`) use their own voices only when **Give game hosts their own voices** is on. Game modes map to roles in `lib/speech-core.mjs`. Within a round, every Kokoro line uses the same voice.

## Debugging

Open with `?voicedebug`, or on localhost. Each line is logged with `console.debug('[voice]', …)`, and `sproutsVoice.status()` returns the state, counters, and the last 50 lines. Logs hold engine, voice, role, length, source, fallback reason, and timings. They never hold the words spoken, and nothing leaves the device.

APK status also identifies the native path and native English/offline readiness. Read-aloud failure messages use known reason codes, not raw native exceptions. Do not infer audible success from a resolved plugin call unless its status is completed; do not treat a timeout as completed playback.

## Measured on October 24, 2026

All runs: desktop Chrome in Cursor's built-in browser, macOS, 10 cores. Times are from `sproutsVoice.status()`.

| Case | Result |
|---|---|
| First visit, model load (no cross-origin isolation) | 8.2 s |
| Revisit, model load from the browser cache | 0.85 s |
| New line, single-thread WASM (plain `python3 -m http.server`) | 4.8 s to generate 2.2 s of audio |
| New line, with COOP/COEP headers like `nginx.conf` (multi-thread) | 3.3 s to generate 3.0 s of audio |
| New line while a prefetch is generating | Waits up to one prefetch job (about 2.5 s), then generates |
| Stored line after reload | Starts in 3 ms |
| Prefetched or repeated line | Starts in 1 ms |
| Home hello on first visit, before the model is ready | Browser voice, reason `not-ready` |
| Fast taps | The first line resolves `interrupted`. Only the newest line plays. |
| Parent corner, all five voice roles | All five `completed`, in order, with the right voices |

Not measured yet: Android Chrome, iOS Safari, macOS Safari, and low-memory devices. Use the checklist below on each.

## Checks to run by hand

Run each check in desktop Chrome, Android Chrome, iOS Safari, and macOS Safari.

| Scenario | Expected |
|---|---|
| First visit, clear site data, open a game at once | First prompts in the browser voice. Parent corner shows download %. Kokoro takes over once ready. |
| Tap **Hear this voice** on first visit | Button shows %, then the sample plays in Kokoro. The button comes back after the audio ends. |
| Same game question twice | Second time starts at once, in the same voice. |
| Tap Next quickly 5 times | No overlapping speech. Only the last prompt plays. |
| Change the voice in Parent corner | New prompts use the new voice, with no old-voice clips. |
| Turn read-aloud off mid-round | Nothing else is spoken. |
| Turn on game host voices, then play Gas race and Hook the fish | Each uses its host voice. Word and math games keep the grown-up's voice. |
| Block `cdn.jsdelivr.net` (DevTools request blocking), reload | Browser voice. Parent corner says it could not load. Stored lines still play in Kokoro. |
| Lock the phone or switch tabs while a line plays | Speech stops. Nothing hangs. The next prompt plays normally. |
| Fill storage (DevTools, simulate a custom quota) | Game keeps playing. Lines still play from memory. |
| iOS: open, wait, then let a timed prompt play before any tap | Falls back to the browser voice (`audio-locked`) if audio is still locked. After one tap, Kokoro plays. |

## Outside dependencies

- `https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1` loads the library, and `https://huggingface.co` loads the model and voices. Both are pinned and fetched by the worker.
- A Content-Security-Policy would need `script-src` and `connect-src` for both hosts, plus `worker-src 'self'`.
- `nginx.conf` sends COOP `same-origin` and COEP `credentialless`, so WASM can use more than one thread. Without them it still works, just slower (see above).
- Hosting `kokoro-js`, the ONNX model, and the voice files on the same server would make loads more predictable. Saved lines would also keep working with no network. That would mean serving about 90 MB.
