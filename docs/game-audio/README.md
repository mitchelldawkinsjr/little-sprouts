# Little Sprouts — Shared Game Audio

**Working branch:** `feat/game-audio-gpt6`  
**Base:** `main`  
**Status:** Implemented on this feature branch (shared engine, settings, semantic SFX, six original music themes). PR #22 is awaiting final validation; physical Fire HD 8 tests and deeper per-game sound tuning remain outstanding.

## Goal

Create consistent, fun, accessible gameplay sound effects, music, and environmental ambience across Little Sprouts — on web, PWA, and the offline Fire Tablet APK — without obscuring spoken learning questions or inflating the APK substantially.

## Existing foundations to reuse

| Existing source | Available capability |
| --- | --- |
| `lib/sidecar-guest.js` | Sidecar Web Audio gain mixing; host sends `duck` while a learning question is spoken. Current nominal/duck levels are 0.4 / 0.12. |
| `app/helpers.mjs` | Tracks spoken-question state and broadcasts `postSidecar({ type: 'duck', on })`. |
| `sidecars/range/sound.mjs` | Lightweight procedural Web Audio effects without asset downloads. |
| `sidecars/paint-the-plan/src/audio/audio.js` | Procedural SFX, positional audio and loop interfaces. |
| `sidecars/paint-the-plan/src/audio/music.js` | Generated music. |
| `sidecars/station-scout/src/core/audio.js` | 3D environmental audio and generated music. |
| `sidecars/grass/game.mjs` | Grass Maze's existing synthesized sound effects. |

**Avoid double attenuation:** Several sidecar games already create gain stages. The shared engine should coordinate ducking with existing mixers, rather than multiplying one ducking stage by another.

## Phase A — Shared foundation

**Target modules**

```text
lib/game-audio-policy.mjs      Pure event names, categories, settings/defaults
lib/game-audio.mjs             AudioContext, master/music/SFX/ambience buses, lifecycle
lib/game-audio-presets.mjs     Theme mapping by game ID
app/game-audio.mjs             Start/home/quiz/settings integration
tests/game-audio.test.mjs      Policy, mute, ducking, lifecycle regression tests
```

**Work items**
- [ ] Expose `unlock()` / `start(gameId)` / `play(event, options)` / `music(theme)` / `duck(on)` / `pause()` / `resume()` / `stop()` and `dispose()`.
- [ ] Make `unlock()` run on an actual Play or user-input gesture, respecting Android WebView autoplay restrictions; repeated calls must be safe.
- [x] Separate **narration**, **effects**, **music** and **ambience**. Never mix gameplay audio into the narration bus.
- [x] Store independent music/effects/ambience mute and volume preferences; preserve the existing **Read to me** setting and its behavior.
- [x] When host narration begins, fade music/ambience down promptly; restore gradually after speech ends. Support multiple overlapping/nested duck requests safely.
- [x] Stop old game audio when navigating home, changing games, entering an end screen, hiding the app, or unmounting an iframe.
- [x] Avoid duplicate AudioContexts, duplicate loops, stuck sounds and unbounded event/voice pools.
- [x] Use lightweight generated SFX as the default. Add actual audio assets only where their quality substantially matters.
- [x] Expose a safe game-audio control/configuration message to sidecars; handle embedded and stand-alone games.
- [x] Build graceful silent fallback on unsupported, interrupted, or suspended audio devices.

**Acceptance:** Game narration always remains intelligible; mute settings persist; a new game does not inherit previous music or effects; game playback works without Wi-Fi after offline download.

## Phase B — Common gameplay events

Use one set of semantic events so existing and new games can opt in without their own sound implementations.

| Event | Suggested feedback |
| --- | --- |
| `ui.select`, `ui.back`, `ui.start` | Light tap, close, startup cue |
| `quiz.correct`, `quiz.incorrect` | Joyful two-/three-tone reward, soft try-again cue |
| `reward.star`, `reward.level-up`, `reward.win` | Sparkle, ascending fanfare, completion flourish |
| `player.jump`, `player.land`, `player.step` | Boing, soft thud, surface-dependent step |
| `player.collect`, `player.power-up` | Pop/bling, uplift |
| `player.hit`, `player.crash` | Soft impact with game-specific layer |
| `vehicle.engine`, `vehicle.brake`, `vehicle.explosion` | Continuous speed-sensitive loop, skid, stylized impact |
| `boss.approach`, `boss.attack`, `boss.defeat` | Tension, warning, victory |

**Work items**
- [x] Add mappings into host games at authoritative events (answers, level changes, results).
- [ ] Add a sidecar protocol event for `SproutsSidecar.sound(event, options)`, validating event names/options.
- [x] Throttle high-frequency effects (steps, collisions, pickups) and cap active voices for low-end Fire tablets.
- [x] Make wrong-answer feedback supportive rather than harsh or alarming.
- [ ] Test touch, gamepad, mouse/keyboard, player restart and repeated game navigation.

## Phase C — Per-game soundtracks and ambience

| Games/theme | Audio direction |
| --- | --- |
| Grass Maze / Garden exploration | Birds, grass movement, footsteps, calm playful loop |
| Sketchbook Mega Ramp / driving | Speed-dependent engine, tires, jumps, impacts, bigger (child-friendly) crash layers |
| Block Meadow / building | Block placement, digging, soft meadow ambience |
| Skybound / flying | Wind, whoosh, checkpoint, altitude/speed ambience |
| Boss Chase / running | Footsteps, approaching boss, power-up cues, escalating tension |
| Other puzzle and learning games | Gentle clicks, success chimes, short non-distracting motifs |

**Work items**
- [ ] Add one themed music/ambience preset at a time, starting with the most-played games.
- [x] Keep melodies short and loopable; lower background level by default and avoid rapid loudness changes.
- [ ] Use 3D positional audio only when gameplay direction benefits; prefer simple stereo/mono for lower CPU.
- [x] Record source/licensing details for any included external samples. Use original/generated material or assets with suitable redistribution rights.
- [x] Ensure tracks are packaged/cached for offline play. Avoid runtime CDN dependency or heavy game-start downloads.

## User controls

Add accessible controls in Parent Corner (and optionally a compact in-game speaker menu):
- **Read to me:** keep the existing educational speech toggle independent.
- **Music:** separate on/off and volume.
- **Effects:** separate on/off and volume.
- **Ambience:** separate on/off and volume.
- **All gameplay audio:** quick mute for quiet settings.

Initial suggested levels, tuned by device tests: speech full/unchanged; SFX 60–70%; music 15–25%; ambience 15–25%. These are targets, not sound levels implemented today.

## Device, offline and QA requirements

- [ ] Test Fire HD 8 (12th gen) on the real device, including cold launch, first tap audio unlock, sleep/resume, Bluetooth headphones and game-to-game navigation.
- [ ] Confirm in-app questions remain audible over music/effects; avoid speech duck getting stuck after errors/cancel.
- [ ] Keep all base audio in the APK and PWA offline pack; measure incremental APK bytes and startup latency.
- [x] Confirm audio context/voices and loops are cleaned up after leaving a game.
- [ ] Preserve existing sidecar sound behavior until each game is migrated; migrate incrementally.
- [x] Add automated tests for preference storage/defaults, silent fallback, duck transitions, event throttling and lifecycle.

## Suggested delivery slices

1. **Audio foundation PR:** modules, mute/volume controls, lifecycle, speech duck coordination, tests; no new music assets.
2. **Shared SFX PR:** event API and cross-game correct/wrong/collect/win/collision sound integration.
3. **Theme packs PR(s):** game-specific audio starting with Grass Maze, Sketchbook Mega Ramp, Block Meadow, Skybound and Boss Chase.

All work starts on **`feat/game-audio-gpt6`**. Review each slice before merging to `main`; don't automatically publish an APK for a roadmap-only change.

## Implementation notes (PR #22)

The feature branch contains `lib/game-audio-policy.mjs`, `lib/game-audio-presets.mjs`, `lib/game-audio.mjs`, `app/game-audio.mjs`, integrations into the app/round/parent/sidecar modules, and `tests/game-audio.test.mjs`.

The music is **original procedurally generated short motifs** (meadow, arcade, drive, sky, chase and puzzle), not copyrighted recordings. Synthesized sounds and background ambience add no audio files to the APK. Each game selects a theme automatically. Existing special game effects are preserved; dedicated semantic sound triggers are wired into Grass Maze, Boss Chase, Block Meadow and Sketchbook Mega Ramp, plus built-in maze/hop/chase/cube games. Other games share quiz, UI and result sounds now, and can adopt richer gameplay-specific effects later.

The existing `Read to me` flag is independent from the Parent Corner game audio sliders. The in-game music button is a quick mute. The host uses one Web Audio context and ducks during speech; sidecars retain their own existing Web Audio graph and receive a compatible gain-level configuration. Avoid stacking both duckers for the same output.

**Still to validate on hardware:** Fire HD 8 audio unlock, screen lock and resume, differences between stereo and Bluetooth, volume perceptual consistency and native speech ducking. Additional engine-speed loops and richer 3D positional sounds can be added after field tuning. The browser and Node tests are not a substitute for physical Fire OS results.
