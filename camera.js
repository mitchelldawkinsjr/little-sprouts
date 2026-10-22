// Reach play: on-device pose tracking turns a held hand into a tap on the answer under it.
// Video frames are only read in this tab; nothing is recorded, stored, or uploaded.
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1';
const FULL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
const LITE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const DWELL = 700;
const GRACE = 200;
const LOST = 320;
const STICK = 36;
const ENTER = 18;
const NEAR = 52;
const SIDES = [
  { shoulder: 11, elbow: 13, wrist: 15, index: 19, pinky: 17 },
  { shoulder: 12, elbow: 14, wrist: 16, index: 20, pinky: 18 }
];

let landmarker = null;
let stream = null;
let view = null;
let needDrop = false;
let lastTime = 0;
let videoCb = 0;
let raf = 0;
let loopVideo = null;

const vis = p => {
  if (!p) return 0;
  const seen = p.visibility ?? 0;
  if (p.presence == null || p.presence === 0) return seen;
  return Math.min(seen, p.presence);
};

export function mapCover(nx, ny, videoWidth, videoHeight, boxWidth, boxHeight) {
  if (!videoWidth || !videoHeight) return { x: (1 - nx) * boxWidth, y: ny * boxHeight };
  const scale = Math.max(boxWidth / videoWidth, boxHeight / videoHeight);
  const dispW = videoWidth * scale;
  const dispH = videoHeight * scale;
  return {
    x: (boxWidth - dispW) / 2 + (1 - nx) * dispW,
    y: (boxHeight - dispH) / 2 + ny * dispH
  };
}

export function pickPose(poses) {
  let best = null;
  let bestScore = 0;
  for (const lm of poses || []) {
    if (!lm || lm.length < 21) continue;
    const seen = [11, 12, 15, 16].reduce((sum, i) => sum + vis(lm[i]), 0) / 4;
    if (seen < 0.2) continue;
    const span = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
    const score = span * seen;
    if (score > bestScore) {
      best = lm;
      bestScore = score;
    }
  }
  return best;
}

export function pointerNorm(parts) {
  const { wrist, index, pinky } = parts;
  const tip = vis(index) >= 0.25 ? index : vis(pinky) >= 0.25 ? pinky : null;
  if (tip && vis(wrist) >= 0.2) return { x: wrist.x * 0.3 + tip.x * 0.7, y: wrist.y * 0.3 + tip.y * 0.7 };
  if (tip) return { x: tip.x, y: tip.y };
  if (vis(wrist) >= 0.2) return { x: wrist.x, y: wrist.y };
  return null;
}

export function reachScore(parts) {
  const tip = pointerNorm(parts);
  if (!tip) return -1;
  const shoulder = parts.shoulder;
  const elbow = parts.elbow;
  const wrist = parts.wrist;
  if (vis(shoulder) >= 0.25) {
    let score = shoulder.y - tip.y;
    if (vis(elbow) >= 0.25 && elbow.y < shoulder.y + 0.02 && tip.y <= elbow.y + 0.02) {
      score = Math.max(score, shoulder.y - elbow.y, 0.05);
    }
    if (wrist && vis(wrist) >= 0.2 && wrist.z < shoulder.z - 0.1 && tip.y < shoulder.y + 0.12) {
      score = Math.max(score, 0.06);
    }
    return score;
  }
  return 0.42 - tip.y;
}

export function handRaised(wasUp, score) {
  return wasUp ? score > -0.055 : score > 0.04;
}

export function zoneHit(zones, x, y, pad) {
  let best = null;
  let bestD = Infinity;
  for (const zone of zones) {
    const r = zone.rect;
    if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) continue;
    const dx = x - (r.left + r.right) / 2;
    const dy = y - (r.top + r.bottom) / 2;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      best = zone.el;
      bestD = d;
    }
  }
  return best;
}

function oneEuro(minCutoff = 1.2, beta = 0.08, dCutoff = 1) {
  let x;
  let dx = 0;
  let t = 0;
  const alpha = (cutoff, dt) => 1 / (1 + 1 / (2 * Math.PI * cutoff) / dt);
  return {
    reset() { x = undefined; },
    next(value, now) {
      if (x === undefined) {
        x = value;
        dx = 0;
        t = now;
        return value;
      }
      const dt = Math.max((now - t) / 1000, 1 / 120);
      t = now;
      const d = (value - x) / dt;
      const ad = alpha(dCutoff, dt);
      dx += ad * (d - dx);
      x += alpha(minCutoff + beta * Math.abs(dx), dt) * (value - x);
      return x;
    }
  };
}

function freshSide() {
  return { x: oneEuro(), y: oneEuro(), joints: {}, score: null, up: false, seen: 0, px: 0, py: 0, live: false };
}

function problem(e) {
  if (e?.name === 'NotAllowedError') return 'The camera is blocked for this site. You can still tap the answers.';
  if (e?.name === 'NotFoundError') return 'No camera was found. You can still tap the answers.';
  if (e?.name === 'InsecureContext') return 'Reach play needs https or localhost. You can still tap the answers.';
  return 'The camera could not start (the first time needs internet). You can still tap the answers.';
}

function poseOptions(files, PoseLandmarker, model, delegate, poses) {
  return PoseLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: model, delegate },
    runningMode: 'VIDEO',
    numPoses: poses,
    minPoseDetectionConfidence: 0.4,
    minPosePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4
  });
}

async function load() {
  if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: 'InsecureContext' });
  if (!landmarker) {
    const { FilesetResolver, PoseLandmarker } = await import(`${MP}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
    landmarker = await poseOptions(files, PoseLandmarker, FULL, 'GPU', 2)
      .catch(() => poseOptions(files, PoseLandmarker, LITE, 'CPU', 1));
  }
  stream ??= await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }
  });
}

function cancelLoop() {
  if (videoCb) loopVideo?.cancelVideoFrameCallback?.(videoCb);
  if (raf) cancelAnimationFrame(raf);
  videoCb = 0;
  raf = 0;
  loopVideo = null;
}

function schedule(video) {
  loopVideo = video;
  if (video.requestVideoFrameCallback) videoCb = video.requestVideoFrameCallback(() => tick());
  else raf = requestAnimationFrame(tick);
}

export async function attach(stage, status) {
  cancelLoop();
  const me = view = {
    stage,
    status,
    sides: [freshSide(), freshSide()],
    hold: null,
    since: 0,
    missed: 0,
    bothSince: 0,
    saw: 0,
    started: 0,
    msg: '',
    near: false
  };
  ensureArms(stage);
  const video = stage.querySelector('video');
  if (!(landmarker && stream)) status('Waking up the camera…');
  try {
    await load();
  } catch (e) {
    if (view === me) status(problem(e));
    return;
  }
  if (view !== me) return;
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    if (video.videoWidth) stage.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
  };
  const played = await video.play().then(() => true).catch(() => false);
  if (view !== me) return;
  if (!played) status('Tap the picture if it stays blank. You can still tap the answers.');
  tick();
}

export function detach() {
  view = null;
  cancelLoop();
}

export function stop() {
  detach();
  needDrop = false;
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
}

function tick() {
  if (!view) return;
  const video = view.stage.querySelector('video');
  if (!video?.isConnected) {
    detach();
    return;
  }
  schedule(video);
  if (document.hidden || video.readyState < 2) return;
  const now = Math.max(performance.now(), lastTime + 1);
  lastTime = now;
  try {
    landmarker.detectForVideo(video, now, result => {
      if (view) follow(result?.landmarks, now, video);
    });
  } catch {
    /* A bad frame should not stop the loop. */
  }
}

function ensureArms(stage) {
  if (stage.querySelector('svg.arms')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('arms');
  svg.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 2; i++) svg.append(document.createElementNS('http://www.w3.org/2000/svg', 'polyline'));
  stage.querySelector('video').after(svg);
}

function glide(prev, point, now, last) {
  if (!prev || !last) return point;
  const a = 1 - Math.exp(-Math.min(80, Math.max(0, now - last)) / 55);
  return { x: prev.x + (point.x - prev.x) * a, y: prev.y + (point.y - prev.y) * a };
}

function follow(poses, now, video) {
  const { stage, sides } = view;
  const box = stage.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) return;
  if (!view.started) view.started = now;
  const pose = pickPose(poses);
  if (pose) view.saw = now;
  const live = view.saw && now - view.saw < 450;
  stage.classList.toggle('live', !!live);
  stage.classList.toggle('wait', !live && now - view.started > 1200);

  const dots = stage.querySelectorAll('.hand');
  const lines = stage.querySelectorAll('svg.arms polyline');
  const svg = stage.querySelector('svg.arms');
  if (svg) svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

  const hands = sides.map((side, i) => {
    const ids = SIDES[i];
    const parts = pose ? {
      shoulder: pose[ids.shoulder],
      elbow: pose[ids.elbow],
      wrist: pose[ids.wrist],
      index: pose[ids.index],
      pinky: pose[ids.pinky]
    } : null;
    const norm = parts ? pointerNorm(parts) : null;
    if (norm) {
      if (now - side.seen > LOST) {
        side.x.reset();
        side.y.reset();
        side.joints = {};
        side.score = null;
      }
      const mapped = mapCover(norm.x, norm.y, video.videoWidth, video.videoHeight, box.width, box.height);
      side.px = side.x.next(mapped.x, now);
      side.py = side.y.next(mapped.y, now);
      const raw = reachScore(parts);
      side.score = side.score == null ? raw : side.score * 0.55 + raw * 0.45;
      side.up = handRaised(side.up, side.score);
      side.seen = now;
      side.live = true;
      const chain = [parts.shoulder, parts.elbow, parts.wrist, parts.index].map((joint, n) => {
        if (vis(joint) < 0.2) return null;
        const key = ['s', 'e', 'w', 'i'][n];
        const point = mapCover(joint.x, joint.y, video.videoWidth, video.videoHeight, box.width, box.height);
        side.joints[key] = glide(side.joints[key], point, now, side.jointT);
        return side.joints[key];
      }).filter(Boolean);
      side.jointT = now;
      side.chain = chain;
    } else if (!side.seen || now - side.seen > LOST) {
      side.live = false;
      side.up = false;
      side.score = null;
      side.chain = [];
      side.x.reset();
      side.y.reset();
    } else if (now - side.seen > GRACE) side.up = false;
    return side;
  });

  const raised = hands.filter(h => h.live && h.up);
  if (needDrop && !raised.length) needDrop = false;
  const zones = [...stage.querySelectorAll('[data-zone]:not(:disabled)')].map(el => ({ el, rect: el.getBoundingClientRect() }));
  const go = document.querySelector('[data-camera-go]:not([hidden])');
  if (!needDrop && raised.length >= 2) {
    if (!view.bothSince) view.bothSince = now;
  } else view.bothSince = 0;
  const bothReady = view.bothSince && now - view.bothSince >= 120;

  let target = null;
  view.near = false;
  if (!needDrop) {
    const points = raised.map(h => ({ x: h.px + box.left, y: h.py + box.top, hand: h })).sort((a, b) => b.hand.score - a.hand.score);
    if (view.hold?.isConnected && !view.hold.disabled && view.hold !== go) {
      const sticky = zones.find(z => z.el === view.hold);
      if (sticky && points.some(p => zoneHit([sticky], p.x, p.y, STICK))) target = view.hold;
    }
    if (!target) {
      for (const p of points) {
        target = zoneHit(zones, p.x, p.y, ENTER);
        if (target) break;
      }
    }
    if (!target && go && bothReady) target = go;
    if (!target) {
      view.near = points.some(p => zoneHit(zones, p.x, p.y, NEAR));
    }
  }

  if (view.hold && (!view.hold.isConnected || view.hold.disabled)) {
    release(view.hold);
    view.hold = null;
  }
  if (target === view.hold) view.missed = 0;
  else if (!target && view.hold && (!view.missed || now - view.missed < GRACE)) {
    if (!view.missed) view.missed = now;
    target = view.hold;
  } else {
    release(view.hold);
    view.hold = target;
    view.since = now;
    view.missed = 0;
  }

  const done = target ? Math.min(1, (now - view.since) / DWELL) : 0;
  if (target) {
    target.classList.add('reaching');
    target.classList.toggle('hot', target !== go);
    target.style.setProperty('--dwell', done);
  }
  hands.forEach(h => { h.holding = false; });
  if (target === go) raised.forEach(h => { h.holding = true; });
  else if (target) {
    const hit = raised.find(h => zoneHit([{ el: target, rect: target.getBoundingClientRect() }], h.px + box.left, h.py + box.top, STICK));
    if (hit) hit.holding = true;
  }

  hands.forEach((h, i) => {
    const dot = dots[i];
    const line = lines[i];
    if (!dot) return;
    dot.hidden = !h.live;
    if (!h.live) {
      dot.classList.remove('holding', 'aim');
    } else {
      dot.style.transform = `translate3d(${h.px}px, ${h.py}px, 0) scale(${h.holding ? 1.12 : 1})`;
      dot.style.setProperty('--dwell', h.holding ? done : 0);
      dot.classList.toggle('holding', !!h.holding);
      dot.classList.toggle('aim', h.up && !h.holding);
    }
    if (line) line.setAttribute('points', h.live && h.chain?.length > 1 ? h.chain.map(p => `${p.x},${p.y}`).join(' ') : '');
  });

  coach(pose, hands, target, go, zones);

  if (target && done >= 1) {
    const el = target;
    release(el);
    view.hold = null;
    view.bothSince = 0;
    needDrop = true;
    el.click();
  }
}

function release(el) {
  el?.classList.remove('reaching', 'hot');
  el?.style.removeProperty('--dwell');
}

function coach(pose, hands, target, go, zones) {
  let msg;
  if (needDrop) msg = 'Put your hands down, then reach again.';
  else if (!pose) msg = 'Step back so your shoulders and hands fit.';
  else if (target && go && target === go) msg = 'Hold both hands up…';
  else if (target) msg = 'Hold it there…';
  else if (!zones.length && go) msg = 'Raise both hands and hold to go on.';
  else if (!hands.some(h => h.live)) msg = 'I see you. Reach one hand up.';
  else if (view.near) msg = 'Almost — put your hand on the answer.';
  else if (hands.some(h => h.up)) msg = 'Put your hand on an answer.';
  else msg = 'Reach one hand up onto an answer.';
  if (msg === view.msg) return;
  view.msg = msg;
  view.status(msg);
}
