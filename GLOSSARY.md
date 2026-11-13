# Glossary

**Garden buddy** — the animal a learner picks on their profile: fox, bear, bunny,
frog, owl, or chick. Shown on the home screen and star garden, and it is the player
character in any game that has one (ADR 0001). Stored as `sprite` on the profile.
_Avoid:_ avatar, mascot, garden friend.

**Sidecar** — a game that runs in its own page inside an iframe and talks to the
app with `ask` / `pick` / `mark` messages (`lib/sidecar.js`, `lib/sidecar-guest.js`).

**Star shop** — where a learner spends learning stars on **gear** (flower, party hat,
sunglasses, gold crown) for their garden buddy (`logic/shop.mjs`, `app/shop.mjs`).
`stars` on the profile stays the lifetime total; the shop adds `spent`, `gear` (owned
ids), and `wearing`. Stars to spend = `stars - spent`. Every buddy renderer shows the
worn gear.
