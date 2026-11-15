import * as THREE from '../../vendor/three/build/three.module.js?v=r187';
import { makeBuddyBall } from '../../lib/buddy3d.mjs';
import { LANE_WIDTH, rowAt, rowDistance, rowLanes, WORLD_RADIUS } from './logic.mjs';

const SKY = 0xfffafa;
const BALL_RADIUS = .2;
const PLANET_Y = -24;
const PLANET_Z = 2;
const PLAYER_ANGLE = Math.asin(2.8 / WORLD_RADIUS);
const UP = new THREE.Vector3(0, 1, 0);
const ROLL_AXIS = new THREE.Vector3(-1, 0, 0);
const TAU = Math.PI * 2;

function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function facetedPlanet(random) {
  const geometry = new THREE.SphereGeometry(WORLD_RADIUS, 40, 40);
  const p = geometry.attributes.position;
  const v = new THREE.Vector3();
  // Keep the longitude seam and both poles joined while breaking up the regular grid.
  for (let y = 1; y < 40; y++) {
    for (let x = 0; x < 40; x++) {
      const i = y * 41 + x;
      v.fromBufferAttribute(p, i);
      const phi = Math.atan2(v.z, v.x) + (y % 2 ? (.25 + random() * .5) * TAU / 40 : 0);
      const spread = Math.hypot(v.x, v.z);
      v.set(Math.cos(phi) * spread, v.y, Math.sin(phi) * spread);
      v.multiplyScalar(1 + (random() - .5) * .07 / WORLD_RADIUS);
      p.setXYZ(i, v.x, v.y, v.z);
      if (x === 0) p.setXYZ(i + 40, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  geometry.rotateZ(-Math.PI / 2);
  return geometry;
}

function canopy(random) {
  // Six jagged rings make the CodePen's stepped silhouette in one triangulated crown.
  const rings = [[.38, .55], [.49, .39], [.64, .415], [.79, .263], [.94, .29], [1.09, .125], [1.4, 0]];
  const sides = 8;
  const points = [];
  for (const [height, radius] of rings) {
    for (let j = 0; j < sides; j++) {
      const angle = j * TAU / sides;
      const r = radius * (radius && j % 2 ? 1.03 + random() * .25 : 1);
      points.push([Math.cos(angle) * r, height + (radius ? (random() - .5) * .11 : 0), Math.sin(angle) * r]);
    }
  }
  const triangles = [];
  for (let j = 0; j < sides; j++) triangles.push(...points[j], ...points[(j + 1) % sides], 0, .38, 0);
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let j = 0; j < sides; j++) {
      const a = ring * sides + j;
      const b = ring * sides + (j + 1) % sides;
      triangles.push(...points[a], ...points[a + sides], ...points[b]);
      if (ring < rings.length - 2) triangles.push(...points[b], ...points[a + sides], ...points[b + sides]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createPebbleScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.FogExp2(0xf0fff0, .14);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 90);
  camera.position.set(0, 2.5, 6.5);

  const random = randomFrom(3703);
  const matte = color => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 });
  scene.add(new THREE.HemisphereLight(SKY, 0x202b1c, 1.45));
  const sun = new THREE.DirectionalLight(0xcdc1c5, 2.2);
  sun.position.set(12, 6, -7);
  sun.target.position.set(0, 1, 3);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 35 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.normalBias = .035;
  scene.add(sun, sun.target);

  const world = new THREE.Group();
  world.position.set(0, PLANET_Y, PLANET_Z);
  scene.add(world);
  world.name = 'forest planet';
  const ground = new THREE.Mesh(facetedPlanet(random), matte(SKY));
  ground.name = 'pale spherical terrain';
  ground.receiveShadow = true;
  world.add(ground);
  const trunkGeo = new THREE.CylinderGeometry(.09, .1, .56, 8);
  trunkGeo.translate(0, .27, 0);
  const pineGeos = Array.from({ length: 8 }, () => canopy(random));
  const pineMat = matte(0x33ff33);
  const trunkMat = matte(0x886633);
  const radial = new THREE.Vector3();

  function tree(index) {
    const group = new THREE.Group();
    const leaves = new THREE.Mesh(pineGeos[index % pineGeos.length], pineMat);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    leaves.rotation.y = random() * TAU;
    leaves.castShadow = trunk.castShadow = true;
    group.add(trunk, leaves);
    return group;
  }

  function plant(object, x, angle, lean = 0) {
    const span = Math.sqrt(WORLD_RADIUS ** 2 - x ** 2);
    radial.set(x, Math.cos(angle) * span, Math.sin(angle) * span);
    object.position.copy(radial).multiplyScalar((WORLD_RADIUS - .11) / WORLD_RADIUS);
    object.quaternion.setFromUnitVectors(UP, radial.normalize());
    if (lean) object.rotateX(lean);
  }

  for (let i = 0; i < 36; i++) {
    for (const side of [-1, 1]) {
      const pine = tree(i);
      const x = side * (2.9 + 2.3 * random());
      plant(pine, x, TAU * (i + .28 * random()) / 36, (random() - .5) * .3);
      pine.scale.setScalar(.92 + random() * .25);
      world.add(pine);
    }
  }
  const hazards = Array.from({ length: 16 }, (_, i) => {
    const pine = tree(i);
    pine.name = 'lane tree';
    world.add(pine);
    return pine;
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.27, .022, 5, 24), new THREE.MeshBasicMaterial({ color: 0xffdd55 }));
  halo.rotation.x = -1.08;
  scene.add(halo);

  const sparks = new Float32Array(20 * 3);
  const sparkVelocities = new Float32Array(sparks.length);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparks, 3).setUsage(THREE.DynamicDrawUsage));
  const sparkMat = new THREE.PointsMaterial({ color: SKY, size: .11, transparent: true });
  const burst = new THREE.Points(sparkGeo, sparkMat);
  burst.frustumCulled = false;
  burst.visible = false;
  scene.add(burst);
  let burstAge = 0;
  let buddy;

  return {
    scene,
    camera,
    setBuddy(kind) {
      if (buddy?.kind === kind) return;
      if (buddy) { scene.remove(buddy.group); buddy.dispose(); }
      buddy = makeBuddyBall(THREE, kind, BALL_RADIUS, { tint: 0xe5f2f2, material: matte });
      // Keep the original's tiny pale faceted outline, with the learner's buddy visible inside.
      const shell = buddy.shell.children[0];
      shell.geometry.dispose();
      shell.geometry = new THREE.DodecahedronGeometry(BALL_RADIUS, 0);
      shell.material.flatShading = true;
      shell.material.opacity = .35;
      shell.castShadow = true;
      buddy.shell.children[1].material.opacity = .22;
      scene.add(buddy.group);
    },
    hit() {
      burst.position.copy(buddy.group.position);
      burstAge = .48;
      for (let i = 0; i < sparks.length; i++) {
        sparks[i] = (random() - .5) * .36;
        sparkVelocities[i] = sparks[i] * 8;
      }
      burst.visible = true;
    },
    draw(run, dt, di, reduced) {
      const rotation = (run.distance / WORLD_RADIUS) % TAU;
      world.rotation.x = -rotation;
      let used = 0;
      const near = Math.max(0, rowAt(run.distance - 2));
      for (let row = near; rowDistance(row) <= run.distance + 35; row++) {
        const ahead = rowDistance(row) - run.distance;
        if (ahead < -2) continue;
        for (const lane of rowLanes(row, run.seed)) {
          const tree = hazards[used++];
          tree.visible = true;
          plant(tree, lane * LANE_WIDTH, PLAYER_ANGLE - ahead / WORLD_RADIUS + rotation);
        }
      }
      for (let i = used; i < hazards.length; i++) hazards[i].visible = false;

      const groundY = PLANET_Y + Math.cos(PLAYER_ANGLE) * WORLD_RADIUS;
      const bob = reduced ? 0 : Math.abs(Math.sin(run.distance * 2.3)) * .045;
      buddy.group.visible = !run.ended;
      buddy.group.position.set(run.x, groundY + BALL_RADIUS + run.lift + bob, 4.8);
      buddy.roll(ROLL_AXIS, di * 1.0);
      buddy.animate(dt, 0, 0, run.distance);
      buddy.buddy.group.rotation.y = Math.PI * .17;
      halo.visible = run.shield && !run.ended;
      halo.position.copy(buddy.group.position);
      if (burst.visible) {
        burstAge -= dt;
        burst.visible = burstAge > 0 && !reduced;
        sparkMat.opacity = Math.max(0, burstAge / .48);
        for (let i = 0; i < sparks.length; i++) sparks[i] += sparkVelocities[i] * dt;
        sparkGeo.attributes.position.needsUpdate = true;
      }
    }
  };
}

export function createPebbleView(root, { onLost }) {
  const stage = createPebbleScene();
  const { scene, camera } = stage;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  root.append(renderer.domElement);

  function resize() {
    const width = Math.max(1, root.clientWidth);
    const height = Math.max(1, root.clientHeight);
    camera.aspect = width / height;
    // The reference is landscape. Widen the view enough to keep three lanes on narrow phones.
    camera.position.z = 6.5 + Math.max(0, .95 / camera.aspect - 1) * 1.6;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.setSize(width, height);
    renderer.render(scene, camera);
  }
  addEventListener('resize', resize);
  resize();

  return {
    setBuddy: stage.setBuddy,
    hit: stage.hit,
    draw(...args) {
      stage.draw(...args);
      renderer.render(scene, camera);
    }
  };
}
