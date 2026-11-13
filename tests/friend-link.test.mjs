import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  packSignal, unpackSignal, readSdp, to7, from7, toQrText, fromQrText, crc8
} from '../lib/friend-wire.mjs';

// A Chrome offer for a data channel, as made on a home network (mDNS host candidates).
const CHROME_OFFER = [
  'v=0', 'o=- 1985763405238870341 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0',
  'a=extmap-allow-mixed', 'a=msid-semantic: WMS',
  'm=application 61067 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0',
  'a=candidate:1213260239 1 udp 2113937151 99db01ed-012d-4cf9-933c-3596d12d086d.local 61067 typ host generation 0 network-cost 999',
  'a=candidate:2311075926 1 udp 2113939711 74e59a06-85bf-494c-84b1-3387fed3a3ad.local 53450 typ host generation 0 network-cost 999',
  'a=candidate:842163049 1 udp 1677729535 203.0.113.9 61067 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999',
  'a=candidate:7 1 tcp 1518280447 192.168.1.20 9 typ host tcptype active generation 0',
  'a=ice-ufrag:Zx3q', 'a=ice-pwd:8mT0wqKcC9yDk2hLx0aBf3Zr', 'a=ice-options:trickle',
  'a=fingerprint:sha-256 4F:12:9A:00:AB:CD:EF:01:23:45:67:89:FE:DC:BA:98:76:54:32:10:0F:1E:2D:3C:4B:5A:69:78:87:96:A5:B4',
  'a=setup:actpass', 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ''
].join('\r\n');

const ANSWER_V4 = CHROME_OFFER
  .replace('a=setup:actpass', 'a=setup:active')
  .replace(/a=candidate:1213260239[^\r]*\r\n/, 'a=candidate:1 1 udp 2122260223 192.168.1.42 50000 typ host generation 0\r\n');

test('friend link: an offer shrinks to under 100 bytes and keeps what WebRTC needs', () => {
  const bytes = packSignal(CHROME_OFFER, { kind: 'offer', session: 4242 });
  assert.ok(bytes.length <= 100, `offer is ${bytes.length} bytes`);
  const back = unpackSignal(bytes);
  assert.equal(back.kind, 'offer');
  assert.equal(back.session, 4242);
  const a = readSdp(CHROME_OFFER);
  const b = readSdp(back.sdp);
  assert.equal(b.ufrag, a.ufrag);
  assert.equal(b.pwd, a.pwd);
  assert.deepEqual(b.fingerprint, a.fingerprint);
  assert.equal(b.setup, 'actpass');
  assert.deepEqual(b.candidates, a.candidates.slice(0, 2), 'only udp host candidates, mDNS names intact');
  assert.match(back.sdp, /m=application 9 UDP\/DTLS\/SCTP webrtc-datachannel/);
});

test('friend link: an answer keeps one address, prefers plain IPv4, and says active', () => {
  const bytes = packSignal(ANSWER_V4, { kind: 'answer', session: 7 });
  const back = unpackSignal(bytes);
  assert.equal(back.kind, 'answer');
  assert.equal(back.candidates, 1);
  assert.match(back.sdp, /192\.168\.1\.42 50000 typ host/);
  assert.match(back.sdp, /a=setup:active/);
  assert.ok(bytes.length < packSignal(CHROME_OFFER, { kind: 'offer', session: 7 }).length);
});

test('friend link: damaged or foreign bytes are ignored', () => {
  const bytes = packSignal(CHROME_OFFER, { kind: 'offer', session: 1 });
  const bad = Uint8Array.from(bytes);
  bad[20] ^= 0x40;
  assert.equal(unpackSignal(bad), null, 'CRC catches a flipped bit');
  assert.equal(unpackSignal(bytes.subarray(0, 30)), null);
  assert.equal(unpackSignal(new Uint8Array(60)), null);
  assert.equal(crc8(bytes, bytes.length - 1), bytes[bytes.length - 1]);
});

test('friend link: 7-bit text for sound and QR text both round-trip', () => {
  const bytes = packSignal(CHROME_OFFER, { kind: 'offer', session: 999 });
  const seven = to7(bytes);
  assert.ok([...seven].every(ch => ch.charCodeAt(0) < 128));
  assert.deepEqual(Array.from(from7(seven)).slice(0, bytes.length), Array.from(bytes));
  const qr = toQrText(bytes);
  assert.match(qr, /^SPROUTS1:[A-Za-z0-9_-]+$/);
  assert.deepEqual(Array.from(fromQrText(qr)), Array.from(bytes));
  assert.equal(fromQrText('https://example.com'), null);
});

test('friend link: a signal survives a ggwave chirp, heard in small pieces like a microphone', async () => {
  const require = createRequire(import.meta.url);
  const factory = require('../vendor/ggwave/ggwave.js');
  const gg = await factory({ print: () => {}, printErr: () => {} });
  const p = gg.getDefaultParameters();
  p.sampleRateInp = p.sampleRateOut = 48000;
  p.sampleFormatInp = p.sampleFormatOut = gg.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
  const tx = gg.init(p);
  const rx = gg.init(p);
  const bytes = packSignal(CHROME_OFFER, { kind: 'offer', session: 31337 });
  const wave = gg.encode(tx, to7(bytes), gg.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FASTEST, 60);
  const samples = new Float32Array(wave.buffer.slice(wave.byteOffset, wave.byteOffset + wave.byteLength));
  assert.ok(samples.length / 48000 < 6, `chirp is ${(samples.length / 48000).toFixed(1)} s`);
  let heard = null;
  for (let i = 0; i < samples.length + 48000 && !heard; i += 1024) {
    const part = new Float32Array(1024);
    part.set(samples.subarray(i, i + 1024));
    // A little room noise on top.
    for (let k = 0; k < part.length; k++) part[k] += (Math.random() - 0.5) * 0.02;
    const r = gg.decode(rx, new Int8Array(part.buffer));
    if (r && r.length) heard = from7(String.fromCharCode(...new Uint8Array(r)));
  }
  assert.ok(heard, 'the chirp was heard');
  const sig = unpackSignal(heard.subarray(0, bytes.length));
  assert.equal(sig?.session, 31337);
});
