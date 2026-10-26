# Read-aloud voice

All speech goes through `speech.js`. Games never talk to Kokoro or `speechSynthesis` directly. `app.js` calls `say()`, which calls `speak()`.

| File | Job |
|---|---|
| `speech.js` | Public interface. One line at a time, playback, fallback choice, status, and timing logs. |
| `speech-worker.js` | Loads Kokoro (kokoro-js 1.2.1, Kokoro-82M ONNX, `q8` on WASM), generates lines, and keeps the memory and IndexedDB caches. |
| `speech-core.mjs` | Pure logic shared by both, plus the tests: cache keys, PCM checks, engine choice, queue, retries, text clean-up, and voice roles. |
| `speech.test.mjs` | Node tests. They run the real `speech.js` and `speech-worker.js` against stand-in Worker, Web Audio, and speech objects. |

## Using it

```js
import { speak, speakAndWait, stop, prefetchSpeech, prepareSpeech, getSpeechStatus, onSpeechStatus } from './speech.js?v=voice-life';

speak('Find the circle.', voiceId);                    // older call shape; resolves like speakAndWait
const { status, engine } = await speakAndWait('What is 7 × 8?', { voiceId, context: 'mathCoach' });
// status: completed | interrupted | failed | skipped. engine: kokoro | browser | null

stop();                                                // the current line resolves as interrupted
prefetchSpeech(['Try another one.'], { priority: 'next' });
await prepareSpeech({ onProgress: n => {} });          // a grown-up's tap: retries now, reports download progress
```

`speakAndWait` options:

- `fallback: 'not-ready'` is the default for games. While the model is still downloading, a stored line plays in Kokoro and a new one uses the browser voice.
- `fallback: 'on-error'` waits for the download. The Parent corner previews use it.
- `fallback: 'never'` reports `failed` instead of using the browser voice.
- `interrupt: false` returns `skipped` if another line is playing.
- `spell: true` reads letters one at a time.

Every promise settles exactly once. There is only one foreground line at a time. Hiding the tab stops the current line.

## When the browser voice speaks

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

`narrator`, `readingCoach`, and `mathCoach` always use the grown-up's voice. `sportsHost` (`am_michael`) and `gameHost` (`bf_emma`) use their own voices only when **Give game hosts their own voices** is on. Game modes map to roles in `speech-core.mjs`. Within a round, every Kokoro line uses the same voice.

## Debugging

Open with `?voicedebug`, or on localhost. Each line is logged with `console.debug('[voice]', …)`, and `sproutsVoice.status()` returns the state, counters, and the last 50 lines. Logs hold engine, voice, role, length, source, fallback reason, and timings. They never hold the words spoken, and nothing leaves the device.

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
