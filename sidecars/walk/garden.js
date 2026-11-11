/* Garden walk. The meadow, the sprout, and the questions are drawn here
   on one plain canvas. */
(function () {
  var SOURCE = 'sprouts-sidecar';
  var WORLD_W = 960;
  var WORLD_H = 540;
  var BUDDY_W = 96;
  var SIGN_W = 150;
  var SIGN_H = 190;
  var ART = {
    meadow: 'art/meadow.png',
    standRight: 'art/sprout-stand-right.png',
    standLeft: 'art/sprout-stand-left.png',
    walkRight: 'art/sprout-walk-right.png',
    walkLeft: 'art/sprout-walk-left.png'
  };
  var FRAMES = { walkRight: 4, walkLeft: 4 };
  var FRAME_DELAY = 5;
  var BUDDY_H = 128;
  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');
  var art = {};
  var motions = [];
  var buddy;
  var frame = 0;
  var ticks = 0;
  var signs = [];
  var pose = '';
  var held = { left: false, right: false };
  var busy = false;
  var settled = false;
  var booted = false;
  var question = null;
  var strolling = false;
  var level = 1;
  var reduced = false;
  var speed = 3;

  function send(type, extra) {
    if (window.parent === window) return;
    var message = { source: SOURCE, type: type };
    if (extra) Object.keys(extra).forEach(function (key) { message[key] = extra[key]; });
    window.parent.postMessage(message, '*');
  }
  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }
  function face(name) {
    if (!buddy || pose === name) return;
    if (reduced && name.indexOf('walk') === 0) name = name.indexOf('Left') > 0 ? 'standLeft' : 'standRight';
    if (pose === name) return;
    pose = name;
    frame = 0;
    ticks = 0;
  }
  var EASE = {
    easeIn: function (t) { return t * t; },
    easeOut: function (t) { return t * (2 - t); },
    easeInOut: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  };
  function addMotion(m) {
    m.start = performance.now();
    m.from = { x: m.object.x, y: m.object.y };
    motions.push(m);
  }
  function stopMotion(object) {
    motions = motions.filter(function (m) { return m.object !== object; });
  }
  function stepMotions(now) {
    var finished = [];
    motions.slice().forEach(function (m) {
      var t = Math.min(1, (now - m.start) / m.duration);
      if (m.shake) m.object.shake = t < 1 ? Math.sin(t * Math.PI * 2 * m.amount) * m.amplitude * (1 - t) : 0;
      else {
        var e = (EASE[m.easing] || function (n) { return n; })(t);
        m.object.x = m.from.x + m.x * e;
        m.object.y = m.from.y + m.y * e;
      }
      if (t >= 1) finished.push(m);
    });
    motions = motions.filter(function (m) { return finished.indexOf(m) < 0; });
    finished.forEach(function (m) { if (m.callback) m.callback(); });
  }
  function overlaps(view) {
    var center = buddy.x + BUDDY_W / 2;
    return center > view.x + 28 && center < view.x + view.width - 28;
  }
  function hit(view, pos) {
    return pos.x >= view.x && pos.y >= view.y && pos.x <= view.x + view.width && pos.y <= view.y + view.height;
  }
  function clearSigns() {
    signs.forEach(function (sign) { stopMotion(sign.view); });
    signs = [];
  }
  function moving() {
    return held.left !== held.right;
  }
  function miss(sign) {
    if (sign.skip || settled) return;
    sign.skip = true;
    busy = true;
    send('slip');
    var away = buddy.x + BUDDY_W / 2 < sign.view.x + sign.view.width / 2 ? -56 : 56;
    face(away < 0 ? 'standLeft' : 'standRight');
    addMotion({ object: sign.view, shake: true, amount: 2, duration: reduced ? 180 : 340, amplitude: reduced ? 4 : 12 });
    stopMotion(buddy);
    addMotion({
      object: buddy,
      x: away,
      y: 0,
      duration: reduced ? 140 : 260,
      easing: 'easeOut',
      callback: function () {
        buddy.x = clamp(buddy.x, 8, WORLD_W - BUDDY_W - 8);
        busy = false;
      }
    });
  }
  function win() {
    if (settled || !question) return;
    var index = -1;
    signs.forEach(function (sign) { if (sign.ok) index = sign.index; });
    if (index < 0) return;
    settled = true;
    busy = true;
    face(pose.indexOf('Left') > 0 ? 'standLeft' : 'standRight');
    send('pick', { index: index });
    if (reduced) return;
    var ground = buddy.y;
    addMotion({
      object: buddy,
      x: 0,
      y: -22,
      duration: 160,
      easing: 'easeOut',
      callback: function () {
        addMotion({
          object: buddy,
          x: 0,
          y: 22,
          duration: 200,
          easing: 'easeIn',
          callback: function () { buddy.y = ground; }
        });
      }
    });
  }
  function choose(sign) {
    if (sign.ok) win();
    else miss(sign);
  }
  function checkHits() {
    if (busy || settled || moving()) return;
    for (var i = 0; i < signs.length; i++) {
      var sign = signs[i];
      if (!overlaps(sign.view)) {
        sign.skip = false;
        continue;
      }
      if (sign.skip) continue;
      choose(sign);
      return;
    }
  }
  function walkTo(sign) {
    if (busy || settled || !buddy) return;
    var target = sign.view.x + sign.view.width / 2 - BUDDY_W / 2;
    var dx = target - buddy.x;
    if (Math.abs(dx) < 10) {
      if (sign.ok) win();
      else miss(sign);
      return;
    }
    busy = true;
    face(dx < 0 ? 'walkLeft' : 'walkRight');
    stopMotion(buddy);
    addMotion({
      object: buddy,
      x: dx,
      y: 0,
      duration: reduced ? 200 : Math.max(360, Math.min(1500, Math.abs(dx) * (level >= 3 ? 2.1 : 3.2))),
      easing: 'easeInOut',
      callback: function () {
        face(dx < 0 ? 'standLeft' : 'standRight');
        busy = false;
        choose(sign);
      }
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawShape(ctx, shape, fill) {
    ctx.save();
    ctx.translate(75, 78);
    ctx.fillStyle = fill || '#5d7a45';
    ctx.beginPath();
    var s = 28;
    if (shape === 'circle' || shape === 'oval') ctx.ellipse(0, 0, shape === 'oval' ? 36 : s, shape === 'oval' ? 22 : s, 0, 0, Math.PI * 2);
    else if (shape === 'triangle') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s, s * 0.85);
      ctx.lineTo(-s, s * 0.85);
      ctx.closePath();
    } else if (shape === 'diamond') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
    } else if (shape === 'star') {
      for (var i = 0; i < 10; i++) {
        var radius = i % 2 ? s * 0.42 : s;
        var a = -Math.PI / 2 + i * Math.PI / 5;
        var px = Math.cos(a) * radius;
        var py = Math.sin(a) * radius;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
    } else if (shape === 'hexagon') {
      for (var n = 0; n < 6; n++) {
        var ang = Math.PI / 6 + n * Math.PI / 3;
        var hx = Math.cos(ang) * s;
        var hy = Math.sin(ang) * s;
        if (n) ctx.lineTo(hx, hy);
        else ctx.moveTo(hx, hy);
      }
      ctx.closePath();
    } else if (shape === 'rectangle') ctx.rect(-36, -20, 72, 40);
    else ctx.rect(-s, -s, s * 2, s * 2);
    ctx.fill();
    ctx.restore();
  }
  function paintSign(choice) {
    var canvas = document.createElement('canvas');
    canvas.width = SIGN_W;
    canvas.height = SIGN_H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8a5a32';
    ctx.fillRect(68, 108, 14, 74);
    roundRect(ctx, 8, 12, 134, 112, 16);
    ctx.fillStyle = '#f7f1e4';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d7c7a4';
    ctx.stroke();
    if (choice.shape) drawShape(ctx, choice.shape, choice.fill);
    else if (choice.fill) {
      ctx.beginPath();
      ctx.fillStyle = choice.fill;
      ctx.arc(75, 62, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#244b3d';
      ctx.font = '700 16px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(choice.label, 75, 100);
    } else {
      var size = 34;
      ctx.fillStyle = '#244b3d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 ' + size + 'px Trebuchet MS, sans-serif';
      while (size > 14 && ctx.measureText(choice.label).width > 112) {
        size -= 1;
        ctx.font = '700 ' + size + 'px Trebuchet MS, sans-serif';
      }
      ctx.fillText(choice.label, 75, 68);
    }
    return canvas;
  }
  function place(data) {
    clearSigns();
    settled = false;
    busy = false;
    question = data;
    level = Math.max(1, Math.min(3, data.level | 0 || 1));
    reduced = !!data.reduced;
    speed = reduced ? 1.7 : level >= 3 ? 4.6 : level === 2 ? 3.6 : 2.6;
    document.getElementById('prompt').textContent = data.prompt || 'Walk to the picture that matches.';
    document.getElementById('show').innerHTML = data.show || '';
    if (buddy) {
      stopMotion(buddy);
      buddy.x = 18;
      buddy.y = 392;
      face('standRight');
      pose = 'standRight';
    }
    var choices = data.choices;
    var x0 = 200;
    var x1 = WORLD_W - 20 - SIGN_W;
    choices.forEach(function (choice, index) {
      signs.push({
        view: {
          img: paintSign(choice),
          x: choices.length === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * index / (choices.length - 1),
          y: 318,
          width: SIGN_W,
          height: SIGN_H,
          shake: 0
        },
        ok: !!choice.ok,
        index: index,
        skip: false
      });
    });
    if (choices.length) send('show');
  }
  function update() {
    if (!booted || busy || settled || !buddy) return;
    try {
      if (window.parent !== window && window.parent.document.body.classList.contains('listen-first')) return;
    } catch (e) { /* another origin */ }
    var dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (!dir) {
      if (pose.indexOf('walk') === 0) face(pose.indexOf('Left') > 0 ? 'standLeft' : 'standRight');
      checkHits();
      return;
    }
    face(dir < 0 ? 'walkLeft' : 'walkRight');
    buddy.x = clamp(buddy.x + dir * speed, 8, WORLD_W - BUDDY_W - 8);
  }
  function draw() {
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    ctx.drawImage(art.meadow, 0, 0);
    ctx.drawImage(art[pose], frame * BUDDY_W, 0, BUDDY_W, BUDDY_H, buddy.x, buddy.y, BUDDY_W, BUDDY_H);
    signs.forEach(function (sign) {
      ctx.drawImage(sign.view.img, sign.view.x + sign.view.shake, sign.view.y);
    });
  }
  function loop(now) {
    stepMotions(now);
    if (FRAMES[pose] && ++ticks >= FRAME_DELAY) {
      ticks = 0;
      frame = (frame + 1) % FRAMES[pose];
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }
  function boot() {
    buddy = { x: 18, y: 392 };
    face('standRight');
    booted = true;
    if (question) place(question);
    canvas.addEventListener('pointerdown', function (event) {
      if (busy || settled) return;
      var box = canvas.getBoundingClientRect();
      var pos = { x: (event.clientX - box.left) * WORLD_W / box.width, y: (event.clientY - box.top) * WORLD_H / box.height };
      for (var i = 0; i < signs.length; i++) {
        if (hit(signs[i].view, pos)) {
          walkTo(signs[i]);
          return;
        }
      }
    });
    requestAnimationFrame(loop);
  }
  Promise.all(Object.keys(ART).map(function (name) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { art[name] = img; resolve(); };
      img.onerror = reject;
      img.src = ART[name];
    });
  })).then(boot);

  function hold(id, key) {
    var el = document.getElementById(id);
    var down = function (event) {
      event.preventDefault();
      held[key] = true;
    };
    var up = function () { held[key] = false; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }
  hold('left', 'left');
  hold('right', 'right');
  document.getElementById('hear').onclick = function () { send('replay'); };
  window.addEventListener('keydown', function (event) {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') { event.preventDefault(); held.left = true; }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') { event.preventDefault(); held.right = true; }
  });
  window.addEventListener('keyup', function (event) {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') held.left = false;
    if (event.code === 'ArrowRight' || event.code === 'KeyD') held.right = false;
  });
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== SOURCE || event.source !== window.parent) return;
    if (data.type === 'arcade') {
      strolling = true;
      question = { arcade: true, choices: [] };
      var line = document.getElementById('prompt');
      if (line) line.textContent = 'Walk the meadow.';
      var show = document.getElementById('show');
      if (show) show.innerHTML = '';
      return;
    }
    if (data.type === 'ask' && data.choices && data.choices.length) {
      if (question && question.round === data.round && signs.length && !settled) return;
      if (!booted) question = data;
      else place(data);
    }
  });
  send('ready');
  setInterval(function () {
    if (!strolling && !question && booted) send('need');
  }, 1000);
})();
