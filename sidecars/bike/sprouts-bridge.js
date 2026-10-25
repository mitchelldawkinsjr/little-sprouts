/* Little Sprouts questions over the Dirt Bike Rampage engine. */
(function () {
  var SOURCE = 'sprouts-sidecar';
  var askEl = document.getElementById('ask');
  var bike = window.DirtRampage;
  var asking = false;
  var question = null;
  var needing = false;
  var armed = false;
  var arcade = false;

  function send(type, extra) {
    if (window.parent === window) return;
    var message = { source: SOURCE, type: type };
    if (extra) Object.keys(extra).forEach(function (key) { message[key] = extra[key]; });
    window.parent.postMessage(message, '*');
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function face(choice) {
    if (choice.shape) return '<span class="shape ' + esc(choice.shape) + '" style="--shape-color:' + esc(choice.fill || '#5d7a45') + '"></span><span>' + esc(choice.label) + '</span>';
    if (choice.fill) return '<span class="swatch" style="background:' + esc(choice.fill) + '"></span><span>' + esc(choice.label) + '</span>';
    return '<span>' + esc(choice.label) + '</span>';
  }
  function slots() {
    return question.word.split('').map(function (_, i) {
      return i < question.built.length ? question.built[i] : '_';
    }).join(' ');
  }
  function paintSpell() {
    askEl.innerHTML = '<div class="card"><p class="prompt">' + esc(question.prompt || 'Spell the word.') + '</p><p class="slots">' + esc(slots()) + '</p><div class="choices">' + question.letters.map(function (letter, index) {
      return '<button type="button" class="letter" data-i="' + index + '">' + esc(letter) + '</button>';
    }).join('') + '</div><label class="spell-type">Type the next letter <input class="spell-key" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" aria-label="Type the next letter"></label><p class="note">Tap a letter or type it.</p></div>';
    askEl.querySelectorAll('button').forEach(function (button) {
      button.onclick = function () { spellTap(+button.dataset.i, button); };
    });
    var field = askEl.querySelector('.spell-key');
    if (field) {
      field.addEventListener('keydown', function (event) { event.stopPropagation(); });
      field.addEventListener('input', function () { spellType(field.value); });
      field.focus();
    }
  }
  function paintAsk() {
    askEl.hidden = false;
    if (question.kind === 'spell' && question.word && question.letters.length) {
      paintSpell();
      return;
    }
    askEl.innerHTML = '<div class="card"><p class="prompt">' + esc(question.prompt || '') + '</p><div class="show">' + (question.show || '') + '</div><div class="choices">' + question.choices.map(function (choice, index) {
      return '<button type="button" data-i="' + index + '">' + face(choice) + '</button>';
    }).join('') + '</div><p class="note">A right answer says good and the ride continues. A wrong one speeds the bike up.</p></div>';
    askEl.querySelectorAll('button').forEach(function (button) {
      button.onclick = function () { choose(+button.dataset.i); };
    });
  }
  function closeAsk() {
    asking = false;
    askEl.hidden = true;
    bike.resume();
  }
  function choose(index) {
    if (!asking || !question || !question.choices[index]) return;
    askEl.querySelectorAll('button').forEach(function (button) { button.disabled = true; });
    send('pick', { index: index });
    closeAsk();
  }
  function spellType(raw) {
    var chars = String(raw || '').match(/[a-zA-Z']/g) || [];
    var field = askEl.querySelector('.spell-key');
    for (var n = 0; n < chars.length; n++) {
      if (!asking || !question || question.built === question.word) break;
      var next = question.word[question.built.length];
      if (chars[n].toLowerCase() !== String(next).toLowerCase()) {
        if (field) {
          field.classList.add('wrong');
          setTimeout(function () { field.classList.remove('wrong'); }, 280);
        }
        if (!question.slipped) {
          question.slipped = true;
          send('slip');
        }
        break;
      }
      var buttons = askEl.querySelectorAll('button.letter');
      var tapped = false;
      for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        if (button.disabled) continue;
        if (String(question.letters[+button.dataset.i]).toLowerCase() !== String(next).toLowerCase()) continue;
        spellTap(+button.dataset.i, button);
        tapped = true;
        break;
      }
      if (!tapped) break;
    }
    if (field) field.value = '';
  }
  function spellTap(index, button) {
    if (!asking || !question || question.kind !== 'spell' || button.disabled) return;
    var letter = question.letters[index];
    if (letter !== question.word[question.built.length]) {
      button.classList.add('wrong');
      if (!question.slipped) {
        question.slipped = true;
        send('slip');
      }
      setTimeout(function () { button.classList.remove('wrong'); }, 280);
      return;
    }
    question.built += letter;
    button.disabled = true;
    var line = askEl.querySelector('.slots');
    if (line) line.textContent = slots();
    if (question.built !== question.word) return;
    send('pick', { index: 0 });
    closeAsk();
  }
  function openAsk() {
    if (asking || !question || !question.choices.length) return;
    if (question.kind === 'spell') {
      question.built = '';
      question.slipped = false;
    }
    asking = true;
    bike.pause();
    paintAsk();
    send('show');
    send('progress', { label: 'Riding', travel: Math.round(bike.getProgress().travel) });
  }
  function remember(data) {
    bike.setDifficulty({ level: data.level, reduced: !!data.reduced });
    question = {
      prompt: data.prompt || '',
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
    needing = false;
    if (!armed) {
      armed = true;
      bike.arm();
    }
  }
  function applyConfig(data) {
    if (data.difficulty) bike.setDifficulty(data.difficulty);
    if (data.reward) bike.setReward(data.reward);
    if (data.progress) bike.setProgress(data.progress);
    if (typeof data.audio === 'boolean') bike.setAudio(data.audio);
    if (data.arcade) {
      arcade = true;
      if (asking) closeAsk();
      if (!armed) armed = true;
      bike.arm();
    }
  }
  bike.onQuestion(function () {
    if (arcade) {
      bike.arm();
      return;
    }
    if (asking) return;
    if (!question || !question.choices.length) {
      if (!needing) {
        needing = true;
        send('need');
      }
      return;
    }
    needing = false;
    openAsk();
  });
  setInterval(function () {
    if (asking) return;
    send('progress', { label: 'Riding', travel: Math.round(bike.getProgress().travel) });
  }, 4000);
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== SOURCE || event.source !== window.parent) return;
    if (data.type === 'config') applyConfig(data);
    if (data.type === 'ask' && data.choices && data.choices.length) {
      if (asking) return;
      var waiting = needing;
      remember(data);
      if (waiting) openAsk();
    }
    if (data.type === 'mark') bike.grant(!!data.ok);
    if (data.type === 'duck') bike.setDuck(!!data.on);
  });
  window.addEventListener('keydown', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('spell-key')) event.stopPropagation();
  }, true);
  send('ready');
})();
