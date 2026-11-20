/**
 * Little Sprouts questions inside a big game (INKWAVE, Tidewater).
 *
 * The game decides when a question fits its play (you got splatted, a fish bit) and calls
 * quiz.ask({ title, note }). That shows this learner's current question on a card over the
 * game and resolves true once it is answered right. A wrong answer greys that choice and the
 * card stays, the same question up, until the right one is picked. The game pauses itself
 * while the card is open and gives its reward when the promise resolves.
 *
 * Host messages: ask (the current question), mark (was that pick right), clear, arcade.
 * Guest messages: ready, need, show, pick, replay, quit, finish.
 * With no host (the game on its own page), quiz.live is false and ask() resolves true at once.
 * A game can pass makeQuiz({ local }) instead: local() returns { prompt, choices: [{ label, ok, fill?, shape? }] },
 * and with no host question to ask (own page, or Arcade) the card shows that one and grades it here.
 */
const SOURCE = 'sprouts-sidecar';
const embedded = typeof window !== 'undefined' && window.parent !== window;

function send(type, extra = {}) {
  if (embedded) window.parent.postMessage({ source: SOURCE, type, ...extra }, location.origin);
}

const CSS = `
#sprouts-quiz{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(12,18,24,.55);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f4536}
#sprouts-quiz[hidden]{display:none!important}
#sprouts-quiz .card{width:min(680px,100%);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;background:#faf9f5;border-radius:24px;padding:20px 20px 16px;box-shadow:0 18px 44px #0007;text-align:center}
#sprouts-quiz .tag{display:inline-block;margin:0 0 8px;padding:4px 12px;border-radius:999px;background:#ffe2b8;color:#7a3d00;font:800 14px/1.2 inherit;letter-spacing:.04em;text-transform:uppercase}
#sprouts-quiz .prompt{margin:0 0 12px;font-size:clamp(22px,3.4vw,32px);font-weight:800;line-height:1.25}
#sprouts-quiz .show{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:0 0 12px;font-size:28px}
#sprouts-quiz .show .countrow,#sprouts-quiz .show .numpath{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
#sprouts-quiz .choices{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
#sprouts-quiz button{font-family:inherit;cursor:pointer}
#sprouts-quiz .choice{min-width:120px;min-height:88px;padding:10px 14px;border:3px solid #d7decc;border-radius:16px;background:#fff;color:#1f4536;font-weight:800;font-size:clamp(20px,3vw,30px);line-height:1.1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
#sprouts-quiz .choice:disabled{opacity:.45;cursor:default}
#sprouts-quiz .choice.wrong{border-color:#e3ad7b;background:#fff4e9}
#sprouts-quiz .choice.right{border-color:#32634e;background:#e2f1d8}
#sprouts-quiz .shape{display:block;width:54px;height:54px;background:var(--fill,#5d7a45)}
#sprouts-quiz .circle{border-radius:50%}#sprouts-quiz .square{border-radius:5px}
#sprouts-quiz .triangle{clip-path:polygon(50% 0,0 100%,100% 100%)}
#sprouts-quiz .rectangle{width:72px;height:44px;border-radius:5px}#sprouts-quiz .oval{width:72px;border-radius:50%}
#sprouts-quiz .diamond{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
#sprouts-quiz .star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 94%,50% 73%,21% 94%,32% 57%,2% 35%,39% 35%)}
#sprouts-quiz .hexagon{clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}
#sprouts-quiz .swatch{width:54px;height:54px;border-radius:50%;border:1px solid #0002}
#sprouts-quiz .row{display:flex;justify-content:center;gap:10px;margin-top:14px}
#sprouts-quiz .soft{min-height:44px;padding:8px 16px;border:1px solid #c9d3c0;border-radius:12px;background:transparent;color:#1f4536;font-size:16px;font-weight:700}
#sprouts-quiz .note{margin:12px 0 0;font-size:15px;font-weight:700;color:#4b6658}
#sprouts-quiz .note.good{color:#2f6b3f}
`;

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function face(choice) {
  if (choice.shape) return `<span class="shape ${esc(choice.shape)}" style="--fill:${esc(choice.fill || '#5d7a45')}"></span><span>${esc(choice.label)}</span>`;
  if (choice.fill) return `<span class="swatch" style="background:${esc(choice.fill)}"></span><span>${esc(choice.label)}</span>`;
  return `<span>${esc(choice.label)}</span>`;
}

export function makeQuiz({ local } = {}) {
  let current = null;   // the host's current question
  let shown = null;     // the question on the card: the host's, or a local one
  let open = null;      // { resolve, waiting } while the card is up
  let cleared = false;  // the host says there is nothing more to ask (arcade play)
  let root = null;
  let readyResolve;
  let level = 0;
  let sound = true;
  const firstAsk = new Promise(r => { readyResolve = r; });

  function ensure() {
    if (root) return root;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);
    root = document.createElement('div');
    root.id = 'sprouts-quiz';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    // The Little Sprouts controller walks these buttons with the d-pad and presses with A.
    root.dataset.padMenu = '';
    // Keys typed on the card are not the game's.
    root.addEventListener('keydown', e => e.stopPropagation());
    document.body.append(root);
    return root;
  }

  function paint(title, note) {
    const el = ensure();
    el.innerHTML = `<div class="card"><p class="tag">${esc(title || 'Question')}</p><p class="prompt">${esc(shown.prompt || '')}</p>`
      + (shown.show ? `<div class="show">${shown.show}</div>` : '')
      + `<div class="choices">${shown.choices.map((c, i) => `<button type="button" class="choice" data-i="${i}">${face(c)}</button>`).join('')}</div>`
      + `<div class="row"><button type="button" class="soft hear">🔊 Hear it again</button></div>`
      + `<p class="note">${esc(note || '')}</p></div>`;
    el.querySelectorAll('.choice').forEach(b => { b.onclick = () => pick(+b.dataset.i, b); });
    el.querySelector('.hear').onclick = () => {
      if (!open?.local) send('replay');
      else if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(shown.prompt));
      }
    };
    el.hidden = false;
    setTimeout(() => el.querySelector('.choice:not(:disabled)')?.focus(), 30);
  }

  function pick(index, button) {
    if (!open || open.waiting || !shown?.choices[index]) return;
    open.waiting = { index, button };
    root.querySelectorAll('.choice').forEach(b => { b.disabled = true; });
    if (open.local) grade(!!shown.choices[index].ok);
    else send('pick', { index });
  }

  function grade(ok) {
    const { button } = open.waiting;
    open.waiting = null;
    if (ok) {
      button?.classList.add('right');
      const note = root.querySelector('.note');
      if (note) { note.textContent = 'Yes! That’s right.'; note.classList.add('good'); }
      // The host is already making the next question; let the right answer show for a moment.
      setTimeout(() => close(true), 900);
    } else {
      button?.classList.add('wrong');
      root.querySelectorAll('.choice').forEach(b => { if (!b.classList.contains('wrong')) b.disabled = false; });
      const note = root.querySelector('.note');
      if (note) note.textContent = 'Not yet. Try another one.';
      root.querySelector('.choice:not(:disabled)')?.focus();
    }
  }

  function close(result) {
    if (!open) return;
    const { resolve } = open;
    open = null;
    if (root) root.hidden = true;
    resolve(result);
  }

  addEventListener('message', e => {
    if (!embedded || e.source !== window.parent || e.data?.source !== SOURCE) return;
    const data = e.data;
    if (data.type === 'ask' && Array.isArray(data.choices) && data.choices.length) {
      current = { prompt: data.prompt || '', show: data.show || '', choices: data.choices };
      // The learner's level (1–3) and whether Little Sprouts reads aloud, for games that adapt to them.
      if (Number.isFinite(+data.level)) level = +data.level;
      if (typeof data.sound === 'boolean') sound = data.sound;
      readyResolve(true);
    } else if (data.type === 'clear' || data.type === 'arcade') {
      cleared = true;
      readyResolve(false);
      // A local question already on the card stays until it is answered.
      if (!open?.local) close(true);
    } else if (data.type === 'mark' && open?.waiting && !open.local) {
      grade(!!data.ok);
    }
  });

  if (embedded) {
    send('ready');
    // Ask for a question until one comes (the host answers `need` with the current one).
    const nudge = setInterval(() => { if (current || cleared) clearInterval(nudge); else send('need'); }, 1200);
  }

  return {
    /** True inside Little Sprouts, where questions come from the learner's list. */
    live: embedded,
    get busy() { return !!open; },
    get cleared() { return cleared; },
    /** The learner's level, 1 to 3 (0 until the first question comes). */
    get level() { return level; },
    /** False when the grown-up turned reading aloud off. */
    get sound() { return sound; },
    /** Wait until the first question has come (or the host says there are none). */
    ready: () => (embedded ? firstAsk : Promise.resolve(false)),
    /** Show the current question. Resolves true when it is answered right. */
    ask({ title, note } = {}) {
      const isLocal = !embedded || cleared || !current;
      if (isLocal && !local) return Promise.resolve(true);
      if (open) return open.promise;
      shown = isLocal ? local() : current;
      let resolve;
      const promise = new Promise(r => { resolve = r; });
      open = { resolve, promise, waiting: null, local: isLocal };
      paint(title, note);
      if (!isLocal) send('show');
      return promise;
    },
    progress: label => send('progress', { label: String(label || '') }),
    finish: detail => send('finish', { detail: String(detail || '') }),
    quit: () => send('quit'),
  };
}
