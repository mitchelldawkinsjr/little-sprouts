// Lightweight original vehicle silhouettes. Visuals are attached to Sketchbook's
// existing car chassis; collision, wheel rays and crash detection stay untouched.
import { garageVehicle } from './garage.mjs';
import { makeGarageBody, makeGarageWheelFace } from './garage-models.mjs?v=sculpted1';
export { makeGarageBody };

export function clearGarageVisuals(car) {
  const container = car?.modelContainer;
  const old = container?.getObjectByName('sprouts-garage-body');
  if (old) {
    container.remove(old);
    old.traverse(node => node.geometry?.dispose?.());
    for (const material of old.userData.garageMaterials) material.dispose();
  }
  const wheels = car?.userData?.sproutsGarageWheels;
  if (wheels) {
    for (const { mesh, material } of wheels.originals) mesh.material = material;
    for (const face of wheels.faces) face.parent?.remove(face);
    wheels.geometry.dispose();
    wheels.rubber.dispose();
    wheels.metal.dispose();
    delete car.userData.sproutsGarageWheels;
  }
  for (const child of container?.userData.sproutsGarageOriginal || []) child.visible = true;
}

function dressWheels(T, car) {
  if (!car.wheels?.length) return;
  const geometry = makeGarageWheelFace(T);
  const rubber = new T.MeshStandardMaterial({ color: 0x252e38, roughness: .85, metalness: .02 });
  const metal = new T.MeshStandardMaterial({ color: 0xb6c5ce, roughness: .27, metalness: .65, side: 2 });
  const originals = [], faces = [];
  for (const wheel of car.wheels) {
    const root = wheel.wheelObject;
    root.traverse(mesh => {
      if (mesh.isMesh) { originals.push({ mesh, material: mesh.material }); mesh.material = rubber; }
    });
    const hub = car.rayCastVehicle.wheelInfos[wheel.rayCastWheelInfoIndex]?.chassisConnectionPointLocal;
    const side = Math.sign(hub?.x ?? wheel.position.x);
    root.geometry?.computeBoundingBox();
    const box = root.geometry?.boundingBox;
    const face = new T.Mesh(geometry, metal);
    face.name = 'sprouts-garage-wheel-face';
    face.position.x = box ? (side > 0 ? box.max.x + .003 : box.min.x - .003) : side * .125;
    face.rotation.y = side * Math.PI / 2;
    root.add(face);
    faces.push(face);
  }
  car.userData.sproutsGarageWheels = { originals, faces, geometry, rubber, metal };
}

export function tuneGarageHandling(car, choice) {
  const ray = car?.rayCastVehicle;
  if (!ray?.wheelInfos?.length) return false;
  const selected = garageVehicle(choice);
  if (!ray.userData) ray.userData = {};
  let stock = ray.userData.sproutsGarageStock;
  if (!stock) {
    stock = {
      wheels: ray.wheelInfos.map(w => ({
        frictionSlip: w.frictionSlip,
        suspensionStiffness: w.suspensionStiffness,
        suspensionRestLength: w.suspensionRestLength,
        dampingCompression: w.dampingCompression,
        dampingRelaxation: w.dampingRelaxation
      })),
      engine: ray.applyEngineForce,
      steer: ray.setSteeringValue
    };
    ray.userData.sproutsGarageStock = stock;
    if (typeof stock.engine === 'function') {
      ray.applyEngineForce = function(force, index) {
        return stock.engine.call(this, force * (this.userData.sproutsGarageSpeed ?? 1), index);
      };
    }
    if (typeof stock.steer === 'function') {
      ray.setSteeringValue = function(angle, index) {
        return stock.steer.call(this, angle * (this.userData.sproutsGarageSteer ?? 1), index);
      };
    }
  }
  ray.userData.sproutsGarageSpeed = selected.speed;
  ray.userData.sproutsGarageSteer = selected.grip;
  ray.wheelInfos.forEach((wheel, index) => {
    const original = stock.wheels[index];
    for (const field of ['frictionSlip', 'suspensionStiffness', 'suspensionRestLength', 'dampingCompression', 'dampingRelaxation']) {
      if (!Number.isFinite(original[field])) continue;
      const multiplier = field === 'frictionSlip' ? selected.grip
        : field === 'suspensionRestLength' ? selected.suspension
        : field === 'suspensionStiffness' ? 1 / selected.suspension
        : Math.sqrt(1 / selected.suspension);
      wheel[field] = original[field] * multiplier;
    }
  });
  return true;
}

export function applyGarageVehicle(T, car, choice) {
  if (!car || !car.modelContainer || !car.rayCastVehicle?.wheelInfos?.length) return false;
  const selected = garageVehicle(choice);
  tuneGarageHandling(car, selected.id);
  const container = car.modelContainer;
  if (!container.userData.sproutsGarageOriginal) {
    container.userData.sproutsGarageOriginal = [...container.children];
  }
  clearGarageVisuals(car);
  car.userData ??= {};
  for (const child of container.userData.sproutsGarageOriginal) child.visible = selected.id === 'classic';
  if (selected.id !== 'classic') {
    container.add(makeGarageBody(T, selected.id));
    dressWheels(T, car);
  }
  // Preserve stock Cannon chassis and its wheel contact behavior. Modify only
  // motor and steering inputs using the catalog's bounded driving characteristics.
  car.userData.sproutsGarageId = selected.id;
  return true;
}
