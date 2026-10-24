/**
 * Sort bins — pour the top balls into a matching tube or an empty one.
 * Each ball rolls out of one tube, across the gap, and down into the next.
 */
import { sortPour, sortPourCount, sortSolved, sortTopRun } from './logic.mjs?v=sort-roll';

let active = null;

export function stopSort() {
  active?.destroy();
  active = null;
}

export function mountSort(root, { tubes = [], pieces = [], capacity = 4, reduced = false, onMiss, onDone } = {}) {
  stopSort();
  const session = {
    dead: false,
    cleanups: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      this.cleanups.forEach(fn => fn());
      if (active === this) active = null;
    }
  };
  active = session;
  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };
  const faces = new Map(pieces.map(piece => [String(piece.id), piece]));
  let state = tubes.map(tube => [...tube]);
  let selected = null;
  let missed = false;
  let done = false;
  let pouring = false;
  const cap = Math.max(1, capacity | 0);
  const host = document.createElement('div');
  host.className = `sort-play${reduced ? ' plain' : ''}`;
  host.innerHTML = '<div class="sort-tubes"></div>';
  root.replaceChildren(host);
  const rack = host.querySelector('.sort-tubes');

  const labelOf = id => faces.get(String(id))?.label || String(id);
  const ball = (id, lifted) => {
    const piece = faces.get(String(id));
    const tint = piece?.fill ? ` style="--ball:${piece.fill}"` : '';
    const face = piece?.fill ? '' : `<span class="sort-face">${piece?.html || labelOf(id)}</span>`;
    return `<span class="sort-ball${lifted ? ' up' : ''}"${tint}>${face}</span>`;
  };
  const paint = () => {
    rack.innerHTML = state.map((tube, index) => {
      const run = selected === index ? sortTopRun(tube) : 0;
      const names = tube.length ? tube.slice().reverse().map(labelOf).join(', ') : 'empty';
      const balls = tube.map((id, spot) => ball(id, spot >= tube.length - run)).join('');
      return `<button type="button" class="sort-tube${selected === index ? ' selected' : ''}" data-tube="${index}" style="--cap:${cap}" aria-label="Tube ${index + 1}, ${names}">${balls}</button>`;
    }).join('');
  };

  const slotTop = (tube, slot, ballH) => {
    const balls = [...tube.querySelectorAll('.sort-ball')];
    const rect = tube.getBoundingClientRect();
    const gap = 4;
    if (balls.length) return balls[0].getBoundingClientRect().top - slot * (ballH + gap);
    const style = getComputedStyle(tube);
    const pad = parseFloat(style.paddingBottom) || 0;
    const border = parseFloat(style.borderBottomWidth) || 0;
    return rect.bottom - border - pad - ballH - slot * (ballH + gap);
  };

  const roll = async (from, to, count) => {
    const fromBtn = rack.querySelector(`[data-tube="${from}"]`);
    const toBtn = rack.querySelector(`[data-tube="${to}"]`);
    const moving = [...(fromBtn?.querySelectorAll('.sort-ball') || [])].slice(-count);
    if (!fromBtn || !toBtn || !moving.length) return;
    const stage = host.getBoundingClientRect();
    const padL = parseFloat(getComputedStyle(host).paddingLeft) || 0;
    const padT = parseFloat(getComputedStyle(host).paddingTop) || 0;
    const originX = stage.left + padL;
    const originY = stage.top + padT;
    const toRect = toBtn.getBoundingClientRect();
    const fromRect = fromBtn.getBoundingClientRect();
    const ballBox = moving[0].getBoundingClientRect();
    const ballH = ballBox.height || 48;
    const ballW = ballBox.width || 48;
    const destX = toRect.left + (toRect.width - ballW) / 2;
    const crestY = Math.min(fromRect.top, toRect.top) - 52;
    const landed = state[to].length;
    const flies = moving.map(node => {
      const start = node.getBoundingClientRect();
      const fly = node.cloneNode(true);
      fly.classList.remove('up');
      fly.classList.add('sort-fly');
      fly.style.left = `${start.left - originX}px`;
      fly.style.top = `${start.top - originY}px`;
      host.append(fly);
      node.style.visibility = 'hidden';
      return { fly, start };
    });
    const motions = flies.map(({ fly, start }, i) => {
      const landY = slotTop(toBtn, landed + i, ballH);
      const across = destX - start.left;
      const rise = crestY - start.top;
      const drop = landY - start.top;
      const travel = Math.hypot(across, drop - rise);
      const spins = Math.max(1, Math.round(travel / (Math.PI * ballW)));
      const rollBy = Math.sign(across || 1) * spins * 360;
      return fly.animate([
        { transform: 'translate(0px, 0px) rotate(0deg)' },
        { transform: `translate(0px, ${rise}px) rotate(${rollBy * 0.18}deg)`, offset: 0.24 },
        { transform: `translate(${across}px, ${rise * 0.7}px) rotate(${rollBy * 0.68}deg)`, offset: 0.64 },
        { transform: `translate(${across}px, ${drop}px) rotate(${rollBy}deg)` }
      ], { duration: 720, delay: i * 200, easing: 'cubic-bezier(.33, .02, .2, 1)', fill: 'forwards' });
    });
    await Promise.all(motions.map(motion => motion.finished.catch(() => {})));
    if (session.dead) return;
    flies.forEach(({ fly }) => fly.remove());
  };

  const choose = async index => {
    if (done || session.dead || pouring) return;
    const tube = state[index];
    if (selected == null) {
      if (!tube?.length) return;
      selected = index;
      paint();
      return;
    }
    if (selected === index) {
      selected = null;
      paint();
      return;
    }
    const next = sortPour(state, selected, index, cap);
    if (!next) {
      missed = true;
      const button = rack.querySelector(`[data-tube="${index}"]`);
      button?.classList.remove('wrong');
      void button?.offsetWidth;
      button?.classList.add('wrong');
      setTimeout(() => button?.classList.remove('wrong'), 420);
      call(onMiss);
      return;
    }
    const from = selected;
    const count = sortPourCount(state[from], state[index], cap);
    selected = null;
    pouring = true;
    if (!reduced) await roll(from, index, count);
    if (session.dead) return;
    state = next;
    pouring = false;
    paint();
    if (sortSolved(state, cap)) {
      done = true;
      call(onDone, !missed);
    }
  };

  host.addEventListener('click', event => {
    const button = event.target.closest?.('.sort-tube');
    if (!button) return;
    choose(+button.dataset.tube);
  });
  paint();
  return session;
}
