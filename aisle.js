/**
 * Market walk. The shopper moves the way The Mine does: each spot in the
 * aisles is a radio, an arrow checks the next spot, and the aisle slides
 * over in one step. You can pick up only what is in the spot you are
 * standing in. Up and down exist at the ends of an aisle, where the
 * aisles meet. The market and the shopper are drawn here.
 */
import { questionHolding } from './hold.js?v=ask-first';

let stop = () => {};
let serial = 0;

const call = (fn, ...args) => { try { return fn?.(...args); } catch (error) { console.error(error); } };

const WALK = 0.72;
const ROWS = 2;

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function hex(fill) {
  return /^#[0-9a-fA-F]{3,8}$/.test(fill || '') ? fill : '';
}

function shapeSvg(name, fill) {
  const color = hex(fill) || '#5d7a45';
  const pen = `fill="${color}" stroke="#3d5230" stroke-width="4" stroke-linejoin="round"`;
  const body = {
    square: `<rect x="18" y="18" width="64" height="64" rx="8" ${pen}/>`,
    rectangle: `<rect x="10" y="28" width="80" height="44" rx="8" ${pen}/>`,
    triangle: `<polygon points="50,12 90,84 10,84" ${pen}/>`,
    diamond: `<polygon points="50,8 90,50 50,92 10,50" ${pen}/>`,
    star: `<polygon points="50,8 61,38 94,38 67,58 78,90 50,70 22,90 33,58 6,38 39,38" ${pen}/>`,
    hexagon: `<polygon points="50,8 88,28 88,72 50,92 12,72 12,28" ${pen}/>`,
    oval: `<ellipse cx="50" cy="50" rx="40" ry="26" ${pen}/>`
  }[name] || `<circle cx="50" cy="50" r="34" ${pen}/>`;
  return `<svg class="market-shape" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}

function goodInner(item) {
  if (item.shape) return shapeSvg(item.shape, item.fill);
  const color = hex(item.fill);
  if (color) return `<i class="market-swatch" style="background:${color}"></i><span>${escape(item.label)}</span>`;
  return `<span>${escape(item.label)}</span>`;
}

function neighbor(spot, dir, cols) {
  if (dir === 'left' && spot.col > 0) return { row: spot.row, col: spot.col - 1 };
  if (dir === 'right' && spot.col < cols - 1) return { row: spot.row, col: spot.col + 1 };
  const lift = spot.col === 0 || spot.col === cols - 1;
  if (lift && dir === 'up' && spot.row > 0) return { row: spot.row - 1, col: spot.col };
  if (lift && dir === 'down' && spot.row < ROWS - 1) return { row: spot.row + 1, col: spot.col };
  return null;
}

function placeGoods(choices, cols) {
  const open = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === ROWS - 1 && col === 0) continue;
      open.push({ row, col });
    }
  }
  for (let i = open.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [open[i], open[j]] = [open[j], open[i]];
  }
  const placed = [];
  choices.forEach(choice => {
    let index = open.findIndex(spot => placed.every(item => Math.abs(item.row - spot.row) + Math.abs(item.col - spot.col) >= 2));
    if (index < 0) index = 0;
    const spot = open.splice(index, 1)[0];
    if (!spot) return;
    placed.push({ ...choice, row: spot.row, col: spot.col, tried: false });
  });
  return placed;
}

export function stopAisle() {
  stop();
  stop = () => {};
}

export function mountAisle(root, { board = {}, reduced, nextQuestion, onPrompt, onMiss, onClear, onTime, onFinished } = {}) {
  stopAisle();
  if (!root) return;
  const prefix = `mkt${++serial}`;
  const engine = document.createElement('div');
  engine.className = 'arcade aisle-play market-engine';
  if (reduced) engine.classList.add('plain');
  root.replaceChildren(engine);

  let alive = true;
  let cols = 4;
  let goods = [];
  let phase = 'shop';
  let clock = board.seconds || 32;
  let shown = -1;
  let slipped = false;
  let reveal = false;
  let wait = 0;
  let walking = false;
  let at = { row: ROWS - 1, col: 0 };
  let raf = 0;
  let said = 0;
  let walkTimer = 0;

  const idOf = spot => `${prefix}-r${spot.row}c${spot.col}`;
  const keyOf = spot => `r${spot.row}c${spot.col}`;
  const seconds = () => Math.max(8, (+board.seconds || 32) * (reduced ? 1.4 : 1));
  const view = () => engine.querySelector('.market-view');
  const frozen = () => !alive || phase !== 'shop' || walking || !!document.querySelector('dialog[open]') || questionHolding();

  const face = dir => {
    const kid = engine.querySelector('.market-kid');
    if (!kid || (dir !== 'left' && dir !== 'right')) return;
    kid.dataset.face = dir;
  };
  const sayLine = text => {
    const line = engine.querySelector('.market-say');
    if (!line) return;
    line.textContent = text;
    line.hidden = false;
    clearTimeout(said);
    said = setTimeout(() => { if (line.isConnected) line.hidden = true; }, reduced ? 700 : 1700);
  };
  const paintClock = () => {
    const node = engine.querySelector('.market-clock');
    if (!node) return;
    const left = Math.max(0, Math.ceil(clock));
    node.textContent = `${left}s`;
    node.classList.toggle('late', left === 0);
  };
  const reportTime = () => {
    const next = Math.max(0, Math.ceil(clock));
    paintClock();
    if (next === shown) return;
    shown = next;
    call(onTime, next);
  };
  const paintHere = () => {
    const here = keyOf(at);
    engine.querySelectorAll('.market-spot').forEach(spot => { spot.inert = spot.dataset.spot !== here; });
    engine.querySelectorAll('.market-arrow').forEach(arrow => { arrow.inert = walking || arrow.dataset.from !== here; });
    engine.querySelectorAll('.market-good').forEach(button => {
      const item = goods.find(entry => keyOf(entry) === button.dataset.spot);
      if (item?.tried) button.inert = true;
    });
  };
  const unlock = () => {
    if (!alive) return;
    walking = false;
    engine.classList.remove('walking');
    engine.querySelectorAll('.market-radio').forEach(radio => { radio.disabled = false; });
    clearTimeout(walkTimer);
    walkTimer = 0;
    paintHere();
  };
  const lockWalk = () => {
    walking = true;
    engine.classList.add('walking');
    engine.querySelectorAll('.market-radio').forEach(radio => { radio.disabled = true; });
    paintHere();
    clearTimeout(walkTimer);
    walkTimer = setTimeout(unlock, Math.round(WALK * 1000) + 90);
  };
  const readSpot = () => {
    const radio = engine.querySelector('.market-radio:checked');
    const match = radio?.id.match(/r(\d+)c(\d+)$/);
    return match ? { row: +match[1], col: +match[2] } : { row: ROWS - 1, col: 0 };
  };
  const go = dir => {
    if (frozen()) return;
    const next = neighbor(at, dir, cols);
    if (!next) return;
    const radio = engine.querySelector(`#${idOf(next)}`);
    if (!radio || radio.checked) return;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const take = item => {
    if (!item || item.tried || phase !== 'shop') return;
    const button = engine.querySelector(`.market-good[data-spot="${keyOf(item)}"]`);
    if (!item.ok) {
      item.tried = true;
      slipped = true;
      button?.classList.add('tried');
      if (button) button.inert = true;
      const stage = view();
      stage?.classList.remove('shake');
      void stage?.offsetWidth;
      stage?.classList.add('shake');
      sayLine('Not this one.');
      call(onMiss, 'wrong');
      return;
    }
    item.tried = true;
    button?.classList.add('pocketed');
    phase = 'pocket';
    engine.classList.add('pocket');
    wait = reduced ? 0.2 : 0.45;
    sayLine('In the basket.');
  };

  const paint = () => {
    engine.classList.add('plain');
    engine.classList.remove('walking', 'pocket');
    engine.style.setProperty('--cols', String(cols));
    engine.style.setProperty('--rows', String(ROWS));
    engine.style.setProperty('--walk', reduced ? '0s' : `${WALK}s`);
    const radios = [];
    const spots = [];
    const arrows = [];
    let css = '';
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < cols; col++) {
        const spot = { row, col };
        const key = keyOf(spot);
        const id = idOf(spot);
        const door = row === ROWS - 1 && col === 0;
        const checked = door ? ' checked' : '';
        radios.push(`<input class="market-radio" type="radio" name="${prefix}" id="${id}"${checked} tabindex="-1" aria-hidden="true">`);
        css += `#${id}:checked ~ .market-view .market-world{transform:translate(calc(${-col} * 100% / var(--cols)),calc(${-row} * 100% / var(--rows)))}`;
        css += `#${id}:checked ~ .market-view .market-arrow[data-from="${key}"]{opacity:1;pointer-events:auto}`;
        const item = goods.find(good => good.row === row && good.col === col);
        const lift = col === 0 || col === cols - 1;
        const sign = door ? 'Door' : `Aisle ${row === ROWS - 1 ? 1 : 2}`;
        const good = item
          ? `<button type="button" class="market-good" data-spot="${key}" data-long="${String(item.label || '').length > 8 ? 1 : 0}" aria-label="Pick up ${escape(item.label || item.shape || 'this')}">${goodInner(item)}</button>`
          : '';
        spots.push(`<section class="market-spot${door ? ' door' : ''}${lift ? ' lift' : ''}" data-spot="${key}"><p class="market-sign">${escape(sign)}</p><div class="market-wall" aria-hidden="true"></div><div class="market-floor" aria-hidden="true"></div>${good}</section>`);
        for (const dir of ['left', 'right', 'up', 'down']) {
          const next = neighbor(spot, dir, cols);
          if (!next) continue;
          const symbol = dir === 'left' ? '←' : dir === 'right' ? '→' : dir === 'up' ? '↑' : '↓';
          const name = dir === 'up' || dir === 'down' ? 'Walk to the other aisle' : `Walk ${dir}`;
          arrows.push(`<label class="market-arrow" data-dir="${dir}" data-from="${key}" for="${idOf(next)}" aria-label="${name}">${symbol}</label>`);
        }
      }
    }
    engine.innerHTML = `<style>${css}</style>${radios.join('')}<div class="market-view aisle" aria-label="A market. Tap the arrows to walk the aisles and pick up the right thing."><div class="market-world">${spots.join('')}</div><div class="market-kid" data-face="right" aria-hidden="true"><div class="market-kid-flip"><span class="market-shadow"></span><span class="market-basket"></span><span class="market-shirt"></span><span class="market-face"></span><span class="market-leaf"></span></div></div>${arrows.join('')}<p class="market-say" hidden></p><p class="market-clock" aria-live="polite"></p></div><div class="steer market-pad" aria-label="Walk"><button type="button" class="steer-btn" data-dir="up" aria-label="Up">↑</button><button type="button" class="steer-btn" data-dir="left" aria-label="Left">←</button><button type="button" class="steer-btn" data-dir="down" aria-label="Down">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Right">→</button></div>`;
    at = { row: ROWS - 1, col: 0 };
    paintClock();
    paintHere();
    if (!reduced) requestAnimationFrame(() => { if (alive) engine.classList.remove('plain'); });
  };

  const begin = () => {
    unlock();
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      phase = 'done';
      call(onFinished);
      return;
    }
    cols = Math.max(4, pack.choices.length + 1);
    goods = placeGoods(pack.choices, cols);
    phase = 'shop';
    clock = seconds();
    shown = -1;
    slipped = false;
    reveal = false;
    paint();
    reportTime();
    call(onPrompt);
  };

  engine.addEventListener('change', event => {
    if (!event.target.classList?.contains('market-radio')) return;
    const next = readSpot();
    if (next.row === at.row && next.col === at.col) return;
    const dir = next.col < at.col ? 'left' : next.col > at.col ? 'right' : next.row < at.row ? 'up' : 'down';
    at = next;
    face(dir);
    if (!reduced && phase === 'shop') lockWalk();
    else paintHere();
  });
  engine.addEventListener('click', event => {
    const good = event.target.closest?.('.market-good');
    if (good && engine.contains(good)) {
      if (frozen()) {
        event.preventDefault();
        return;
      }
      take(goods.find(item => keyOf(item) === good.dataset.spot));
      return;
    }
    if (event.target.closest?.('.market-arrow') && frozen()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  engine.addEventListener('pointerdown', event => {
    const button = event.target.closest?.('.market-pad [data-dir]');
    if (!button || !engine.contains(button)) return;
    event.preventDefault();
    go(button.dataset.dir);
  });
  engine.addEventListener('transitionend', event => {
    if (event.target === engine.querySelector('.market-world') && event.propertyName === 'transform') unlock();
  });

  const onKey = event => {
    if (!engine.isConnected) return;
    const key = event.key.toLowerCase();
    const dir = key === 'arrowleft' || key === 'a' ? 'left' : key === 'arrowright' || key === 'd' ? 'right' : key === 'arrowup' || key === 'w' ? 'up' : key === 'arrowdown' || key === 's' ? 'down' : '';
    if (!dir) return;
    if (event.target?.closest?.('input, textarea, select, dialog')) return;
    event.preventDefault();
    if (event.repeat) return;
    go(dir);
  };
  window.addEventListener('keydown', onKey);

  const frame = now => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - (frame.then || now)) / 1000 || 0);
    frame.then = now;
    const paused = !!document.querySelector('dialog[open]') || questionHolding();
    if (!paused && phase === 'shop') {
      if (!reveal) {
        clock -= dt;
        if (clock <= 0) {
          clock = 0;
          reveal = true;
          slipped = true;
          goods.forEach(item => {
            if (item.ok) engine.querySelector(`.market-good[data-spot="${keyOf(item)}"]`)?.classList.add('glow');
          });
          sayLine('Time is up.');
          call(onMiss, 'time');
        }
      }
      reportTime();
    } else if (!paused && phase === 'pocket') {
      wait -= dt;
      if (wait <= 0) {
        phase = 'shop';
        call(onClear, !slipped);
        begin();
      }
    }
    raf = requestAnimationFrame(frame);
  };

  begin();
  raf = requestAnimationFrame(frame);
  stop = () => {
    alive = false;
    cancelAnimationFrame(raf);
    clearTimeout(said);
    clearTimeout(walkTimer);
    window.removeEventListener('keydown', onKey);
  };
}
