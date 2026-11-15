# Canyon Pods

An original Little Sprouts sidecar inspired by the desert pod-racing idea from [Scorch](https://github.com/0xmariowu/awesome-threejs-games/tree/main/scorch-podracer). No archived game code, fonts, models, sounds, or artwork are included. Canyon Pods builds its pods, canyon, boost gates, and track from procedural geometry and uses the repository's local Three.js and garden buddy renderer.

Run `node server/serve.mjs` and pick **Canyon Pods** under **Drive, Fly & Aim**. Opening the sidecar by itself starts Arcade Play.

- Select one of three pod colors and race two laps against three rival garden buddies. All four drivers are visible 3D characters seated in their pods. The course includes a start/finish gantry, checkpoints, and canyon scenery modeled in Three.js.
- The pod accelerates automatically. Hold left or right to steer. Brake to line up for a gap, and use boost on a clear stretch.
- Learning Play pauses at four gates. A correct answer earns a boost charge, a one-hit shield, and a learning star through the shared Questions API. Wrong answers can be retried. A two-second countdown precedes re-entry.
- Arcade Play skips questions and stars. Gates provide boost charges.
- Use keyboard arrows (or A/D/S), Space, and Escape. A controller uses the left stick or D-pad, A/RT to boost, X to brake, and Start to pause. Touch uses the labeled on-screen buttons.
- The entire game runs offline once Little Sprouts has downloaded it.
