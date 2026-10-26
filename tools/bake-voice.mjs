// Renders bakedLines for every voice into voice/<version>/<voice>/<hash>.m4a.
// Run from the repo root: node tools/bake-voice.mjs
// A file that is already there is left as it is, so a stopped run can continue.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BAKE_VERSION, DTYPE, MODEL, SPEED, bakedPath, bakedTexts, usable, voiceIds } from '../speech-core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(new URL('./voice-bake/package.json', import.meta.url));
const { KokoroTTS } = require('kokoro-js');

const only = process.argv.find(arg => arg.startsWith('--voice='))?.slice('--voice='.length);
const voices = only ? voiceIds.filter(id => id === only) : voiceIds;
if (!voices.length) throw new Error(`unknown voice ${only}`);

function wavBytes(samples, rate) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function encode(wav, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const result = spawnSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1', wav, dest], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`afconvert failed for ${dest}`);
}

const texts = bakedTexts();
const pending = [];
for (const voice of voices) {
  for (const text of texts) {
    const path = bakedPath({ voice, text, speed: SPEED });
    const dest = join(root, path);
    if (!existsSync(dest)) pending.push({ voice, text, dest });
  }
}
console.log(`${pending.length} clips to render (${texts.length} lines, ${voices.length} voices, version ${BAKE_VERSION})`);
if (!pending.length) process.exit(0);

const tts = await KokoroTTS.from_pretrained(MODEL, { dtype: DTYPE, device: 'cpu' });
let done = 0;
for (const job of pending) {
  const started = Date.now();
  const audio = await tts.generate(job.text, { voice: job.voice, speed: SPEED });
  const samples = audio.audio;
  const rate = audio.sampling_rate || 24000;
  if (!usable(samples)) throw new Error(`unusable audio for ${job.voice}: ${job.text}`);
  const wav = join(tmpdir(), `sprouts-${process.pid}.wav`);
  writeFileSync(wav, wavBytes(samples, rate));
  encode(wav, job.dest);
  done += 1;
  console.log(`${done}/${pending.length} ${job.voice} ${((Date.now() - started) / 1000).toFixed(1)}s ${job.text}`);
}
