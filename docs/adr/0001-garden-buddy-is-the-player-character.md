# 1. The garden buddy is the player character

Date: 2026-11-13

## Decision

When a game has a character the child moves around, that character is the
**garden buddy** chosen on the learner's profile: fox, bear, bunny, frog, owl,
or chick. Games do not bring their own hero.

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

- New games with a player character use `lib/buddy3d.mjs` (or a 2D version of
  the same buddies) instead of their own character art.
- Grass maze is the first. Older games with their own character (Garden walk's
  sprout, the dirt bike rider, Paint Sphere's player) should move over when they
  are next changed.
