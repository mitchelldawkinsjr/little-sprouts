# Home game discovery

The default home view shows Featured Games, Keep Playing (when available), and six New Games. Categories and All Games remain available in the top navigation and below these rows. Featured games use real 640 × 360 JPEG captures in `icons/gameplay/`, included in the normal offline inventory.

`lib/game-discovery.mjs` owns the featured order and addition dates. The featured order is:

1. Block meadow
2. Sketchbook Mega Ramp
3. Cabin camp
4. Boss chase
5. Skybound climb
6. Garden gulp

When adding a game, add its ID and an explicit `YYYY-MM-DD` addition date to `GAME_ADDED`. Existing dates were backfilled from the first appearance of the game's source or catalog entry in Git history. Do not change them for fixes, rebuilds, or new screenshots. Equal dates sort by game ID so the New Games preview and full list agree regardless of category grouping. The test suite checks that every registered game has a date.

Featured-first browsing puts available featured games first in the same order, followed by other games newest first. Newest-first browsing uses only addition dates. All discovery rows receive the existing availability-filtered catalog: hidden reading games, missing builds, device-incompatible games, and unavailable offline games are not brought back by discovery.

Recent games are stored in the learner's `recentGames` list alongside the existing `lastPlayed` field. Starting a game moves it to the front, removes duplicates, and keeps at most six IDs. Old profiles using only `lastPlayed` continue to work. This is a shortcut to reopen the game, not a saved round or cross-device history.

A valid Parent corner Up next pin retains its banner. Without a pin, the featured row replaces the old automatic Shape safari banner so players see the featured choices immediately. The read-aloud recommendation and Up next marker use the featured-first catalog and continue to respect the parent pin and next-after-last-played behavior.

Run `node --test tests/*.test.mjs server/*.test.mjs` and the production bundle/budget checks in `.github/workflows/verify.yml` before changing this flow. Check a new learner, an existing learner, learner switching, parent pins, category filters, and both sort options at desktop and phone widths.
