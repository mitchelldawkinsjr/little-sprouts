// True while the question is being read and play should wait.
export function questionHolding() {
  const docs = [];
  try { docs.push(document); } catch { /* no document */ }
  try {
    if (window.parent && window.parent !== window) docs.push(window.parent.document);
  } catch { /* another origin */ }
  return docs.some(doc => doc.body?.classList.contains('listen-first'));
}
