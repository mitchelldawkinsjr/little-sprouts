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
      say: 'Cover the verse and write what you remember.',
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
