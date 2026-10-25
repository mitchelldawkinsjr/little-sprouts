/**
 * Sidecar games boot in their own document and draw in an iframe.
 * Add a future game by appending one entry here. Its page can load
 * /sidecar-guest.js and call SproutsSidecar.ready(), .progress(),
 * .finish(), or .quit(). A page without that script still plays:
 * the iframe finishing its load counts as ready.
 *
 * Messages are { source: 'sprouts-sidecar', type, ... }.
 * Host to guest: boot, ask, mark, config. Guest to host: ready, show, pick, slip, progress, finish, quit, need.
 * progress may include label and travel. The guest does not store learner profiles.
 */

export const SIDECAR_SOURCE = 'sprouts-sidecar';

export const SIDECARS = [
  {
    id: 'rally',
    title: 'Backroad rally',
    blurb: 'Spell a word you hear, match, or answer a math fact. A right answer turbos the car.',
    icon: '🏎',
    tint: '#efe6d4',
    tag: 'DRIVE',
    src: 'sidecars/rally/index.html?v=mix-level',
    howTo: 'Pick a car and a road. Questions are spread along the stage. Five right answers, and you can drive the rest of the way to the finish. A longer round asks up to eight.'
  },
  {
    id: 'flight',
    title: 'Sky flight',
    blurb: 'Steer through the gate with the right answer. A wrong gate turns the plane back.',
    icon: '✈',
    tint: '#d7ebf5',
    tag: 'FLY',
    src: 'sidecars/flight/index.html?v=arcade-play',
    howTo: 'The plane holds its height. Steer left or right through the gate with the right answer. A wrong gate slows the plane and turns it back. Those same gates stay until you fly through the right one. After five right answers, you get two minutes of free flight. The plane keeps flying where you look. Forward flies faster, back flies backward, and the side buttons slide. Hitting the ground ends the flight.'
  },
  {
    id: 'bike',
    title: 'Dirt ride',
    blurb: 'Lean back, jump the ramps, and land the dirt bike. A right answer says good.',
    icon: '🏍',
    tint: '#f3e2c4',
    tag: 'RIDE',
    src: 'sidecars/bike/index.html?v=mix-level',
    howTo: 'Hold the gas and the bike pulls away. Lean back to lift the front wheel, and lean forward to bring the nose down. Ride the hills and land on both wheels. A question comes after a longer stretch of trail. A right answer says good, and the ride continues. A wrong answer speeds the bike up. Level 1 stays upright. Level 3 lets you tilt in the air.'
  },
  {
    id: 'walk',
    title: 'Garden walk',
    blurb: 'Walk the sprout to the picture that matches.',
    icon: '🌱',
    tint: '#e4f2df',
    tag: 'WALK',
    src: 'sidecars/walk/index.html?v=arcade-play',
    howTo: 'Hold left or right and walk past the other pictures. Let go on the one that matches, or tap it and the sprout walks to it. The right picture finishes the question. A wrong picture sends the sprout back. Words, numbers, shapes, and colors take turns.'
  },
  {
    id: 'paint',
    title: 'Paint sphere',
    blurb: 'Look inside the shell, then paint the half with the right answer.',
    icon: '🎨',
    tint: '#f8e2d4',
    tag: 'PAINT',
    src: 'sidecars/paint/index.html?v=paint-shell2',
    howTo: 'A math question from this learner’s profile appears, and the two answers float on either half of the shell. Look for five seconds, then paint for ten. Only paint on the right answer counts. Click the picture to look around. The train on the middle circle sets you down beside the track.'
  }
];

const built = new Set();

export function sidecarGame(id) {
  return SIDECARS.find(game => game.id === id) || null;
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
