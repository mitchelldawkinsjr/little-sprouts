/**
 * Parent corner status copy. app.js still owns the settings form and gate.
 */

export function voiceStatusText(s) {
  if (s.engine === 'native') {
    const info = s.nativeInfo || {};
    if (info.ready) return info.offline
      ? 'The tablet’s English voice is ready for offline read-aloud. Included recordings play first.'
      : 'The tablet’s English voice is ready. Included recordings play first.';
    if (!info.reason || info.reason === 'initializing') return 'Getting the tablet’s English voice ready…';
    if (info.reason === 'not-initialized') return 'Included recordings play first. Tap Hear this voice to check the tablet’s English voice.';
    return speechFailureText(info.reason) + ' Tap Hear this voice to check again.';
  }
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

/** Product copy for known failure codes; never display a raw engine exception. */
export function speechFailureText(error) {
  const reason = typeof error === 'string' ? error : error?.reason;
  if (/english|voice-missing|missing-voice|language|tts-data/.test(reason || '')) {
    return 'The tablet needs an English voice for this question. Ask a grown-up to check the tablet’s speech settings.';
  }
  if (/focus/.test(reason || '')) return 'Another app is using the sound. Return here, then tap Hear it again.';
  return 'We couldn’t read that aloud. Tap Hear it again to try once more.';
}

