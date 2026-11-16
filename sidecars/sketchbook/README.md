# Sketchbook Mega Ramp

A Little Sprouts sidecar based on [swift502's Sketchbook](https://github.com/swift502/Sketchbook) at `62f4b7986fd1ce1e4f91daba89ef032c20a6ce55` (MIT). It uses the original scene geometry, collision shapes, character movement, cars, planes, helicopters, and starting places. This port substitutes a simple material palette for the large map textures and inserts the learner's garden buddy using the same rendering helper as other sidecars. Original notices are included in this folder.

## Play

New games start at the top of the Mega Ramp, already in the driver's seat. Drive down to the playground, then follow the spaced-out learning beacons. The descent itself does not ask a question.

Run `node server/serve.mjs` at the repo root. Choose **Sketchbook Mega Ramp** on the **Run, Jump & Dodge** shelf. Directly opening `http://localhost:8000/sidecars/sketchbook/` starts standalone free roam without profile rewards.

- In learning mode, follow the arrow to five beacons on a roughly 390 m walk past the parked cars, stunt bowl, tunnel, runway airplane, and low helipad. The arrow guides you through the tunnel. No vehicle is required, but at each aircraft stop you can walk straight up and board with the normal vehicle button. Answer the learner’s current question at each beacon. A wrong answer leaves the question up. A correct answer changes the beacon from gold to green and reveals the next one. The host banks learning stars using the shared question flow. **Finish trail** in the menu settles any remaining answered questions. **Back to the trail** returns to the last lit beacon (or the start) without losing progress.
- Arcade Play uses the same playground without questions, beacons or learning stars. Tap the on-screen **Starting places** button in either mode to go straight to the picker. It is also in the trail menu for controller play. Its cards open the original ramp, race, playground, and runway scenarios without resetting your lit beacons.
- Keyboard and mouse: WASD moves, drag looks, Space jumps or brakes, F enters or exits a vehicle, Shift runs or powers an aircraft, and Q/E yaw aircraft. M opens the trail menu.
- Controller: left stick/D-pad moves and right stick looks. A jumps, brakes or descends. X enters/exits, RB runs or powers aircraft, and LB/LT yaw aircraft. Y switches seats, L3 enters as a passenger, R3 changes the vehicle view, and RT sets the airplane's wheel brake. Press Start for the menu, D-pad to highlight, A to choose, and B to go back. The D-pad and A also work on questions and **Hear it again**.
- Touch: drag on the left to move and on the right to look. Hold **Gas** to drive, steer with the left stick, and tap **Brake** to slow down. Tap **Starting places** to change locations or **Menu** for trail actions. The on-screen buttons change with the vehicle, including separate throttle, yaw, and brake or descent controls.

- **Play with a friend:** open the trail menu and choose **Play with a friend**. Start an online room and share the invite link, or choose **Play on this Wi-Fi** on both devices and use the shared Start/Join card and its sound or QR handshake. The invite opens the guest in free roam. Once connected, both players see the other garden buddy move and ride, drive, or fly. Each player still controls their own vehicles, questions, and stars. Vehicle replicas are visual only and cannot be boarded by the other player. Use **Leave room** to return to solo play.

The build ships with the repository, so no npm install is needed to play. All runtime assets are same-origin, each below the service worker's 20 MB per-file limit. Open Little Sprouts online until the offline download is ready before using it off-network.

## Rebuild the vendor engine

From the root, run `sh tools/build-sketchbook.sh` with Node and npm while online. It fetches the pinned upstream revision, applies `tools/sketchbook/upstream.patch`, uses its locked dependencies, and recreates the same `build/` paths. The Little Sprouts question and controller bridge lives in `trail.mjs`, separate from the upstream engine bundle.

Bundled dependency licenses accompany the MIT Sketchbook notice. The Apache-2.0 dat.gui source notice is also retained in the vendor code and reproduced in `notices/NOTICE`.
