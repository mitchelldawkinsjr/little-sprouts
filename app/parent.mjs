import {
  gateOk,
  gateQuestion,
  numberDeck,
  mergeSheets,
  parseSheet,
  parseWords,
  parseVerseScript,
  needsVerseScriptBuild,
  scriptFromSeed,
  verseSheetRows,
  expandVerseSheetRows,
  resetProgress,
  raceKinds,
  roundCount,
  skillStatText,
  stageOf,
  profileSprite,
  nextSprite,
  blankLearner,
  SPRITES
} from '../logic.mjs?v=offline1';
import {
  getSpeechStatus,
  knownVoice,
  onSpeechStatus,
  prepareSpeech,
  profiles,
  sampleLine,
  speakAndWait,
  voiceFor,
  voices
} from '../lib/speech.js?v=roll1';
import { sidecarGame, sidecarIsBuilt } from '../lib/sidecar.js?v=roll1';
import { spriteHtml } from '../lib/home-ui.mjs?v=offline1';
import { voiceStatusText } from '../lib/parent-ui.mjs?v=structure2';
import { $, esc } from './runtime.mjs?v=lean-r2';

export function registerParent(rt) {
  Object.assign(rt, {
    openPrint,
    ask,
    withGrownup,
    loadSheet,
    showWelcome,
    openParentCorner
  });
  const LEARNER_LIMIT = 8;
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdhKSZBII7leKaxTQ6mRPG0Q6POsFtOrCADtNIFDl6yrlnPoCXLXaUCsGvzzNIZPodTxfOHnAjP5MQ/pub?output=csv';
  function decks(x = rt.p()) {
    const lv = id => +(x.levels?.[id] || x.level);
    const counts = {};
    x.words.forEach(w => {
      const c = {};
      [...w].forEach(ch => { c[ch] = (c[ch] || 0) + 1; });
      Object.entries(c).forEach(([ch, n]) => { counts[ch] = Math.max(counts[ch] || 0, n); });
    });
    const word = w => `<span class="cardword" style="--len:${w.length}">${esc(w)}</span>`;
    const chip = (name, hex) => `<span class="swatch${name === 'white' || name === 'yellow' ? ' light' : ''}" style="background:${hex}"></span>`;
    return [
      ['shapes', 'Shapes', 'Shape safari & What’s missing?', rt.pools(Math.max(lv('shapes'), lv('missing'))).ss.map(s => [rt.shape(s), s])],
      ['colors', 'Colors', 'Color garden', rt.pools(lv('colors')).cs.map(([c, h]) => [chip(c, h), c])],
      ['mix', 'Colored shapes', 'Jump to it!', rt.mixDeck(lv('mix')).map(m => { const [c, s] = m.split(' '); return [rt.shape(s, rt.colors.find(v => v[0] === c)[1]), m]; })],
      ...(rt.hidesReading(stageOf(x, rt.data.profiles.indexOf(x))) ? [] : [
        ['words', 'Sight words', 'Word parking', x.words.map(w => [word(w), 'Word parking'])],
        ['letters', 'Letters', 'Build a word', Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).flatMap(([ch, n]) => Array(n).fill([word(ch), 'Build a word']))]
      ]),
      ['numbers', 'Numbers', 'Count & clap and Number path', numberDeck(stageOf(x, rt.data.profiles.indexOf(x)), lv('count'), lv('path')).map(n => [`<span class="cardword${n === 6 || n === 9 ? ' under' : ''}" style="--len:${String(n).length}">${n}</span>`, 'Number'])]
    ];
  }
  function openPrint() {
    $('#printFor').textContent = rt.p().name;
    $('#deckList').innerHTML = decks().map(([id, name, use, cards]) => `<label class="check"><input type="checkbox" data-deck="${id}" checked> ${name} · ${cards.length} cards <span class="hint">for ${use}</span></label>`).join('');
    $('#printDialog').showModal();
  }
  function formSnapshot() {
    return JSON.stringify({
      profile: $('#editProfile').value,
      name: $('#name').value,
      stage: $('#stage').value,
      level: $('#level').value,
      rounds: $('#rounds').value,
      arcade: $('#arcade').checked,
      upNext: $('#upNext')?.value || '',
      words: $('#words').value,
      verse: $('#verse')?.value || '',
      sound: $('#sound').checked,
      voice: $('#voice').value,
      characterVoices: $('#characterVoices').checked,
      camera: $('#camera').checked,
      skills: [...document.querySelectorAll('[data-skill]')].map(el => `${el.dataset.skill}:${el.value}`),
      race: [...document.querySelectorAll('[data-race]')].map(el => `${el.dataset.race}:${el.checked ? 1 : 0}`).join(','),
      rally: [...document.querySelectorAll('[data-rally]')].map(el => `${el.dataset.rally}:${el.checked ? 1 : 0}`).join(','),
      rallySpan: $('#rallySpan').value,
      sprite: document.querySelector('#spritePick [data-sprite].selected')?.dataset.sprite || ''
    });
  }
  function paintStats() {
    const x = rt.data.profiles[+$('#editProfile').value];
    document.querySelectorAll('[data-skill]').forEach(el => {
      el.closest('.skill-setting').querySelector('[data-stat]').textContent = skillStatText(x, el.dataset.skill, +el.value);
    });
  }
  function loadForm() {
    rt.loadingForm = true;
    const x = rt.data.profiles[+$('#editProfile').value];
    $('#name').value = x.name;
    $('#stage').value = stageOf(x, +$('#editProfile').value);
    $('#level').value = x.level;
    $('#rounds').value = x.rounds;
    $('#arcade').checked = !!x.arcade;
    $('#words').value = x.words.join(', ');
    if ($('#verse')) $('#verse').value = x.verse || '';
    $('#sound').checked = rt.data.sound;
    $('#voice').value = knownVoice(rt.data.voice);
    $('#characterVoices').checked = !!rt.data.characterVoices;
    paintVoiceStatus(getSpeechStatus());
    $('#camera').checked = !!rt.data.camera;
    paintSheet();
    $('#error').textContent = '';
    const stage = stageOf(x, +$('#editProfile').value);
    const formGames = rt.games.filter(([id]) => (!rt.hidesReading(stage) || !rt.READING_GAMES.has(id)) && (!sidecarGame(id) || sidecarIsBuilt(id)));
    const skillGames = formGames.filter(([id]) => !sidecarGame(id));
    $('#skillSettings').innerHTML = skillGames.map(([id, name]) => {
      const lv = x.levels?.[id] || x.level;
      return `<div class="skill-setting"><label>${name}<select data-skill="${id}">${[1, 2, 3].map(n => `<option value="${n}" ${n === +lv ? 'selected' : ''}>Level ${n}</option>`).join('')}</select></label><span data-stat>${esc(skillStatText(x, id, +lv))}</span></div>`;
    }).join('');
    document.querySelectorAll('[data-skill]').forEach(el => { el.onchange = paintStats; });
    fillUpNext(formGames, x.upNext);
    const picked = new Set(raceKinds(x.race));
    document.querySelectorAll('[data-race]').forEach(el => { el.checked = picked.has(el.dataset.race); });
    const rally = rt.rallyPrefs(x);
    document.querySelectorAll('[data-rally]').forEach(el => { el.checked = !!rally[el.dataset.rally]; });
    $('#rallySpan').value = rally.span;
    paintStageTopics();
    const sprite = profileSprite(x, +$('#editProfile').value);
    const pick = $('#spritePick');
    if (pick) {
      pick.innerHTML = SPRITES.map(kind => `<button type="button" class="sprite-choice${kind === sprite ? ' selected' : ''}" data-sprite="${kind}" aria-pressed="${kind === sprite}" aria-label="${kind}">${spriteHtml(kind)}</button>`).join('');
      pick.querySelectorAll('[data-sprite]').forEach(btn => {
        btn.onclick = () => {
          pick.querySelectorAll('[data-sprite]').forEach(el => {
            const on = el === btn;
            el.classList.toggle('selected', on);
            el.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        };
      });
    }
    const remove = $('#removeLearner');
    if (remove) remove.disabled = rt.data.profiles.length < 2;
    const add = $('#addLearner');
    if (add) add.disabled = rt.data.profiles.length >= LEARNER_LIMIT;
    rt.cleanSnapshot = formSnapshot();
    rt.loadingForm = false;
  }
  function fillUpNext(formGames, pin) {
    const up = $('#upNext');
    if (!up) return;
    const chosen = String(pin || up.value || '');
    up.innerHTML = `<option value="">After the last game they played</option>${formGames.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('')}`;
    up.value = formGames.some(([id]) => id === chosen) ? chosen : '';
  }
  function paintStageTopics() {
    const stage = $('#stage').value;
    const preschool = stage === 'preschool';
    const grade4 = stage === 'grade4';
    const spell = document.querySelector('[data-rally="spell"]');
    const words = document.querySelector('[data-race="words"]');
    const colors = document.querySelector('[data-race="colors"]');
    if (spell) {
      spell.disabled = preschool;
      if (preschool) spell.checked = false;
    }
    if (words) {
      words.disabled = preschool;
      if (preschool) words.checked = false;
    }
    if (colors) {
      colors.disabled = grade4;
      if (grade4) colors.checked = false;
    }
    const formGames = rt.games.filter(([id]) => (!rt.hidesReading(stage) || !rt.READING_GAMES.has(id)) && (!sidecarGame(id) || sidecarIsBuilt(id)));
    fillUpNext(formGames, $('#upNext')?.value);
  }
  function readWordField() {
    const raw = $('#words').value.trim();
    if (!raw) return { words: [], ok: true };
    return parseWords(raw);
  }
  function applyForm() {
    const { words } = readWordField();
    const x = rt.data.profiles[+$('#editProfile').value];
    const sprite = document.querySelector('#spritePick [data-sprite].selected')?.dataset.sprite;
    Object.assign(x, {
      name: $('#name').value.trim(),
      stage: $('#stage').value,
      level: +$('#level').value,
      rounds: roundCount($('#rounds').value),
      arcade: $('#arcade').checked,
      upNext: $('#upNext')?.value || '',
      words,
      verse: $('#verse')?.value || '',
      sprite: profileSprite({ sprite }, +$('#editProfile').value)
    });
    x.levels = Object.fromEntries([...document.querySelectorAll('[data-skill]')].map(el => [el.dataset.skill, +el.value]));
    x.race = Object.fromEntries([...document.querySelectorAll('[data-race]')].map(el => [el.dataset.race, el.checked]));
    x.rally = {
      spell: !!document.querySelector('[data-rally="spell"]')?.checked,
      match: !!document.querySelector('[data-rally="match"]')?.checked,
      math: !!document.querySelector('[data-rally="math"]')?.checked,
      span: ['single', 'twelves', 'wide'].includes($('#rallySpan').value) ? $('#rallySpan').value : 'twelves'
    };
    rt.data.sound = $('#sound').checked;
    rt.data.voice = knownVoice($('#voice').value);
    rt.data.characterVoices = $('#characterVoices').checked;
    rt.data.camera = $('#camera').checked;
    rt.data.active = +$('#editProfile').value;
    rt.save();
    rt.cleanSnapshot = formSnapshot();
  }
  function ask(title, text, okLabel, opts = {}) {
    rt.askYesOnCancel = !!opts.keep;
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmOk').textContent = opts.keep ? 'Keep playing' : okLabel;
    $('#confirmCancel').textContent = opts.keep ? okLabel : 'Go back';
    $('#confirm').showModal();
    return new Promise(resolve => { rt.askResolve = resolve; });
  }
  function withGrownup(next) {
    if (rt.grownupOk) { next(); return; }
    showGate(next);
  }
  function showGate(next) {
    const q = gateQuestion();
    rt.gateAnswer = q.answer;
    rt.gateNext = next;
    rt.stopSpeech();
    $('#gateLabel').textContent = q.text;
    $('#gateAnswer').value = '';
    $('#gateError').textContent = '';
    $('#gate').showModal();
    $('#gateAnswer').focus();
  }
  function settleAsk(ok) {
    if ($('#confirm').open) $('#confirm').close();
    const resolve = rt.askResolve;
    rt.askResolve = null;
    resolve?.(ok);
  }
  async function closeSettings() {
    if (formSnapshot() !== rt.cleanSnapshot) {
      const ok = await ask('Discard these changes?', 'Your edits will not be saved.', 'Discard');
      if (!ok) return;
    }
    rt.stopSpeech();
    $('#settings').close();
    if ((location.hash || '') === '#settings') rt.setHash?.('home', { replace: true });
  }
  function openParentCorner() {
    showGate(rt.data.profiles.length ? openSettings : openSetupForm);
  }
  function fillLearners(index = rt.data.active) {
    rt.loadingForm = true;
    $('#editProfile').innerHTML = rt.data.profiles.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('');
    $('#editProfile').value = String(index);
    rt.loadingForm = false;
  }
  function openSettings() {
    if (!rt.data.profiles.length) { openSetupForm(); return; }
    $('#gate').close();
    fillLearners(rt.data.active);
    loadForm();
    $('#settings').showModal();
    rt.setHash?.('settings');
  }
  function showWelcome({ syncHash = true } = {}) {
    if (syncHash) rt.setHash?.('welcome');
    $('#app').innerHTML = `<section class="welcome"><h1>Welcome</h1><p>A grown-up sets up this browser once. The child’s name, grade, and garden buddy stay on this device.</p><button type="button" class="primary" id="beginSetup">Set up this browser</button></section>`;
    const begin = $('#beginSetup');
    if (begin) begin.onclick = () => openSetup();
  }
  function paintSetupSprites(selected = 'fox') {
    const pick = $('#setupSprites');
    if (!pick) return;
    pick.innerHTML = SPRITES.map(kind => `<button type="button" class="sprite-choice${kind === selected ? ' selected' : ''}" data-sprite="${kind}" aria-pressed="${kind === selected}" aria-label="${kind}">${spriteHtml(kind)}</button>`).join('');
    pick.querySelectorAll('[data-sprite]').forEach(btn => {
      btn.onclick = () => {
        pick.querySelectorAll('[data-sprite]').forEach(el => {
          const on = el === btn;
          el.classList.toggle('selected', on);
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
    });
  }
  function openSetupForm() {
    $('#gate').close();
    paintSetupSprites('fox');
    $('#setupName').value = '';
    $('#setupStage').value = 'preschool';
    $('#setupError').textContent = '';
    $('#setup').showModal();
    $('#setupName').focus();
  }
  function openSetup() {
    withGrownup(openSetupForm);
  }
  function finishSetup(e) {
    e.preventDefault();
    const name = $('#setupName').value.trim();
    if (!name) {
      $('#setupError').textContent = 'Add the child’s name.';
      $('#setupName').focus();
      return;
    }
    if (rt.data.profiles.length) {
      $('#setup').close();
      rt.home();
      return;
    }
    const stage = $('#setupStage').value;
    const sprite = document.querySelector('#setupSprites [data-sprite].selected')?.dataset.sprite || 'fox';
    const learner = blankLearner(name, sprite);
    learner.stage = stageOf({ stage });
    learner.words = [];
    rt.data.profiles = [learner];
    rt.data.active = 0;
    rt.save();
    $('#setup').close();
    rt.home();
  }
  async function discardEdits(text) {
    if (formSnapshot() === rt.cleanSnapshot) return true;
    return ask('Discard these changes?', text, 'Discard');
  }
  async function addLearner() {
    if (rt.data.profiles.length >= LEARNER_LIMIT) {
      $('#error').textContent = 'This device can keep 8 learners. Remove one to add another.';
      return;
    }
    if (!await discardEdits('Adding a learner will drop unsaved edits.')) return;
    rt.data.profiles.push(blankLearner('New learner', nextSprite(rt.data.profiles)));
    rt.data.active = rt.data.profiles.length - 1;
    rt.save();
    fillLearners(rt.data.active);
    loadForm();
    $('#name').focus();
    $('#name').select();
  }
  async function removeCurrentLearner() {
    if (rt.data.profiles.length < 2) return;
    const index = +$('#editProfile').value;
    const name = rt.data.profiles[index]?.name || 'This learner';
    const ok = await ask('Remove this learner?', `${name} and their stars will be removed from this browser.`, 'Remove learner');
    if (!ok) return;
    rt.data.profiles.splice(index, 1);
    if (rt.data.active > index) rt.data.active -= 1;
    else if (rt.data.active === index) rt.data.active = Math.min(index, rt.data.profiles.length - 1);
    rt.save();
    fillLearners(rt.data.active);
    loadForm();
  }
  $('#printForm').onsubmit = e => {
    e.preventDefault();
    const chosen = [...document.querySelectorAll('[data-deck]:checked')].map(el => el.dataset.deck);
    const cards = decks().filter(d => chosen.includes(d[0])).flatMap(d => d[3].map(([art, label]) => `<div class="floorcard"><span class="cardart">${art}</span><small>${esc(label)}</small></div>`));
    if (!cards.length) return;
    $('#printArea').innerHTML = cards.join('');
    $('#printDialog').close();
    window.print();
  };
  $('#printClose').onclick = () => $('#printDialog').close();
  $('.brand').onclick = e => { e.preventDefault(); rt.requestHome(); };
  $('#parents').onclick = () => {
    if (!rt.roundActive()) { rt.clearTimers('rocket'); openParentCorner(); return; }
    ask('Leave this round?', 'This round will not be saved.', 'Leave round', { keep: true }).then(ok => {
      if (!ok) return;
      rt.home();
      openParentCorner();
    });
  };
  $('#gateCancel').onclick = () => {
    $('#gate').close();
    if ((location.hash || '') === '#settings') rt.setHash?.('home', { replace: true });
  };
  $('#setupForm').onsubmit = finishSetup;
  $('#gateForm').onsubmit = e => {
    e.preventDefault();
    if (!gateOk($('#gateAnswer').value, rt.gateAnswer)) {
      $('#gateError').textContent = 'Try that one again.';
      $('#gateAnswer').focus();
      return;
    }
    rt.grownupOk = true;
    const next = rt.gateNext || openSettings;
    $('#gate').close();
    next();
  };
  $('#editProfile').onchange = async () => {
    if (rt.loadingForm || !rt.cleanSnapshot) return;
    const next = $('#editProfile').value;
    const previous = JSON.parse(rt.cleanSnapshot).profile;
    if (next === previous) return;
    $('#editProfile').value = previous;
    if (formSnapshot() !== rt.cleanSnapshot) {
      const ok = await ask('Discard these changes?', 'Switching learners will drop unsaved edits.', 'Discard');
      if (!ok) return;
    }
    $('#editProfile').value = next;
    loadForm();
  };
  $('#level').onchange = () => {
    document.querySelectorAll('[data-skill]').forEach(el => { el.value = $('#level').value; });
    paintStats();
  };
  $('#stage').onchange = () => { if (!rt.loadingForm) paintStageTopics(); };
  $('#voice').innerHTML = voices.map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('');
  async function hearWith(button, lines) {
    const label = button.textContent;
    const ready = n => { button.textContent = n ? `Getting the voice ready… ${Math.round(n * 100)}%` : 'Getting the voice ready…'; };
    document.querySelectorAll('.voice-preview').forEach(b => { b.disabled = true; });
    ready(0);
    try {
      await prepareSpeech({ onProgress: ready });
      button.textContent = 'Playing…';
      for (const [text, voiceId] of lines()) {
        const { status } = await speakAndWait(text, { voiceId, fallback: 'on-error' });
        if (status !== 'completed') break;
      }
    } finally {
      document.querySelectorAll('.voice-preview').forEach(b => { b.disabled = false; });
      button.textContent = label;
    }
  }
  $('#hearVoice').onclick = () => hearWith($('#hearVoice'), () => [[sampleLine, $('#voice').value]]);
  $('#hearHosts').onclick = () => hearWith($('#hearHosts'), () => Object.entries(profiles).map(([id, role]) => [`${role.label}. ${role.line}`, voiceFor(id, $('#voice').value, $('#characterVoices').checked)]));
  function paintVoiceStatus(s) {
    const el = $('#voiceStatus');
    if (el) el.textContent = voiceStatusText(s);
  }
  onSpeechStatus(paintVoiceStatus);
  function paintSheet() {
    const el = $('#sheetStatus');
    if (!el) return;
    const sheet = rt.data.sheet;
    if (!sheet) { el.textContent = 'Checking the question sheet…'; return; }
    if (sheet.error && !sheet.rows?.length) { el.textContent = sheet.error; return; }
    if (sheet.note === 'columns') { el.textContent = 'The question sheet needs columns named learner, game, item, and extra.'; return; }
    if (sheet.note === 'empty' || !sheet.rows?.length) { el.textContent = 'No question rows yet. The default sheet and the Google Sheet were both empty.'; return; }
    const counts = {};
    for (const row of sheet.rows) counts[row.game] = (counts[row.game] || 0) + 1;
    const summary = Object.entries(counts).map(([game, n]) => `${n} ${game}`).join(', ');
    const replaced = sheet.games?.length ? `The Google Sheet replaced ${sheet.games.join(', ')}. ` : 'Using the default sheet. ';
    const stale = sheet.error ? ` ${sheet.error}` : '';
    el.textContent = `${replaced}${sheet.rows.length} items (${summary}) stay on this device until you reload.${stale}`;
  }
  async function loadSheet() {
    const el = $('#sheetStatus');
    if (el) el.textContent = 'Checking the question sheet…';
    let base = { rows: [], note: 'empty' };
    try {
      const local = await fetch('./sheet.csv?v=levels', { cache: 'no-store' });
      if (local.ok) base = parseSheet(await local.text());
    } catch { /* the default file is missing; the Google Sheet can still supply rows */ }
    let remote = { rows: [], note: 'empty' };
    let error = '';
    try {
      const res = await fetch(SHEET_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      remote = parseSheet(await res.text());
    } catch {
      error = 'The Google Sheet could not be loaded. Games are using the default sheet.';
    }
    const merged = mergeSheets(base, remote);
    let rows = merged.rows;
    try {
      rows = await expandVerseSheetRows(rows);
    } catch {
      error = error || 'A verse reference on the sheet could not be loaded.';
    }
    rt.data.sheet = { at: Date.now(), rows, note: merged.note, games: merged.games, error };
    if (rows.length || !error) rt.save();
    paintSheet();
  }
  $('#reloadSheet').onclick = () => loadSheet();
  function verseSeedNow() {
    const seed = ($('#verseSeed')?.value || '').trim();
    if (seed) return seed;
    const script = $('#verse')?.value || '';
    return needsVerseScriptBuild(script) ? script.trim() : '';
  }

  async function buildVerseFromSeed({ quiet = false } = {}) {
    const status = $('#verseBuildStatus');
    const seed = verseSeedNow();
    if (!seed) {
      if (!quiet && status) status.textContent = 'Paste a reference like John 3:16, or paste the full verse.';
      return null;
    }
    if (status) status.textContent = 'Making the verse games…';
    try {
      const script = await scriptFromSeed(seed, { translation: $('#verseTranslation')?.value || 'web' });
      if (!script || !parseVerseScript(script)) {
        if (status) status.textContent = 'Need a longer verse, or a reference the public Bible can find.';
        return null;
      }
      if ($('#verse')) $('#verse').value = script;
      if ($('#verseSeed') && needsVerseScriptBuild($('#verseSeed').value)) $('#verseSeed').value = '';
      if (status) status.textContent = 'Script ready. Save Parent corner, or copy sheet rows into the Google Sheet.';
      return script;
    } catch (err) {
      if (status) status.textContent = err?.message || 'That reference could not be loaded.';
      return null;
    }
  }
  $('#verseBuild')?.addEventListener('click', () => buildVerseFromSeed());
  $('#verseCopyRows')?.addEventListener('click', async () => {
    const status = $('#verseBuildStatus');
    const script = $('#verse')?.value || '';
    if (!script.trim() || !parseVerseScript(script)) {
      if (status) status.textContent = 'Make a verse script first.';
      return;
    }
    const csv = `learner,game,item,extra\n${verseSheetRows(script, '*')}`;
    try {
      await navigator.clipboard.writeText(csv);
      if (status) status.textContent = 'Sheet rows copied. Paste them under the Google Sheet header.';
    } catch {
      if (status) status.textContent = 'Copy failed. Select the script and copy it by hand.';
    }
  });
  $('#close').onclick = () => closeSettings();
  $('#addLearner').onclick = () => addLearner();
  $('#removeLearner').onclick = () => removeCurrentLearner();
  $('#printOpen').onclick = openPrint;
  $('#resetProgress').onclick = async () => {
    const x = rt.data.profiles[+$('#editProfile').value];
    const ok = await ask('Reset progress?', `Stars and scores for ${x.name} will be cleared. The name, levels, and words stay.`, 'Reset progress');
    if (!ok) return;
    Object.assign(x, resetProgress(x));
    rt.save();
    loadForm();
  };
  $('#confirmForm').onsubmit = e => { e.preventDefault(); settleAsk(!rt.askYesOnCancel); };
  $('#confirmCancel').onclick = () => settleAsk(rt.askYesOnCancel);
  $('#parentForm').onsubmit = async e => {
    e.preventDefault();
    const parsed = readWordField();
    if (!$('#name').value.trim()) {
      $('#error').textContent = 'Add a name.';
      return;
    }
    if (!parsed.ok) {
      $('#error').textContent = 'Add at least 3 different words, or leave the box blank for this grade’s list. Use letters only, with at most one apostrophe, up to 12 letters.';
      return;
    }
    let verseText = $('#verse')?.value || '';
    if (verseSeedNow() && !parseVerseScript(verseText)) {
      const built = await buildVerseFromSeed();
      if (!built) {
        $('#error').textContent = $('#verseBuildStatus')?.textContent || 'Could not make the verse games from that text.';
        return;
      }
      verseText = built;
    }
    if (verseText.trim() && !parseVerseScript(verseText)) {
      $('#error').textContent = 'Memory verse needs a circle, fill, clue, or verse line. Leave the box blank to use the question sheet.';
      return;
    }
    if (![...document.querySelectorAll('[data-race]')].some(el => el.checked)) {
      $('#error').textContent = 'Choose at least one Gas race topic: math facts, sight words, shapes, or colors.';
      return;
    }
    if (![...document.querySelectorAll('[data-rally]')].some(el => el.checked)) {
      $('#error').textContent = 'Choose at least one Backroad rally question: spelling, match, or math facts.';
      return;
    }
    if (rt.roundActive()) {
      const ok = await ask('Leave this round?', 'Saving will end the round in progress. Stars for this round will not be added.', 'Save and leave');
      if (!ok) return;
    }
    applyForm();
    $('#settings').close();
    rt.home();
  };
  $('#creditsOpen').onclick = () => $('#credits').showModal();
  $('#creditsClose').onclick = () => $('#credits').close();
}
