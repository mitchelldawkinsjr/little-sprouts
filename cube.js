/**
 * Cube dash — a blue cube runs a long path while red cubes rush in.
 * Steer into the cube with the right answer. A red cube costs a life.
 * The path, the rush, and the lives follow Jason Leisure's Red vs Blue.
 * The questions and the on-screen buttons are Little Sprouts' own.
 */
import { cubeLanes, cubeOverlap } from './logic.mjs?v=cube-dash';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js';
const GROUND_TOP = 0.25;
const GRAVITY = -7.2;
const JUMP = 4.8;

let active = null;

export function stopCube() {
  active?.destroy();
  active = null;
}

function call(fn, arg) {
  try { return fn?.(arg); }
  catch { return undefined; }
}

function drawShape(ctx, name, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#32634e';
  ctx.beginPath();
  if (name === 'square') ctx.rect(-s * 0.38, -s * 0.38, s * 0.76, s * 0.76);
  else if (name === 'rectangle') ctx.rect(-s * 0.52, -s * 0.26, s * 1.04, s * 0.52);
  else if (name === 'triangle') {
    ctx.moveTo(0, -s * 0.46);
    ctx.lineTo(s * 0.44, s * 0.34);
    ctx.lineTo(-s * 0.44, s * 0.34);
    ctx.closePath();
  } else if (name === 'diamond') {
    ctx.moveTo(0, -s * 0.48);
    ctx.lineTo(s * 0.38, 0);
    ctx.lineTo(0, s * 0.48);
    ctx.lineTo(-s * 0.38, 0);
    ctx.closePath();
  } else if (name === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const px = Math.cos(a) * s * 0.44;
      const py = Math.sin(a) * s * 0.44;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (name === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? s * 0.18 : s * 0.46;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else ctx.ellipse(0, 0, name === 'oval' ? s * 0.62 : s * 0.42, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function labelSprite(THREE, choice) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255,250,240,.94)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(8, 16, 240, 96, 28);
  else ctx.rect(8, 16, 240, 96);
  ctx.fill();
  if (choice.shape) drawShape(ctx, choice.shape, 128, 64, 52);
  else {
    const text = String(choice.label || '');
    ctx.fillStyle = '#143024';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 48;
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    while (size > 20 && ctx.measureText(text).width > 210) {
      size -= 2;
      ctx.font = `700 ${size}px Outfit, sans-serif`;
    }
    ctx.fillText(text, 128, 66);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(2.15, 1.08, 1);
  sprite.position.y = 1.15;
  sprite.userData.texture = texture;
  return sprite;
}

function box(THREE, geo, color) {
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 }));
  mesh.castShadow = true;
  return mesh;
}

export function mountCube(root, { board = {}, reduced, nextQuestion, onPrompt, onLives, onMiss, onClear, onOver, onFinished } = {}) {
  stopCube();
  const session = {
    dead: false,
    raf: 0,
    clean: [],
    destroy() {
      if (this.dead) return;
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.clean.forEach(fn => { try { fn(); } catch { /* already gone */ } });
      if (active === this) active = null;
    }
  };
  active = session;

  const host = document.createElement('div');
  host.className = 'arcade cube-play';
  host.innerHTML = `<div class="cube" role="application" aria-label="Steer the blue cube. Jump over the red ones. Touch the cube with the right answer."><p class="cube-wait">The cubes are coming.</p><b class="cube-lives"></b><b class="cube-score"></b></div><div class="steer cube-pad" aria-label="Steer"><button type="button" class="steer-btn" data-dir="up" aria-label="Move ahead">↑</button><button type="button" class="steer-btn" data-dir="left" aria-label="Move left">←</button><button type="button" class="steer-btn" data-dir="down" aria-label="Move back">↓</button><button type="button" class="steer-btn" data-dir="right" aria-label="Move right">→</button><button type="button" class="steer-btn cube-jump" data-act="jump" aria-label="Jump">Jump</button></div>`;
  root.replaceChildren(host);
  const stage = host.querySelector('.cube');

  import(THREE_URL).then(THREE => {
    if (session.dead) return;
    begin(THREE, stage, session, { board, reduced, nextQuestion, onPrompt, onLives, onMiss, onClear, onOver, onFinished });
  }).catch(() => {
    if (session.dead) return;
    const wait = stage.querySelector('.cube-wait');
    if (wait) wait.textContent = 'The cubes could not load. Check the connection and try again.';
  });
}

function begin(THREE, stage, session, { board, reduced, nextQuestion, onPrompt, onLives, onMiss, onClear, onOver, onFinished }) {
  const wait = stage.querySelector('.cube-wait');
  if (wait) wait.remove();
  const livesEl = stage.querySelector('.cube-lives');
  const scoreEl = stage.querySelector('.cube-score');
  const calm = reduced ? 0.72 : 1;
  const spec = {
    lives: board.lives || 4,
    spawn: (board.spawn || 2.8) / calm,
    rush: (board.rush || 1) * calm
  };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0c4a6e');
  scene.fog = new THREE.Fog('#0c4a6e', 16, 40);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.classList.add('pad-space');
  stage.appendChild(renderer.domElement);

  const sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  scene.add(sun);
  scene.add(sun.target);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const groundGeo = new THREE.BoxGeometry(10, 0.5, 80);
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.8 }));
  ground.receiveShadow = true;
  ground.position.y = GROUND_TOP - 0.25;
  scene.add(ground);
  const railGeo = new THREE.BoxGeometry(0.35, 0.7, 80);
  const railMat = new THREE.MeshStandardMaterial({ color: '#075985' });
  [-5.15, 5.15].forEach(x => {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(x, 0.35, 0);
    rail.receiveShadow = true;
    scene.add(rail);
  });

  const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const playerMat = new THREE.MeshStandardMaterial({ color: '#3ee0ef', roughness: 0.35, metalness: 0.08 });
  const playerMesh = new THREE.Mesh(cubeGeo, playerMat);
  playerMesh.castShadow = true;
  scene.add(playerMesh);
  const player = { x: 0, y: GROUND_TOP + 0.5, z: 0, vx: 0, vy: 0, vz: 0, w: 1, h: 1, d: 1 };

  const keys = { left: false, right: false, up: false, down: false };
  const held = { left: false, right: false, up: false, down: false };
  const enemies = [];
  const answers = [];
  let lives = spec.lives;
  let score = 0;
  let shownScore = -1;
  let phase = 'play';
  let asking = false;
  let askWait = 0.7;
  let slipped = false;
  let invuln = 0;
  let spawnIn = 0.4;
  let spawned = 0;
  let closed = false;
  let camReady = false;
  let last = 0;

  const paintHud = () => {
    if (livesEl) livesEl.textContent = `Lives: ${lives}`;
    const next = Math.max(0, Math.floor(score));
    if (next !== shownScore && scoreEl) {
      shownScore = next;
      scoreEl.textContent = `Score: ${next}`;
    }
  };
  paintHud();
  call(onLives, lives);

  const drop = item => {
    scene.remove(item.mesh);
    item.mesh.material?.dispose();
    const sprite = item.mesh.children[0];
    sprite?.material?.map?.dispose();
    sprite?.material?.dispose();
  };

  const clearAnswers = () => {
    answers.splice(0).forEach(drop);
    asking = false;
  };

  const placeAsk = () => {
    if (typeof nextQuestion !== 'function' || closed || asking || phase !== 'play') return;
    const pack = call(nextQuestion);
    if (!pack?.choices?.length) {
      closed = true;
      phase = 'done';
      call(onFinished);
      return;
    }
    slipped = false;
    asking = true;
    const lanes = cubeLanes(pack.choices.length, 7);
    pack.choices.forEach((choice, i) => {
      const color = choice.fill || (choice.shape ? '#8fbf73' : '#f6e7a8');
      const mesh = box(THREE, cubeGeo, color);
      mesh.add(labelSprite(THREE, choice));
      const body = { x: lanes[i] || 0, y: GROUND_TOP + 0.5, z: player.z - 16, w: 1, h: 1, d: 1, vz: 0.85 * spec.rush };
      mesh.position.set(body.x, body.y, body.z);
      scene.add(mesh);
      answers.push({ body, mesh, ok: !!choice.ok });
    });
    call(onPrompt);
  };

  const grounded = () => player.y <= GROUND_TOP + player.h / 2 + 0.06 && player.vy <= 0.35;
  const jump = () => { if (phase === 'play' && grounded()) player.vy = JUMP; };

  const hurt = () => {
    if (invuln > 0 || phase !== 'play') return;
    lives -= 1;
    invuln = 0.9;
    player.z += 1.5;
    if (asking) {
      slipped = true;
      call(onMiss, 'red');
    }
    paintHud();
    call(onLives, lives);
    if (lives <= 0) {
      phase = 'over';
      if (!closed) {
        closed = true;
        call(onOver);
      }
    }
  };

  const settle = body => {
    if (body.y - body.h / 2 > GROUND_TOP) return;
    body.y = GROUND_TOP + body.h / 2;
    if (body.vy < 0) body.vy = Math.abs(body.vy) < 0.8 ? 0 : -body.vy * 0.35;
  };

  const step = dt => {
    const speed = 3.1 * calm;
    player.vx = (held.left || keys.left) ? -speed : (held.right || keys.right) ? speed : 0;
    player.vz = (held.up || keys.up) ? -speed : (held.down || keys.down) ? speed : 0;
    player.vy += GRAVITY * dt;
    player.x = Math.max(-4.2, Math.min(4.2, player.x + player.vx * dt));
    player.z += player.vz * dt;
    player.y += player.vy * dt;
    settle(player);
    if (player.vz < -0.2) score += 28 * dt;
    playerMesh.position.set(player.x, player.y, player.z);
    playerMat.emissive.set(invuln > 0 && Math.floor(invuln * 10) % 2 ? '#083038' : '#000000');
    if (invuln > 0) invuln -= dt;

    ground.position.z = player.z - 10;
    scene.children.forEach(child => {
      if (child.geometry === railGeo) child.position.z = player.z - 10;
    });

    spawnIn -= dt;
    if (spawnIn <= 0 && enemies.length < 8) {
      spawned += 1;
      spawnIn = Math.max(0.55, spec.spawn - spawned * 0.16);
      const mesh = box(THREE, cubeGeo, '#e23d3d');
      const body = {
        x: (Math.random() - 0.5) * 8,
        y: GROUND_TOP + 0.5,
        z: player.z - 24,
        w: 1, h: 1, d: 1,
        vz: (1.7 + Math.random() * 0.4) * spec.rush,
        accel: 0.62 * spec.rush
      };
      mesh.position.set(body.x, body.y, body.z);
      scene.add(mesh);
      enemies.push({ body, mesh });
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.body.vz += enemy.body.accel * dt;
      enemy.body.z += enemy.body.vz * dt;
      enemy.mesh.position.set(enemy.body.x, enemy.body.y, enemy.body.z);
      if (enemy.body.z > player.z + 10) {
        drop(enemy);
        enemies.splice(i, 1);
      }
    }

    for (const answer of answers) {
      answer.body.z += answer.body.vz * dt;
      answer.mesh.position.set(answer.body.x, answer.body.y, answer.body.z);
    }
    if (answers.length && answers.every(answer => answer.body.z > player.z + 1.2)) {
      if (answers.some(answer => answer.ok)) {
        slipped = true;
        call(onMiss, 'pass');
      }
      const lanes = cubeLanes(answers.length, 7);
      answers.forEach((answer, i) => {
        answer.body.x = lanes[i] || 0;
        answer.body.z = player.z - 16;
      });
    }

    let touched = null;
    answers.forEach(answer => {
      if (touched || !cubeOverlap(player, answer.body)) return;
      touched = answer;
    });
    if (touched) {
      if (touched.ok) {
        const clean = !slipped;
        clearAnswers();
        askWait = 1.15;
        call(onClear, clean);
      } else {
        slipped = true;
        drop(touched);
        answers.splice(answers.indexOf(touched), 1);
        player.z += 0.7;
        call(onMiss, 'wrong');
      }
    } else if (invuln <= 0 && enemies.some(enemy => cubeOverlap(player, enemy.body))) {
      hurt();
      if (phase !== 'play') return;
    }

    if (!asking && askWait > 0) askWait -= dt;
    if (!asking && askWait <= 0) placeAsk();

    const goalX = player.x * 0.28;
    const goalZ = player.z + 7.2;
    if (!camReady) {
      camera.position.set(goalX, player.y + 3.3, goalZ);
      camReady = true;
    } else {
      camera.position.x += (goalX - camera.position.x) * 0.14;
      camera.position.y = player.y + 3.3;
      camera.position.z = goalZ;
    }
    camera.lookAt(player.x * 0.45, player.y + 0.2, player.z - 7);
    sun.position.set(player.x + 4, 9, player.z + 6);
    sun.target.position.set(player.x, 0, player.z - 4);
    sun.target.updateMatrixWorld();
    paintHud();
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(280, rect.width || 640);
    const height = Math.max(200, rect.height || 360);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  const onKey = event => {
    if (event.target && (event.target.matches?.('input, textarea') || event.target.isContentEditable)) return;
    const down = event.type === 'keydown';
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = down;
    else if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = down;
    else if (event.code === 'ArrowUp' || event.code === 'KeyW') keys.up = down;
    else if (event.code === 'ArrowDown' || event.code === 'KeyS') keys.down = down;
    else if (down && event.code === 'Space') jump();
    else return;
    event.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  session.clean.push(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  });

  stage.parentElement?.querySelectorAll('.steer-btn').forEach(button => {
    const name = button.dataset.dir;
    const press = on => {
      if (name) held[name] = on;
    };
    const down = event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      press(true);
      if (button.dataset.act === 'jump') jump();
    };
    const up = () => press(false);
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    session.clean.push(() => {
      button.removeEventListener('pointerdown', down);
      button.removeEventListener('pointerup', up);
      button.removeEventListener('pointercancel', up);
    });
  });

  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  session.clean.push(() => window.removeEventListener('resize', onResize));

  const frame = now => {
    if (session.dead) return;
    session.raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (phase === 'play') step(dt);
    if (session.dead) return;
    renderer.render(scene, camera);
  };
  session.raf = requestAnimationFrame(frame);

  const prior = session.destroy.bind(session);
  session.destroy = () => {
    if (session.dead) return;
    prior();
    cancelAnimationFrame(session.raf);
    enemies.splice(0).forEach(drop);
    answers.splice(0).forEach(drop);
    cubeGeo.dispose();
    groundGeo.dispose();
    railGeo.dispose();
    railMat.dispose();
    playerMat.dispose();
    ground.material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
