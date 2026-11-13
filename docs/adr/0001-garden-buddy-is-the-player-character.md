# 1. The garden buddy is the player character

Date: 2026-11-13

## Decision

When a game has a character the child moves around, that character is the
**garden buddy** chosen on the learner's profile: fox, bear, bunny, frog, owl,
or chick. Games do not bring their own hero. When the child moves a ball, the
ball is the garden buddy rolled up in a clear ball (a **buddy ball**).

- 3D games build it with `makeBuddy(THREE, kind)` from `lib/buddy3d.mjs`, which
  matches the buddy drawings on the home screen (`spriteHtml` in `lib/home-ui.mjs`,
  colors in `style.css`).
- The host sends `buddy` with every sidecar `ask` message. A game uses
  `buddyKind(msg.buddy)`, which falls back to the saved profile in `sprouts-v1`
  (for the game's own page) and then to the fox.

## Why

The buddy is the one thing a child picks for themselves. Seeing it in every game
makes the games feel like one world, and it tells the child "this one is you".

## Consequences

- 3D games use `makeBuddy` from `lib/buddy3d.mjs`. It takes the game's own material
  (`opts.material`) and returns rig parts (chest, head, arms, legs, eyes) so a game
  can keep its own animation and look.
- Canvas games use `drawBuddy` from `lib/buddy2d.mjs` (front view, same colors). HTML
  games use `spriteHtml` from `lib/home-ui.mjs`.
- Gear bought in the Star shop shows on the buddy everywhere. `makeBuddy` and
  `drawBuddy` read it from the saved profile (`buddyGear(kind)`) when the buddy is the
  learner's own, so a rival never wears it; `spriteHtml(kind, gear)` takes it directly.
- When a game has a rival character (Paint Sphere's bot), the rival is a different
  buddy: the next one in the list after the learner's.
- Ball games keep their ball physics and draw a buddy ball instead:
  `drawBuddyBall(ctx, kind, x, y, r, { spin })` from `lib/buddy2d.mjs` on canvas, or
  `makeBuddyBall(THREE, kind, radius)` from `lib/buddy3d.mjs` (call `roll(axis, angle)`
  to turn the shell and `animate(dt, vx, vz, time)` so the buddy faces where it goes).
  The buddy stays upright; only the shell spins.
- Balls that are answers (Marble path's colored marbles) stay plain: they are what the
  child picks, not who the child is.
- Games where the child is a vehicle or a first-person camera (Rally, Glider, Block
  meadow, Shooting range) have no character to replace. Garden gulp's blob is a
  candidate for a buddy ball.

Where it applies (2026-11-13): Grass maze, Garden walk, Dirt ride (buddy head and
colors on the rider), Paint Sphere, Skybound climb, Sprout hop, Lily cross, Garden
chase, Marble path, Stick bridge, and Market walk. Buddy ball: Light lines and
Marble box.

Paint Sphere and Skybound ship as built bundles whose source folders no longer match
what is live. Their bundles call `window.SproutsPaintBuddy` / `window.SproutsSkyBuddy`
(set by `sidecars/paint/buddy.js` and `sidecars/skybound/buddy.js`) and fall back to
their old characters. Port that call into the source before the next rebuild.
