import * as THREE from 'three';
import { makeBuddyBall } from '../../lib/buddy3d.mjs?v=gear2';
import { resolveAutoQuality, pixelRatioCap, rendererOptions } from '../../lib/device-tier.mjs?v=low-end1';
import { BALL_R, LANE_WIDTH } from './logic.mjs?v=1';

const RADIUS = 27;
const CIRCLE = Math.PI * 2;
const travelAxis = new THREE.Vector3(-1, 0, 0);
const acrossAxis = new THREE.Vector3(0, 0, -1);

export function globePoint(x, angle, lift = 0) {
  const ring = Math.sqrt(RADIUS * RADIUS - x * x) + lift;
  return [x, Math.cos(angle) * ring - RADIUS, -Math.sin(angle) * ring];
}

const mat = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.93 });
function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function strip(parent, x0, x1, lift, shades, dashed = false) {
  const points = [];
  const colors = [];
  const n = 216;
  for (let i = 0; i < n; i++) {
    if (dashed && i % 6 >= 2) continue;
    const a = i * CIRCLE / n, b = (i + 1) * CIRCLE / n;
    const color = new THREE.Color(shades[dashed ? 0 : (i * 7 + Math.floor(i / 9)) % shades.length]);
    // Subdivide the broad middle strip so its chords sit above the curved ground.
    const columns = Math.ceil((x1 - x0) / .46);
    for (let j = 0; j < columns; j++) {
      const left = x0 + (x1 - x0) * j / columns;
      const right = x0 + (x1 - x0) * (j + 1) / columns;
      for (const [x, angle] of [[left, a], [right, a], [left, b], [right, a], [right, b], [left, b]]) {
        const [px, py, pz] = globePoint(x, angle, lift);
        points.push(px, py + RADIUS, pz);
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), parent);
}

export function makeWorld(canvas, kind, embedded) {
  const tier = resolveAutoQuality({ embedded });
  const renderer = new THREE.WebGLRenderer({ canvas, ...rendererOptions(tier) });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(tier)));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c7e6db');
  scene.fog = new THREE.FogExp2('#c7e6db', 0.034);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 105);
  const sky = new THREE.HemisphereLight('#fff4c9', '#5a8272', 2.05);
  const sun = new THREE.DirectionalLight('#fff0c0', 1.85);
  sun.position.set(-9, 12, 5);
  scene.add(sky, sun);

  const globe = new THREE.Group();
  globe.position.y = -RADIUS;
  scene.add(globe);
  const soil = new THREE.SphereGeometry(RADIUS, 60, 48);
  const vertices = soil.getAttribute('position');
  const colors = [];
  const grass = ['#65a166', '#72aa70', '#7bb477', '#7fb578', '#75aa6b'].map(hex => new THREE.Color(hex));
  for (let i = 0; i < vertices.count; i++) {
    const c = grass[(Math.abs(Math.round(vertices.getX(i) * 13 + vertices.getY(i) * 7 - vertices.getZ(i) * 11))) % grass.length];
    colors.push(c.r, c.g, c.b);
  }
  soil.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  mesh(soil, new THREE.MeshStandardMaterial({ flatShading: true, vertexColors: true }), globe);
  strip(globe, -2.67, -2.36, .047, ['#d3bd80']);
  strip(globe, 2.36, 2.67, .047, ['#d3bd80']);
  strip(globe, -2.42, 2.42, .052, ['#e3bc82', '#e4bd84', '#e8c48b', '#e6c087']);
  for (const x of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) strip(globe, x - .024, x + .024, .064, ['#f8deb1'], true);

  const trunkGeo = new THREE.CylinderGeometry(.10, .16, .82, 6);
  const branchGeo = new THREE.ConeGeometry(.77, 1.34, 7);
  const bark = mat('#76462e');
  const pine = mat('#28634c');
  const tops = mat('#488459');
  const trunk = new THREE.InstancedMesh(trunkGeo, bark, 132);
  const lower = new THREE.InstancedMesh(branchGeo, pine, 132);
  const upper = new THREE.InstancedMesh(branchGeo, tops, 132);
  const obj = new THREE.Object3D();
  const shade = new THREE.Color();
  for (let i = 0; i < 132; i++) {
    const side = i % 2 ? -1 : 1;
    const a = Math.floor(i / 2) * CIRCLE / 66 + Math.sin(i * 6.2) * .033;
    const x = side * (3.35 + ((i * 173) % 100) / 20);
    const size = .77 + ((i * 113) % 100) / 112;
    const [px, py, pz] = globePoint(x, a);
    obj.position.set(px, py + RADIUS, pz);
    obj.rotation.set(-a, 0, -side * .13);
    obj.scale.setScalar(size);
    obj.translateY(.35 * size);
    obj.updateMatrix();
    trunk.setMatrixAt(i, obj.matrix);
    obj.translateY(.85 * size);
    obj.rotateY(i * 1.86);
    obj.updateMatrix();
    lower.setMatrixAt(i, obj.matrix);
    obj.translateY(.54 * size);
    obj.scale.setScalar(size * .79);
    obj.updateMatrix();
    upper.setMatrixAt(i, obj.matrix);
    shade.setRGB(0.66 + (i % 7) * .05, 0.74 + (i % 5) * .055, .68 + (i % 9) * .035);
    lower.setColorAt(i, shade);
    upper.setColorAt(i, shade);
  }
  globe.add(trunk, lower, upper);

  const stoneGeo = new THREE.DodecahedronGeometry(.31, 0);
  const stones = new THREE.InstancedMesh(stoneGeo, mat('#8d9a79'), 96);
  const petals = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.105), mat('#f7cd67'), 104);
  for (const [instances, near, width] of [[stones, 2.93, 3.0], [petals, 2.85, 1.2]]) {
    for (let i = 0; i < instances.count; i++) {
      const a = i * CIRCLE / instances.count;
      const x = (i % 2 ? -1 : 1) * (near + ((i * 37) % 100) / 100 * width);
      const [px, py, pz] = globePoint(x, a, .09);
      obj.position.set(px, py + RADIUS, pz);
      obj.rotation.set(-a, i * .81, 0);
      obj.scale.set(1 + (i % 5) * .15, .47 + (i % 4) * .17, .8);
      obj.updateMatrix();
      instances.setMatrixAt(i, obj.matrix);
    }
    globe.add(instances);
  }

  const logGeo = new THREE.CylinderGeometry(.24, .27, 1.13, 9);
  const cutGeo = new THREE.CircleGeometry(.192, 9);
  const cutMat = mat('#edba75');
  const logBark = mat('#855039');
  const mossGeo = new THREE.IcosahedronGeometry(.17, 0);
  const mossMat = mat('#d9ae57');
  const obstacleNodes = new Map();
  const spare = { log: [], pine: [] };
  function obstacle(kind) {
    const ready = spare[kind].pop();
    if (ready) { ready.visible = true; return ready; }
    const group = new THREE.Group();
    scene.add(group);
    if (kind === 'log') {
      mesh(logGeo, logBark, group, 0, .20, 0).rotation.z = Math.PI / 2;
      for (const sign of [-1, 1]) mesh(cutGeo, cutMat, group, sign * .567, .20, 0).rotation.y = sign * Math.PI / 2;
      for (const x of [-.31, -.12, .24]) mesh(mossGeo, mossMat, group, x, .40, .02).scale.set(1, .39, .72);
    } else {
      mesh(trunkGeo, bark, group, 0, .4, 0);
      mesh(branchGeo, pine, group, 0, 1.03, 0).scale.set(.82, 1, .82);
      mesh(branchGeo, tops, group, 0, 1.65, 0).scale.set(.61, .79, .61);
    }
    return group;
  }

  const arch = new THREE.Group();
  const beam = new THREE.CylinderGeometry(.13, .16, 2.30, 8);
  const gold = mat('#ebad4d');
  const ivory = mat('#fff0b8');
  for (const side of [-1, 1]) {
    mesh(beam, gold, arch, side * 2.44, 1.12);
    mesh(mossGeo, ivory, arch, side * 2.44, 2.28).scale.setScalar(1.52);
  }
  mesh(new THREE.BoxGeometry(5.1, .33, .32), gold, arch, 0, 2.4);
  mesh(new THREE.BoxGeometry(5.1, .075, .33), ivory, arch, 0, 2.47);
  const gem = mesh(new THREE.OctahedronGeometry(.35), mat('#fff1a1'), arch, 0, 2.82);
  scene.add(arch);

  let priorX = 0;
  let priorDistance = 0;
  let ball = makeBuddyBall(THREE, kind, BALL_R);
  scene.add(ball.group);
  const shadow = mesh(new THREE.CircleGeometry(.56, 24), new THREE.MeshBasicMaterial({ color: '#47553e', transparent: true, opacity: .25, depthWrite: false }), scene);
  shadow.rotation.x = -Math.PI / 2;
  const guard = mesh(new THREE.SphereGeometry(BALL_R * 1.17, 20, 12), new THREE.MeshBasicMaterial({ color: '#5eddf2', transparent: true, opacity: .26, depthWrite: false }), scene);
  guard.renderOrder = 2;

  return {
    setBuddy(kind) {
      if (ball.kind === kind) return;
      scene.remove(ball.group);
      ball.dispose();
      ball = makeBuddyBall(THREE, kind, BALL_R);
      scene.add(ball.group);
    },
    resize() {
      const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      camera.aspect = w / h;
      camera.fov = THREE.MathUtils.clamp(39 / Math.sqrt(camera.aspect), 37, 63);
      camera.position.set(0, camera.aspect < .85 ? 4.9 : 4.15, 7.6);
      camera.lookAt(0, .50, -4.9);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    draw(run, dt, reduced) {
      globe.rotation.x = (run.distance / RADIUS) % CIRCLE;
      const time = run.distance / 5;
      const seen = new Set();
      for (const row of run.rows) {
        if (row.at - run.distance > 35) continue;
        const a = (row.at - run.distance) / RADIUS;
        for (const item of row.obstacles) {
          const x = item.lane * LANE_WIDTH;
          const entry = obstacleNodes.get(item) || obstacle(item.kind);
          obstacleNodes.set(item, entry);
          seen.add(item);
          entry.position.set(...globePoint(x, a, .055));
          entry.rotation.set(-a, 0, -x / RADIUS);
        }
      }
      for (const [item, entry] of obstacleNodes) {
        if (seen.has(item)) continue;
        entry.visible = false;
        spare[item.kind].push(entry);
        obstacleNodes.delete(item);
      }
      const gate = Math.min(run.nextGate, run.finishAt);
      arch.visible = Number.isFinite(gate) && gate - run.distance < 35;
      if (arch.visible) {
        const a = (gate - run.distance) / RADIUS;
        arch.position.set(...globePoint(0, a, .08));
        arch.rotation.x = -a;
        gem.rotation.y = reduced ? 0 : time;
      }
      const [x, y, z] = globePoint(run.x, 0, .055);
      ball.group.position.set(x, y + BALL_R + run.height, z);
      // The buddy faces the player inside the clear shell. The trail rolls underneath.
      ball.animate(dt, 0, dt && !reduced ? 2.6 : 0, time);
      if (dt && !reduced && run.distance >= priorDistance) {
        ball.roll(travelAxis, (run.distance - priorDistance) / BALL_R);
        ball.roll(acrossAxis, (run.x - priorX) / BALL_R);
      }
      priorX = run.x;
      priorDistance = run.distance;
      ball.group.visible = reduced || run.grace < .7 || Math.sin(run.grace * 36) < .5;
      guard.position.copy(ball.group.position);
      guard.visible = run.shield > 0;
      shadow.position.set(x, y + .014, z);
      shadow.material.opacity = .25 / (1 + run.height * 2.8);
      renderer.render(scene, camera);
    }
  };
}
