/**
 * Sidecar games boot in their own document and draw in an iframe.
 * Add a future game by appending one entry here. Its page can load
 * /lib/sidecar-guest.js and call SproutsSidecar.ready(), .progress(),
 * .finish(), or .quit(). A page without that script still plays:
 * the iframe finishing its load counts as ready.
 *
 * Messages are { source: 'sprouts-sidecar', type, ... }.
 * Host to guest: boot, ask, mark, config. Guest to host: ready, show, pick, slip, progress, finish, quit, need.
 * progress may include label and travel. The guest does not store learner profiles.
 *
 * Arcade play (a learner with Arcade play on in Parent corner) runs every game with an `arcade`
 * line and no questions. The line is the game's goal, shown and said at the start. How the game
 * hears about it (`arcadeVia`):
 *   (default)  the host posts { type: 'arcade' } when the game is ready
 *   'clear'    the host posts { type: 'clear' }: nothing left to ask (Backroad rally)
 *   'pictures' the game has no question-free mode of its own, so the host keeps sending rounds of
 *              pictures where every choice is right (Paint Sphere, Targets)
 * Quick Math is its own math missions and has no arcade line.
 *
 * Set `alone` to a short line when the game also has its own page.
 * The host shows Play on its own and opens `src` without the query.
 */

const SIDECAR_SOURCE = 'sprouts-sidecar';

const SIDECARS = [
  {
    id: 'rally',
    arcade: 'Drive the backroad to the finish.',
    arcadeVia: 'clear',
    title: 'Backroad rally',
    blurb: 'Spell a word you hear, match, or answer a math fact. A right answer turbos the car.',
    icon: '🏎',
    tint: '#efe6d4',
    tag: 'DRIVE',
    shelf: 'drive-fly-aim',
    src: 'sidecars/rally/index.html?v=low-end1',
    alone: 'Pick a car and a road on that page.',
    howTo: 'Pick a car and a road. Questions are spread along the stage. Five right answers, and you can drive the rest of the way to the finish. A longer round asks up to eight.'
  },
  {
    id: 'flight',
    arcade: 'Fly the glider.',
    title: 'Sky flight',
    blurb: 'Steer through the gate with the right answer. A wrong gate turns the plane back.',
    icon: '✈',
    tint: '#d7ebf5',
    tag: 'FLY',
    shelf: 'drive-fly-aim',
    src: 'sidecars/flight/index.html?v=low-end1',
    alone: 'The bush plane flies on its own, through sample gates.',
    howTo: 'The bush plane holds its height. Steer left or right through the gate with the right answer. A wrong gate slows the plane and turns it back. Those same gates stay until you fly through the right one. After five right answers, you get two minutes of free flight over the hills. The plane keeps flying where you look. Forward flies faster, back flies backward, and the side buttons slide. Hitting the ground ends the flight.'
  },
  {
    id: 'bike',
    arcade: 'Ride the dirt bike.',
    title: 'Dirt ride',
    blurb: 'Lean back, jump the ramps, and land the dirt bike. A right answer says good.',
    icon: '🏍',
    tint: '#f3e2c4',
    tag: 'RIDE',
    shelf: 'drive-fly-aim',
    src: 'sidecars/bike/index.html?v=ball3',
    // Start pauses, X starts the level again.
    pad: { keys: { start: 'KeyP', x: 'KeyR' } },
    alone: 'A level menu, four trails, and stars are on that page.',
    howTo: 'Hold the gas and the bike pulls away. Lean back to lift the front wheel, and lean forward to bring the nose down. Ride the hills and land on both wheels. A question comes after a longer stretch of trail. A right answer says good, and the ride continues. A wrong answer speeds the bike up and tips it hard either way. Lean quick to save the crash. Level 1 stays upright until a miss. Level 3 lets you tilt in the air.'
  },
  {
    id: 'walk',
    arcade: 'Walk the meadow.',
    title: 'Garden walk',
    blurb: 'Walk your garden buddy to the picture that matches.',
    icon: '🌱',
    tint: '#e4f2df',
    tag: 'WALK',
    shelf: 'run-jump-dodge',
    src: 'sidecars/walk/index.html?v=ball3',
    alone: 'The meadow is on that page, and your buddy can walk.',
    howTo: 'Hold left or right and walk past the other pictures. Let go on the one that matches, or tap it and your buddy walks to it. The right picture finishes the question. A wrong picture sends your buddy back. Words, numbers, shapes, and colors take turns.'
  },
  {
    id: 'paint',
    arcade: 'Paint the shell! Every side is a good side.',
    arcadeVia: 'pictures',
    title: 'Paint sphere',
    blurb: 'Look inside the shell, then paint the half with the right answer.',
    icon: '🎨',
    tint: '#f8e2d4',
    tag: 'PAINT',
    shelf: 'drive-fly-aim',
    src: 'sidecars/paint/index.html?v=ball3',
    alone: 'Play, a friend, and room mode are on that page.',
    howTo: 'A math question from this learner’s profile appears, and the two answers float on either half of the shell. Look for five seconds, then paint for ten. Only paint on the right answer counts. Click the picture to look around. The train on the middle circle sets you down beside the track.'
  },
  {
    id: 'gulp',
    arcade: 'Swallow what fits. Clear the city or grow big before the clock runs out.',
    title: 'Garden gulp',
    blurb: 'You are a hole in a busy city. Gulp the right answers to grow, then swallow the streets.',
    icon: '🕳',
    tint: '#e6f0d8',
    tag: 'GULP',
    shelf: 'drive-fly-aim',
    src: 'sidecars/gulp/index.html?v=ball3',
    alone: 'Play, a friend, and room mode are on that page.',
    howTo: 'Drag, use the arrows, or a controller to move your hole through city blocks. A question from this learner’s profile floats at the top, with answer bubbles around you. Gulp a right answer to grow fast, and gulp its other copies for more. A wrong bubble shrinks you a little, and the question stays. Swallow cones and people, then cars, shops, and towers. Biggest hole after two minutes wins. Arcade play skips the questions. Play with a friend uses the same room link as Paint Sphere.'
  },
  {
    id: 'roll',
    arcade: 'Roll the marble to the star.',
    title: 'Marble box',
    blurb: 'Tilt the wooden box and roll the marble into the pocket with the right answer.',
    icon: '🔮',
    tint: '#f1e2cc',
    tag: 'ROLL',
    shelf: 'drive-fly-aim',
    src: 'sidecars/roll/index.html?v=arcade1',
    alone: 'Five sample mazes are on that page.',
    howTo: 'A question from this learner’s profile floats at the top, and each answer sits by a pocket in the maze. Drag anywhere, use the arrows, or a controller to tilt the box. On a phone, tap Tilt and tip the phone. Roll the marble into the pocket with the right answer. A wrong pocket closes, and the marble rolls back to the start. Each question is a new maze.'
  },
  {
    id: 'grass',
    arcade: 'Run to the star sign.',
    title: 'Grass maze',
    blurb: 'Run your garden buddy through a maze of tall grass to the sign with the right answer.',
    icon: '🌾',
    tint: '#dcefc8',
    tag: 'GRASS',
    shelf: 'run-jump-dodge',
    src: 'sidecars/grass/index.html?v=arcade1',
    alone: 'Five sample mazes are on that page.',
    howTo: 'A question from this learner’s profile floats at the top, and each answer is on a sign at the end of a grass path. Drag anywhere, use the arrows, or a controller to run. Tap Map to see the whole maze. On a controller, the left stick or d-pad runs and A shows the map. Run to the sign with the right answer. A wrong sign fades, and you keep looking. Each question is a new maze.'
  },
  {
    id: 'dash',
    arcade: 'Run from the caterpillar.',
    title: 'Garden dash',
    blurb: 'Run from the hungry caterpillar. Jump to catch the right answer and zoom ahead.',
    icon: '🥕',
    tint: '#f4e6cf',
    tag: 'RUN',
    shelf: 'run-jump-dodge',
    src: 'sidecars/dash/index.html?v=dash5',
    alone: 'Endless run is on that page too.',
    howTo: 'Seen from the side, your garden buddy runs on top of a little round garden while a hungry caterpillar follows, and the run gets faster and faster. Tap, space, the up arrow, or A to jump. Jump the rocks, logs, and flower pots, and jump to grab carrots, which push the caterpillar back. A question from this learner’s profile shows at the top, and its answers float past at jump height. Jump to catch the right one to zoom ahead. A wrong one slows you down and leaves the next row. Miss the right one, and the row comes round again. If the caterpillar catches up, it munches your buddy; tap to jump back in with the same question. Arcade play is endless run with no questions, until the caterpillar catches you.'
  },
  {
    id: 'pinecone-trail',
    arcade: 'Roll as far as you can. Dodge pines and hop over logs.',
    banks: true,
    title: 'Pinecone Trail',
    blurb: 'Roll your garden buddy across a tiny forest globe, dodge pines, and hop over logs.',
    icon: '🌲',
    tint: '#dcebd5',
    tag: 'ROLL',
    shelf: 'run-jump-dodge',
    src: 'sidecars/pinecone-trail/index.html?v=1',
    pad: { keys: { a: 'Space', rt: 'Space', start: 'KeyP' } },
    alone: 'An endless run with a local best distance is on that page.',
    howTo: 'Switch lanes with the arrows, A and D, the controller stick or d-pad, or the on-screen arrows. Press Space, controller A, or Jump to hop a fallen log. Switch lanes to avoid tall pines. In Learning play, each checkpoint pauses the run for a question. A right answer gives a trail shield and restores a heart. Clear the checkpoints to earn learning stars. Arcade play has no questions or learning stars. Roll as far as you can on three hearts.'
  },
  {
    id: 'pebble',
    arcade: 'Roll through the pines and dodge trees.',
    banks: true,
    title: 'Pebble roll',
    blurb: 'Roll your garden buddy across a little forest planet. Dodge trees and charge a shield at checkpoints.',
    icon: '🪨',
    tint: '#dceee2',
    tag: 'ROLL',
    shelf: 'run-jump-dodge',
    src: 'sidecars/pebble/index.html?v=4',
    pad: { keys: { a: 'Space', rt: 'Space', start: 'KeyP' } },
    alone: 'Roll through the pines without questions on that page.',
    howTo: 'Roll your garden buddy over a tiny forest planet. Hop left or right to change lanes, or jump over a tree with Space or Up. Tap left or right twice to cross two lanes with the keyboard or touchscreen. On a controller, you can hold the stick or D-pad to cross both lanes. A jumps and Start pauses on a controller. In learning play, a right answer at a checkpoint charges a shield that blocks one bump. A two-second countdown gives you time to get ready before you roll again. Three unshielded bumps end a learning run. Arcade Play has no questions and the first bump ends the run.'
  },
  {
    id: 'boss',
    arcade: 'Swim away from the boss.',
    title: 'Boss chase',
    blurb: 'Build a boss (caterpillar, spider, shark, squid, gator, octopus, or a mix), then swim away from it.',
    icon: '🐛',
    tint: '#d3eef2',
    tag: 'SWIM',
    shelf: 'run-jump-dodge',
    src: 'sidecars/boss/index.html?v=boss2',
    alone: 'The boss builder and endless swim are on that page too.',
    howTo: 'First build a boss: tap a ready-made caterpillar, spider, shark, squid, gator, or octopus, or mix your own head, body, legs, color, eyes, topper, and size. Then, seen from the side under water, your garden buddy swims away while the boss follows your path. Drag, move the mouse, or use the up and down arrows to swim. Further right (or the right arrow) swims faster and pulls away from the boss; further left is slower and easier to steer. A question from this learner’s profile shows at the top, and its answers float in as bubbles. Swim into the right one to zoom ahead. A wrong one lets the boss closer, and the question stays. Tap jellyfish, puffers, and crates, or press A, to set them off: the boss bumps into them and falls back. Rocks bump anyone, bubble vents give a boost, and shells push the boss back. Play: answer every question and you get away. If the boss catches you, it chomps, and you tap to swim on with the same question. Endless: questions keep coming, and the game ends when the boss catches you. Arcade play is endless with no questions.'
  },
  {
    id: 'cabin',
    arcade: 'Keep the cabin cozy.',
    banks: true,
    title: 'Cabin camp',
    blurb: 'Keep your cozy cabin tidy at dusk. A raccoon family wanders in for snacks, and your watering can sends them home giggling.',
    icon: '🏕',
    tint: '#dbe8dc',
    tag: 'CAMP',
    shelf: 'drive-fly-aim',
    src: 'sidecars/cabin/index.html?v=cabin1',
    alone: 'The title screen, best night, and settings are on that page.',
    howTo: 'You are the garden buddy in a cozy cabin at dusk, with a watering can. Raccoons come in from the yard looking for snacks. Walk with the left stick or WASD, aim with the mouse or right stick, and hold the right trigger, A, or the mouse button to sprinkle. A sprinkle sends a raccoon home giggling; they never get hurt. Raccoons that reach you take a heart, and hearts come back slowly. After each round, pick one treat for the cabin. A question from this learner’s profile comes between rounds, with the run frozen while it is read. A wrong answer leaves the same question up. Press Y or Hear it again to hear it once more. B or Start pauses. Tap Friend to keep one cabin cozy with a friend: the raccoons are shared, each player gets their own questions, and a buddy out of hearts naps until the friend is the only one awake. The cabin can also be played on its own, with a title screen, settings, and a best night saved in this browser.'
  },
  {
    id: 'glow',
    arcade: 'Draw a path to the star.',
    title: 'Light lines',
    blurb: 'Draw glowing lines on a dark board and roll a ball down them to the right answer.',
    icon: '💡',
    tint: '#d9dcf2',
    tag: 'GLOW',
    shelf: 'drive-fly-aim',
    src: 'sidecars/glow/index.html?v=arcade1',
    alone: 'Five sample boards are on that page.',
    howTo: 'The board is dark. A question from this learner’s profile floats at the top, and each answer sits in a pocket along the bottom. Draw lines with a finger or the mouse: they glow, light up the board, and show hidden walls. White is a ramp, green speeds the ball up, blue bounces, and yellow slows it down. Red lines are danger: touching one costs a heart. Ink runs out, so plan a path, then tap Drop. A wrong pocket closes, and you can fix your lines and drop again. On a controller, A drops, B undoes, and the bumpers change color.'
  },
  {
    id: 'range',
    arcade: 'Paint any board you like.',
    arcadeVia: 'pictures',
    title: 'Targets',
    blurb: 'Stand at the counter or walk the plaza, and paint the board with the right answer.',
    icon: '🎯',
    tint: '#f6e4d8',
    tag: 'PAINT',
    shelf: 'drive-fly-aim',
    src: 'sidecars/range/index.html?v=targets1',
    alone: 'Two sample questions are on that page, in Stand or Walk.',
    howTo: 'Pick Stand or Walk with the button in the corner. Stand: paint from the counter. Walk: walk the plaza and find the boards; the little map shows where they stand. Drag or use the arrows to look around, then press Paint, or tap a board to paint it. The right board finishes the question. A wrong board greys out, and you paint another one. Spelling puts up letter boards: paint them in order, or type them. The paint launcher waits while the question is read.'
  },
  {
    id: 'blocks',
    arcade: 'Build in the meadow.',
    title: 'Block meadow',
    blurb: 'Walk a big block world. Find gift boxes, answer, and build with the blocks you win.',
    icon: '🧱',
    tint: '#e2efd6',
    tag: 'BUILD',
    shelf: 'calm-create',
    src: 'sidecars/blocks/index.html?v=blocks3',
    alone: 'The meadow, building, and sample gift boxes are on that page.',
    howTo: 'Walk anywhere in the meadow. Follow the arrow to the glowing gift box and open it for a question from this learner’s profile. A right answer earns a learning star, a new color of block, and a prize. Prizes take turns: a build kit (a little house, stairs, a bridge, or a tree) that goes down with one tap, then a power-up (a lantern that keeps the night bugs away, super jump, or super speed). A wrong answer greys out, and you pick again. Tap a block to build on it, or pick the shovel and tap to dig it out. Windows and doors are in the block bar from the start. Tapping a door opens or shuts it, and you can walk through an open one. After five right answers, every block is yours for free build. Press I’m done building to finish. The world is saved in this browser. After a while the light fades to night, and a big caterpillar and a big spider come out. They can grab you, but not inside a house: a roof overhead and walls on every side keep you safe until morning. Press Friend to open a room for two and send the link: your friend joins your world as their own garden buddy, and you build together. On a controller, the left stick walks, the right stick looks, A builds or digs, X jumps, the shoulders change the block, and the left trigger switches build and dig.'
  },
  {
    id: 'quickmath',
    title: 'Quick Math',
    blurb: 'Three-minute multiplication, division, and word-problem missions.',
    icon: '⚡',
    tint: '#e8eefc',
    tag: 'MATH',
    shelf: 'words-numbers',
    src: 'sidecars/quick-math/index.html?v=1',
    // All buttons: the d-pad walks the missions and the answers, and A presses the one lit up.
    pad: { menu: '[data-level], [data-choice]:not([disabled]), [data-again], .secondary-action[data-home], .back-button, [data-finish]' },
    alone: 'Pick a mission and race the clock on that page.',
    howTo: 'Pick a mission. Answer as many as you can in three minutes. Four choices each time. Finish early or wait for the timer.'
  },
  {
    id: 'skybound',
    arcade: 'Climb to the portal.',
    title: 'Skybound climb',
    blurb: 'Jump the floating pads. Checkpoints ask a question before you climb on.',
    icon: '☁',
    tint: '#d9e4f8',
    tag: 'CLIMB',
    shelf: 'run-jump-dodge',
    src: 'sidecars/skybound/index.html?v=worlds1',
    alone: 'Three worlds and crystals are on that page.',
    howTo: 'Jump from pad to pad. Checkpoints ask this learner’s questions until the set is done, then the climb goes on. Reach the portal to finish the world and earn the stars. Each new world is harder. Arcade play skips the questions.'
  },
  {
    id: 'fishing',
    arcade: 'Fish the island.',
    banks: true,
    needs: 'webgpu',
    title: 'Tidewater fishing',
    blurb: 'Fish the island from the pier or the boat. When a fish bites, answer to hook it.',
    icon: '🐟',
    tint: '#d4ecec',
    tag: 'FISH',
    shelf: 'calm-create',
    src: 'sidecars/field-guide-fishing/tidewater-coast.html?v=tide2',
    // Left stick walks, right stick looks, A (or RT) casts, strikes, and reels, LT reels an empty line,
    // X boards the boat and talks, Y takes out the rod, LB opens the cooler, RB runs.
    pad: { move: 'wasd', look: 'move', lookOn: '#app canvas', keys: { a: 'Mouse0', rt: 'Mouse0', lt: 'Mouse2', x: 'KeyE', y: 'KeyR', lb: 'KeyI', rb: 'ShiftLeft' } },
    alone: 'Tidewater on its own: no questions, sell your catch to Joe before dark.',
    howTo: 'Walk to the water or the pier and take out the rod. Hold to wind up, and let go to cast. When a fish takes the bait, a question comes up: answer it right to hook the fish. Then hold to reel it in, and let go when the line gets tight so it does not snap. A wrong answer leaves the same question up, so try another one. Your stars add up as you answer. Keep fishing as long as you like.'
  },
  {
    id: 'inkwave',
    arcade: 'Paint the plaza with your team.',
    banks: true,
    title: 'Inkwave',
    blurb: 'Paint the plaza with your team in a four-on-four ink battle. Questions charge your super ink.',
    icon: '🖌',
    tint: '#d9e8ee',
    tag: 'INK',
    shelf: 'drive-fly-aim',
    // The match reads the controller itself (lib/pad.js leaves turf-riot alone): left stick moves, right stick looks.
    src: 'sidecars/paint-the-plan/turf-riot.html?sprouts=1&v=ink4',
    alone: 'The full INKWAVE menus, maps, and settings are on that page.',
    howTo: 'Your team paints the plaza while the other team paints it their color. Move with WASD or the left stick, look with the mouse or the right stick, and shoot ink with the mouse button or the right trigger. Every so often a Super ink question comes up: a right answer fills your special and your ink. If you get splatted, answer a question to jump back in, charged up. A wrong answer leaves the same question up, so try another one. The team with the most paint when the clock runs out wins, and your stars add up as you answer. With a mouse, click the game once and the mouse aims. On a phone or tablet, the left thumb moves, the right thumb looks around and sprays ink, and the big buttons paint, jump, swim, and fire your special. Tap Friend to play a friend head to head: send them the link, and you each lead one team, with bots filling the rest.'
  },
  {
    id: 'station',
    arcade: 'Help the town.',
    banks: true,
    title: 'Sakura town helper',
    blurb: 'Run errands for the people of a little train town. Answer at the shop to buy what they need.',
    icon: '🚉',
    tint: '#f6e1e8',
    tag: 'HELP',
    shelf: 'run-jump-dodge',
    src: 'sidecars/station-scout/index.html?v=town2',
    // Left stick walks (A walks forward too), right stick looks around, X jumps, a shoulder runs.
    pad: { keys: { x: 'Space', rb: 'ShiftLeft', lb: 'ShiftLeft' }, look: 'drag', lookOn: 'canvas' },
    alone: 'The town on its own: errands with no questions, and free walking.',
    howTo: 'Someone in town needs something: the café worker wants flowers, the station master wants sweets, the girl at the crossing needs a bike bell. Walk to the shop, go in through its door, and step into the glowing ring at the counter to answer a question and buy it. Then bring it to them, wherever they are in town. The banner says where to go; little explorers always get an arrow, and anyone can tap Show me the way. A wrong answer leaves the same question up, so try another one. Three cats hide around town: find one for a bonus question. Help five people to finish. Walk with WASD, the arrows, the left stick, or the arrow buttons; look with the mouse or the right stick; Shift or a shoulder button runs.'
  },
  {
    id: 'deliveries',
    arcade: 'Grow the sky garden.',
    banks: true,
    title: 'Cloudkeep sky garden',
    blurb: 'Fly a little airship and catch sky creatures. When a question comes up, catch the creature carrying the right answer.',
    icon: '🎈',
    tint: '#dcebf6',
    tag: 'FLY',
    shelf: 'drive-fly-aim',
    src: 'sidecars/sky-deliveries/index.html?v=catch4',
    // Left stick flies and strafes, right stick steers the view, A scatters seeds, X captures, a shoulder boosts, Y recenters.
    pad: { move: 'wasd', keys: { a: 'Space', rt: 'Space', x: 'KeyQ', rb: 'ShiftLeft', lb: 'ShiftLeft', y: 'KeyC' }, look: 'drag', lookOn: '#world' },
    alone: 'Cloudkeep on its own: no questions, the same floating gardens.',
    howTo: 'Fly your little airship through the clouds. Scatter seeds and the sky creatures come close; hold capture near one to catch it for sky coins. When a question comes up, each answer floats on a label over a different kind of sky creature: fly into the one with the right answer, or hold capture near it, and the airship reels it in for double sky coins. Catching a wrong one crosses that answer off, and the question stays until you catch the right one. Then fly free for a bit before the next question. Spend sky coins in Upgrades to restore the floating sanctuary. Your stars add up as you answer. Fly with WASD or the left stick, steer the view by dragging or with the right stick, Space or A scatters seeds, hold Q or X to catch, Shift or a shoulder button boosts. On a phone or tablet, the left thumb is a joystick that flies (push a little to go slow), and dragging the sky on the right steers.'
  },

  {
    id: 'canyon-pods',
    title: 'Canyon Pods',
    blurb: 'Race your garden buddy against three other buddies in twin-engine pods through a 3D desert canyon.',
    icon: '🏁',
    tint: '#ffecd7',
    tag: 'RACE',
    shelf: 'drive-fly-aim',
    src: 'sidecars/canyon-pods/index.html?v=3',
    arcade: 'Race the canyon without questions. The gates charge your boost.',
    banks: true,
    pad: { move: 'arrows', menuOpen: '#pause', menuBack: '[data-pad-back]', keys: { a: 'Space', x: 'KeyS', rt: 'Space' } },
    alone: 'Race two laps against three rivals without questions.',
    howTo: 'Pick a pod and race two laps with your garden buddy. The pod moves forward on its own. Hold left or right to steer, down or X to brake, and Space or A to boost. On a touchscreen, use the joystick to steer and the Brake and Boost buttons. In Learning Play, glowing gates pause the race for a question. A correct answer charges a boost and a shield, then you get two seconds to get ready. In Arcade Play, gates charge boosts without questions or stars. Choose Play with a friend to race two laps together with two computer racers.'
  },
  {
    id: 'sketchbook',
    arcade: 'Explore the playground.',
    banks: true,
    title: 'Sketchbook Mega Ramp',
    blurb: 'Drive down the Mega Ramp, then explore the playground and light beacons.',
    icon: '🧭',
    tint: '#e2efd2',
    tag: 'EXPLORE',
    shelf: 'run-jump-dodge',
    src: 'sidecars/sketchbook/index.html?v=trail8',
    pad: { move: 'wasd', look: 'move', lookOn: '#canvas', menuOpen: '#trail-menu', menuBack: '[data-trail-back], [data-k="cancel"], [data-id="cancel"], [data-id="later"]',
      keys: { a: 'Space', x: 'KeyF', y: 'KeyX', rb: 'ShiftLeft', lb: 'KeyQ', lt: 'KeyE', rt: 'KeyB', ls: 'KeyG', rs: 'KeyV' } },
    alone: 'The same playground, vehicles, and starting places without questions.',
    howTo: 'Start in the car on top of the Mega Ramp. Hold W or the on-screen Gas button, or push the Move stick forward, to drive down. Tap Starting places on the game screen to pick a new spot without losing lit beacons. Walk with WASD, the left stick, or the on-screen Move stick. Drag or use the right stick to look. Press Space or A to jump and F or X to enter or leave a vehicle. Press Start for the trail menu. Follow the arrow to five beacons spread across the playground. Answer at each beacon to light it and reveal the next one. Wrong answers stay up until you try again. Choose Finish trail to bank any learning stars not already saved. Arcade play has the whole playground and its starting places with no questions or learning stars. Choose Play with a friend in the trail menu to share an invite or join over the same Wi-Fi.'
  }
];

const built = new Set();
let gpuCheck = null;
/** True when this device can draw with WebGPU (an adapter, not just the API). Asked once. */
function webgpuReady() {
  gpuCheck ||= Promise.resolve()
    .then(() => globalThis.navigator?.gpu?.requestAdapter?.())
    .then(adapter => !!adapter, () => false);
  return gpuCheck;
}

/** Sidecars that play without questions in arcade play. */
export function sidecarArcadeIds() {
  return SIDECARS.filter(game => game.arcade).map(game => game.id);
}

export function sidecarGame(id) {
  return SIDECARS.find(game => game.id === id) || null;
}

/**
 * Mission games (`lesson: true`) run their own Discover / Practice / Challenge missions instead of
 * the learner's question list. The host sends `lesson-config` (stage, level 0–2, buddy, sound), and
 * the game sends `finish` with detail `lesson:<attempts>:<firstRight>` when the child saves.
 */
export function sidecarIsLesson(id) {
  return !!sidecarGame(id)?.lesson;
}

/** `lesson:<attempts>:<firstRight>` → how many stars the mission earns and how many were first tries. */
export function lessonResult(detail, mission = 0) {
  const m = /^lesson:(\d+):(\d+)$/.exec(String(detail || ''));
  if (!m) return null;
  const attempts = Math.max(1, Math.min(20, +m[1]));
  const right = Math.max(0, Math.min(attempts, +m[2]));
  // A mission is worth more than one question: 3 stars for Discover, 4 for Practice, 5 for Challenge.
  const stars = 3 + Math.max(0, Math.min(2, mission | 0));
  return { stars, firstRight: Math.round(stars * right / attempts) };
}

/** Which mission (0 Discover, 1 Practice, 2 Challenge) fits this learner. A level set for the game in
 *  Parent corner picks it directly; otherwise the grade picks it and the overall level nudges it. */
export function lessonMission(stage, level, gameLevel) {
  if (gameLevel) return Math.max(0, Math.min(2, (gameLevel | 0) - 1));
  const base = /^(preschool|kindergarten)$/.test(stage || '') ? 0 : /^(grade1|grade2)$/.test(stage || '') ? 1 : /^(grade3|grade4)$/.test(stage || '') ? 2 : 0;
  return Math.max(0, Math.min(2, base + ((level | 0) || 2) - 2));
}

/** The game’s own page, when `alone` is set. Href is `src` with the cache query removed. */
/** The controller map for the game playing in a frame, from the frame's address. See lib/pad-core.mjs. */
export function padMapFor(href) {
  let path = '';
  try { path = new URL(href, location.href).pathname; } catch { return null; }
  const game = SIDECARS.find(g => path.endsWith('/' + String(g.src).split('?')[0]));
  return game?.pad || null;
}

export function sidecarAlone(game) {
  if (!game || typeof game.alone !== 'string' || !game.alone.trim() || !game.src) return null;
  return {
    title: game.title,
    note: game.alone.trim(),
    href: String(game.src).split('?')[0]
  };
}

export function sidecarRows() {
  return SIDECARS.map(game => [game.id, game.title, game.blurb, game.icon, game.tint, game.tag]);
}

export function sidecarIsBuilt(id) {
  return built.has(id);
}

// Offline: the saved files, and the build list as of the last finished save (null without one).
let savedSet = null;
function savedFiles() {
  return savedSet ||= (async () => {
    const keys = new Set();
    let list = null;
    for (const name of await globalThis.caches.keys()) {
      if (!name.startsWith('sprouts-offline-')) continue;
      const cache = await globalThis.caches.open(name);
      for (const req of await cache.keys()) keys.add(new URL(req.url).pathname);
      try { list ||= (await (await cache.match('/__offline-files.json'))?.json()) || null; } catch { /* no list yet */ }
    }
    return { keys, list };
  })();
}

/**
 * True when the offline cache holds this page and every file the build ships in its folder,
 * so a game half saved (still downloading, or cut short) does not show a tile that cannot load.
 */
export async function savedOffline(src, files = savedFiles()) {
  try {
    const { keys, list } = await files;
    const page = new URL(src, location.href).pathname;
    if (!keys.has(page)) return false;
    if (!list) return true;
    const dir = `.${page.slice(0, page.lastIndexOf('/') + 1)}`;
    return Object.keys(list).every(path => !path.startsWith(dir) || keys.has(path.slice(1)));
  } catch {
    return false;
  }
}

/**
 * Keep a tile only for a sidecar whose page is already on this site.
 * The service worker skips HEAD requests, so offline (or when the check is slow) it falls back to
 * the saved copy. The home screen waits on this, so each check gets a short time limit.
 */
export async function findBuiltSidecars() {
  savedSet = null;
  const found = [];
  await Promise.all(SIDECARS.map(async game => {
    // Tidewater draws with WebGPU only; on a device without a WebGPU adapter the game would not start.
    if (game.needs === 'webgpu' && !(await webgpuReady())) return;
    try {
      const res = await fetch(game.src, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout?.(1500) });
      if (res.ok) found.push(game.id);
    } catch {
      // Offline, a slow connection, or the page is not built.
      if (await savedOffline(game.src)) found.push(game.id);
    }
  }));
  built.clear();
  found.forEach(id => built.add(id));
  return found;
}

let active = null;

export function stopSidecar() {
  active?.destroy();
  active = null;
}

export function postSidecar(message) {
  const frame = active?.frame;
  if (!message || !frame || active.dead || !frame.contentWindow) return;
  let origin = location.origin;
  try { origin = new URL(frame.src, location.href).origin; } catch { /* keep this page */ }
  frame.contentWindow.postMessage({ source: SIDECAR_SOURCE, ...message }, origin);
}

export function mountSidecar(root, spec, { onReady, onReload, onProgress, onFinish, onQuit, onPick, onSlip, onShow, onReplay, onNeed, onSay, onHush } = {}) {
  stopSidecar();
  const session = {
    dead: false,
    destroy() {
      if (this.dead) return;
      this.dead = true;
      window.removeEventListener('message', onMessage);
      if (frame) {
        frame.src = 'about:blank';
        frame.remove();
      }
      if (active === this) active = null;
    }
  };
  active = session;
  let frame = null;
  let announced = false;
  const ready = () => {
    if (announced || session.dead) return;
    announced = true;
    onReady?.();
  };
  const onMessage = event => {
    if (session.dead || !frame || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== SIDECAR_SOURCE) return;
    if (data.type === 'ready') ready();
    else if (data.type === 'progress') onProgress?.(data);
    else if (data.type === 'finish') onFinish?.(data.detail || '');
    else if (data.type === 'quit') onQuit?.();
    else if (data.type === 'pick') onPick?.(data);
    else if (data.type === 'slip') onSlip?.();
    else if (data.type === 'show') onShow?.();
    else if (data.type === 'replay') onReplay?.();
    else if (data.type === 'need') onNeed?.(data);
    // A mission game asks again for its settings once its panel is up (it may have missed the first send).
    else if (data.type === 'lesson-config-request') onNeed?.({ ...data, lesson: true });
    else if (data.type === 'say' && typeof data.text === 'string') onSay?.(data.text);
    else if (data.type === 'hush') onHush?.(!!data.on, frame);
  };
  window.addEventListener('message', onMessage);

  const missing = () => {
    if (session.dead) return;
    root.innerHTML = '<p class="sidecar-missing">This game is not on the site yet.</p>';
  };
  const guest = new URL(spec.src, location.href);
  fetch(spec.src, { cache: 'no-store' }).then(res => {
    if (session.dead) return;
    if (!res.ok) { missing(); return; }
    frame = document.createElement('iframe');
    frame.className = 'sidecar-frame';
    frame.title = spec.title;
    // Camera and microphone: Play with a friend without internet scans a code or listens for the chirp.
    frame.setAttribute('allow', 'autoplay; fullscreen; gamepad; camera; microphone');
    if (guest.origin !== location.origin) frame.setAttribute('credentialless', '');
    frame.addEventListener('load', () => {
      if (session.dead || !frame.src || frame.src === 'about:blank') return;
      try {
        frame.contentWindow?.postMessage({ source: SIDECAR_SOURCE, type: 'boot', game: spec.id }, guest.origin);
      } catch { /* the guest can ignore boot */ }
      // A game that reloads its own page (Skybound's next world) starts fresh and needs its setup again.
      if (announced) onReload?.();
      ready();
    });
    session.frame = frame;
    root.appendChild(frame);
    frame.src = spec.src;
  }).catch(() => missing());

  return session;
}
