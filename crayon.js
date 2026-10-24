/**
 * Color by number — paint each numbered area with the color in the legend.
 * Brush strokes follow the HTML5 canvas drawing app:
 * https://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
 * Each press is stored and stroked with a round join. Paint stays inside the
 * matching number. The pictures here are Little Sprouts’ own.
 */
import { crayonCovered, crayonInk, crayonSamples, regionAt } from './logic.mjs?v=color-num';

let active = null;

export function stopCrayon() {
  active?.destroy();
  active = null;
}

export function mountCrayon(root, { picture, legend = [], brush = 8, cover = 0.3, onMiss, onFill, onDone } = {}) {
  stopCrayon();
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

  const rows = new Map(legend.map(row => [row.id, row]));
  const regions = (picture?.regions || []).map(region => {
    const row = rows.get(region.id) || { name: 'color', hex: '#538cbf', number: 1 };
    return { ...region, name: row.name, hex: row.hex, number: row.number, filled: false };
  });
  const samples = crayonSamples(regions).map(points => points.map(point => ({ ...point, hit: false })));
  const hits = regions.map(() => 0);
  const clicks = [];
  const buttons = [];
  let chosen = null;
  let painting = false;
  let noted = false;
  let wrong = false;
  let finished = false;
  let last = null;
  let size = { w: 1, h: 1 };

  const host = document.createElement('div');
  host.className = 'crayon-play';
  const board = document.createElement('div');
  board.className = 'crayon-board';
  const ink = document.createElement('canvas');
  ink.className = 'crayon-ink';
  ink.setAttribute('aria-hidden', 'true');
  const page = document.createElement('canvas');
  page.className = 'crayon-page';
  page.setAttribute('aria-label', `Coloring page of a ${picture?.name || 'picture'}. Paint each number with the color in the legend.`);
  board.append(ink, page);
  const list = document.createElement('div');
  list.className = 'crayon-legend';
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Number colors');
  host.append(board, list);
  root.replaceChildren(host);

  const seen = new Set();
  const chips = [];
  legend.forEach(row => {
    if (seen.has(row.number)) return;
    seen.add(row.number);
    chips.push(row);
  });
  chips.sort((a, b) => a.number - b.number);
  chips.forEach(row => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'crayon-chip';
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-pressed', 'false');
    button.dataset.number = String(row.number);
    const swatch = document.createElement('i');
    swatch.style.background = row.hex;
    const num = document.createElement('b');
    num.textContent = String(row.number);
    const name = document.createElement('span');
    name.textContent = row.name;
    button.append(swatch, num, name);
    button.addEventListener('click', () => select(row.number));
    list.append(button);
    buttons.push(button);
  });
  if (chips[0]) select(chips[0].number);

  const inkCtx = ink.getContext('2d');
  const pageCtx = page.getContext('2d');

  const project = point => [point[0] / 100 * size.w, point[1] / 100 * size.h];
  const scale = () => Math.min(size.w, size.h);
  const lineWidth = () => brush / 100 * scale() * 2;

  const trace = (ctx, shape) => {
    const add = part => {
      if (!part) return;
      if (part.parts) { part.parts.forEach(add); return; }
      if (part.poly?.length) {
        part.poly.forEach((point, index) => {
          const [x, y] = project(point);
          if (index) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.closePath();
        return;
      }
      if (part.circle) {
        const [cx, cy, r] = part.circle;
        const [x, y] = project([cx, cy]);
        const rad = r / 100 * scale();
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        return;
      }
      if (part.ellipse) {
        const [cx, cy, rx, ry] = part.ellipse;
        const [x, y] = project([cx, cy]);
        const rxPx = rx / 100 * size.w;
        const ryPx = ry / 100 * size.h;
        ctx.moveTo(x + rxPx, y);
        ctx.ellipse(x, y, rxPx, ryPx, 0, 0, Math.PI * 2);
      }
    };
    ctx.beginPath();
    add(shape);
  };

  const strokeClick = (ctx, click, prev) => {
    const [x1, y1] = project([click.x, click.y]);
    ctx.beginPath();
    if (click.drag && prev) {
      const [x0, y0] = project([prev.x, prev.y]);
      ctx.moveTo(x0, y0);
    } else ctx.moveTo(x1 - 1, y1);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.stroke();
  };

  const redrawInk = () => {
    inkCtx.clearRect(0, 0, size.w, size.h);
    inkCtx.lineJoin = 'round';
    inkCtx.lineCap = 'round';
    inkCtx.lineWidth = lineWidth();
    regions.forEach(region => {
      if (region.filled) return;
      const mine = clicks.filter(click => click.id === region.id);
      if (!mine.length) return;
      inkCtx.save();
      trace(inkCtx, region.shape);
      inkCtx.clip();
      inkCtx.strokeStyle = region.hex;
      mine.forEach((click, index) => strokeClick(inkCtx, click, mine[index - 1]));
      inkCtx.restore();
    });
  };

  const drawMark = mark => {
    pageCtx.lineJoin = 'round';
    pageCtx.lineCap = 'round';
    if (mark.line) {
      pageCtx.beginPath();
      mark.line.forEach((point, index) => {
        const [x, y] = project(point);
        if (index) pageCtx.lineTo(x, y);
        else pageCtx.moveTo(x, y);
      });
      pageCtx.strokeStyle = mark.stroke || '#3c342c';
      pageCtx.lineWidth = mark.width || 2.2;
      pageCtx.stroke();
      return;
    }
    trace(pageCtx, mark);
    if (mark.fill) {
      pageCtx.fillStyle = mark.fill;
      pageCtx.fill();
    }
    if (mark.stroke !== false) {
      pageCtx.strokeStyle = mark.stroke || '#3c342c';
      pageCtx.lineWidth = 2.2;
      pageCtx.stroke();
    }
  };

  const redrawPage = () => {
    pageCtx.clearRect(0, 0, size.w, size.h);
    regions.forEach(region => {
      if (!region.filled) return;
      pageCtx.fillStyle = region.hex;
      trace(pageCtx, region.shape);
      pageCtx.fill();
    });
    pageCtx.strokeStyle = '#3c342c';
    pageCtx.lineWidth = Math.max(1.6, scale() * 0.008);
    pageCtx.lineJoin = 'round';
    pageCtx.lineCap = 'round';
    regions.forEach(region => {
      trace(pageCtx, region.shape);
      pageCtx.stroke();
    });
    (picture?.marks || []).forEach(drawMark);
    const fontFor = text => Math.max(13, scale() * (String(text).length > 1 ? 0.042 : 0.055));
    pageCtx.textAlign = 'center';
    pageCtx.textBaseline = 'middle';
    pageCtx.strokeStyle = '#fffdf8';
    pageCtx.fillStyle = '#2c2824';
    regions.forEach(region => {
      if (region.filled || !region.label) return;
      const text = String(region.number);
      const font = fontFor(text);
      pageCtx.font = `700 ${font}px Outfit, sans-serif`;
      pageCtx.lineWidth = Math.max(3, font * 0.22);
      const [x, y] = project(region.label);
      pageCtx.strokeText(text, x, y);
      pageCtx.fillText(text, x, y);
    });
  };

  const fit = () => {
    const rect = board.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    size = { w, h };
    [ink, page].forEach(canvas => {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    });
    inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pageCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawPage();
    redrawInk();
  };

  const finish = () => {
    if (finished || session.dead) return;
    finished = true;
    regions.forEach(region => { region.filled = true; });
    redrawPage();
    redrawInk();
    call(onDone, !wrong);
  };

  const fillRegion = index => {
    const region = regions[index];
    if (!region || region.filled) return;
    region.filled = true;
    redrawPage();
    call(onFill, { number: region.number, name: region.name });
    if (regions.every(item => item.filled)) finish();
  };

  const mark = (index, from, to) => {
    const points = samples[index];
    if (!points?.length) {
      fillRegion(index);
      return;
    }
    for (const point of points) {
      if (point.hit) continue;
      if (!crayonInk(point, from, to, brush)) continue;
      point.hit = true;
      hits[index] += 1;
    }
    if (crayonCovered(hits[index], points.length, cover)) fillRegion(index);
  };

  function select(number) {
    chosen = chips.find(row => row.number === number) || chips[0] || null;
    buttons.forEach(button => {
      const on = chosen && button.dataset.number === String(chosen.number);
      button.classList.toggle('selected', !!on);
      button.setAttribute('aria-pressed', String(!!on));
    });
  }

  const at = event => {
    const rect = page.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) / rect.width * 100,
      y: (event.clientY - rect.top) / rect.height * 100
    };
  };

  const regionUnder = point => {
    const spots = [regionAt(regions, point.x, point.y)];
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      spots.push(regionAt(regions, point.x + Math.cos(angle) * brush * 0.65, point.y + Math.sin(angle) * brush * 0.65));
    }
    const open = spots.filter(region => region && !region.filled);
    return open.find(region => region.number === chosen?.number) || open[0] || null;
  };

  const miss = region => {
    if (noted || finished) return;
    noted = true;
    wrong = true;
    call(onMiss, { number: region.number, name: region.name });
  };

  const dab = (point, drag) => {
    if (!chosen || finished || session.dead) return;
    const region = regionUnder(point);
    if (!region || region.filled) {
      last = null;
      return;
    }
    if (region.number !== chosen.number) {
      last = null;
      miss(region);
      return;
    }
    const index = regions.indexOf(region);
    const from = drag && last && last.id === region.id ? last : point;
    const click = { x: point.x, y: point.y, drag: from !== point, id: region.id };
    clicks.push(click);
    inkCtx.save();
    inkCtx.lineJoin = 'round';
    inkCtx.lineCap = 'round';
    inkCtx.lineWidth = lineWidth();
    inkCtx.strokeStyle = region.hex;
    trace(inkCtx, region.shape);
    inkCtx.clip();
    strokeClick(inkCtx, click, from === point ? null : from);
    inkCtx.restore();
    mark(index, from, point);
    last = click;
  };

  const stopPaint = () => {
    painting = false;
    last = null;
  };

  const onDown = event => {
    if (finished || event.button) return;
    event.preventDefault();
    painting = true;
    noted = false;
    try { page.setPointerCapture?.(event.pointerId); } catch { /* the stroke still follows the pointer */ }
    const point = at(event);
    if (point) dab(point, false);
  };
  const onMove = event => {
    if (!painting || finished) return;
    const point = at(event);
    if (point) dab(point, true);
  };
  const listen = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    session.cleanups.push(() => target.removeEventListener(type, fn, options));
  };
  listen(page, 'pointerdown', onDown, { passive: false });
  listen(page, 'pointermove', onMove);
  listen(page, 'pointerup', stopPaint);
  listen(page, 'pointercancel', stopPaint);
  listen(page, 'lostpointercapture', stopPaint);

  const observer = new ResizeObserver(() => { if (!session.dead) fit(); });
  observer.observe(board);
  session.cleanups.push(() => observer.disconnect());
  fit();
}
