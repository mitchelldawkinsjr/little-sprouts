/**
 * Quick Math — vanilla port of Math Facts Shorts missions.
 * Hub → 3-minute timed round → results. Best scores in localStorage.
 */
(function () {
  const ROUND_SECONDS = 180;
  const STORAGE_KEY = 'math-shorts-best-scores';
  const LEVEL_COLORS = ['#315ee8', '#e4775d', '#319674', '#a15ab4', '#bf8a1c', '#345e9d', '#dd664e'];

  const LEVELS = [
    { id: 1, title: 'Multiplication by 2, 5 & 10', shortTitle: 'Double Dash', description: 'Start your streak with friendly facts.', skill: '2s · 5s · 10s' },
    { id: 2, title: 'Multiplication by 3 & 4', shortTitle: 'Triple Trouble', description: 'Build your multiplication power.', skill: '3s · 4s' },
    { id: 3, title: 'Multiplication by 6, 7 & 8', shortTitle: 'Power-Up Patrol', description: 'Take on bigger facts, one at a time.', skill: '6s · 7s · 8s' },
    { id: 4, title: 'Multiplication by 9, 11 & 12', shortTitle: 'Mega Multiplier', description: 'Put your strongest facts to the test.', skill: '9s · 11s · 12s' },
    { id: 5, title: 'Division Using Multiplication Facts', shortTitle: 'Division Defender', description: 'Use what you know to find the missing factor.', skill: 'Division facts' },
    { id: 6, title: 'Mixed Multiplication & Division', shortTitle: 'Mixed-Up Mission', description: 'Switch operations and stay sharp.', skill: 'Multiply · Divide' },
    { id: 7, title: 'Superhero Word-Problem Battles', shortTitle: 'Hero Story Showdown', description: 'Read the mission, solve the problem, save the day.', skill: 'Word problems' }
  ];

  const TABLES_BY_LEVEL = {
    1: [2, 5, 10],
    2: [3, 4],
    3: [6, 7, 8],
    4: [9, 11, 12]
  };

  const WORD_PROBLEMS = [
    { before: 'A hero packs', after: 'rescue bags with', ending: 'snack bars in each bag. How many snack bars altogether?', operation: 'multiply' },
    { before: 'A team has', after: 'energy shields to share equally among', ending: 'heroes. How many shields does each hero get?', operation: 'divide' },
    { before: 'A hero places', after: 'gadgets in each of', ending: 'tool boxes. How many gadgets are packed?', operation: 'multiply' },
    { before: 'A rescue crew has', after: 'water bottles and puts', ending: 'in each supply kit. How many full kits can they make?', operation: 'divide' },
    { before: 'A robot helper makes', after: 'stacks of', ending: 'power cards. How many cards are there in all?', operation: 'multiply' },
    { before: 'There are', after: 'rescue stickers shared equally by', ending: 'young heroes. How many stickers does each hero get?', operation: 'divide' }
  ];

  const state = {
    phase: 'ready',
    levelId: null,
    question: null,
    timeLeft: ROUND_SECONDS,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answeredCount: 0,
    feedback: null,
    bestScores: readBestScores(),
    selectedChoice: null,
    deadline: null,
    answerTimer: 0,
    tickTimer: 0,
    answered: false
  };

  const root = document.getElementById('app');

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(items) {
    const next = items.slice();
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
    }
    return next;
  }

  function makeChoices(answer) {
    const choices = new Set([answer]);
    const offsets = shuffle([-12, -8, -5, -3, -2, -1, 1, 2, 3, 5, 8, 12]);
    for (const offset of offsets) {
      const distractor = answer + offset;
      if (distractor >= 0 && distractor !== answer) choices.add(distractor);
      if (choices.size === 4) break;
    }
    let fallback = 1;
    while (choices.size < 4) {
      const candidate = answer + fallback;
      if (candidate >= 0 && candidate !== answer) choices.add(candidate);
      fallback += 1;
    }
    return shuffle(Array.from(choices));
  }

  function buildQuestion(prompt, equation, answer) {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      prompt,
      equation,
      answer,
      choices: makeChoices(answer)
    };
  }

  function multiplicationQuestion(factors) {
    const table = factors[randomInt(0, factors.length - 1)];
    const other = randomInt(0, 12);
    const leftFirst = Math.random() < 0.5;
    const left = leftFirst ? table : other;
    const right = leftFirst ? other : table;
    const equation = `${left} × ${right}`;
    return buildQuestion(`${equation} = ?`, equation, left * right);
  }

  function divisionQuestion() {
    const divisor = randomInt(2, 12);
    const quotient = randomInt(0, 12);
    const dividend = divisor * quotient;
    const equation = `${dividend} ÷ ${divisor}`;
    return buildQuestion(`${equation} = ?`, equation, quotient);
  }

  function wordProblemQuestion() {
    const story = WORD_PROBLEMS[randomInt(0, WORD_PROBLEMS.length - 1)];
    const first = randomInt(2, 12);
    const second = randomInt(2, 12);
    if (story.operation === 'divide') {
      const total = first * second;
      const equation = `${total} ÷ ${second}`;
      return buildQuestion(`${story.before} ${total} ${story.after} ${second} ${story.ending}`, equation, first);
    }
    const equation = `${first} × ${second}`;
    return buildQuestion(`${story.before} ${first} ${story.after} ${second} ${story.ending}`, equation, first * second);
  }

  function createQuestion(levelId) {
    if (levelId === 5) return divisionQuestion();
    if (levelId === 6) {
      return Math.random() < 0.5
        ? multiplicationQuestion([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        : divisionQuestion();
    }
    if (levelId === 7) return wordProblemQuestion();
    return multiplicationQuestion(TABLES_BY_LEVEL[levelId]);
  }

  function emptyScores() {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  }

  function readBestScores() {
    const empty = emptyScores();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return empty;
      const parsed = JSON.parse(saved);
      for (const level of LEVELS) {
        const value = parsed[level.id];
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
          empty[level.id] = Math.floor(value);
        }
      }
    } catch {
      return empty;
    }
    return empty;
  }

  function saveBestScores(scores) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {
      /* keep session scores */
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch]);
  }

  function clearTimers() {
    if (state.answerTimer) {
      window.clearTimeout(state.answerTimer);
      state.answerTimer = 0;
    }
    if (state.tickTimer) {
      window.clearInterval(state.tickTimer);
      state.tickTimer = 0;
    }
  }

  function endRound() {
    if (state.phase !== 'playing') return;
    clearTimers();
    state.phase = 'finished';
    state.feedback = null;
    state.answered = false;
    state.selectedChoice = null;
    render();
  }

  function startRound(levelId) {
    clearTimers();
    state.levelId = levelId;
    state.question = createQuestion(levelId);
    state.timeLeft = ROUND_SECONDS;
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.answeredCount = 0;
    state.feedback = null;
    state.selectedChoice = null;
    state.answered = false;
    state.deadline = Date.now() + ROUND_SECONDS * 1000;
    state.phase = 'playing';
    state.tickTimer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
      state.timeLeft = remaining;
      paintTimer();
      if (remaining === 0) endRound();
    }, 200);
    render();
  }

  function submitAnswer(answer) {
    if (state.phase !== 'playing' || !state.question || !state.levelId || state.answered) return;
    state.answered = true;
    state.answeredCount += 1;
    state.selectedChoice = answer;
    const correct = answer === state.question.answer;
    state.feedback = { correct, correctAnswer: state.question.answer };
    if (correct) {
      state.score += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      if (state.score > state.bestScores[state.levelId]) {
        state.bestScores = { ...state.bestScores, [state.levelId]: state.score };
        saveBestScores(state.bestScores);
      }
    } else {
      state.streak = 0;
    }
    paintRoundLive();
    state.answerTimer = window.setTimeout(() => {
      state.answerTimer = 0;
      if (state.phase !== 'playing' || state.levelId == null) return;
      state.question = createQuestion(state.levelId);
      state.feedback = null;
      state.selectedChoice = null;
      state.answered = false;
      paintRoundQuestion();
    }, 720);
  }

  function reset() {
    clearTimers();
    state.phase = 'ready';
    state.levelId = null;
    state.question = null;
    state.timeLeft = ROUND_SECONDS;
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.answeredCount = 0;
    state.feedback = null;
    state.selectedChoice = null;
    state.deadline = null;
    state.answered = false;
    render();
  }

  function levelById(id) {
    return LEVELS.find(level => level.id === id);
  }

  function paintTimer() {
    const timeEl = root.querySelector('[data-time]');
    const fill = root.querySelector('[data-timer-fill]');
    const track = root.querySelector('[data-timer-track]');
    if (timeEl) timeEl.textContent = formatTime(state.timeLeft);
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, (state.timeLeft / ROUND_SECONDS) * 100))}%`;
    if (track) {
      track.setAttribute('aria-valuenow', String(state.timeLeft));
    }
  }

  function paintRoundLive() {
    const scoreEl = root.querySelector('[data-score]');
    const streakEl = root.querySelector('[data-streak]');
    if (scoreEl) scoreEl.textContent = String(state.score);
    if (streakEl) streakEl.textContent = String(state.streak);
    paintRoundQuestion();
  }

  function paintRoundQuestion() {
    const panel = root.querySelector('[data-question-panel]');
    if (!panel || !state.question) return;
    const q = state.question;
    const feedback = state.feedback;
    const showEquation = q.equation !== q.prompt;
    panel.innerHTML = `
      <div class="question-meta"><span></span> QUICK CHALLENGE <span></span></div>
      <h1 class="question-prompt" id="question-prompt">${esc(q.prompt)}</h1>
      ${showEquation ? `<div class="equation">${esc(q.equation)}</div>` : '<div class="equation spacer"></div>'}
      <div class="choice-grid" role="group" aria-label="Answer choices">
        ${q.choices.map((choice, index) => {
          const isCorrect = feedback && choice === feedback.correctAnswer;
          const isWrong = feedback && !feedback.correct && choice === state.selectedChoice;
          const className = `choice-button${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`;
          return `<button class="${className}" type="button" data-choice="${choice}" ${feedback ? 'disabled' : ''} aria-label="Answer ${choice}">${choice}</button>`;
        }).join('')}
      </div>
      <div class="feedback-line${feedback ? (feedback.correct ? ' good' : ' retry') : ''}" aria-live="polite">
        ${feedback?.correct ? 'That’s right! Keep that power streak going.' : ''}
        ${feedback && !feedback.correct ? `Not quite—and that’s okay. The answer is ${feedback.correctAnswer}.` : ''}
      </div>
      ${!feedback ? '<p class="play-hint">Choose the answer that feels right. You’ve got this.</p>' : ''}
    `;
    panel.querySelectorAll('[data-choice]').forEach(button => {
      button.addEventListener('click', () => submitAnswer(Number(button.dataset.choice)));
    });
  }

  function renderHub() {
    return `
      <div class="game-shell">
        <div class="page-wrap">
          <header class="topbar">
            <button class="brand" type="button" data-home aria-label="Quick Math home">
              <span class="brand-mark" aria-hidden="true">⚡</span>
              <span class="brand-name">QUICK MATH<small>MISSIONS</small></span>
            </button>
            <div class="top-note">Small rounds. Big brain power.</div>
          </header>
        </div>
        <main class="page-wrap hub-main">
          <section class="hub-intro animate-rise">
            <div>
              <div class="eyebrow">Your next great math moment</div>
              <h1 class="hub-title">Ready, set,<br><em>super solve.</em></h1>
              <p class="hub-subtitle">Pick a mission. Play for three minutes. Every answer makes your math hero stronger.</p>
            </div>
            <div class="hero-burst" aria-hidden="true">
              <div class="hero-orbit"><div class="hero-crest">⚡</div></div>
            </div>
          </section>
          <section aria-labelledby="missions-heading">
            <div class="section-heading">
              <div>
                <h2 id="missions-heading">Choose your mission</h2>
                <p>Seven ways to build your math superpowers.</p>
              </div>
              <span class="eyebrow missions-count">7 missions</span>
            </div>
            <div class="level-grid">
              ${LEVELS.map((level, index) => `
                <button class="level-card animate-rise" type="button" style="--level-accent:${LEVEL_COLORS[index]}" data-level="${level.id}" aria-label="Start level ${level.id}: ${esc(level.title)}">
                  <span class="level-number" aria-hidden="true">${String(level.id).padStart(2, '0')}</span>
                  <span class="level-copy">
                    <span class="level-title">${esc(level.shortTitle)}</span>
                    <span class="level-desc">${esc(level.title)}</span>
                  </span>
                  <span class="level-trail">
                    <span class="level-skill">${esc(level.skill)}</span>
                    <span class="best-score">Best ${state.bestScores[level.id]}</span>
                  </span>
                </button>
              `).join('')}
            </div>
          </section>
          <footer class="hub-footer">
            <span class="footer-tip">Stuck? Take a breath and try your best.</span>
            <span>One question at a time.</span>
          </footer>
        </main>
      </div>
    `;
  }

  function renderRound(level) {
    return `
      <div class="game-shell">
        <div class="page-wrap">
          <header class="topbar">
            <button class="brand" type="button" data-home aria-label="Quick Math home">
              <span class="brand-mark" aria-hidden="true">⚡</span>
              <span class="brand-name">QUICK MATH<small>MISSIONS</small></span>
            </button>
            <div class="top-note">Small rounds. Big brain power.</div>
          </header>
        </div>
        <main class="play-wrap">
          <div class="play-top">
            <button type="button" class="back-button" data-home>← Missions</button>
            <div class="round-title">
              <span class="round-kicker">Current mission</span>
              <strong>${esc(level.shortTitle)}</strong>
            </div>
            <button type="button" class="quiet-button" data-finish>Finish</button>
          </div>
          <section class="round-stats" aria-label="Round stats">
            <div class="stat-box timer">
              <span class="stat-icon" aria-hidden="true">⏱</span>
              <span><span class="stat-label">Time left</span><span class="stat-value" data-time>${formatTime(state.timeLeft)}</span></span>
            </div>
            <div class="stat-box">
              <span class="stat-icon" aria-hidden="true">◎</span>
              <span><span class="stat-label">Score</span><span class="stat-value" data-score>${state.score}</span></span>
            </div>
            <div class="stat-box streak">
              <span class="stat-icon" aria-hidden="true">🔥</span>
              <span><span class="stat-label">Streak</span><span class="stat-value" data-streak>${state.streak}</span></span>
            </div>
          </section>
          <div class="timer-track" role="progressbar" aria-label="Time remaining" aria-valuemin="0" aria-valuemax="180" aria-valuenow="${state.timeLeft}" data-timer-track>
            <div class="timer-fill" data-timer-fill style="width:${Math.max(0, Math.min(100, (state.timeLeft / ROUND_SECONDS) * 100))}%"></div>
          </div>
          <section class="question-panel animate-rise" data-question-panel aria-labelledby="question-prompt"></section>
          <div class="hub-footer play-foot">
            <span class="footer-tip">Best score this mission: ${state.bestScores[level.id]}</span>
            <span>Every try counts.</span>
          </div>
        </main>
      </div>
    `;
  }

  function renderResults(level) {
    const total = state.answeredCount;
    const percentage = total > 0 ? Math.round((state.score / total) * 100) : 0;
    const message = state.score > 0
      ? 'That was a powerful round. Look how much you did!'
      : 'You showed up and gave it a go. That is how heroes grow.';
    return `
      <div class="game-shell">
        <div class="page-wrap">
          <header class="topbar">
            <button class="brand" type="button" data-home aria-label="Quick Math home">
              <span class="brand-mark" aria-hidden="true">⚡</span>
              <span class="brand-name">QUICK MATH<small>MISSIONS</small></span>
            </button>
            <div class="top-note">Small rounds. Big brain power.</div>
          </header>
        </div>
        <main class="result-wrap">
          <section class="result-card animate-rise" aria-labelledby="result-heading">
            <div class="result-badge" aria-hidden="true">★</div>
            <div class="result-eyebrow">Mission complete · ${esc(level.shortTitle)}</div>
            <h1 class="result-title" id="result-heading">Hero work!</h1>
            <p class="result-copy">${esc(message)}</p>
            <div class="result-score">
              <strong>${state.score}</strong>
              <span>correct answers</span>
            </div>
            <div class="result-stats">
              <div class="result-stat"><span>Questions tried</span><strong>${total}</strong></div>
              <div class="result-stat"><span>Best streak</span><strong>${state.bestStreak}</strong></div>
            </div>
            <p class="result-copy result-accuracy">${percentage}% correct this round · Your best score is ${state.bestScores[level.id]}.</p>
            <div class="result-actions">
              <button class="primary-action" type="button" data-again>Play this mission again</button>
              <button class="secondary-action" type="button" data-home>Choose another mission →</button>
            </div>
          </section>
        </main>
      </div>
    `;
  }

  function bind() {
    root.querySelectorAll('[data-home]').forEach(el => {
      el.addEventListener('click', () => reset());
    });
    root.querySelectorAll('[data-level]').forEach(el => {
      el.addEventListener('click', () => startRound(Number(el.dataset.level)));
    });
    const finish = root.querySelector('[data-finish]');
    if (finish) finish.addEventListener('click', () => endRound());
    const again = root.querySelector('[data-again]');
    if (again && state.levelId != null) {
      again.addEventListener('click', () => startRound(state.levelId));
    }
  }

  function render() {
    const level = state.levelId != null ? levelById(state.levelId) : null;
    if (state.phase === 'ready') root.innerHTML = renderHub();
    else if (state.phase === 'playing' && level) {
      root.innerHTML = renderRound(level);
      paintRoundQuestion();
    } else if (state.phase === 'finished' && level) root.innerHTML = renderResults(level);
    else root.innerHTML = renderHub();
    bind();
  }

  window.addEventListener('beforeunload', clearTimers);
  render();
  if (window.SproutsSidecar) window.SproutsSidecar.ready();
})();
