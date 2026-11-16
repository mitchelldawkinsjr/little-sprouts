# New games and sidecars

Use this checklist for every new Little Sprouts game. Read the [glossary](../../GLOSSARY.md) and [garden buddy ADR](../adr/0001-garden-buddy-is-the-player-character.md) first.

## 1. Adapt the reference and define the loop

- Name the reference and preserve its relevant viewpoint, depth, scale, lighting, and feel. Explain what gameplay changes for Little Sprouts. Use original code/assets when reuse rights are unknown.
- Use the learner's garden buddy, with its gear. Use vendored Three.js for a 3D reference, not a CSS-only imitation. Keep physics and scoring testable without the renderer, respect reduced motion, and cap the render cost for older devices.
- Keep a game's physical challenge separate from the learner's question level. If the game has difficulty modes, put them at the top and explain unlocks. Make both Learning and question-free Arcade entry points clear when both make sense.

## 2. Connect the shared APIs

| Capability | Required integration |
| --- | --- |
| Questions | For cards, start with `lib/sidecar-quiz.mjs`. For physical answer collection, use the sidecar `ready / need / ask / show / pick / mark / clear / finish` flow. Start with Moonlight Swing or Ink Trail. Check frame source, same-origin, question revision, and pending pick. Only the host grades embedded answers, keeps first-try credit, and banks learning stars. Test retries and the final question. Don't send question progress during Arcade or standalone practice. |
| Physical controller | Register a map in `lib/sidecar.js`. Reuse `lib/pad.js` for embedded input and its `data-pad-standalone` entry point for direct game pages. Put navigable buttons in `data-pad-menu` and use a pause/back mapping. Do not poll a second gamepad in an embedded page. Test start, movement, action, pause, resume, and exit on a controller. |
| Touchscreen | Use `attachTouchControls` in `lib/touch-controls.mjs`. Prefer one floating stick and dedicated action buttons when needed. Mark active play surfaces, use `lib/game-touch.css`, and reset held inputs on pause, questions, blur and results. Keep scrolling and intentional zoom in menus, and do not opt the whole app out of zoom. Test two fingers at once in an iframe and standalone on touch hardware. |
| Play with a friend | Include it when friends can share a fair race or world. Use `lib/group-room.mjs` and `lib/group-transport.mjs` (Canyon Pods for races, Sketchbook for a shared world). Define room capacities, validated pose/events, ownership of shared state, join/rejoin/leave and disconnect behavior, and whether it is available online and on the same Wi-Fi. Keep learner questions and stars private. Do not register the game for the relay without a playable friend mode. If not applicable, explain why in the PR and list what a later friend variant would need. |

## 3. Ship and verify

- Register the title, shelf, guide, Arcade entry and controller map in `lib/sidecar.js`. Add a speech context in `lib/speech-core.mjs` if needed.
- Serve the sidecar in `Dockerfile`. Confirm the build catalog and offline inventory include its local HTML, scripts, styles, and all dependencies. Test an actual offline reload and avoid new CDN, font or game-asset dependencies.
- Run `node --test tests/*.test.mjs server/*.test.mjs` and the production asset budgets in `.github/workflows/verify.yml`. Check keyboard, controller and touch, and record any unverified browser or device behavior in the PR.
- Open a dedicated PR with the reference, intended modes, integration decisions, and verification. Add an actual screenshot or clip when a browser playback is available.
