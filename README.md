# Little Sprouts — Play & Learn

Eleven early-learning activities (including three math games and three screen games) with three learner profiles, spoken prompts, adjustable levels, custom sight words, and per-skill progress.

## Run locally
Extract this ZIP. From the little-sprouts directory, run:

    python3 -m http.server 8000

Open http://localhost:8000 in your browser. No build step or dependencies are required.

## Files
- index.html — page structure and parent settings
- style.css — responsive styling
- app.js — games, settings, progress, speech, play styles and floor-card printing
- arcade.js — Catch the answer, Word lanes, and Rocket climb
- speech.js — Kokoro read-aloud (loaded on the first spoken prompt)
- speech-worker.js — runs that voice off the main thread so game buttons stay responsive
- logic.mjs — scoring, word rules and level text shared with tests
- logic.test.mjs — checks for those rules (`node --test logic.test.mjs`)
- camera.js — Reach play (loaded only when Reach is used)
- camera.test.mjs — checks for Reach tracking math (`node --test camera.test.mjs`)

## Parent controls
Open Parent corner and answer the grown-up check (21). Continue is the button Enter and Go activate. Rename learners, set the math band (preschool, kindergarten, or 4th grade), set levels per activity, change the round length, enter custom words (letters, with at most one apostrophe), reset that learner’s progress, print floor cards and allow Reach play. Read-aloud, the spoken voice, and Reach apply to every learner on this device. Saving during a round asks before leaving it. Reload question sheet reads `sheet.csv` first, then a published Google Sheet (learner, game, item, extra), and saves the combined lists in this browser. A Google Sheet list replaces that same list from the default file. `push-sheet.gs` adds new default rows to the Google Sheet about once an hour and leaves rows already there unchanged. Words, count pictures, hunt objects, and 4th-grade times tables come from those lists.

## Play styles
Pick a style on the home screen under "How are we playing?". It is saved per learner, and progress is tracked separately for each style.
- Tap — answer on the screen.
- Move — the game calls out a movement ("Hop like a bunny to the triangle!") and the child moves to a printed floor card. A grown-up taps ✓ Got it or Not yet. In What's missing?, the child does a movement break while the shapes are hidden. Use "Print floor cards" to print cards that match the learner's levels and sight words, two per page.
- Hunt — the child finds real things that match (something blue, something round, a sight word in a book). A grown-up confirms. What's missing? plays as Move.
- Reach — appears once a grown-up allows it in Parent corner. The camera tracks the child's fingertips with an on-device pose model. Holding a hand on an answer until it fills picks it, and raising both hands continues. The cursor stays steady if a frame jitters or drops, and a short coach line tells the child what to do next. Video is never recorded, saved or uploaded. The pose model (MediaPipe) downloads from Google's CDN on first use, so this needs internet once, plus https or localhost for camera access. Answers can still be tapped if the camera is unavailable.

## Math games
Math follows a band on each learner (change it in Parent corner). Defaults: Learner 1 preschool, Learner 2 kindergarten, Learner 3 4th grade. The 1–3 skill level only changes difficulty inside that band.
- Preschool — Count & clap: 1–5, then 8, then 10 pictures. Number path: find numbers, then one more, then before / after / which is more up to 10.
- Kindergarten — Count & clap: 1–10, then 20 (Hunt stays at 10). Number path: find 1–10; before / after / which is more; then hops that add or take away within 10.
- 4th grade — multiplication and multiples throughout. Count & clap: arrays (rows of 2–5 by 2–6), then times tables to 12 × 12 with missing-factor questions, then 2-digit × 1-digit, multiples of ten (40 × 6), and 2-digit × 2-digit up to 19 × 15. Number path: skip-counting and multiples of 2, 5 and 10, then multiples of 3–12, then factors, common multiples and primes. Wrong choices are common mistakes (neighbouring facts, adding instead of multiplying) rather than random numbers. Hints give a strategy without highlighting the answer.
  - Move: the movement is the method — jump once per skip-count (7 × 8 is seven jumps counting by 8s), clap arrays row by row, take giant steps for tens and baby steps for ones in 23 × 4, clap and stomp two skip-counts to find a common multiple.
  - Hunt: build arrays and groups with spoons, coins or blocks (when the total is 40 or less), or check multiples on a calendar or 100 chart.
  - The Numbers deck prints 0–12 as fact cards.

For preschool and kindergarten, the Numbers floor-card deck covers every number those games can ask for. 6 and 9 are underlined so they can't be confused on the floor.

After each correct Move or Hunt answer, a short grown-up prompt suggests a question to extend the conversation.

## Arcade games
Catch the answer, Word lanes, and Rocket climb are screen games. Move, Hunt, and Reach do not change them. A round is still that learner’s question count, and a miss before the right catch, lane, or fuel-up keeps it from counting as a first try.

- Catch the answer — move a basket under the falling answer. Preschool and kindergarten use counting and the number path, with the pictures or number line still on screen. 4th grade uses multiplication (arrays, times tables, missing factors, and larger products). Level 1 drops 3 slow answers, level 2 drops 4, and level 3 drops 5 a little faster.
- Word lanes — the voice says a sight word and the car has to be in that lane at the finish. There are 3 lanes, then 4, then 5, and never more lanes than words in the list. Level 1 shows the word in the heading. Levels 2 and 3 only say it. The lane signs stay visible.
- Rocket climb — questions alternate between the same math as Catch the answer and a sight word. The fuel tank lasts 18 seconds at level 1, 12 at level 2, and 8 at level 3. Reduced motion drains it more slowly. A right answer refills the tank and lifts the rocket from the garden through the clouds, sky, and stars toward the Moon. A wrong answer burns about a third of the tank. An empty tank dips the rocket, counts as a miss, and refills partway so the learner can try that question again. Level 1 shows a sight word in the heading. Levels 2 and 3 only say it. The answer buttons stay visible.

Steer with the arrow keys, A and D, the on-screen buttons, or a drag or tap on that side of the field. Reduced motion slows the fall and the drive.

## Hosting
Upload index.html, style.css, app.js, arcade.js, speech.js, speech-worker.js and camera.js together to any static web host. Access restrictions for the hosted ChatGPT version are not part of these source files; configure access separately on your host if needed.

## Notes
Progress and settings use browser localStorage and do not sync between devices or transfer from the original hosted URL. Clearing site data removes saved progress. Spoken prompts use Kokoro, downloaded once and then run on this device. A line that has already been spoken (including “You found it!” and Hear it again) plays back from a saved clip instead of being generated again. The voice starts loading on the home screen. If that voice cannot load, speech uses the browser’s own voice. Fonts load from Google Fonts with `display=swap` and local fallbacks. The parent check is not a security lock.
