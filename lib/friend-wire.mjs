/**
 * Friend link wire format: a WebRTC offer or answer squeezed into about 80 bytes, so it
 * fits in a short chirp of sound (ggwave) or a small QR code. No server is involved.
 *
 * Only what a data channel needs is kept: the ICE username and password, the DTLS
 * certificate fingerprint, the DTLS role, and up to two host candidates. Everything
 * else in the SDP is the same for every browser and is rebuilt on the other side.
 *
 * Layout:
 *   0      version (high 4 bits) | kind (bit 0: 0 offer, 1 answer) | setup (bits 1-2)
 *   1-2    session id (the answer repeats the offer's, so stray chirps are ignored)
 *   ...    ufrag:  length byte, then 6-bit packed ICE characters
 *   ...    pwd:    length byte, then 6-bit packed ICE characters
 *   ...    32-byte sha-256 fingerprint
 *   ...    candidate count, then per candidate: type byte, address, 2-byte port
 *   last   CRC-8 of everything before it
 */

export const VERSION = 1;
const ICE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const SETUPS = ['actpass', 'active', 'passive'];
const MAX_CANDIDATES = 2;
const CAND_IPV4 = 0;
const CAND_MDNS = 1;
const CAND_IPV6 = 2;
const MDNS_RE = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/i;

export function crc8(bytes, end = bytes.length) {
  let c = 0;
  for (let i = 0; i < end; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff;
  }
  return c;
}

function pack6(text) {
  const out = [];
  let acc = 0;
  let n = 0;
  for (const ch of text) {
    const v = ICE_CHARS.indexOf(ch);
    if (v < 0) throw new Error(`not an ICE character: ${ch}`);
    acc = (acc << 6) | v;
    n += 6;
    if (n >= 8) { n -= 8; out.push((acc >> n) & 0xff); }
    acc &= (1 << n) - 1;
  }
  if (n) out.push((acc << (8 - n)) & 0xff);
  return out;
}

function unpack6(bytes, count) {
  let out = '';
  let acc = 0;
  let n = 0;
  for (let i = 0; i < bytes.length && out.length < count; i++) {
    acc = (acc << 8) | bytes[i];
    n += 8;
    while (n >= 6 && out.length < count) { n -= 6; out += ICE_CHARS[(acc >> n) & 63]; }
    acc &= (1 << n) - 1;
  }
  return out;
}

/** Bytes to a string of 7-bit characters (ggwave turns characters over 127 into two bytes). */
export function to7(bytes) {
  let out = '';
  let acc = 0;
  let n = 0;
  for (const v of bytes) {
    acc = (acc << 8) | v;
    n += 8;
    while (n >= 7) { n -= 7; out += String.fromCharCode((acc >> n) & 127); }
    acc &= (1 << n) - 1;
  }
  if (n) out += String.fromCharCode((acc << (7 - n)) & 127);
  return out;
}

export function from7(text) {
  const out = [];
  let acc = 0;
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    acc = (acc << 7) | (text.charCodeAt(i) & 127);
    n += 7;
    if (n >= 8) { n -= 8; out.push((acc >> n) & 0xff); }
    acc &= (1 << n) - 1;
  }
  return Uint8Array.from(out);
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const QR_PREFIX = 'SPROUTS1:';

/** Bytes to the text inside a QR code. */
export function toQrText(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const v = (a << 16) | (b << 8) | c;
    out += B64[(v >> 18) & 63] + B64[(v >> 12) & 63];
    if (i + 1 < bytes.length) out += B64[(v >> 6) & 63];
    if (i + 2 < bytes.length) out += B64[v & 63];
  }
  return QR_PREFIX + out;
}

export function fromQrText(text) {
  const s = String(text || '').trim();
  if (!s.startsWith(QR_PREFIX)) return null;
  const body = s.slice(QR_PREFIX.length);
  const out = [];
  let acc = 0;
  let n = 0;
  for (const ch of body) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 6) | v;
    n += 6;
    if (n >= 8) { n -= 8; out.push((acc >> n) & 0xff); }
    acc &= (1 << n) - 1;
  }
  return Uint8Array.from(out);
}

/** Pull the parts that matter out of a full SDP. */
export function readSdp(sdp) {
  const line = (key) => (sdp.match(new RegExp(`^a=${key}:(.+)$`, 'm')) || [])[1]?.trim() || '';
  const fp = line('fingerprint');
  const [algo, hex] = fp.split(/\s+/);
  const candidates = [];
  for (const m of sdp.matchAll(/^a=candidate:(\S+) (\d) (\S+) (\d+) (\S+) (\d+) typ (\S+)/gm)) {
    const [, , component, proto, , address, port, type] = m;
    if (component !== '1' || proto.toLowerCase() !== 'udp' || type !== 'host') continue;
    candidates.push({ address, port: Number(port) });
  }
  return {
    ufrag: line('ice-ufrag'),
    pwd: line('ice-pwd'),
    algo: (algo || '').toLowerCase(),
    fingerprint: (hex || '').split(':').map(h => parseInt(h, 16)),
    setup: line('setup'),
    candidates
  };
}

function candidateBytes({ address, port }) {
  const portBytes = [(port >> 8) & 0xff, port & 0xff];
  const mdns = address.match(MDNS_RE);
  if (mdns) {
    const hex = mdns.slice(1).join('');
    const out = [CAND_MDNS];
    for (let i = 0; i < 32; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
    return out.concat(portBytes);
  }
  const v4 = address.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) return [CAND_IPV4, ...v4.slice(1).map(Number), ...portBytes];
  if (address.includes(':')) {
    const parts = address.split('::');
    const head = parts[0] ? parts[0].split(':') : [];
    const tail = parts[1] ? parts[1].split(':') : [];
    const groups = [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail];
    if (groups.length !== 8) return null;
    const out = [CAND_IPV6];
    for (const g of groups) { const v = parseInt(g || '0', 16); out.push((v >> 8) & 0xff, v & 0xff); }
    return out.concat(portBytes);
  }
  return null;
}

/** Rank candidates: plain IPv4 first (no lookup needed), then mDNS names, then IPv6. */
function rank(c) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(c.address)) return c.address.startsWith('169.254.') ? 3 : 0;
  if (MDNS_RE.test(c.address)) return 1;
  return 2;
}

/** A local description (offer or answer) as bytes. */
export function packSignal(sdp, { kind, session }) {
  const s = readSdp(sdp);
  if (s.algo !== 'sha-256' || s.fingerprint.length !== 32) throw new Error('needs a sha-256 fingerprint');
  if (!s.ufrag || !s.pwd) throw new Error('missing ICE credentials');
  const setup = Math.max(0, SETUPS.indexOf(s.setup));
  const out = [(VERSION << 4) | (setup << 1) | (kind === 'answer' ? 1 : 0), (session >> 8) & 0xff, session & 0xff];
  out.push(s.ufrag.length, ...pack6(s.ufrag));
  out.push(s.pwd.length, ...pack6(s.pwd));
  out.push(...s.fingerprint);
  const cands = s.candidates
    .slice()
    .sort((a, b) => rank(a) - rank(b))
    .map(candidateBytes)
    .filter(Boolean)
    // The answer needs only one: the host learns the rest when the guest's checks arrive.
    .slice(0, kind === 'answer' ? 1 : MAX_CANDIDATES);
  out.push(cands.length);
  for (const c of cands) out.push(...c);
  out.push(crc8(out));
  return Uint8Array.from(out);
}

/** Bytes back to { kind, session, sdp }, or null if they are damaged or not ours. */
export function unpackSignal(bytes) {
  try {
    if (!bytes || bytes.length < 40) return null;
    if (crc8(bytes, bytes.length - 1) !== bytes[bytes.length - 1]) return null;
    let i = 0;
    const head = bytes[i++];
    if (head >> 4 !== VERSION) return null;
    const kind = head & 1 ? 'answer' : 'offer';
    const setup = SETUPS[(head >> 1) & 3] || 'actpass';
    const session = (bytes[i++] << 8) | bytes[i++];
    const take = () => {
      const len = bytes[i++];
      const size = Math.ceil((len * 6) / 8);
      const text = unpack6(bytes.subarray(i, i + size), len);
      i += size;
      return text;
    };
    const ufrag = take();
    const pwd = take();
    const fp = Array.from(bytes.subarray(i, i + 32), b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
    i += 32;
    const count = bytes[i++];
    const candidates = [];
    for (let k = 0; k < count; k++) {
      const type = bytes[i++];
      let address = '';
      if (type === CAND_IPV4) { address = Array.from(bytes.subarray(i, i + 4)).join('.'); i += 4; }
      else if (type === CAND_MDNS) {
        const h = Array.from(bytes.subarray(i, i + 16), b => b.toString(16).padStart(2, '0')).join('');
        address = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.local`;
        i += 16;
      } else if (type === CAND_IPV6) {
        const g = [];
        for (let j = 0; j < 16; j += 2) g.push(((bytes[i + j] << 8) | bytes[i + j + 1]).toString(16));
        address = g.join(':');
        i += 16;
      } else return null;
      const port = (bytes[i] << 8) | bytes[i + 1];
      i += 2;
      candidates.push({ address, port });
    }
    if (i !== bytes.length - 1 || ufrag.length < 4 || pwd.length < 22) return null;
    const lines = [
      'v=0',
      `o=- ${session}${Date.now() % 100000} 2 IN IP4 127.0.0.1`,
      's=-',
      't=0 0',
      'a=group:BUNDLE 0',
      'a=msid-semantic: WMS',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
      'c=IN IP4 0.0.0.0',
      ...candidates.map((c, k) => `a=candidate:${k + 1} 1 udp ${2122260223 - k} ${c.address} ${c.port} typ host`),
      'a=end-of-candidates',
      `a=ice-ufrag:${ufrag}`,
      `a=ice-pwd:${pwd}`,
      `a=fingerprint:sha-256 ${fp}`,
      `a=setup:${setup}`,
      'a=mid:0',
      'a=sctp-port:5000',
      'a=max-message-size:262144'
    ];
    return { kind, session, sdp: lines.join('\r\n') + '\r\n', candidates: candidates.length };
  } catch {
    return null;
  }
}
