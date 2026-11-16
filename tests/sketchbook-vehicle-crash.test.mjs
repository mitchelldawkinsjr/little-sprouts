import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCrashBursts, vehicleKind, watchVehicleCrashes } from '../sidecars/sketchbook/vehicle-crash.mjs';

function target(props = {}) {
  const listeners = new Map();
  return Object.assign(props, {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    fire(type, event) { for (const fn of listeners.get(type) ?? []) fn(event); },
    listenerCount(type) { return listeners.get(type)?.size ?? 0; }
  });
}
const point = (x = 0, y = 0, z = 0) => ({ x, y, z });
const actionsFor = { plane: { wheelBrake: {} }, car: { throttle: {} }, heli: { ascend: {} } };
function makeVehicle(kind) {
  return { actions: actionsFor[kind],
    collision: target({ position: point(10, 10, 10), velocity: point() }),
    rayCastVehicle: { wheelInfos: [{ isInContact: false, raycastResult: { hitPointWorld: point(10, 1, 10) } }] }
  };
}
function fixture(kind = 'plane') {
  const vehicle = makeVehicle(kind);
  const physics = target();
  const world = { physicsWorld: physics, physicsFrameTime: 1 / 60, isOutOfBounds: p => p.y < 0 };
  const hits = [];
  const watch = watchVehicleCrashes(world, hit => hits.push(hit));
  watch.track([vehicle]);
  return { vehicle, body: vehicle.collision, wheel: vehicle.rayCastVehicle.wheelInfos[0], physics, hits, watch };
}
function collide(body, speed, second = false, enabled = true) {
  const other = {};
  body.fire('collide', { body: other, contact: { bi: second ? other : body, bj: second ? body : other,
    ri: point(1, -1, 2), rj: point(-1, -1, -2), enabled, getImpactVelocityAlongNormal: () => speed } });
}
function steps(physics, count) { for (let i = 0; i < count; i++) physics.fire('postStep'); }

test('crash tracking attaches once per drivable vehicle and detaches on scenario changes', () => {
  const { vehicle: plane, body, hits, watch, physics } = fixture();
  const heli = makeVehicle('heli'), car = makeVehicle('car'), decoration = makeVehicle('');
  watch.track([plane, plane, heli, car, decoration]);
  assert.deepEqual([plane, heli, car, decoration].map(vehicleKind), ['plane', 'heli', 'car', '']);
  assert.equal(body.listenerCount('collide'), 1);
  assert.equal(heli.collision.listenerCount('collide'), 1);
  assert.equal(car.collision.listenerCount('collide'), 1);
  assert.equal(decoration.collision.listenerCount('collide'), 0);
  watch.track([]);
  for (const v of [plane, heli, car]) assert.equal(v.collision.listenerCount('collide'), 0);
  watch.track([plane]);
  watch.clear();
  collide(body, 18);
  steps(physics, 12);
  assert.equal(hits.length, 0);
  watch.dispose();
  assert.equal(physics.listenerCount('postStep'), 0);
});

test('a hard chassis collision emits at contact once and ignores disabled, soft, and separating contacts', () => {
  const { body, hits, physics } = fixture();
  collide(body, 4);
  collide(body, 15, false, false);
  collide(body, -20);
  assert.equal(hits.length, 0);
  collide(body, 15);
  collide(body, 18, true);
  assert.equal(hits.length, 1);
  assert.deepEqual([hits[0].x, hits[0].y, hits[0].z], [11, 9, 12]);
  assert.deepEqual(body.position, point(10, 10, 10));
  steps(physics, 140);
  collide(body, 18, true);
  assert.deepEqual([hits[1].x, hits[1].y, hits[1].z], [9, 9, 8]);
  assert.ok(hits[1].strength > hits[0].strength);
});

test('car collisions and helicopter impacts use different thresholds', () => {
  const car = fixture('car'), heli = fixture('heli');
  collide(car.body, 8);
  collide(heli.body, 4);
  assert.equal(car.hits.length, 0);
  assert.equal(heli.hits.length, 0);
  collide(car.body, 13);
  collide(heli.body, 8);
  assert.equal(car.hits.length, 1);
  assert.equal(heli.hits.length, 1);
});

test('both sides of a two-vehicle collision produce one burst at the struck surface', () => {
  const { vehicle, body, watch, hits } = fixture('car');
  const other = makeVehicle('car').collision;
  other.position = point(12, 10, 10);
  watch.track([vehicle, { actions: actionsFor.car, collision: other }]);
  const contact = { bi: body, bj: other, ri: point(1.1), rj: point(-1),
    getImpactVelocityAlongNormal: () => 13 };
  body.fire('collide', { body: other, contact });
  other.fire('collide', { body, contact });
  assert.equal(hits.length, 1);
  assert.deepEqual([hits[0].x, hits[0].y, hits[0].z], [11, 10, 10]);
});

test('wheels trigger only on a hard touchdown after air time, not road seams or a gentle landing', () => {
  for (const kind of ['plane', 'car', 'heli']) {
    const { body, wheel, physics, hits } = fixture(kind);
    body.velocity.y = -10;
    steps(physics, 2);
    wheel.isInContact = true;
    steps(physics, 1);
    assert.equal(hits.length, 0);
    wheel.isInContact = false;
    body.velocity.y = -3;
    steps(physics, 20);
    wheel.isInContact = true;
    steps(physics, 1);
    assert.equal(hits.length, 0);
    wheel.isInContact = false;
    body.velocity.y = -12;
    steps(physics, 20);
    wheel.isInContact = true;
    body.velocity.y = 0;
    steps(physics, 10);
    assert.equal(hits.length, 1);
    assert.deepEqual([hits[0].x, hits[0].y, hits[0].z], [10, 1, 10]);
  }
});

test('a falling vehicle emits before the game respawns it and does not change its velocity', () => {
  for (const kind of ['plane', 'car', 'heli']) {
    const { body, physics, hits } = fixture(kind);
    body.position.y = -1;
    body.velocity.y = -9;
    steps(physics, 1);
    assert.equal(body.velocity.y, -9);
    body.position.y = 10;
    body.velocity.y = 0;
    steps(physics, 10);
    assert.equal(hits.length, 1);
    assert.deepEqual([hits[0].x, hits[0].y, hits[0].z], [10, -1, 10]);
  }
});

test('the crash effect uses a bounded pool with lighter variants, expires, and clears on reset', () => {
  class Object3D {
    constructor() {
      this.children = [];
      this.position = { set: (x, y, z) => Object.assign(this.position, { x, y, z }) };
      this.rotation = { set() {} };
      this.scale = { setScalar() {} };
    }
    add(...nodes) { this.children.push(...nodes); }
  }
  const Geometry = class {};
  const T = { Group: Object3D, Mesh: class extends Object3D {
    constructor(geometry, material) { super(); Object.assign(this, { geometry, material }); }
  }, SphereBufferGeometry: Geometry, BoxBufferGeometry: Geometry, TorusBufferGeometry: Geometry,
  MeshBasicMaterial: class { constructor(settings) { Object.assign(this, settings); } } };
  for (const [options, max, nodes] of [[{}, 3, 25], [{ performance: true }, 2, 13], [{ reduced: true }, 2, 4]]) {
    const scene = new Object3D();
    const fx = makeCrashBursts(T, scene, options);
    for (let i = 0; i < 10; i++) fx.spawn({ ...point(i, 4, -4), strength: 1 });
    assert.equal(scene.children.length, max);
    assert.ok(scene.children.every(g => g.children.length === nodes));
    fx.update(.24);
    assert.ok(scene.children.some(g => g.visible && g.children.some(m => m.visible)));
    fx.update(1.5);
    assert.ok(scene.children.every(g => !g.visible));
    fx.spawn({ ...point(99, 1, 1), strength: 1 });
    assert.ok(scene.children.some(g => g.visible && g.position.x === 99));
    fx.clear();
    assert.ok(scene.children.every(g => !g.visible));
  }
});
