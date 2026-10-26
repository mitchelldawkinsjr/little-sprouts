/* Garden walk. The meadow, the sprout, and the questions are drawn here.
   The canvas, sprite slices, and walk motors are BlocksJS (MIT). */
(function () {
  var SOURCE = 'sprouts-sidecar';
  var WORLD_W = 960;
  var WORLD_H = 540;
  var BUDDY_W = 96;
  var SIGN_W = 150;
  var SIGN_H = 190;
  var spec = {
    width: WORLD_W,
    height: WORLD_H,
    meadow: { src: 'art/meadow.png' },
    standRight: { src: 'art/sprout-stand-right.png' },
    standLeft: { src: 'art/sprout-stand-left.png' },
    walkRight: { src: 'art/sprout-walk-right.png', numberOfFrames: 4, frameDelay: 5, loop: true },
    walkLeft: { src: 'art/sprout-walk-left.png', numberOfFrames: 4, frameDelay: 5, loop: true }
  };
  var game = BLOCKS.game(spec);
  game.addEventListener('loaded', boot);
  var layer;
  var meadow;
  var buddy;
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
    buddy.setSlice(name);
  }
  function overlaps(view) {
    var center = buddy.x + BUDDY_W / 2;
    return center > view.x + 28 && center < view.x + view.width - 28;
  }
  function hit(view, pos) {
    return pos.x >= view.x && pos.y >= view.y && pos.x <= view.x + view.width && pos.y <= view.y + view.height;
  }
  function clearSigns() {
    signs.forEach(function (sign) {
      sign.view.removeMotors();
      game.stage.removeView(sign.view);
      sign.view.destroy();
    });
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
    game.addMotor('vibrate', {
      object: sign.view,
      amount: 2,
      duration: reduced ? 180 : 340,
      amplitude: reduced ? 4 : 12,
      angle: 0
    });
    buddy.removeMotors();
    game.addMotor('move', {
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
    game.addMotor('move', {
      object: buddy,
      x: 0,
      y: -22,
      duration: 160,
      easing: 'easeOut',
      callback: function () {
        game.addMotor('move', {
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
    buddy.removeMotors();
    game.addMotor('move', {
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
  function paintSign(choice, done) {
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
    var img = new Image();
    img.onload = function () { done(img); };
    img.src = canvas.toDataURL('image/png');
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
      buddy.removeMotors();
      buddy.x = 18;
      buddy.y = 392;
      face('standRight');
      pose = 'standRight';
    }
    var choices = data.choices;
    var pending = choices.length;
    choices.forEach(function (choice, index) {
      paintSign(choice, function (img) {
        if (question !== data) return;
        var x0 = 200;
        var x1 = WORLD_W - 20 - SIGN_W;
        var view = BLOCKS.block({
          layer: layer,
          x: choices.length === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * index / (choices.length - 1),
          y: 318,
          slices: [{ name: 'sign', image: img }]
        });
        game.stage.addView(view);
        signs.push({ view: view, ok: !!choice.ok, index: index, skip: false });
        pending -= 1;
        if (!pending) send('show');
      });
    });
  }
  function boot() {
    layer = game.addLayer('scene');
    meadow = BLOCKS.slice({ layer: layer, image: spec.meadow.image });
    game.stage.addView(meadow);
    buddy = BLOCKS.block({
      layer: layer,
      x: 18,
      y: 392,
      slices: [
        { name: 'standRight', image: spec.standRight.image },
        { name: 'standLeft', image: spec.standLeft.image },
        { name: 'walkRight', image: spec.walkRight.image, numberOfFrames: 4, frameDelay: 5, loop: true },
        { name: 'walkLeft', image: spec.walkLeft.image, numberOfFrames: 4, frameDelay: 5, loop: true }
      ]
    });
    game.stage.addView(buddy);
    face('standRight');
    booted = true;
    if (question) place(question);
    game.addEventListener('postUpdate', function () {
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
      buddy.dirty = true;
    });
    game.tap = function (pos) {
      if (busy || settled) return;
      for (var i = 0; i < signs.length; i++) {
        if (hit(signs[i].view, pos)) {
          walkTo(signs[i]);
          return;
        }
      }
    };
  }

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
