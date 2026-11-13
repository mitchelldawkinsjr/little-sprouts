/**
 * Data over sound for friend rooms with no internet. ggwave (MIT, vendor/ggwave) turns a
 * few dozen bytes into a short chirp and back. One computer plays, the other listens.
 *
 * ggwave turns characters above 127 into two bytes, so bytes travel as 7-bit characters
 * (friend-wire.mjs to7 / from7).
 */
import { to7, from7 } from './friend-wire.mjs?v=friend1';

const GGWAVE_SRC = '/vendor/ggwave/ggwave.js?v=friend1';
const VOLUME = 60;

let factoryPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(s);
  });
}

function ggwave() {
  if (!factoryPromise) {
    factoryPromise = (window.ggwave_factory ? Promise.resolve() : loadScript(GGWAVE_SRC))
      // ggwave prints a line for every encode; keep the console quiet.
      .then(() => window.ggwave_factory({ print: () => {}, printErr: () => {} }))
      .then((gg) => { try { gg.disableLog(); } catch { /* older build */ } return gg; });
  }
  return factoryPromise;
}

export class SoundLink {
  constructor() {
    this.ctx = null;
    this.gg = null;
    this.inst = null;
    this.stream = null;
    this.proc = null;
    this.onBytes = null;
    this.playing = null;
    this.level = 0;
  }

  /** Call from a click: it starts audio and asks for the microphone. */
  async start({ listen = true } = {}) {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {});
    this.gg = await ggwave();
    if (!this.inst) {
      const p = this.gg.getDefaultParameters();
      p.sampleRateInp = this.ctx.sampleRate;
      p.sampleRateOut = this.ctx.sampleRate;
      p.sampleFormatInp = this.gg.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
      p.sampleFormatOut = this.gg.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
      this.inst = this.gg.init(p);
    }
    if (listen && !this.stream) await this.listen();
  }

  async listen() {
    // Echo cancelling and noise removal would scrub the chirp out, so both stay off.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    const source = this.ctx.createMediaStreamSource(this.stream);
    const proc = this.ctx.createScriptProcessor(1024, 1, 1);
    const mute = this.ctx.createGain();
    mute.gain.value = 0;
    proc.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < input.length; i += 16) peak = Math.max(peak, Math.abs(input[i]));
      this.level = this.level * 0.8 + peak * 0.2;
      const copy = new Float32Array(input);
      let res = null;
      try { res = this.gg.decode(this.inst, new Int8Array(copy.buffer)); } catch { res = null; }
      if (res && res.length) {
        const text = String.fromCharCode(...new Uint8Array(res));
        this.onBytes?.(from7(text));
      }
    };
    source.connect(proc);
    proc.connect(mute);
    mute.connect(this.ctx.destination);
    this.proc = proc;
    this.source = source;
  }

  /** The chirp for some bytes, as samples at this context's rate. */
  encode(bytes) {
    const wave = this.gg.encode(this.inst, to7(bytes), this.gg.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FASTEST, VOLUME);
    return new Float32Array(wave.buffer.slice(wave.byteOffset, wave.byteOffset + wave.byteLength));
  }

  /** Play bytes once. Resolves when the chirp ends. */
  play(bytes) {
    const samples = this.encode(bytes);
    const buffer = this.ctx.createBuffer(1, samples.length, this.ctx.sampleRate);
    buffer.getChannelData(0).set(samples);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);
    this.playing = src;
    return new Promise((resolve) => {
      src.onended = () => { if (this.playing === src) this.playing = null; resolve(); };
      src.start();
    });
  }

  stopPlaying() {
    try { this.playing?.stop(); } catch { /* already done */ }
    this.playing = null;
  }

  close() {
    this.stopPlaying();
    try { this.proc?.disconnect(); this.source?.disconnect(); } catch { /* gone */ }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.proc = null;
    this.onBytes = null;
    try { if (this.inst != null) this.gg?.free(this.inst); } catch { /* freed */ }
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.inst = null;
  }
}
