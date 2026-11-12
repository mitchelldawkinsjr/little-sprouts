/** Memory-verse script. Braces hold the answer first: {Joseph|David|Moses}. */

const STOP = new Set('a an the of in to and was were him he she they it for on at by his her'.split(' '));

export const GENESIS_39_SCRIPT = [
  'title: Genesis 39:22-23 | Joseph in Prison',
  'remember: God was with Joseph, even in a difficult place.',
  'verse: So the warden put Joseph in charge of all those held in the prison. The warden paid no attention to anything under Joseph\'s care, because the Lord was with Joseph and gave him success in whatever he did.',
  'bonus: What does this verse teach you about God?',
  'bank: Joseph | prison | warden | Lord | success',
  'circle: The warden put {Joseph|David|Moses} in charge.',
  'circle: Joseph was held in the {prison|palace|garden}.',
  'circle: The warden paid no {attention|money|visits}.',
  'circle: The {Lord|guard|king} was with Joseph.',
  'fill: So the {warden} put {Joseph} in charge.',
  'fill: Of all those held in the {prison}.',
  'fill: Because the {Lord} was with Joseph.',
  'fill: And gave him {success} in whatever he did.',
  'clue: The warden paid no {attention|money|visits} to anything under Joseph\'s care.',
  'clue: The Lord was {with|before|after} Joseph.',
  'clue: God gave Joseph {success|money|time} in whatever he did.'
].join('\n');

function splitBank(value) {
  return [...new Set(String(value).split(/[|,]/).map(part => part.trim()).filter(Boolean))];
}

function clueMark(word) {
  const letters = String(word).replace(/[^A-Za-z]/g, '');
  const first = letters[0] || String(word)[0] || '';
  return `${first}${'_'.repeat(Math.max(3, letters.length - 1))}`;
}

function splitParts(value, kind) {
  const parts = [];
  const re = /\{([^{}]+)\}/g;
  let last = 0;
  let index = 0;
  let match;
  while ((match = re.exec(value))) {
    if (match.index > last) parts.push({ type: 'text', text: value.slice(last, match.index) });
    const choices = match[1].split('|').map(part => part.trim()).filter(Boolean);
    const answer = choices[0];
    if (answer) {
      parts.push({
        type: 'blank',
        answer,
        choices,
        index,
        mark: kind === 'clue' ? clueMark(answer) : '____'
      });
      index += 1;
    }
    last = match.index + match[0].length;
  }
  if (last < value.length) parts.push({ type: 'text', text: value.slice(last) });
  return parts;
}

function stepFrom(kind, value) {
  const parts = splitParts(value, kind);
  const blanks = parts.filter(part => part.type === 'blank');
  if (!blanks.length) return null;
  const answers = blanks.map(part => part.answer);
  const spoken = parts.map(part => (part.type === 'text' ? part.text : 'blank')).join('').replace(/\s+/g, ' ').trim();
  const lead = kind === 'circle' ? 'Circle the correct word.' : kind === 'fill' ? 'Fill in the missing words.' : `The word starts with ${answers[0][0]}.`;
  const say = `${lead} ${spoken}${/[.?!]$/.test(spoken) ? '' : '.'}`;
  const choices = kind === 'circle'
    ? blanks[0].choices
    : [...new Set(blanks.flatMap(part => (part.choices.length > 1 ? part.choices : [])))];
  return { kind, say, answers, choices, parts };
}

export function parseVerseScript(text) {
  const meta = { title: 'Memory verse', ref: '', remember: '', verse: '', bonus: '', bank: [] };
  const steps = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!value) continue;
    if (key === 'title') {
      const [ref, name] = value.split('|').map(part => part.trim());
      meta.ref = ref || value;
      meta.title = name || ref || 'Memory verse';
    } else if (key === 'remember') meta.remember = value;
    else if (key === 'verse') meta.verse = value;
    else if (key === 'bonus') meta.bonus = value;
    else if (key === 'bank') meta.bank = splitBank(value);
    else if (key === 'circle' || key === 'fill' || key === 'clue') {
      const step = stepFrom(key, value);
      if (step) steps.push(step);
    }
  }
  const clueAnswers = [...new Set(steps.filter(step => step.kind === 'clue').flatMap(step => step.answers))];
  for (const step of steps) {
    if (step.kind === 'fill' && !step.choices.length) step.choices = meta.bank.length ? meta.bank.slice() : step.answers.slice();
    if (step.kind === 'clue' && step.choices.length <= 1) step.choices = clueAnswers.length > 1 ? clueAnswers.slice() : step.answers.slice();
  }
  if (meta.verse) {
    steps.push({
      kind: 'write',
      say: 'Write what you remember. Optional — extra star if you do.',
      answers: [meta.verse],
      choices: [],
      parts: [{ type: 'text', text: meta.verse }]
    });
  }
  if (meta.bonus) {
    steps.push({
      kind: 'bonus',
      say: meta.bonus,
      answers: [],
      choices: [],
      parts: [{ type: 'text', text: meta.bonus }]
    });
  }
  if (!steps.length) return null;
  return { ...meta, steps };
}

/** True when the box has text that is not yet a playable script (a ref or pasted verse). */
export function needsVerseScriptBuild(text) {
  const raw = String(text || '').trim();
  return !!raw && !parseVerseScript(raw);
}

export function verseScriptFromRows(rows) {
  return (rows || [])
    .filter(row => row && row.game === 'verse' && String(row.item || '').trim() && String(row.extra || '').trim())
    .map(row => `${String(row.item).trim()}: ${String(row.extra).trim()}`)
    .join('\n');
}

function rowsFor(rows, name) {
  const who = String(name || '').trim().toLowerCase();
  const mine = (rows || []).filter(row => row?.game === 'verse');
  const specific = who ? mine.filter(row => String(row.learner || '').trim().toLowerCase() === who) : [];
  if (specific.length) return specific;
  return mine.filter(row => {
    const learner = String(row.learner || '*').trim().toLowerCase() || '*';
    return learner === '*';
  });
}

/** A learner script wins, then that learner's sheet rows, then Genesis 39. */
export function versePack({ script, rows, name } = {}) {
  const own = String(script || '').trim() ? parseVerseScript(script) : null;
  if (own) return { ...own, source: 'learner' };
  const fromSheet = parseVerseScript(verseScriptFromRows(rowsFor(rows, name)));
  if (fromSheet) return { ...fromSheet, source: 'sheet' };
  return { ...parseVerseScript(GENESIS_39_SCRIPT), source: 'builtin' };
}

export function normWord(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function clueMatch(answer, typed) {
  const want = normWord(answer);
  const got = normWord(typed);
  if (!want || !got) return false;
  return got === want || got === want.slice(1);
}

export function verseRecall(expected, typed) {
  const want = String(expected || '').toLowerCase().split(/[^a-z0-9']+/).map(normWord).filter(word => word && !STOP.has(word));
  const got = new Set(String(typed || '').toLowerCase().split(/[^a-z0-9']+/).map(normWord).filter(Boolean));
  const total = want.length;
  const hit = want.filter(word => got.has(word)).length;
  const need = total < 8 ? Math.max(1, Math.ceil(total * 0.5)) : Math.min(4, total);
  return { ok: total ? hit >= need : got.size > 0, hit, need, total };
}

/** Full verse with the reference at the end — for speaking and the completed listing. */
export function verseWithRef(pack) {
  const verse = String(pack?.verse || '').trim();
  if (!verse) return '';
  const ref = String(pack?.ref || '').trim();
  if (!ref) return verse;
  const bare = verse.replace(/[—–-]\s*$/, '').trim();
  const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`(?:^|[\\s—–-])${escaped}\\.?$`, 'i').test(bare)) return bare;
  return `${bare} — ${ref}`;
}

const DECOYS = 'house river stone night water friend peace faith heart voice king queen child mother father garden temple mountain valley morning prayer hope love joy'.split(' ');

/** True when the box is a Bible reference like Genesis 21:11, not a pasted verse. */
export function looksLikeVerseRef(text) {
  const line = String(text || '').trim().replace(/\s+/g, ' ');
  if (!line || line.length > 48 || /[.!?]/.test(line)) return false;
  return /^(?:[123]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+)?\s+\d+:\d+(?:\s*-\s*\d+)?$/i.test(line);
}

function cleanVerseText(text) {
  return String(text || '').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

function contentWords(verse) {
  const seen = new Set();
  const words = [];
  for (const raw of String(verse || '').match(/[A-Za-z']+/g) || []) {
    const word = raw.replace(/^'+|'+$/g, '');
    const key = word.toLowerCase();
    if (word.length < 4 || STOP.has(key) || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function decoysFor(answer, bank, need = 2) {
  const take = [];
  const used = new Set([normWord(answer)]);
  for (const word of [...bank, ...DECOYS]) {
    const key = normWord(word);
    if (!key || used.has(key) || Math.abs(word.length - answer.length) > 4) continue;
    used.add(key);
    take.push(word);
    if (take.length >= need) break;
  }
  while (take.length < need) take.push(DECOYS[take.length % DECOYS.length]);
  return take;
}

function sentenceFor(verse, word) {
  const parts = String(verse || '').split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);
  const hit = parts.find(part => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(part));
  return hit || verse;
}

function blankLine(sentence, word, choices) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  if (!re.test(sentence)) return null;
  return sentence.replace(re, `{${choices.join('|')}}`);
}

/**
 * Build a playable verse script from a reference and/or the full verse text.
 * shortcut: distractors are other bank words plus a small decoy list; edit the script when a line needs better wrong answers.
 */
export function buildVerseScript({ reference = '', verse = '', title = '', remember = '', bonus = '' } = {}) {
  const text = cleanVerseText(verse);
  if (!text) return null;
  const ref = String(reference || '').trim() || 'Memory verse';
  const name = String(title || '').trim() || ref;
  const bank = contentWords(text).slice(0, 5);
  if (!bank.length) return null;
  const lines = [
    `title: ${ref} | ${name === ref ? 'Memory verse' : name}`,
    `remember: ${String(remember || '').trim() || 'God keeps his word.'}`,
    `verse: ${text}`,
    `bonus: ${String(bonus || '').trim() || 'What does this verse teach you about God?'}`,
    `bank: ${bank.join(' | ')}`
  ];
  for (const word of bank.slice(0, 4)) {
    const choices = [word, ...decoysFor(word, bank)];
    const line = blankLine(sentenceFor(text, word), word, choices);
    if (line) lines.push(`circle: ${line}`);
  }
  for (const word of bank) {
    const line = blankLine(sentenceFor(text, word), word, [word]);
    if (line) lines.push(`fill: ${line}`);
  }
  for (const word of bank.slice(0, 3)) {
    const choices = [word, ...decoysFor(word, bank)];
    const line = blankLine(sentenceFor(text, word), word, choices);
    if (line) lines.push(`clue: ${line}`);
  }
  return lines.join('\n');
}

export function verseSheetRows(script, learner = '*') {
  const who = String(learner || '*').trim() || '*';
  return String(script || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
      if (!match) return '';
      const item = match[1].toLowerCase();
      const extra = match[2].replace(/"/g, '""');
      const quoted = /[,"\n]/.test(match[2]) ? `"${extra}"` : extra;
      return `${who},verse,${item},${quoted}`;
    })
    .filter(Boolean)
    .join('\n');
}

/** Public-domain text only: World English Bible (default) or King James. */
export async function fetchPublicVerse(reference, translation = 'web') {
  const ref = String(reference || '').trim();
  if (!ref) throw new Error('Add a Bible reference.');
  const tx = String(translation || 'web').toLowerCase() === 'kjv' ? 'kjv' : 'web';
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${tx}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('That reference could not be loaded.');
  const data = await res.json();
  const verse = cleanVerseText(data.text || (data.verses || []).map(v => v.text).join(' '));
  if (!verse) throw new Error('That reference had no verse text.');
  return {
    reference: data.reference || ref,
    verse,
    translation: tx
  };
}

/** Turn a pasted reference or full verse into a finished script. */
export async function scriptFromSeed(seed, { translation = 'web', title = '', remember = '', bonus = '' } = {}) {
  const raw = String(seed || '').trim();
  if (!raw) return null;
  if (looksLikeVerseRef(raw)) {
    const found = await fetchPublicVerse(raw, translation);
    return buildVerseScript({
      reference: found.reference,
      verse: found.verse,
      title,
      remember,
      bonus
    });
  }
  return buildVerseScript({
    reference: title || 'Memory verse',
    verse: raw,
    title,
    remember,
    bonus
  });
}

/** Expand sheet verse groups that only have a ref and/or verse text. */
export async function expandVerseSheetRows(rows, { translation = 'web' } = {}) {
  const list = Array.isArray(rows) ? rows.slice() : [];
  const byLearner = new Map();
  for (const row of list) {
    if (row?.game !== 'verse') continue;
    const who = String(row.learner || '*').trim().toLowerCase() || '*';
    if (!byLearner.has(who)) byLearner.set(who, []);
    byLearner.get(who).push(row);
  }
  const keep = list.filter(row => row?.game !== 'verse');
  for (const [who, group] of byLearner) {
    const hasPlay = group.some(row => /^(circle|fill|clue)$/i.test(row.item));
    if (hasPlay) {
      keep.push(...group);
      continue;
    }
    const ref = group.find(row => /^ref$/i.test(row.item))?.extra || '';
    const verse = group.find(row => /^verse$/i.test(row.item))?.extra || '';
    const title = group.find(row => /^title$/i.test(row.item))?.extra || '';
    const remember = group.find(row => /^remember$/i.test(row.item))?.extra || '';
    const bonus = group.find(row => /^bonus$/i.test(row.item))?.extra || '';
    const tx = group.find(row => /^translation$/i.test(row.item))?.extra || translation;
    let script = null;
    if (ref && looksLikeVerseRef(ref)) script = await scriptFromSeed(ref, { translation: tx, title, remember, bonus });
    else if (verse) script = buildVerseScript({ reference: ref || title, verse, title, remember, bonus });
    if (!script) {
      keep.push(...group);
      continue;
    }
    const learner = group[0]?.learner || who;
    for (const line of script.split('\n')) {
      const match = line.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
      if (match) keep.push({ learner, game: 'verse', item: match[1].toLowerCase(), extra: match[2] });
    }
  }
  return keep;
}
