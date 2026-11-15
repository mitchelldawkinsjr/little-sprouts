# Sketchbook Trail

A Little Sprouts sidecar based on [swift502's Sketchbook](https://github.com/swift502/Sketchbook) at `62f4b7986fd1ce1e4f91daba89ef032c20a6ce55` (MIT). It uses the original scene geometry, collision shapes, character movement, cars, planes, helicopters, and starting places. This port substitutes a simple material palette for the large map textures and inserts the learner's garden buddy using the same rendering helper as other sidecars. Original notices are included in this folder.

## Play

Run `node server/serve.mjs` at the repo root. Choose **Sketchbook Trail** on the **Run, Jump & Dodge** shelf. Directly opening `http://localhost:8000/sidecars/sketchbook/` starts standalone free roam without profile rewards.

- In learning mode walk to the beacon shown by the arrow, then answer the learner's current question. A wrong answer leaves the question up. A correct answer changes the beacon from gold to green and reveals the next one. The host banks learning stars using the shared question flow. **Finish trail** settles any remaining answered questions. **Back to the trail** returns to the starting place without losing lit beacons.
- Arcade Play uses the same playground without questions, beacons or learning stars. **Starting places** opens the original driving, free-roam and flight scenarios.
- WASD moves, drag looks, Space jumps or brakes, F enters or exits a vehicle, Shift runs or powers an aircraft, and Q/E yaw aircraft. On a controller the left stick moves, the right stick looks, A jumps or brakes, X enters or exits, and RB runs or powers aircraft. LB/LT yaw aircraft. The touch controls use the native Little Sprouts two-stick UI.

The build ships with the repository, so no npm install is needed to play. All runtime assets are same-origin, each below the service worker's 20 MB per-file limit. Open Little Sprouts online until the offline download is ready before using it off-network.

## Rebuild the vendor engine

From the root, run `sh tools/build-sketchbook.sh` with Node and npm while online. It fetches the pinned upstream revision, applies `tools/sketchbook/upstream.patch`, uses its locked dependencies, and recreates the same `build/` paths. The Little Sprouts question and controller bridge lives in `trail.mjs`, separate from the upstream engine bundle.

Bundled dependency licenses accompany the MIT Sketchbook notice. The Apache-2.0 dat.gui source notice is also retained in the vendor code and reproduced in `notices/NOTICE`.
