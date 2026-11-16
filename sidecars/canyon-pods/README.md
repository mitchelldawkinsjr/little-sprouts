# Canyon Pods

An original Little Sprouts sidecar inspired by the desert pod-racing idea from [Scorch](https://github.com/0xmariowu/awesome-threejs-games/tree/main/scorch-podracer). No archived game code, fonts, models, sounds, or artwork are included. Canyon Pods builds its pods, canyon, boost gates, and track from procedural geometry and uses the repository's local Three.js and garden buddy renderer.

Run `node server/serve.mjs` and pick **Canyon Pods** under **Drive, Fly & Aim**. Opening the sidecar by itself starts Arcade Play.

- Select one of three pod colors and race two laps against three rival garden buddies. All four drivers are visible 3D characters seated in their pods. The course includes a start/finish gantry, checkpoints, and canyon scenery modeled in Three.js.
- The pod accelerates automatically. Hold left or right to steer. Brake to line up for a gap, and use boost on a clear stretch.
- Learning Play pauses at four gates. A correct answer earns a boost charge, a one-hit shield, and a learning star through the shared Questions API. Wrong answers can be retried. A two-second countdown precedes re-entry.
- Arcade Play skips questions and stars. Gates provide boost charges.
- Use keyboard arrows (or A/D/S), Space, and Escape. With a controller, use the left stick or D-pad to steer and navigate, A to select, A/RT to boost, X to brake, and Start to open race options. On a touchscreen, drag the shared joystick on the left and use the Brake and Boost buttons on the right.
- The entire game runs offline once Little Sprouts has downloaded it.

## Group Arcade races

Choose **Play with a friend** in Arcade Play or in the standalone game. Two to four human racers can share a room. The four-pod grid fills any empty seats with computer racers. No questions or learning stars are shared.

- **Online or on a network with a reachable relay:** Choose **Start a room** and share the invite link. Each player picks a pod and taps **Ready to race**. When everyone is ready, the host taps **Start race**. A guest may join between rounds, but not during a race.
- **Same Wi-Fi without internet:** Save Little Sprouts on every device while online. On the same non-isolated Wi-Fi network, select **Host on same Wi-Fi** on one device and **Join on same Wi-Fi** on the next. Use sound, or have the guest scan the host's QR and the host scan the answer QR. After the first guest joins, select **Add another friend** to pair the next device. This uses direct WebRTC channels and does not need the relay. Browser camera/microphone permissions apply to the corresponding pairing method.
- Everyone gets the same finish order. A disconnected guest is marked DNF if they had not finished. If the host leaves, the room closes. **Race again** returns everyone still connected to the lobby. Opening race options does not stop a multiplayer race.

### Reproduce the real-device offline test

1. On three devices, save the game while online and confirm each can open Canyon Pods from the saved app.
2. Disconnect the Wi-Fi router's WAN connection. Keep all three devices connected to its non-guest network. Do not run a relay for this test.
3. Host on device A and join on device B. Scan both QR codes, then confirm both appear on the roster. On A, select **Add another friend** and cancel. B should stay connected.
4. Add device C. Ready all three devices. Start from A, complete both laps on all devices, and confirm everyone sees the same order with one computer racer. Rematch.
5. Repeat with sound pairing. Keep the devices close, turn up the volume, and grant microphone access. Report QR and sound results separately.
