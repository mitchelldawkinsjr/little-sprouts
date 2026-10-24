/**
 * Pair match — flip two cards and keep the ones that are the same.
 * The flip-and-match idea follows the animated emoji memory game.
 * These cards are shapes, colors, numbers, and words drawn here.
 */
let active = null;

export function stopMatch() {
  active?.destroy();
  active = null;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function mountMatch(root, { faces = [], reduced, onPair, onMiss, onDone }) {
  stopMatch();
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

  const cards = shuffle(faces.flatMap(face => [0, 1].map(copy => ({
    id: face.id,
    label: face.label,
    html: face.html,
    key: `${face.id}-${copy}`,
    up: false,
    matched: false
  }))));
  let open = [];
  let lock = false;
  let missed = false;
  let matched = 0;
  let done = false;
  const call = (fn, arg) => { try { fn?.(arg); } catch { /* the host owns errors */ } };

  const paint = () => {
    root.querySelectorAll('.match-card').forEach((button, index) => {
      const card = cards[index];
      const show = card.up || card.matched;
      button.classList.toggle('open', card.up && !card.matched);
      button.classList.toggle('matched', card.matched);
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? card.label : 'Hidden card');
      button.disabled = card.matched || done;
    });
  };

  const flip = index => {
    const card = cards[index];
    if (!card || lock || done || card.matched || card.up) return;
    card.up = true;
    open.push(index);
    paint();
    if (open.length < 2) return;
    const [a, b] = open;
    if (cards[a].id === cards[b].id) {
      cards[a].matched = true;
      cards[b].matched = true;
      matched += 1;
      open = [];
      paint();
      if (matched >= faces.length) {
        done = true;
        paint();
        call(onDone, !missed);
      } else call(onPair, cards[a]);
      return;
    }
    missed = true;
    lock = true;
    call(onMiss);
    const timer = setTimeout(() => {
      if (session.dead) return;
      cards[a].up = false;
      cards[b].up = false;
      open = [];
      lock = false;
      paint();
    }, reduced ? 420 : 850);
    session.cleanups.push(() => clearTimeout(timer));
  };

  root.innerHTML = `<div class="match-play ${reduced ? 'plain' : ''}"><div class="match-board" role="group" aria-label="Match the pairs">${cards.map(card => `<button type="button" class="match-card" aria-pressed="false" aria-label="Hidden card"><span class="match-inner"><span class="match-back" aria-hidden="true"></span><span class="match-face">${card.html}</span></span></button>`).join('')}</div></div>`;
  root.querySelectorAll('.match-card').forEach((button, index) => {
    button.addEventListener('click', () => flip(index));
  });
  if (!cards.length) call(onDone, true);
  return session;
}
