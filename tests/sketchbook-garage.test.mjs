import test from 'node:test';
import assert from 'node:assert/strict';
import { GARAGE, garageVehicle, garageChoice, saveGarageChoice } from '../sidecars/sketchbook/garage.mjs';
import { makeGarageBody, applyGarageVehicle, tuneGarageHandling } from '../sidecars/sketchbook/garage-body.mjs';

test('garage offers six distinct vehicles and safely persists selections', () => {
  assert.equal(GARAGE.length, 6);
  assert.equal(new Set(GARAGE.map(v => v.shape)).size, 6);
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, val) => data.set(key, val) };
  assert.equal(saveGarageChoice(storage, 'luxury-suv').id, 'luxury-suv');
  assert.equal(garageChoice(storage).id, 'luxury-suv');
  assert.equal(garageVehicle('unknown').id, 'classic');
  assert.equal(saveGarageChoice(null, 'sports').id, 'sports');
});

test('garage bodies are original geometry and swapping retains car physics', () => {
  class Node {
    constructor() { this.children = []; this.userData = {}; this.position = { set() {} }; this.rotation = {}; }
    add(child) { this.children.push(child); child.parent = this; }
    remove(child) { this.children = this.children.filter(c => c !== child); }
    getObjectByName(name) { return this.children.find(c => c.name === name); }
    traverse(fn) { fn(this); for (const child of this.children) child.traverse?.(fn); }
  }
  class Mesh extends Node { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } }
  class Material { constructor(options) { this.options = options; } dispose() {} }
  class Geometry { constructor(...dimensions) { this.dimensions = dimensions; } dispose() {} }
  const T = { Group: Node, Mesh, MeshStandardMaterial: Material, MeshBasicMaterial: Material, BoxBufferGeometry: Geometry };
  const stock = new Node();
  const container = new Node();
  container.add(stock);
  const physics = { wheels: [{ id: 1 }] };
  const car = { modelContainer: container, rayCastVehicle: { wheelInfos: physics.wheels }, collision: physics };
  assert.equal(applyGarageVehicle(T, car, 'luxury-suv'), true);
  assert.equal(stock.visible, false);
  assert.equal(container.getObjectByName('sprouts-garage-body').children.length > 3, true);
  assert.equal(car.collision, physics);
  assert.equal(car.rayCastVehicle.wheelInfos, physics.wheels);
  applyGarageVehicle(T, car, 'sports');
  assert.equal(container.children.length, 2);
  applyGarageVehicle(T, car, 'classic');
  assert.equal(stock.visible, true);
  assert.equal(container.children.length, 1);
  assert.ok(makeGarageBody(T, 'buggy'));
});

test('handling changes motor, steering and suspension without changing collision', () => {
  const calls = [];
  const wheels = Array.from({ length: 4 }, () => ({
    frictionSlip: 5, suspensionStiffness: 20, suspensionRestLength: .3,
    dampingCompression: 4, dampingRelaxation: 5
  }));
  const ray = {
    wheelInfos: wheels,
    applyEngineForce(force, index) { calls.push(['engine', force, index]); },
    setSteeringValue(angle, index) { calls.push(['steer', angle, index]); }
  };
  const car = { rayCastVehicle: ray, collision: { id: 'unchanged' } };
  assert.equal(tuneGarageHandling(car, 'sports'), true);
  ray.applyEngineForce(100, 2);
  ray.setSteeringValue(.5, 0);
  assert.equal(calls[0][1], 120);
  assert.equal(calls[1][1], .57);
  assert.equal(wheels[0].frictionSlip, 5 * 1.14);
  assert.equal(wheels[0].suspensionRestLength, .3 * .88);
  tuneGarageHandling(car, 'classic');
  ray.applyEngineForce(100, 2);
  assert.equal(calls[2][1], 100);
  assert.equal(wheels[0].frictionSlip, 5);
  assert.equal(wheels[0].suspensionRestLength, .3);
  assert.deepEqual(car.collision, { id: 'unchanged' });
  assert.equal(ray.userData.sproutsGarageStock.engine !== ray.applyEngineForce, true);
});
