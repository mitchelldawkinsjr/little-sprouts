import test from 'node:test';
import assert from 'node:assert/strict';
import { GARAGE, garageVehicle, garageChoice, saveGarageChoice } from '../sidecars/sketchbook/garage.mjs';
import { makeGarageBody, applyGarageVehicle, clearGarageVisuals, tuneGarageHandling } from '../sidecars/sketchbook/garage-body.mjs';
import * as T from '../vendor/three/build/three.module.js';

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
  const stock = new T.Mesh(new T.BoxGeometry(), new T.MeshStandardMaterial());
  const container = new T.Group();
  container.add(stock);
  const physics = { wheels: [{ id: 1 }] };
  const car = { modelContainer: container, rayCastVehicle: { wheelInfos: physics.wheels }, collision: physics };
  assert.equal(applyGarageVehicle(T, car, 'luxury-suv'), true);
  assert.equal(stock.visible, false);
  assert.equal(container.getObjectByName('sprouts-garage-body').children.length > 3, true);
  assert.equal(car.collision, physics);
  assert.equal(car.rayCastVehicle.wheelInfos, physics.wheels);
  const old = container.getObjectByName('sprouts-garage-body');
  const disposed = new Set();
  for (const node of old.children) node.geometry.addEventListener('dispose', () => disposed.add(node.geometry));
  for (const mat of old.userData.garageMaterials) mat.addEventListener('dispose', () => disposed.add(mat));
  applyGarageVehicle(T, car, 'sports');
  assert.equal(disposed.size, old.children.length + old.userData.garageMaterials.length);
  assert.equal(container.children.length, 2);
  applyGarageVehicle(T, car, 'classic');
  assert.equal(stock.visible, true);
  assert.equal(container.children.length, 1);
  assert.ok(makeGarageBody(T, 'buggy'));
});

test('sculpted bodies fit the stock wheelbase, have valid normals, and stay within a tablet rendering budget', () => {
  const silhouettes = new Set();
  for (const vehicle of GARAGE.filter(v => v.id !== 'classic')) {
    const body = makeGarageBody(T, vehicle.id);
    const box = new T.Box3().setFromObject(body), size = box.getSize(new T.Vector3());
    assert.ok(size.x < 1.55 && size.z < 2.95, `${vehicle.id}: coachwork must fit the original chassis`);
    assert.ok(body.children.length <= 7, `${vehicle.id}: batch details by material`);
    let count = 0;
    for (const mesh of body.children) {
      const positions = mesh.geometry.attributes.position;
      const normals = mesh.geometry.attributes.normal;
      assert.equal(positions.count, normals.count);
      assert.equal(positions.count % 3, 0);
      for (const attribute of [positions, normals]) assert.ok(attribute.array.every(Number.isFinite));
      for (let i = 0; i < normals.count; i++) {
        const magnitude = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
        assert.ok(magnitude > .98 && magnitude < 1.02, `${vehicle.id}: degenerate surface normal`);
      }
      count += positions.count;
    }
    assert.ok(count < 10000, `${vehicle.id}: keep procedural meshes lightweight`);
    silhouettes.add(body.getObjectByName('garage-paint').geometry.attributes.position.array.join(','));
  }
  assert.equal(silhouettes.size, 5, 'the new vehicles must differ in geometry as well as paint');
});

test('wheel finishes follow the stock wheels and restore their original materials without changing contacts', () => {
  const wheels = [-1, 1, -1, 1].map((side, i) => {
    const object = new T.Mesh(new T.BoxGeometry(.15, .5, .5), new T.MeshStandardMaterial());
    object.rotation.x = .4;
    return { wheelObject: object, rayCastWheelInfoIndex: i, position: new T.Vector3(side * .48, 0, 0) };
  });
  const originals = wheels.map(wheel => ({ geometry: wheel.wheelObject.geometry, material: wheel.wheelObject.material,
    rotation: wheel.wheelObject.quaternion.clone() }));
  const contacts = wheels.map(wheel => ({ chassisConnectionPointLocal: wheel.position }));
  const car = { modelContainer: new T.Group(), wheels, rayCastVehicle: { wheelInfos: contacts } };
  applyGarageVehicle(T, car, 'sports');
  const style = car.userData.sproutsGarageWheels;
  for (const [i, wheel] of wheels.entries()) {
    const face = wheel.wheelObject.getObjectByName('sprouts-garage-wheel-face');
    assert.ok(face && face.parent === wheel.wheelObject);
    assert.equal(face.geometry, style.geometry, 'share the lightweight rim mesh across all four wheels');
    assert.equal(wheel.wheelObject.geometry, originals[i].geometry);
    assert.ok(wheel.wheelObject.quaternion.equals(originals[i].rotation));
  }
  assert.equal(car.rayCastVehicle.wheelInfos, contacts);
  let disposed = 0;
  for (const resource of [style.geometry, style.rubber, style.metal]) resource.addEventListener('dispose', () => disposed++);
  applyGarageVehicle(T, car, 'classic');
  assert.equal(disposed, 3);
  for (const [i, wheel] of wheels.entries()) {
    assert.equal(wheel.wheelObject.material, originals[i].material);
    assert.equal(wheel.wheelObject.children.length, 0);
  }
  clearGarageVisuals(car);
  assert.equal(disposed, 3, 'scenario cleanup must be safe after a prior reset');
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
