/**
 * The friend room card for playing on the same Wi-Fi with no internet: pick Start or Join,
 * then a chirp (sound) or a QR code carries the connection. Lives in a shadow root so the
 * game's styles and the card's never mix.
 */

const QR_SRC = '/vendor/qr/qrcode.js?v=friend1';
const JSQR_SRC = '/vendor/qr/jsQR.js?v=friend1';

const CSS = `
:host { all: initial; }
.back { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; padding: 16px;
  background: #0c1a14b3; font: 16px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; color: #16382c; }
.card { position: relative; width: min(440px, 100%); max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box;
  padding: 22px 22px 18px; border-radius: 22px; background: #faf9f5; box-shadow: 0 20px 50px #0006; text-align: center; }
.tag { display: inline-block; margin: 0 0 10px; padding: 4px 10px; border-radius: 999px; background: #e8efe9; font-size: 13px; font-weight: 700; }
h2 { margin: 0 0 6px; font-size: 26px; }
p { margin: 0 0 12px; }
.big { font-size: 54px; line-height: 1; margin: 4px 0 10px; }
.big.pulse { animation: pulse 1.1s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(1.12); } }
@media (prefers-reduced-motion: reduce) { .big.pulse { animation: none; } }
.meter { height: 8px; margin: 0 auto 12px; width: 60%; border-radius: 4px; background: #e2e8e3; overflow: hidden; }
.meter i { display: block; height: 100%; width: 0; background: #3f9c6f; transition: width 90ms linear; }
.row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 6px; }
button { border: 0; border-radius: 14px; padding: 12px 16px; font: 700 17px system-ui, -apple-system, "Segoe UI", sans-serif; cursor: pointer; background: #16382c; color: #faf9f5; }
button.soft { background: #e8efe9; color: #16382c; }
button.go { background: #e07a4a; }
button:focus-visible { outline: 4px solid #e07a4a; outline-offset: 2px; }
.choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.choice button { display: grid; gap: 4px; padding: 16px 10px; font-size: 18px; }
.choice button span { font-size: 38px; }
.qr { display: inline-block; margin: 4px 0 8px; padding: 8px; border-radius: 12px; background: #fff; }
.qr svg { display: block; width: 168px; height: 168px; }
video { display: block; width: 100%; max-height: 240px; margin: 0 0 10px; border-radius: 12px; background: #000; object-fit: cover; }
.small { font-size: 14px; opacity: .8; }
.err { color: #a2412a; font-weight: 700; }
`;

function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(window[globalName]);
    s.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(s);
  });
}

export async function qrSvg(text) {
  const qrcode = await loadScript(QR_SRC, 'qrcode');
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

export class FriendPanel {
  constructor() {
    this.host = document.createElement('div');
    this.host.setAttribute('data-friend-panel', '');
    this.root = this.host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `<style>${CSS}</style><div class="back" role="dialog" aria-modal="true" aria-live="polite"><div class="card"></div></div>`;
    this.card = this.root.querySelector('.card');
    this.meterTimer = 0;
    this.scanStop = null;
  }

  mount() {
    if (!this.host.isConnected) document.body.appendChild(this.host);
  }

  close() {
    this.stopScan();
    clearInterval(this.meterTimer);
    this.host.remove();
  }

  render(html) {
    this.mount();
    this.stopScan();
    clearInterval(this.meterTimer);
    this.card.innerHTML = html;
    this.card.querySelector('button')?.focus({ preventScroll: true });
  }

  on(selector, fn) {
    this.card.querySelector(selector)?.addEventListener('click', fn);
  }

  /** Watch a 0..1 level and show it in the meter, so kids can see the computer hearing. */
  meter(read) {
    const bar = this.card.querySelector('.meter i');
    if (!bar) return;
    this.meterTimer = setInterval(() => { bar.style.width = `${Math.min(100, (read() || 0) * 300)}%`; }, 100);
  }

  /** Start or Join. Resolves 'host', 'guest', or null for Cancel. */
  choose(reason) {
    return new Promise((resolve) => {
      this.render(`
        <p class="tag">📶 ${reason}</p>
        <h2>Play on this Wi-Fi</h2>
        <p>Both computers need to be on the same Wi-Fi and close together, with the sound turned up.</p>
        <div class="choice">
          <button type="button" data-k="host"><span>🏠</span>Start a room</button>
          <button type="button" data-k="guest"><span>🤝</span>Join a friend</button>
        </div>
        <div class="row"><button type="button" class="soft" data-k="cancel">Cancel</button></div>`);
      this.card.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
        const k = b.getAttribute('data-k');
        resolve(k === 'cancel' ? null : k);
      }));
    });
  }

  /** A status card. buttons: [{ id, label, kind }] */
  async status({ emoji, pulse = false, title, text, small = '', qr = '', meter = false, buttons = [], error = '' }) {
    const svg = qr ? await qrSvg(qr).catch(() => '') : '';
    this.render(`
      <div class="big${pulse ? ' pulse' : ''}" aria-hidden="true">${emoji}</div>
      <h2>${title}</h2>
      <p>${text}</p>
      ${error ? `<p class="err">${error}</p>` : ''}
      ${meter ? '<div class="meter" aria-hidden="true"><i></i></div>' : ''}
      ${svg ? `<div class="qr" aria-label="Code to scan">${svg}</div><p class="small">Or scan this code with the other device.</p>` : ''}
      ${small ? `<p class="small">${small}</p>` : ''}
      <div class="row">${buttons.map(b => `<button type="button" class="${b.kind || ''}" data-id="${b.id}">${b.label}</button>`).join('')}</div>`);
  }

  button(id, fn) {
    this.on(`[data-id="${id}"]`, fn);
  }

  /** Point the camera at a code. Calls onText with what it reads until stopped. */
  async scan(onText) {
    this.stopScan();
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted = true;
    const row = this.card.querySelector('.row');
    this.card.insertBefore(video, row || null);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch {
      video.remove();
      throw new Error('camera');
    }
    video.srcObject = stream;
    await video.play().catch(() => {});
    let detector = null;
    if ('BarcodeDetector' in window) {
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch { detector = null; }
    }
    const jsQR = detector ? null : await loadScript(JSQR_SRC, 'jsQR');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      if (video.readyState >= 2) {
        try {
          if (detector) {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) onText(codes[0].rawValue);
          } else {
            const w = Math.min(640, video.videoWidth);
            const h = Math.round((video.videoHeight / video.videoWidth) * w) || 480;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
            if (code?.data) onText(code.data);
          }
        } catch { /* keep looking */ }
      }
      setTimeout(tick, 180);
    };
    tick();
    this.scanStop = () => {
      alive = false;
      stream.getTracks().forEach(t => t.stop());
      video.remove();
    };
  }

  stopScan() {
    this.scanStop?.();
    this.scanStop = null;
  }
}

/** A small floating button, used by an online host whose friend has no internet. */
export function floatingChip(label, onClick) {
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    button { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147482000; border: 0; border-radius: 999px;
      padding: 10px 16px; background: #16382cee; color: #faf9f5; font: 700 15px system-ui, -apple-system, "Segoe UI", sans-serif; cursor: pointer; box-shadow: 0 6px 18px #0004; }
  </style><button type="button">${label}</button>`;
  root.querySelector('button').addEventListener('click', onClick);
  document.body.appendChild(host);
  return () => host.remove();
}
