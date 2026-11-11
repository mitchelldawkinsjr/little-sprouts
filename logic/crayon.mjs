import { CRAYON_PAGES, CRAYON_ICONS } from './crayon-pages.mjs';
import { pointSegmentDistance } from './geom.mjs';

const CRAYON_BOARDS = [
  { regions: 4, colors: 4, brush: 8, cover: 0.3 },
  { regions: 6, colors: 4, brush: 6.2, cover: 0.38 },
  { regions: 8, colors: 6, brush: 4.6, cover: 0.46 }
];

export function crayonBoard(level) {
  const index = Math.min(3, Math.max(1, Math.round(+level) || 1)) - 1;
  return { ...CRAYON_BOARDS[index] };
}

export function crayonLegend(ids, palette, numbers) {
  const slots = Math.min(ids?.length || 0, palette?.length || 0, numbers?.length || 0);
  if (!slots) return [];
  return ids.map((id, index) => {
    const slot = index % slots;
    const [name, hex] = palette[slot];
    return { id, name, hex, number: numbers[slot] };
  });
}

export function shapeHolds(shape, x, y) {
  if (!shape || !Number.isFinite(+x) || !Number.isFinite(+y)) return false;
  if (shape.parts) return shape.parts.some(part => shapeHolds(part, x, y));
  if (shape.circle) {
    const [cx, cy, r] = shape.circle;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }
  if (shape.ellipse) {
    const [cx, cy, rx, ry] = shape.ellipse;
    if (!(rx > 0) || !(ry > 0)) return false;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  const points = shape.poly;
  if (!Array.isArray(points) || points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function regionAt(regions, x, y) {
  if (!Array.isArray(regions)) return null;
  for (let i = regions.length - 1; i >= 0; i--) {
    if (shapeHolds(regions[i]?.shape, x, y)) return regions[i];
  }
  return null;
}

export function crayonSamples(regions, step = 2) {
  const gap = Math.max(1, +step || 2);
  return (regions || []).map(region => {
    const points = [];
    for (let y = gap / 2; y < 100; y += gap) {
      for (let x = gap / 2; x < 100; x += gap) {
        if (regionAt(regions, x, y)?.id === region.id) points.push({ x, y });
      }
    }
    return points;
  });
}

export function crayonInk(point, from, to, radius) {
  if (!point || !from || !to) return false;
  const limit = +radius;
  if (!Number.isFinite(limit) || limit < 0) return false;
  return pointSegmentDistance(point, from, to) <= limit;
}

export function crayonCovered(hit, total, need) {
  const count = +total;
  if (!Number.isFinite(count) || count <= 0) return false;
  return hit / count >= +need;
}

export function crayonCatalog(level) {
  const pages = CRAYON_PAGES[crayonBoard(level).regions] || [];
  return pages.map((page, index) => ({
    index,
    name: page.name,
    icon: page.icon || CRAYON_ICONS[page.name] || '🖍',
    regions: page.regions.length
  }));
}

export function crayonPicture(level, index = 0) {
  const pages = CRAYON_PAGES[crayonBoard(level).regions] || [];
  if (!pages.length) return { name: 'picture', regions: [] };
  const n = Number.isFinite(+index) ? Math.abs(Math.trunc(+index)) : 0;
  return pages[n % pages.length];
}

