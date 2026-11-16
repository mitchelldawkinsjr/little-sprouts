// The entire wire format. No URLs, error messages, device IDs, or learner fields.
export const signals = Object.freeze({
  app_ready: 300_000,
  js_error: 0,
  promise_error: 0,
  catalog_fallback: 0,
  worker_failed: 0,
  offline_ready: 0,
  offline_partial: 0,
  offline_unavailable: 0,
  offline_saved_kb: 2_000_000,
  sidecar_ready: 300_000,
  sidecar_failed: 0,
  speech_fallback: 0
});

export function validSignal(row) {
  return Array.isArray(row) && row.length === 2 && typeof row[0] === 'string' && Object.hasOwn(signals, row[0])
    && Number.isInteger(row[1]) && row[1] >= 0 && row[1] <= signals[row[0]];
}
