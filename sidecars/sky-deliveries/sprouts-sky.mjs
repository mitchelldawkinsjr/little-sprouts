// Cloudkeep inside Little Sprouts: Answer catch.
//
// Fly the airship, scatter seeds, and catch sky creatures, as the game made it. When a question
// comes up, a banner shows it (and Little Sprouts reads it aloud), and each answer floats on a
// label over a different sky creature near the ship. Fly over and catch the creature with the right
// answer: it gives double sky coins, for more upgrades to the floating gardens. Catching a creature
// with a wrong answer crosses that answer off, and the question stays until the right one is caught.
// The next question pins its answers on new creatures, so the whole sky gets explored.
// Seeds still bring creatures close, which helps reach the one you want.
//
// Host messages: ask (question and choices), mark (was that catch right), clear / arcade (no questions).
// Guest messages: ready, need, show, pick, replay, progress. The cargo-mission panel stays hidden.

const SOURCE = 'sprouts-sidecar';
const embedded = typeof window !== 'undefined' && window.parent !== window;
const NEXT_AFTER = 7000;   // ms of free flying between questions
const FIRST_AFTER = 6000;  // ms before the first one
const NEAR = 70;           // prefer creatures this close to the ship
const GRAB = 6.5;          // fly this close to an answer creature to grab it
const COME = 12;           // answer creatures gather this far around the ship

const send = (type, extra = {}) => { if (embedded) window.parent.postMessage({ source: SOURCE, type, ...extra }, location.origin); };
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CSS = `
.ls-overlay, .ls-target { display: none !important; }
#ac-banner{position:fixed;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:12px;max-width:min(640px,calc(100vw - 24px));padding:10px 12px 10px 18px;border-radius:24px;background:#fffdf6f2;color:#1f4552;box-shadow:0 8px 26px #1f455233;font:800 clamp(17px,2.4vw,23px)/1.25 system-ui,sans-serif}
#ac-banner small{display:block;font-size:.68em;font-weight:700;color:#4c6d76}
#ac-banner .show{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 2px;font-size:26px}
#ac-banner .show:empty{display:none}
#ac-banner .show .countrow,#ac-banner .show .numpath{display:flex;flex-wrap:wrap;gap:4px}
#ac-banner button{flex:none;min-height:44px;padding:6px 12px;border:1px solid #c6d8dc;border-radius:14px;background:#fff;color:#1f4552;font:800 15px system-ui,sans-serif;cursor:pointer}
#ac-banner[hidden],.ac-tag[hidden]{display:none}
#ac-banner.good{background:#e3f4da}
.ac-tag{position:fixed;transform:translate(-50%,-100%);z-index:55;pointer-events:none;display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:16px;background:#fffdf6;border:3px solid #f0b545;color:#1f4552;font:900 clamp(16px,2.2vw,22px)/1.1 system-ui,sans-serif;box-shadow:0 6px 18px #1f455240;white-space:nowrap}
.ac-tag::after{content:'';position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);border:6px solid transparent;border-top-color:#f0b545}
.ac-tag.edge{padding:4px 9px;font-size:15px;opacity:.85}
.ac-tag.edge::after{display:none}
.ac-tag .sw{width:20px;height:20px;border-radius:50%;border:1px solid #0002}
.ac-tag .sh{width:20px;height:20px;background:var(--f,#5d7a45)}
.ac-tag .circle{border-radius:50%}.ac-tag .square{border-radius:3px}.ac-tag .triangle{clip-path:polygon(50% 0,0 100%,100% 100%)}
.ac-tag .rectangle{width:28px;height:16px;border-radius:3px}.ac-tag .oval{width:28px;border-radius:50%}
.ac-tag .diamond{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.ac-tag .star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 94%,50% 73%,21% 94%,32% 57%,2% 35%,39% 35%)}
.ac-tag .hexagon{clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}
#ac-cheer{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%) scale(.6);z-index:70;padding:14px 24px;border-radius:22px;background:#fffdf6;color:#1f4552;font:900 clamp(22px,4vw,34px)/1.2 system-ui,sans-serif;box-shadow:0 12px 36px #0004;opacity:0;pointer-events:none;transition:transform .25s,opacity .25s;text-align:center}
#ac-cheer.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
`;

/**
 * Which nearby creatures carry the answers: each choice still needing a creature gets the nearest free
 * one. The answers go on different kinds of creature when there are some about (a bird, a koi, a ray…),
 * and kinds that carried the last question's answers wait their turn, so every kind gets a go.
 */
export function assignTags(creatures, ship, tags, count, near = NEAR, recent = new Set(), lastKinds = new Set()) {
  const alive = new Set(creatures.map(c => c.id));
  for (const [id] of tags) if (!alive.has(id)) tags.delete(id);
  const used = new Set(tags.values());
  const byId = new Map(creatures.map(c => [c.id, c]));
  const kinds = new Set([...tags.keys()].map(id => byId.get(id)?.species).filter(Boolean));
  const free = creatures.filter(c => !tags.has(c.id) && c.mode !== 'capturing')
    .map(c => ({ c, d: Math.hypot(c.pos.x - ship.x, c.pos.y - ship.y, c.pos.z - ship.z) }))
    .sort((a, b) => recent.has(a.c.id) - recent.has(b.c.id) || (a.d > near) - (b.d > near) || a.d - b.d);
  // A creature of a kind not carrying an answer yet (and, better still, not last time either).
  const fresh = (x) => !x.c.species || !kinds.has(x.c.species);
  const pick = () => {
    const nearOk = (x) => x.d <= near || !free.some(y => y.d <= near);
    let at = free.findIndex(x => nearOk(x) && fresh(x) && !lastKinds.has(x.c.species));
    if (at < 0) at = free.findIndex(x => nearOk(x) && fresh(x));
    if (at < 0) at = 0;
    return free.splice(at, 1)[0];
  };
  for (let i = 0; i < count; i++) {
    if (used.has(i)) continue;
    const next = pick();
    if (!next) break;
    tags.set(next.c.id, i);
    if (next.c.species) kinds.add(next.c.species);
    used.add(i);
  }
  return tags;
}

if (embedded) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  // Sound: the flight starts by itself here, and a browser only lets a page start its sound after a
  // real tap, click, or key press on it. The first one turns the game's sound on (unless the app's
  // sound is off, or the game's own sound button was set off).
  let soundOk = true;
  const wakeSound = (e) => {
    if (!e.isTrusted || !soundOk) return;
    const audio = window.__skyAudio;
    if (!audio || !audio.enabled) return;
    if (audio.context?.state === 'running') { off(); return; }
    audio.start().then(on => { window.__skyUi?.setSound?.(on); if (audio.context?.state === 'running') off(); }).catch(() => {});
  };
  const wakeOn = ['pointerdown', 'keydown', 'touchend'];
  const off = () => wakeOn.forEach(t => removeEventListener(t, wakeSound, true));
  wakeOn.forEach(t => addEventListener(t, wakeSound, true));

  // No title screen: begin the flight as soon as the sky is ready.
  const begin = setInterval(() => {
    const go = document.querySelector('.start-button');
    if (go && !go.disabled) { clearInterval(begin); go.click(); }
  }, 300);

  const banner = document.createElement('div');
  banner.id = 'ac-banner';
  banner.hidden = true;
  banner.innerHTML = '<div><span class="q"></span><div class="show"></div><small class="how">Fly into it, or hold Q (or X) near it, to catch it.</small></div><button type="button">🔊 Hear</button>';
  banner.querySelector('button').onclick = () => send('replay');
  const cheerEl = document.createElement('div');
  cheerEl.id = 'ac-cheer';
  document.body.append(banner, cheerEl);
  let cheerTimer = 0;
  const cheer = text => {
    cheerEl.textContent = text;
    cheerEl.classList.add('on');
    clearTimeout(cheerTimer);
    cheerTimer = setTimeout(() => cheerEl.classList.remove('on'), 1800);
  };

  let question = null;      // the host's current question
  let active = false;       // its answers are out on creatures
  let cleared = false;      // arcade play: no questions
  let pending = null;       // a catch waiting for the host's mark
  let readyAt = performance.now() + FIRST_AFTER;
  const tags = new Map();   // creature id -> choice index
  const crossed = new Set(); // choices caught wrong this question
  const labels = [];        // one label element per choice
  let recent = new Set();   // creatures that carried the last question's answers
  let lastKinds = new Set(); // and what kinds of creature they were

  function face(c) {
    if (c.shape) return `<span class="sh ${esc(c.shape)}" style="--f:${esc(c.fill || '#5d7a45')}"></span>${esc(c.label)}`;
    if (c.fill) return `<span class="sw" style="background:${esc(c.fill)}"></span>${esc(c.label)}`;
    return esc(c.label);
  }
  function start() {
    active = true;
    tags.clear();
    crossed.clear();
    labels.splice(0).forEach(el => el.remove());
    question.choices.forEach(c => {
      const el = document.createElement('div');
      el.className = 'ac-tag';
      el.innerHTML = face(c);
      el.hidden = true;
      document.body.append(el);
      labels.push(el);
    });
    banner.querySelector('.q').textContent = question.prompt || 'Catch the right one!';
    banner.querySelector('.show').innerHTML = question.show || '';
    banner.classList.remove('good');
    banner.hidden = false;
    send('show');
    send('progress', { label: 'Catch the right answer!' });
  }
  function stop() {
    active = false;
    recent = new Set(tags.keys());
    const sim = window.__skySim;
    lastKinds = new Set([...tags.keys()].map(id => sim?.creatures.find(x => x.id === id)?.species).filter(Boolean));
    for (const [id] of tags) { const c = sim?.creatures.find(x => x.id === id); if (c) goHome(c); }
    tags.clear();
    labels.splice(0).forEach(el => el.remove());
    banner.hidden = true;
  }

  // Each catch passes through here (patched into the game's capture). Coins come out as usual.
  window.__sproutsGift = (release, creature) => {
    release();
    if (creature) grab(creature, release, false);
  };
  /** An answer creature was caught (held capture) or flown into: that is the pick. */
  function grab(creature, release, flown) {
    if (!active || !tags.has(creature.id) || pending) return;
    const index = tags.get(creature.id);
    tags.delete(creature.id);
    goHome(creature);
    if (flown) release();
    pending = { index, release };
    send('pick', { index });
  }
  /** While a creature carries an answer it flies near the ship; afterwards it goes back to its own spot. */
  function goHome(c) {
    if (c.__home) { c.home = c.__home; c.wander = { ...c.__home }; delete c.__home; }
  }

  addEventListener('message', e => {
    if (e.source !== window.parent || e.data?.source !== SOURCE) return;
    const data = e.data;
    if ('sound' in data) soundOk = data.sound !== false;
    if (data.type === 'duck') {
      const audio = window.__skyAudio;
      if (audio?.context && audio.enabled) audio.master.gain.setTargetAtTime(data.on ? 0.2 : 0.68, audio.context.currentTime, 0.1);
    }
    if (data.type === 'ask' && Array.isArray(data.choices) && data.choices.length) {
      // A new question arrives after a right catch (or at the start); it goes out after some free flying.
      question = { prompt: data.prompt || '', show: data.show || '', choices: data.choices };
    } else if (data.type === 'clear' || data.type === 'arcade') {
      cleared = true;
      stop();
    } else if (data.type === 'mark' && pending) {
      const { index, release } = pending;
      pending = null;
      if (data.ok) {
        // No more grabs for this question: the app has already moved on to the next one.
        active = false;
        const sim = window.__skySim;
        for (const [id] of tags) { const c = sim?.creatures.find(x => x.id === id); if (c) goHome(c); }
        tags.clear();
        release(); // double gift
        cheer('✨ Yes! Double sky coins!');
        banner.classList.add('good');
        setTimeout(stop, 900);
        question = null;
        readyAt = performance.now() + NEXT_AFTER;
      } else {
        crossed.add(index);
        if (labels[index]) labels[index].hidden = true;
        cheer('Not yet! Catch another one.');
      }
    }
  });

  const v = { x: 0, y: 0, z: 0 };
  function project(p, cam) {
    const m = cam.matrixWorldInverse.elements, pr = cam.projectionMatrix.elements;
    const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
    const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
    const z = m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14];
    const cx = pr[0] * x + pr[4] * y + pr[8] * z + pr[12];
    const cy = pr[1] * x + pr[5] * y + pr[9] * z + pr[13];
    const cw = pr[3] * x + pr[7] * y + pr[11] * z + pr[15];
    v.x = cx / cw; v.y = cy / cw; v.z = z;
    return v;
  }

  function frame() {
    requestAnimationFrame(frame);
    const sim = window.__skySim, cam = window.__skyCam;
    const flying = document.body.classList.contains('playing');
    if (!sim || !cam || !flying || cleared) return;
    if (!active && question && !pending && performance.now() >= readyAt) start();
    if (!active) return;
    const count = question.choices.length;
    // Crossed-off answers keep no creature; the rest always have one, even after creatures fly off or get caught.
    for (const [id, i] of tags) if (crossed.has(i)) { const c = sim.creatures.find(x => x.id === id); if (c) goHome(c); tags.delete(id); }
    const need = count;
    assignTags(sim.creatures, sim.pos, tags, need, NEAR, recent, lastKinds);
    for (const [id, i] of tags) if (crossed.has(i)) tags.delete(id);
    const byIndex = new Map([...tags].map(([id, i]) => [i, sim.creatures.find(c => c.id === id)]));
    // Answer creatures gather in a ring around the ship, so they are easy to reach and grab.
    const ship = sim.pos;
    for (const [i, c] of byIndex) {
      if (!c) continue;
      if (!c.__home) c.__home = { ...c.home };
      const a = (sim.yaw || 0) + Math.PI + (i - (count - 1) / 2) * 0.9;
      const spot = { x: ship.x + Math.sin(a) * COME, y: Math.max(9, Math.min(38, ship.y + (i % 2 ? 2 : -1))), z: ship.z + Math.cos(a) * COME };
      c.home = spot;
      if (Math.hypot(c.wander.x - spot.x, c.wander.z - spot.z) > 6) c.wander = { ...spot };
      // Flying into an answer creature catches it with the airship's own capture: it spirals into the
      // intake and gives its coins, the same as holding capture. The catch is the pick (__sproutsGift).
      if (!pending && !sim.autoCapture && c.mode !== 'capturing' && Math.hypot(c.pos.x - ship.x, c.pos.y - ship.y, c.pos.z - ship.z) < GRAB) {
        sim.autoCapture = c.id;
      }
    }
    labels.forEach((el, i) => {
      const c = byIndex.get(i);
      if (!c || crossed.has(i)) { el.hidden = true; return; }
      const p = project({ x: c.pos.x, y: c.pos.y + 3.2, z: c.pos.z }, cam);
      const behind = p.z > 0;
      let x = (p.x + 1) / 2, y = (1 - p.y) / 2;
      const off = behind || x < 0.04 || x > 0.96 || y < 0.3 || y > 0.95;
      if (behind) { x = 1 - x; y = 0.6; }
      el.classList.toggle('edge', off);
      el.style.left = Math.max(5, Math.min(95, x * 100)) + '%';
      el.style.top = Math.max(36, Math.min(94, y * 100)) + '%';
      el.hidden = false;
    });
  }
  requestAnimationFrame(frame);
  // Local testing only: which creature carries which answer.
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__answerCatch = { tags, get question() { return question; }, get active() { return active; } };

  send('ready');
  const nudge = setInterval(() => { if (question || cleared) clearInterval(nudge); else send('need'); }, 1200);
}
