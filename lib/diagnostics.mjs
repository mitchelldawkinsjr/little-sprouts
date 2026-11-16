import { signals, validSignal } from './diagnostic-schema.mjs';

const KEY = 'sprouts-diagnostics-v1';
const MAX = 48;
const MAX_AGE = 86400000;
const BATCH = 24;
const EMPTY = () => ({ enabled: false, rows: [] });

export function createDiagnostics({ storage, send, online, now = Date.now, changed = () => {} }) {
  const local = Object.fromEntries(Object.keys(signals).map(key => [key, 0]));
  const latest = {};
  let inFlight = null;
  let controller = null;
  let epoch = 0;
  let state;
  const tidy = rows => Array.isArray(rows)
    ? rows.filter(row => Array.isArray(row) && row.length === 2 && Number.isFinite(row[0])
      && now() - row[0] <= MAX_AGE && validSignal(row[1])).slice(-MAX)
    : [];
  try {
    const stored = JSON.parse(storage?.getItem(KEY) || 'null');
    state = stored?.enabled === true ? { enabled: true, rows: tidy(stored.rows) } : EMPTY();
  } catch { state = EMPTY(); }
  const save = () => {
    try { storage?.setItem(KEY, JSON.stringify(state)); } catch { /* storage can be blocked */ }
  };

  const snapshot = () => ({ enabled: state.enabled, pending: tidy(state.rows).length, local: { ...local }, latest: { ...latest } });
  function setEnabled(enabled) {
    if (state.enabled === enabled) return;
    epoch++;
    controller?.abort();
    state = { enabled, rows: [] };
    save();
    changed(snapshot());
  }
  function checkConsent() {
    // Check before queuing or sending in case another tab's storage event is delayed.
    if (!storage || !state.enabled) return;
    try {
      const stored = storage.getItem(KEY);
      if (stored != null && JSON.parse(stored)?.enabled !== true) setEnabled(false);
    } catch { /* in-memory choice remains available */ }
  }
  function record(name, value = 0) {
    if (!validSignal([name, value])) return;
    local[name]++;
    if (signals[name]) latest[name] = value;
    checkConsent();
    if (state.enabled) {
      state.rows = [...tidy(state.rows), [now(), [name, value]]].slice(-MAX);
      save();
    }
    changed(snapshot());
  }
  function flush() {
    checkConsent();
    if (inFlight || !state.enabled || !online()) return inFlight;
    state.rows = tidy(state.rows);
    const selected = state.rows.slice(0, BATCH);
    if (!selected.length) { save(); changed(snapshot()); return; }
    const generation = epoch;
    const cancel = new AbortController();
    controller = cancel;
    const deadline = setTimeout(() => cancel.abort(), 5000);
    inFlight = Promise.resolve().then(() => {
      if (generation === epoch) return send(selected.map(row => row[1]), cancel.signal);
    })
      .then(status => {
        checkConsent();
        if (generation !== epoch || (status !== 204 && status !== 400 && status !== 413 && status !== 415)) return;
        const sent = new Set(selected);
        state.rows = state.rows.filter(row => !sent.has(row));
        save();
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(deadline);
        controller = inFlight = null;
        changed(snapshot());
      });
    return inFlight;
  }
  return { snapshot, record, setEnabled, flush, reloadConsent() {
    try {
      const enabled = JSON.parse(storage?.getItem(KEY) || 'null')?.enabled === true;
      if (enabled !== state.enabled) {
        epoch++;
        controller?.abort();
        state = { enabled, rows: [] };
        changed(snapshot());
      }
    } catch { /* local-only if storage is blocked */ }
  } };
}

let client;
let render;
export function diagnostic(name, value) {
  client?.record(name, value);
  if (name === 'app_ready') client?.flush();
}
export function startDiagnostics(win = window, doc = win.document) {
  if (client) return;
  let storage;
  try { storage = win.localStorage; } catch { /* private mode */ }
  const toggle = doc.getElementById('shareDiagnostics');
  const status = doc.getElementById('diagnosticStatus');
  render = (data) => {
    if (toggle) toggle.checked = data.enabled;
    if (status) {
      const errors = data.local.js_error + data.local.promise_error + data.local.worker_failed + data.local.sidecar_failed;
      const ready = data.latest.app_ready;
      status.textContent = `${ready == null ? 'Startup timing unavailable' : `First screen: ${ready} ms`} · ${errors} errors this visit · ${data.enabled ? `${data.pending} signals queued` : 'Sharing off'}`;
    }
  };
  client = createDiagnostics({
    storage, online: () => win.navigator.onLine,
    send: async (rows, signal) => (await win.fetch('/ops/diagnostics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows),
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal
    })).status,
    changed: data => { if (doc.getElementById('settings')?.open) render(data); }
  });
  toggle?.addEventListener('change', () => { client.setEnabled(toggle.checked); client.flush(); });
  win.addEventListener('storage', event => { if (event.key === KEY || event.key === null) client.reloadConsent(); });
  win.addEventListener('error', () => diagnostic('js_error'), true);
  win.addEventListener('unhandledrejection', () => diagnostic('promise_error'));
  win.addEventListener('online', () => client.flush());
  win.setInterval(() => client.flush(), 30000);
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) client.flush(); });
  render(client.snapshot());
}
export function refreshDiagnostics() { if (client) render(client.snapshot()); }
