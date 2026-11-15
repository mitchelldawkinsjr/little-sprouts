// Little Sprouts always speaks English.
//
// A browser line with no language or voice set speaks in whatever the browser picks: the
// device's default voice, or on some browsers the language another page used last. Station
// scout announces its trains in Japanese, and afterwards the app's own lines could come out
// in a Japanese voice. Every browser line goes through here, so it names English and an
// English voice.

const EN = /^en([-_]|$)/i;
const US = /^en[-_]us$/i;

/** The English voice to speak with, or null while the browser hasn't listed its voices yet. */
export function englishVoice(synth = globalThis.speechSynthesis) {
  let all = [];
  try { all = synth?.getVoices?.() || []; } catch { all = []; }
  const en = all.filter(v => EN.test(v.lang || ''));
  return en.find(v => US.test(v.lang) && v.localService && v.default)
    || en.find(v => US.test(v.lang) && v.localService)
    || en.find(v => US.test(v.lang))
    || en.find(v => v.localService)
    || en[0]
    || null;
}

/** A browser speech line in English. */
export function englishLine(text) {
  const line = new SpeechSynthesisUtterance(String(text));
  line.lang = 'en-US';
  const voice = englishVoice();
  if (voice) line.voice = voice;
  return line;
}
