import { BOSS_EMOJI, PARTS, PART_NAMES, PRESETS, bossName, cyclePart, normalizeBoss, randomBoss, saveBoss } from './boss-design.mjs';

const labels = { head: 'Head', body: 'Body', legs: 'Legs', color: 'Color', eyes: 'Eyes', extra: 'On top', size: 'Size' };

/** Mount the shared controls on a game's builder card. The game owns the preview and navigation. */
export function makeBossBuilder({ presets, picks, name, surprise, done, onChange, onSave }) {
  const doc = picks.ownerDocument;
  const button = (label, text) => {
    const el = doc.createElement('button');
    el.type = 'button';
    el.setAttribute('aria-label', label);
    el.textContent = text;
    return el;
  };
  let design = normalizeBoss();
  const presetButtons = Object.entries(PRESETS).map(([kind, preset]) => {
    const el = button(PART_NAMES.head[kind], BOSS_EMOJI[kind]);
    el.className = 'preset';
    el.title = PART_NAMES.head[kind];
    el.onclick = () => change(preset, 'preset');
    presets.append(el);
    return [el, preset];
  });
  const values = Object.keys(PARTS).map(key => {
    const row = doc.createElement('div');
    row.className = 'pick';
    row.dataset.key = key;
    const prev = button(`Previous ${labels[key]}`, '‹');
    const next = button(`Next ${labels[key]}`, '›');
    const heading = doc.createElement('small');
    heading.textContent = labels[key];
    const value = doc.createElement('span');
    const what = doc.createElement('div');
    what.className = 'what';
    what.append(heading, value);
    prev.onclick = () => cycle(key, -1);
    next.onclick = () => cycle(key, 1);
    row.append(prev, what, next);
    picks.append(row);
    return [key, value];
  });
  function set(raw) {
    design = normalizeBoss(raw);
    name.textContent = bossName(design);
    for (const [key, value] of values) value.textContent = PART_NAMES[key][design[key]];
    for (const [el, preset] of presetButtons) {
      const selected = Object.keys(PARTS).every(key => preset[key] === design[key]);
      el.classList.toggle('on', selected);
      el.setAttribute('aria-pressed', String(selected));
    }
    return design;
  }
  function change(raw, reason) {
    set(raw);
    onChange?.(design, reason);
  }
  function cycle(key, step) { change(cyclePart(design, key, step), 'part'); }
  surprise.onclick = () => change(randomBoss(), 'surprise');
  done.onclick = () => onSave?.(saveBoss(design));
  set(design);
  return { set, cycle };
}
