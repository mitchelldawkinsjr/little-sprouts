// Lightweight original vehicle silhouettes. Visuals are attached to Sketchbook's
// existing car chassis; collision, wheel rays and crash detection stay untouched.
import { garageVehicle } from './garage.mjs';

const proportions = {
  sedan: [1.72, .55, 3.65, .72],
  suv: [1.92, .82, 3.9, .88],
  coupe: [1.83, .43, 3.85, .55],
  wedge: [1.91, .36, 4.05, .44],
  muscle: [1.88, .57, 4.08, .61],
  buggy: [1.62, .37, 3.45, .65]
};

export function makeGarageBody(T, choice) {
  const vehicle = garageVehicle(choice);
  const [width, height, length, cabin] = proportions[vehicle.shape];
  const group = new T.Group();
  group.name = 'sprouts-garage-body';
  const paint = new T.MeshStandardMaterial({ color: vehicle.color, roughness: .45, metalness: .22 });
  const glass = new T.MeshStandardMaterial({ color: 0x263c55, roughness: .26, metalness: .1 });
  const trim = new T.MeshStandardMaterial({ color: 0x20232b, roughness: .85 });
  const lights = new T.MeshBasicMaterial({ color: 0xfff3bb });
  function box(w, h, d, x, y, z, material) {
    const mesh = new T.Mesh(new T.BoxBufferGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  box(width, height, length, 0, .12, 0, paint);
  if (vehicle.shape === 'buggy') {
    box(width * .72, .12, length * .6, 0, .45, 0, trim);
    for (const x of [-.57, .57]) box(.09, .65, .09, x, .72, -.55, trim);
    box(1.25, .08, .1, 0, 1.05, -.55, trim);
  } else {
    const top = box(width * (vehicle.shape === 'suv' ? .86 : .76),
      cabin, length * (vehicle.shape === 'suv' ? .57 : .43),
      0, .12 + height / 2 + cabin / 2, vehicle.shape === 'muscle' ? -.28 : .1, glass);
    if (vehicle.shape === 'wedge') top.rotation.x = -.17;
    box(width * .7, .06, .08, 0, .12 + height / 2 + cabin + .06, -.12, paint);
  }
  for (const x of [-width * .37, width * .37]) {
    box(.25, .14, .06, x, .15, length / 2 + .025, lights);
    box(.27, .12, .06, x, .15, -length / 2 - .025, trim);
  }
  if (vehicle.shape === 'wedge' || vehicle.shape === 'muscle') {
    box(width * .9, .09, .25, 0, .5, -length / 2 + .12, paint);
  }
  group.userData.garageMaterials = [paint, glass, trim, lights];
  return group;
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
  const old = container.getObjectByName('sprouts-garage-body');
  if (old) {
    container.remove(old);
    old.traverse(node => node.geometry?.dispose?.());
    for (const mat of old.userData.garageMaterials || []) mat.dispose();
  }
  for (const child of container.userData.sproutsGarageOriginal) child.visible = selected.id === 'classic';
  if (selected.id !== 'classic') container.add(makeGarageBody(T, selected.id));
  // Preserve stock Cannon chassis and its wheel contact behavior. Modify only
  // motor and steering inputs using the catalog's bounded driving characteristics.
  car.userData ??= {};
  car.userData.sproutsGarageId = selected.id;
  return true;
}
