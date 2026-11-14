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
 * Set `alone` to a short line when the game also has its own page.
 * The host shows Play on its own and opens `src` without the query.
 */

const SIDECAR_SOURCE = 'sprouts-sidecar';

const SIDECARS = [
  {
    id: 'rally',
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
    title: 'Dirt ride',
    blurb: 'Lean back, jump the ramps, and land the dirt bike. A right answer says good.',
    icon: '🏍',
    tint: '#f3e2c4',
    tag: 'RIDE',
    shelf: 'drive-fly-aim',
    src: 'sidecars/bike/index.html?v=ball3',
    alone: 'A level menu, four trails, and stars are on that page.',
    howTo: 'Hold the gas and the bike pulls away. Lean back to lift the front wheel, and lean forward to bring the nose down. Ride the hills and land on both wheels. A question comes after a longer stretch of trail. A right answer says good, and the ride continues. A wrong answer speeds the bike up and tips it hard either way. Lean quick to save the crash. Level 1 stays upright until a miss. Level 3 lets you tilt in the air.'
  },
  {
    id: 'walk',
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
    title: 'Marble box',
    blurb: 'Tilt the wooden box and roll the marble into the pocket with the right answer.',
    icon: '🔮',
    tint: '#f1e2cc',
    tag: 'ROLL',
    shelf: 'drive-fly-aim',
    src: 'sidecars/roll/index.html?v=ball3',
    alone: 'Five sample mazes are on that page.',
    howTo: 'A question from this learner’s profile floats at the top, and each answer sits by a pocket in the maze. Drag anywhere, use the arrows, or a controller to tilt the box. On a phone, tap Tilt and tip the phone. Roll the marble into the pocket with the right answer. A wrong pocket closes, and the marble rolls back to the start. Each question is a new maze.'
  },
  {
    id: 'grass',
    title: 'Grass maze',
    blurb: 'Run your garden buddy through a maze of tall grass to the sign with the right answer.',
    icon: '🌾',
    tint: '#dcefc8',
    tag: 'GRASS',
    shelf: 'run-jump-dodge',
    src: 'sidecars/grass/index.html?v=ball3',
    alone: 'Five sample mazes are on that page.',
    howTo: 'A question from this learner’s profile floats at the top, and each answer is on a sign at the end of a grass path. Drag anywhere, use the arrows, or a controller to run. Tap Map to see the whole maze. On a controller, the left stick or d-pad runs and A shows the map. Run to the sign with the right answer. A wrong sign fades, and you keep looking. Each question is a new maze.'
  },
  {
    id: 'dash',
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
    id: 'glow',
    title: 'Light lines',
    blurb: 'Draw glowing lines on a dark board and roll a ball down them to the right answer.',
    icon: '💡',
    tint: '#d9dcf2',
    tag: 'GLOW',
    shelf: 'drive-fly-aim',
    src: 'sidecars/glow/index.html?v=ball3',
    alone: 'Five sample boards are on that page.',
    howTo: 'The board is dark. A question from this learner’s profile floats at the top, and each answer sits in a pocket along the bottom. Draw lines with a finger or the mouse: they glow, light up the board, and show hidden walls. White is a ramp, green speeds the ball up, blue bounces, and yellow slows it down. Red lines are danger: touching one costs a heart. Ink runs out, so plan a path, then tap Drop. A wrong pocket closes, and you can fix your lines and drop again. On a controller, A drops, B undoes, and the bumpers change color.'
  },
  {
    id: 'range',
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
    title: 'Block meadow',
    blurb: 'Walk a big block world. Find gift boxes, answer, and build with the blocks you win.',
    icon: '🧱',
    tint: '#e2efd6',
    tag: 'BUILD',
    shelf: 'calm-create',
    src: 'sidecars/blocks/index.html?v=blocks2',
    alone: 'The meadow, building, and sample gift boxes are on that page.',
    howTo: 'Walk anywhere in the meadow. Follow the arrow to the glowing gift box and open it for a question from this learner’s profile. A right answer earns a learning star and a new color of block. A wrong answer greys out, and you pick again. Tap a block to build on it, or pick the shovel and tap to dig it out. Windows and doors are in the block bar from the start, and tapping a door opens or shuts it. After five right answers, every block is yours for free build. Press I’m done building to finish. The world is saved in this browser. On a controller, the left stick walks, the right stick looks, A builds or digs, X jumps, the shoulders change the block, and the left trigger switches build and dig.'
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
    alone: 'Pick a mission and race the clock on that page.',
    howTo: 'Pick a mission. Answer as many as you can in three minutes. Four choices each time. Finish early or wait for the timer.'
  },
  {
    id: 'skybound',
    title: 'Skybound climb',
    blurb: 'Jump the floating pads. Checkpoints ask a question before you climb on.',
    icon: '☁',
    tint: '#d9e4f8',
    tag: 'CLIMB',
    shelf: 'run-jump-dodge',
    src: 'sidecars/skybound/index.html?v=ball3',
    alone: 'Three worlds and crystals are on that page.',
    howTo: 'Jump from pad to pad. A checkpoint pauses for a question from this learner’s profile. A right answer earns a learning star and the climb continues. A wrong answer lets you keep going without a star. Reach the portal to finish. Arcade play skips the questions.'
  }
];

const built = new Set();

export function sidecarGame(id) {
  return SIDECARS.find(game => game.id === id) || null;
}

/** The game’s own page, when `alone` is set. Href is `src` with the cache query removed. */
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

/** Keep a tile only for a sidecar whose page is already on this site. */
export async function findBuiltSidecars() {
  const found = [];
  await Promise.all(SIDECARS.map(async game => {
    try {
      const res = await fetch(game.src, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) found.push(game.id);
    } catch { /* the page is not built */ }
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

export function mountSidecar(root, spec, { onReady, onProgress, onFinish, onQuit, onPick, onSlip, onShow, onReplay, onNeed } = {}) {
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
    else if (data.type === 'need') onNeed?.();
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
    frame.setAttribute('allow', 'autoplay; fullscreen; gamepad');
    if (guest.origin !== location.origin) frame.setAttribute('credentialless', '');
    frame.addEventListener('load', () => {
      if (session.dead || !frame.src || frame.src === 'about:blank') return;
      try {
        frame.contentWindow?.postMessage({ source: SIDECAR_SOURCE, type: 'boot', game: spec.id }, guest.origin);
      } catch { /* the guest can ignore boot */ }
      ready();
    });
    session.frame = frame;
    root.appendChild(frame);
    frame.src = spec.src;
  }).catch(() => missing());

  return session;
}
