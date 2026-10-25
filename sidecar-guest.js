/* Guest bridge for a sidecar page. Load it from the sprouts origin:
   <script src="/sidecar-guest.js"></script>
   SproutsSidecar.ready(), .progress(label), .finish(detail), or .quit().
   The host posts { type: 'ask', prompt, show, choices }. Once the rally
   stage is actually running, this pauses the drive, shows the question,
   then resumes. A right answer holds the throttle (turbo). A wrong answer
   holds the brake for two seconds. */
(function () {
  var SOURCE = 'sprouts-sidecar';
  var DRIVE_S = 8;
  var TURBO_MS = 1600;
  var SLOW_MS = 2000;
  var DRIVE_KEYS = ['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'Space'];
  function send(type, extra) {
    if (window.parent === window) return;
    var message = { source: SOURCE, type: type };
    if (extra) Object.keys(extra).forEach(function (key) { message[key] = extra[key]; });
    window.parent.postMessage(message, '*');
  }
  window.SproutsSidecar = {
    ready: function () { send('ready'); },
    progress: function (label) { send('progress', { label: label || '' }); },
    finish: function (detail) { send('finish', { detail: detail || '' }); },
    quit: function () { send('quit'); }
  };

  // Every sound the game sends to the speakers passes through one level here, so the spoken
  // question sits well above the game, and the game dips further while a line is being read.
  var GAME_LEVEL = 0.4;
  var DUCK_LEVEL = 0.12;
  var ducked = false;
  var mixes = [];
  function mixFor(destination) {
    var ctx = destination.context;
    if (!ctx.__sproutsMix) {
      var mix = ctx.createGain();
      mix.gain.value = ducked ? DUCK_LEVEL : GAME_LEVEL;
      plainConnect.call(mix, destination);
      ctx.__sproutsMix = mix;
      mixes.push(mix);
    }
    return ctx.__sproutsMix;
  }
  function routed(args) {
    var list = Array.prototype.slice.call(args);
    if (window.AudioDestinationNode && list[0] instanceof AudioDestinationNode) list[0] = mixFor(list[0]);
    return list;
  }
  var plainConnect = window.AudioNode ? AudioNode.prototype.connect : null;
  var plainDisconnect = window.AudioNode ? AudioNode.prototype.disconnect : null;
  if (plainConnect) {
    AudioNode.prototype.connect = function () { return plainConnect.apply(this, routed(arguments)); };
    AudioNode.prototype.disconnect = function () { return plainDisconnect.apply(this, routed(arguments)); };
  }
  function duck(on) {
    ducked = !!on;
    mixes.forEach(function (mix) {
      try { mix.gain.setTargetAtTime(ducked ? DUCK_LEVEL : GAME_LEVEL, mix.context.currentTime, ducked ? 0.05 : 0.3); } catch (e) { /* context closed */ }
    });
  }

  var ask = null;
  var asking = false;
  var quietUntil = 0;
  var stops = 5;
  var goal = 5;
  var gates = [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];
  var gate = 0;
  var rights = 0;
  var cleared = false;
  var finishedSent = false;
  var effectTimer = 0;
  var root = null;
  var real = {};

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  var ownKey = false;
  function key(code, down) {
    ownKey = true;
    try { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, bubbles: true, cancelable: true })); }
    finally { ownKey = false; }
  }
  function rallyPaused() {
    var texts = document.querySelectorAll('.menu-root .text');
    for (var i = 0; i < texts.length; i++) {
      if (texts[i].textContent.trim() === 'resume') return true;
    }
    var hud = document.getElementById('stage-hud');
    return !!(hud && hud.classList.contains('panel-open'));
  }
  function stageProgress() {
    if (rallyPaused()) return null;
    var hud = document.getElementById('stage-hud');
    if (!hud) return null;
    var count = hud.querySelector('.hud-count');
    if (count && count.style.display !== 'none' && count.textContent) return null;
    var card = hud.querySelector('.hud-card');
    if (card && card.style.display !== 'none' && card.textContent) return null;
    var fill = hud.querySelector('.hud-progress .fill');
    if (!fill) return null;
    var d = parseFloat(getComputedStyle(hud).getPropertyValue('--d')) || 1;
    return Math.max(0, Math.min(1, fill.getBoundingClientRect().height / (404 * d)));
  }
  function ensure() {
    if (root) return;
    var style = document.createElement('style');
    style.textContent = [
      'body.sprouts-asking .menu-root{opacity:0 !important;pointer-events:none !important}',
      '#sprouts-ask{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(20,16,12,.45);font-family:Outfit,Inter,sans-serif;color:#244b3d}',
      '#sprouts-ask[hidden]{display:none !important}',
      '#sprouts-ask .card{width:min(720px,92%);background:#faf9f5;border-radius:22px;padding:22px 20px 18px;box-shadow:0 16px 40px #0005}',
      '#sprouts-ask .prompt{margin:0 0 12px;text-align:center;font-size:clamp(22px,3.4vw,34px);font-weight:700;line-height:1.25}',
      '#sprouts-ask .show{display:flex;justify-content:center;gap:8px;margin:0 0 12px;font-size:28px}',
      '#sprouts-ask .show .countrow,#sprouts-ask .show .numpath{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}',
      '#sprouts-ask .show .here{outline:3px solid #db8b32;border-radius:8px}',
      '#sprouts-ask .choices{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}',
      '#sprouts-ask button{min-width:120px;min-height:92px;padding:10px 14px;border:3px solid #d7decc;border-radius:16px;background:#fff;color:#244b3d;font:700 clamp(20px,3vw,30px)/1.1 Outfit,Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer}',
      '#sprouts-ask button.wrong{border-color:#e3ad7b;background:#fff4e9}',
      '#sprouts-ask button.correct{border-color:#32634e;background:#e7f0df}',
      '#sprouts-ask .shape{display:block;width:54px;height:54px;background:var(--shape-color,#5d7a45)}',
      '#sprouts-ask .circle{border-radius:50%}',
      '#sprouts-ask .square{border-radius:5px}',
      '#sprouts-ask .triangle{clip-path:polygon(50% 0,0 100%,100% 100%)}',
      '#sprouts-ask .rectangle{width:72px;height:44px;border-radius:5px}',
      '#sprouts-ask .oval{width:72px;border-radius:50%}',
      '#sprouts-ask .diamond{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}',
      '#sprouts-ask .star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 94%,50% 73%,21% 94%,32% 57%,2% 35%,39% 35%)}',
      '#sprouts-ask .hexagon{clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}',
      '#sprouts-ask .swatch{width:54px;height:54px;border-radius:50%;border:1px solid #0002}',
      '#sprouts-ask .slots{margin:0 0 14px;text-align:center;font:800 32px Outfit,Inter,sans-serif;letter-spacing:.14em}',
      '#sprouts-ask button.hear{min-width:0;width:max-content;min-height:44px;margin:14px auto 0;padding:8px 16px;display:flex;border-width:1px;background:transparent;font-size:16px}',
      '#sprouts-ask button.letter{min-width:64px;min-height:64px}',
      '#sprouts-ask button.wrong{outline:3px solid #b42318}',
      '#sprouts-ask .spell-type{display:flex;flex-direction:column;align-items:center;gap:6px;margin:14px 0 0;font-size:15px;font-weight:700}',
      '#sprouts-ask .spell-key{width:min(220px,80%);height:52px;border:3px solid #d7decc;border-radius:14px;text-align:center;font:700 28px Outfit,Inter,sans-serif;color:#244b3d;background:#fff}',
      '#sprouts-ask .spell-key.wrong{border-color:#b42318;background:#fff4e9}',
      '#sprouts-ask .note{margin:12px 0 0;text-align:center;font-size:15px;font-weight:600}'
    ].join('');
    document.head.appendChild(style);
    root = document.createElement('div');
    root.id = 'sprouts-ask';
    root.hidden = true;
    document.body.appendChild(root);
  }
  function face(choice) {
    if (choice.shape) return '<span class="shape ' + esc(choice.shape) + '" style="--shape-color:' + esc(choice.fill || '#5d7a45') + '"></span><span>' + esc(choice.label) + '</span>';
    if (choice.fill) return '<span class="swatch" style="background:' + esc(choice.fill) + '"></span><span>' + esc(choice.label) + '</span>';
    return '<span>' + esc(choice.label) + '</span>';
  }
  function slots() {
    return ask.word.split('').map(function (_, i) {
      return i < ask.built.length ? ask.built[i] : '_';
    }).join(' ');
  }
  function hearButton() {
    return '<button type="button" class="hear">Hear it again</button>';
  }
  function bindHear() {
    var hear = root.querySelector('button.hear');
    if (hear) hear.onclick = function () { send('replay'); };
  }
  function paintSpell() {
    root.innerHTML = '<div class="card"><p class="prompt">' + esc(ask.prompt || 'Spell the word.') + '</p><p class="slots">' + esc(slots()) + '</p><div class="choices">' + ask.letters.map(function (letter, index) {
      return '<button type="button" class="letter" data-i="' + index + '">' + esc(letter) + '</button>';
    }).join('') + '</div><label class="spell-type">Type the next letter <input class="spell-key" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="Type the next letter"></label>' + hearButton() + '<p class="note">Tap a letter or type it.</p></div>';
    root.querySelectorAll('button.letter').forEach(function (button) {
      button.onclick = function () { spellTap(+button.dataset.i, button); };
    });
    bindHear();
    var field = root.querySelector('.spell-key');
    if (field) {
      field.addEventListener('keydown', function (event) { event.stopPropagation(); });
      field.addEventListener('input', function () { spellType(field.value); });
      field.focus();
    }
  }
  function paint() {
    ensure();
    root.hidden = false;
    if (ask.kind === 'spell' && ask.word && ask.letters.length) {
      paintSpell();
      return;
    }
    root.innerHTML = '<div class="card"><p class="prompt">' + esc(ask.prompt || '') + '</p><div class="show">' + (ask.show || '') + '</div><div class="choices">' + ask.choices.map(function (choice, index) {
      return '<button type="button" data-i="' + index + '">' + face(choice) + '</button>';
    }).join('') + '</div>' + hearButton() + '<p class="note">A right answer turbos the car. A wrong one slows it down.</p></div>';
    root.querySelectorAll('button[data-i]').forEach(function (button) {
      button.onclick = function () { choose(+button.dataset.i, button); };
    });
    bindHear();
  }
  function pauseRally() {
    if (rallyPaused()) return true;
    document.body.classList.add('sprouts-asking');
    key('Escape', true);
    key('Escape', false);
    return rallyPaused();
  }
  function resumeRally() {
    document.body.classList.remove('sprouts-asking');
    var texts = document.querySelectorAll('.menu-root .text');
    for (var i = 0; i < texts.length; i++) {
      if (texts[i].textContent.trim() !== 'resume') continue;
      var row = texts[i].closest('.row');
      if (row) row.click();
      break;
    }
  }
  function releaseDrive() {
    DRIVE_KEYS.forEach(function (code) { key(code, false); });
  }
  function effect(ok) {
    releaseDrive();
    var hold = ok ? 'KeyW' : 'KeyS';
    key(hold, true);
    clearTimeout(effectTimer);
    effectTimer = setTimeout(function () {
      key(hold, false);
      DRIVE_KEYS.forEach(function (code) { if (real[code]) key(code, true); });
    }, ok ? TURBO_MS : SLOW_MS);
  }
  function leaveAsk() {
    asking = false;
    gate++;
    quietUntil = performance.now() + DRIVE_S * 1000;
    if (root) root.hidden = true;
    resumeRally();
  }
  function choose(index, button) {
    if (!asking || !ask || !ask.choices[index]) return;
    root.querySelectorAll('button').forEach(function (el) { el.disabled = true; });
    if (button) button.classList.add('picked');
    send('pick', { index: index });
    leaveAsk();
  }
  function spellType(raw) {
    var chars = String(raw || '').match(/[a-zA-Z']/g) || [];
    var field = root.querySelector('.spell-key');
    for (var n = 0; n < chars.length; n++) {
      if (!asking || !ask || ask.built === ask.word) break;
      var next = ask.word[ask.built.length];
      if (chars[n].toLowerCase() !== String(next).toLowerCase()) {
        if (field) {
          field.classList.add('wrong');
          setTimeout(function () { field.classList.remove('wrong'); }, 280);
        }
        if (!ask.slipped) {
          ask.slipped = true;
          send('slip');
        }
        break;
      }
      var buttons = root.querySelectorAll('button.letter');
      var tapped = false;
      for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        if (button.disabled) continue;
        if (String(ask.letters[+button.dataset.i]).toLowerCase() !== String(next).toLowerCase()) continue;
        spellTap(+button.dataset.i, button);
        tapped = true;
        break;
      }
      if (!tapped) break;
    }
    if (field) field.value = '';
  }
  function spellTap(index, button) {
    if (!asking || !ask || ask.kind !== 'spell' || button.disabled) return;
    var letter = ask.letters[index];
    if (letter !== ask.word[ask.built.length]) {
      button.classList.add('wrong');
      if (!ask.slipped) {
        ask.slipped = true;
        send('slip');
      }
      setTimeout(function () { button.classList.remove('wrong'); }, 280);
      return;
    }
    ask.built += letter;
    button.disabled = true;
    var line = root.querySelector('.slots');
    if (line) line.textContent = slots();
    if (ask.built !== ask.word) return;
    send('pick', { index: 0 });
    leaveAsk();
  }
  function mark(ok) {
    if (ok) rights++;
    if (rights >= goal) cleared = true;
    effect(ok);
  }
  function openAsk() {
    if (cleared || asking || gate >= gates.length || performance.now() < quietUntil || !ask || !ask.choices.length) return;
    if (!pauseRally()) {
      document.body.classList.remove('sprouts-asking');
      return;
    }
    asking = true;
    paint();
    send('show');
  }
  // Phones and tablets: steer, gas, and brake buttons over the road while a stage is running.
  function touchDevice() {
    try { if (window.parent.document.documentElement.classList.contains('touch')) return true; } catch (e) { /* another origin */ }
    return matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  }
  var pad = null;
  var padHeld = {};
  function padKey(code, down) {
    if (!!padHeld[code] === down) return;
    padHeld[code] = down;
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, key: code, bubbles: true, cancelable: true }));
  }
  function buildPad() {
    var style = document.createElement('style');
    style.textContent = [
      '#sprouts-pad{position:fixed;inset:auto 0 0 0;z-index:99999;display:flex;justify-content:space-between;align-items:flex-end;padding:0 max(14px,env(safe-area-inset-right)) calc(16vmin + max(14px,env(safe-area-inset-bottom))) max(14px,env(safe-area-inset-left));pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none}',
      '#sprouts-pad[hidden]{display:none}',
      '#sprouts-pad .side{display:flex;gap:12px}',
      '#sprouts-pad button{pointer-events:auto;touch-action:none;width:clamp(64px,13vmin,96px);height:clamp(64px,13vmin,96px);border-radius:50%;border:2px solid #fff8;background:#0006;color:#fff;font:800 clamp(20px,4.5vmin,30px)/1 Outfit,Inter,sans-serif;-webkit-tap-highlight-color:transparent}',
      '#sprouts-pad button.on{background:#fff7;color:#244b3d}',
      '#sprouts-pad button.gas{background:#32634ecc}',
      '#sprouts-pad button.gas.on{background:#9fd08acc}'
    ].join('');
    document.head.appendChild(style);
    pad = document.createElement('div');
    pad.id = 'sprouts-pad';
    pad.hidden = true;
    pad.innerHTML = '<div class="side"><button type="button" data-code="ArrowLeft" aria-label="Steer left">◀</button><button type="button" data-code="ArrowRight" aria-label="Steer right">▶</button></div>'
      + '<div class="side"><button type="button" data-code="ArrowDown" aria-label="Brake">■</button><button type="button" class="gas" data-code="ArrowUp" aria-label="Gas">GO</button></div>';
    pad.querySelectorAll('button').forEach(function (button) {
      var code = button.dataset.code;
      function down(event) {
        event.preventDefault();
        try { button.setPointerCapture(event.pointerId); } catch (e) { /* the pointer already ended */ }
        button.classList.add('on');
        padKey(code, true);
      }
      function up() {
        button.classList.remove('on');
        padKey(code, false);
      }
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up);
      button.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    });
    document.body.appendChild(pad);
  }
  function showPad(on) {
    if (!pad) {
      if (!on) return;
      buildPad();
    }
    if (pad.hidden === !on) return;
    pad.hidden = !on;
    if (!on) pad.querySelectorAll('button').forEach(function (button) {
      button.classList.remove('on');
      padKey(button.dataset.code, false);
    });
  }
  var touch = touchDevice();

  function frame() {
    requestAnimationFrame(frame);
    if (touch) showPad(!asking && stageProgress() != null);
    if (finishedSent || asking) return;
    var progress = stageProgress();
    if (progress == null) return;
    if (progress >= 0.97) {
      finishedSent = true;
      send('finish', { detail: 'stage' });
      return;
    }
    if (cleared || !ask || performance.now() < quietUntil || gate >= gates.length) return;
    if (progress >= gates[gate]) openAsk();
  }

  window.addEventListener('keydown', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('spell-key')) return;
    if (asking && (event.code === 'Escape' || DRIVE_KEYS.indexOf(event.code) >= 0)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    if (!ownKey) real[event.code] = true;
  }, true);
  window.addEventListener('keyup', function (event) {
    if (!ownKey) real[event.code] = false;
  });
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== SOURCE || event.source !== window.parent) return;
    if (data.type === 'boot') window.dispatchEvent(new CustomEvent('sprouts-sidecar-boot', { detail: data }));
    if (data.type === 'clear') cleared = true;
    if (data.type === 'ask' && data.choices && data.choices.length) {
      if (asking || cleared) return;
      if (Array.isArray(data.gates) && data.gates.length) {
        gates = data.gates.map(Number).filter(function (mark) { return mark > 0 && mark < 1; });
      }
      if (data.stops) {
        stops = Math.max(1, Math.min(8, data.stops | 0));
        goal = Math.min(5, stops);
      }
      if (!gates.length) {
        gates = [];
        for (var i = 1; i <= stops; i++) gates.push(i / (stops + 1));
      }
      var nextPrompt = data.prompt || '';
      ask = {
        prompt: nextPrompt,
        show: data.show || '',
        kind: data.kind || '',
        word: data.word || '',
        letters: Array.isArray(data.letters) ? data.letters.map(function (letter) { return String(letter); }) : [],
        built: '',
        slipped: false,
        choices: data.choices.map(function (choice) {
          return { label: choice.label, fill: choice.fill || '', shape: choice.shape || '' };
        })
      };
    }
    if (data.type === 'mark') mark(!!data.ok);
    if (data.type === 'duck') duck(data.on);
  });
  requestAnimationFrame(frame);
  send('ready');
  setInterval(function () {
    if (!ask && !asking && performance.now() >= quietUntil) send('need');
  }, 1000);
})();
