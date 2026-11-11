const listening = doc => !!doc.body?.classList.contains('listen-first');

// True while the question is being read and play should wait.
export function questionHolding() {
  try { return listening(document) || listening(window.parent.document); }
  catch { return false; /* another origin: only this frame counts */ }
}

// True while a dialog is open or the question is being read.
export function gamePaused() {
  return !!document.querySelector('dialog[open]') || questionHolding();
}
