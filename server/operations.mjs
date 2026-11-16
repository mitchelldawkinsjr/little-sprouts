import { signals, validSignal } from '../lib/diagnostic-schema.mjs'

const LIMIT = 2048
const MAX_BATCH = 24
const MS_BUCKETS = [250, 500, 1000, 2000, 5000, 15000, 60000]
const KB_BUCKETS = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000]

export function operations({ origin, measurementId = '', log = console.log } = {}) {
  const allowed = new Set(Array.isArray(origin) ? origin : origin ? [origin] : [])
  const id = /^G-[A-Z0-9]{4,20}$/.test(measurementId) ? measurementId : ''
  const counts = Object.fromEntries(Object.keys(signals).map(name => [name, 0]))
  const histograms = {
    app_ready: { name: 'app_ready_ms', buckets: MS_BUCKETS },
    sidecar_ready: { name: 'sidecar_ready_ms', buckets: MS_BUCKETS },
    offline_saved_kb: { name: 'offline_saved_kb', buckets: KB_BUCKETS }
  }
  for (const hist of Object.values(histograms)) Object.assign(hist, { sum: 0, counts: hist.buckets.map(() => 0) })
  const results = { accepted: 0, rejected: 0 }

  return async function handle(req, res) {
    const path = req.url?.split('?')[0]
    const send = (status, body = '', type = 'text/plain; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' })
      res.end(req.method === 'HEAD' ? undefined : body)
      return true
    }
    if (path === '/healthz') return send(200, 'ok\n')
    if (path === '/for-parents/analytics.json') {
      if (req.method !== 'GET') return send(405)
      return send(200, JSON.stringify({ measurementId: id }), 'application/json')
    }
    // nginx never proxies this path publicly. Scrape on the private Docker network.
    if (path === '/metrics') {
      const lines = [
        '# TYPE sprouts_telemetry_batches_total counter',
        ...Object.entries(results).map(([result, count]) => `sprouts_telemetry_batches_total{result="${result}"} ${count}`),
        '# TYPE sprouts_diagnostic_events_total counter',
        ...Object.entries(counts).map(([name, count]) => `sprouts_diagnostic_events_total{signal="${name}"} ${count}`)
      ]
      for (const [signal, hist] of Object.entries(histograms)) {
        const metric = `sprouts_${hist.name}`
        lines.push(`# TYPE ${metric} histogram`)
        hist.buckets.forEach((limit, i) => lines.push(`${metric}_bucket{le="${limit}"} ${hist.counts[i]}`))
        lines.push(`${metric}_bucket{le="+Inf"} ${counts[signal]}`, `${metric}_sum ${hist.sum}`, `${metric}_count ${counts[signal]}`)
      }
      return send(200, lines.join('\n') + '\n', 'text/plain; version=0.0.4; charset=utf-8')
    }
    if (path !== '/ops/diagnostics') return false
    const reject = status => { results.rejected++; req.resume(); return send(status) }
    if (req.method !== 'POST') return reject(405)
    if (!allowed.has(req.headers.origin) || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) return reject(403)
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') return reject(415)
    const length = Number(req.headers['content-length'])
    if (!Number.isInteger(length) || length < 2) return reject(411)
    if (length > LIMIT) return reject(413)
    try {
      const chunks = []
      let bytes = 0
      for await (const chunk of req) {
        bytes += chunk.length
        if (bytes > LIMIT) return reject(413)
        chunks.push(chunk)
      }
      if (bytes !== length) return reject(400)
      const rows = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!Array.isArray(rows) || !rows.length || rows.length > MAX_BATCH || !rows.every(validSignal)) return reject(400)
      const batch = {}
      for (const [name, value] of rows) {
        counts[name]++
        batch[name] = (batch[name] || 0) + 1
        const hist = histograms[name]
        if (hist) {
          hist.sum += value
          hist.buckets.forEach((limit, i) => { if (value <= limit) hist.counts[i]++ })
        }
      }
      results.accepted++
      log(JSON.stringify({ event: 'diagnostics_accepted', counts: batch }))
      return send(204)
    } catch {
      if (req.destroyed && !req.complete) return true
      return reject(400)
    }
  }
}
