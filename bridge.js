/**
 * Stick bridge — each question is the next gap.
 * The learner times the stick every time. A right answer makes the
 * landing wide. A wrong answer makes it a thin strip.
 */
import { bridgeReach, bridgeWindow } from './logic.mjs?v=bridge-run';

let active = null;

export function stopBridge() {
  active?.destroy();
  active = null;
}

function nextPad(span, rand) {
  const pad = span.pad || 70;
  const gap = span.gap || 100;
  const wobble = pad * 0.18;
  return {
    gap: gap + (rand() - 0.4) * 24,
    w: Math.max(36, pad + (rand() - 0.5) * wobble)
  };
}

export function mountBridge(root, { span, stops = 5, reduced, onCrossed, onMiss }) {
  stopBridge();
  const calm = reduced ? 0.65 : 1;
  const session = {
    dead: false,
    raf: 0,
    cleanups: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.cleanups.forEach(fn => fn());
      if (active === this) active = null;
    }
  };
  active = session;

  root.innerHTML = `<div class="bridge-play"><div class="bridge" role="application" aria-label="Hold to grow the stick across each gap. Reach the last platform."><canvas class="bridge-view"></canvas></div><button type="button" class="steer-btn bridge-hold" id="bridgeHold" aria-label="Hold to grow the bridge">Hold</button></div>`;
  const stage = root.querySelector('.bridge');
  const canvas = stage.querySelector('canvas');
  const hold = root.querySelector('#bridgeHold');
  const ctx = canvas.getContext('2d');
  let width = 640;
  let height = 320;
  let mode = 'wait';
  let stick = 0;
  let rotation = 0;
  let holding = false;
  let easy = true;
  let missed = false;
  let heroX = 0;
  let heroDrop = 0;
  let pose = 0;
  let last = 0;
  let platforms = [];
  let index = 0;
  const base = { gap: span?.gap || 100, pad: span?.pad || 70, grow: span?.grow || 160 };
  const trees = [40, 120, 210, 300, 390, 480].map((x, i) => ({
    x,
    color: ['#6D8821', '#8FAC34', '#98B333'][i % 3]
  }));

  const call = (fn) => { try { fn?.(); } catch { /* the host owns errors */ } };
  const current = () => platforms[index];
  const upcoming = () => platforms[index + 1];
  const pivotX = () => current().x + current().w;
  const near = () => upcoming().x - pivotX();
  const far = () => upcoming().x + upcoming().w - pivotX();
  const landing = () => bridgeWindow(easy, near(), far());
  const growRate = () => base.grow * (easy ? 0.62 : 1.55);

  const addPlatform = (lastOne) => {
    const prev = platforms[platforms.length - 1];
    const made = nextPad(base, Math.random);
    platforms.push({ x: prev.x + prev.w + made.gap, w: lastOne ? Math.max(made.w, 72) : made.w, goal: !!lastOne });
  };

  const view = () => {
    const here = current();
    const next = upcoming();
    const left = here.x - 28;
    const right = (next ? next.x + next.w : here.x + here.w) + 36;
    const scale = Math.min(1.35, Math.max(0.45, (width - 36) / Math.max(120, right - left)));
    return {
      scale,
      x: wx => 18 + (wx - left) * scale,
      ground: height * 0.62
    };
  };

  const layout = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(280, rect.width);
    height = Math.max(160, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const hill = (color, baseY, amp, freq) => {
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 6) {
      ctx.lineTo(x, height - baseY + Math.sin(x * freq) * amp);
    }
    ctx.lineTo(width, height);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawHero = (x, y, step) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(-9, -32, 18, 22, 5);
    ctx.fill();
    const kick = Math.sin(step) * 3;
    ctx.beginPath();
    ctx.arc(-5, -7, 3.2, 0, Math.PI * 2);
    ctx.arc(5, -7 + kick, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4, -22, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e23b3b';
    ctx.fillRect(-11, -33, 22, 5);
    ctx.beginPath();
    ctx.moveTo(-11, -31);
    ctx.lineTo(-18, -36);
    ctx.lineTo(-16, -26);
    ctx.fill();
    ctx.restore();
  };

  const drawFlag = (x, ground) => {
    ctx.fillStyle = '#111';
    ctx.fillRect(x, ground - 34, 2, 34);
    ctx.fillStyle = '#e23b3b';
    ctx.beginPath();
    ctx.moveTo(x + 2, ground - 34);
    ctx.lineTo(x + 18, ground - 28);
    ctx.lineTo(x + 2, ground - 22);
    ctx.fill();
  };

  const paint = () => {
    const { scale, x, ground } = view();
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#BBD691');
    sky.addColorStop(1, '#FEF1E1');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    hill('#95C629', height * 0.28, 12, 0.02);
    hill('#659F1C', height * 0.18, 18, 0.012);
    trees.forEach(tree => {
      const tx = (tree.x % Math.max(width, 1));
      const ty = height * 0.72 + Math.sin(tree.x * 0.05) * 8;
      ctx.fillStyle = '#7D833C';
      ctx.fillRect(tx - 1, ty - 8, 2, 8);
      ctx.fillStyle = tree.color;
      ctx.beginPath();
      ctx.moveTo(tx - 8, ty - 8);
      ctx.lineTo(tx, ty - 28);
      ctx.lineTo(tx + 8, ty - 8);
      ctx.fill();
    });
    platforms.forEach(pad => {
      const left = x(pad.x);
      ctx.fillStyle = pad.goal ? '#1d3b2a' : '#111';
      ctx.fillRect(left, ground, Math.max(8, pad.w * scale), height - ground + 2);
      if (pad.goal) drawFlag(left + Math.max(8, pad.w * scale) - 16, ground);
    });
    const next = upcoming();
    if (next && (mode === 'stretch' || mode === 'turn')) {
      const zone = landing();
      const x0 = x(pivotX() + zone.near);
      const x1 = x(pivotX() + zone.far);
      ctx.fillStyle = easy ? '#2f6b45' : '#e23b3b';
      ctx.fillRect(x0, ground, Math.max(6, x1 - x0), easy ? 8 : 16);
    }
    if (stick > 1) {
      ctx.save();
      ctx.translate(x(pivotX()), ground);
      ctx.rotate(rotation);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -stick * scale);
      ctx.stroke();
      ctx.restore();
    }
    const feet = ground + heroDrop;
    drawHero(x(heroX), feet, mode === 'walk' ? heroX * 0.35 : 0);
    if (mode === 'stretch' && !holding) {
      ctx.fillStyle = '#24332c';
      ctx.font = '700 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(easy ? 'Hold. The landing is wide.' : 'Hold. The landing is small.', width / 2, 36);
    }
  };

  const openHold = () => {
    mode = 'stretch';
    stick = 2;
    rotation = 0;
    missed = false;
    heroDrop = 0;
    holding = false;
    hold.hidden = false;
  };

  const release = () => {
    if (mode !== 'stretch' || !holding) return;
    holding = false;
    mode = 'turn';
  };

  const tick = now => {
    if (session.dead) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    const paused = !!document.querySelector('dialog[open]');
    if (!paused) {
      if (mode === 'stretch' && holding) {
        stick += growRate() * calm * dt;
        if (stick > far() + 160) release();
      }
      if (mode === 'turn') {
        rotation = Math.min(Math.PI / 2, rotation + 3.4 * calm * dt);
        if (rotation >= Math.PI / 2 - 0.001) {
          rotation = Math.PI / 2;
          const zone = landing();
          missed = !bridgeReach(stick, zone.near, zone.far);
          if (!missed && stick < near()) stick = near();
          mode = 'walk';
        }
      }
      if (mode === 'walk') {
        const limit = missed ? pivotX() + stick + 4 : upcoming().x + upcoming().w - 14;
        heroX += 150 * calm * dt;
        if (heroX >= limit) {
          heroX = limit;
          if (missed) {
            mode = 'fall';
            pose = 0.85;
          } else {
            mode = 'landed';
            pose = 0.4;
          }
        }
      }
      if (mode === 'fall') {
        rotation = Math.min(Math.PI, rotation + 2.6 * calm * dt);
        heroDrop += 160 * calm * dt;
        pose -= dt;
        if (pose <= 0) {
          mode = 'down';
          const wasEasy = easy;
          call(() => onMiss?.({ easy: wasEasy }));
        }
      }
      if (mode === 'landed') {
        pose -= dt;
        if (pose <= 0) {
          index += 1;
          heroX = current().x + 18;
          stick = 0;
          rotation = 0;
          mode = upcoming() ? 'wait' : 'done';
          hold.hidden = true;
          call(onCrossed);
        }
      }
    }
    if (session.dead) return;
    paint();
    session.raf = requestAnimationFrame(tick);
  };

  const down = event => {
    if (mode !== 'stretch' || holding) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    holding = true;
  };
  const up = () => {
    if (mode === 'stretch' && holding) release();
  };
  const typing = event => event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  const onKey = event => {
    if (document.querySelector('dialog[open]') || typing(event) || mode !== 'stretch') return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (event.type === 'keydown' && !event.repeat) holding = true;
    if (event.type === 'keyup') up();
  };

  const gaps = Math.max(1, Math.round(+stops) || 1);
  platforms = [{ x: 40, w: Math.max(78, base.pad) }];
  for (let i = 0; i < gaps; i++) addPlatform(i === gaps - 1);
  heroX = pivotX() - 14;
  layout();
  hold.hidden = true;
  canvas.addEventListener('pointerdown', down);
  hold.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKey);
  window.addEventListener('resize', layout);
  session.cleanups.push(() => {
    canvas.removeEventListener('pointerdown', down);
    hold.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKey);
    window.removeEventListener('resize', layout);
  });
  session.raf = requestAnimationFrame(tick);

  return {
    play({ easy: wide } = {}) {
      if (session.dead || !upcoming()) return;
      if (mode === 'walk' || mode === 'turn' || mode === 'landed' || mode === 'fall') return;
      easy = !!wide;
      heroX = pivotX() - 14;
      openHold();
    },
    retry() {
      if (session.dead || !upcoming()) return;
      heroX = pivotX() - 14;
      openHold();
    },
    destroy: session.destroy
  };
}
