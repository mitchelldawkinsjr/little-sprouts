/**
 * Parent corner status copy. app.js still owns the settings form and gate.
 */

export function voiceStatusText(s) {
  const pct = Math.round((s.progress || 0) * 100);
  return {
    unsupported: 'This browser cannot run the voice here, so the browser’s own voice reads aloud.',
    idle: 'The voice downloads the first time read-aloud is used.',
    loading: pct ? `Getting the voice ready… ${pct}%` : 'Getting the voice ready…',
    ready: 'The voice is ready on this device.',
    failed: s.retryIn != null
      ? 'The voice could not load yet. The browser’s own voice reads aloud until it does.'
      : 'The voice could not load. The browser’s own voice reads aloud. Tap Hear this voice to try again.'
  }[s.engine] || '';
}

