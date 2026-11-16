// Plane-only, visual crash detection over Sketchbook's existing Cannon callbacks.
// Speed values tune the arcade effect. They don't alter the engine or vehicle state.
const CHASSIS_HIT = 8;
const WHEEL_HIT = 8;
const REPEAT_DELAY = 2.2;
const CLEAR_AIR = .20;

const finitePoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
export const isPlane = vehicle => !!vehicle?.actions?.wheelBrake;

export function watchPlaneCrashes(world, onCrash) {
  const physics = world.physicsWorld;
  const tracked = new Map();
  let time = 0;

  function emit(state, point, speed) {
    if (!finitePoint(point) || !Number.isFinite(speed) || time < state.next) return;
    state.next = time + REPEAT_DELAY;
    onCrash({ x: point.x, y: point.y, z: point.z, strength: Math.min(1.65, 1.02 + speed / 38) });
  }

  function step() {
    const dt = world.physicsFrameTime || 1 / 60;
    time += dt;
    for (const [body, state] of tracked) {
      const { position, velocity } = body;
      const wheel = state.wheels.find(w => w.isInContact);
      // Wheel rays don't dispatch chassis contact. Only count a hard touchdown
      // after sustained air time, so runway seams and ordinary landings stay quiet.
      if (wheel && state.air >= CLEAR_AIR && state.vy <= -WHEEL_HIT) {
        emit(state, wheel.raycastResult?.hitPointWorld || position, -state.vy);
      }
      state.air = wheel ? 0 : state.air + dt;
      state.vy = velocity.y;

      // This runs inside Cannon, before Sketchbook teleports vehicles it
      // finds out of bounds. Don't emit at the runway respawn point.
      if (world.isOutOfBounds(position)) {
        const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
        if (speed >= CHASSIS_HIT || velocity.y <= -4.5) emit(state, position, speed);
        state.air = 0;
        state.vy = 0;
      }
    }
  }

  function clear() {
    for (const [body, state] of tracked) body.removeEventListener('collide', state.hit);
    tracked.clear();
  }

  physics.addEventListener('postStep', step);
  return {
    track(vehicles) {
      const planes = new Set();
      for (const vehicle of vehicles) {
        if (!isPlane(vehicle) || !vehicle.collision) continue;
        const body = vehicle.collision;
        planes.add(body);
        if (tracked.has(body)) continue;
        const state = { next: 0, air: 0, vy: 0, wheels: vehicle.rayCastVehicle?.wheelInfos ?? [] };
        state.hit = ({ contact }) => {
          // Cannon dispatches the new contact before solving its impulse.
          if (!contact || contact.enabled === false || (contact.bi !== body && contact.bj !== body)) return;
          const speed = contact.getImpactVelocityAlongNormal();
          if (!(speed >= CHASSIS_HIT)) return;
          const first = contact.bi === body;
          const other = first ? contact.bj : contact.bi;
          // Prefer the struck surface point to avoid burying the visual in penetration.
          const surface = first ? contact.rj : contact.ri;
          const useSurface = finitePoint(other?.position) && finitePoint(surface);
          const offset = useSurface ? surface : first ? contact.ri : contact.rj;
          if (!finitePoint(offset)) return;
          const p = useSurface ? other.position : body.position;
          emit(state, { x: p.x + offset.x, y: p.y + offset.y, z: p.z + offset.z }, speed);
        };
        body.addEventListener('collide', state.hit);
        tracked.set(body, state);
      }
      for (const [body, state] of tracked) {
        if (planes.has(body)) continue;
        body.removeEventListener('collide', state.hit);
        tracked.delete(body);
      }
    },
    clear,
    dispose() {
      clear();
      physics.removeEventListener('postStep', step);
    }
  };
}

// Reuse a bounded pool of scene meshes. No textures, lights, screen flashes, or physics bodies.
export function makeCrashBursts(T, scene, { performance = false, reduced = false } = {}) {
  const limit = performance || reduced ? 2 : 3;
  const bursts = [];
  let sphere, shard, circle, material;
  const solid = color => new T.MeshBasicMaterial({ color });
  const fade = color => new T.MeshBasicMaterial({ color, transparent: true, depthWrite: false });

  function makeBurst() {
    sphere ??= new T.SphereBufferGeometry(1, 9, 6);
    if (!reduced) {
      shard ??= new T.BoxBufferGeometry(.13, .12, .55);
      if (!performance) circle ??= new T.TorusBufferGeometry(1, .035, 5, 24);
    }
    material ??= { amber: solid(0xff923b), gold: solid(0xffcf64), spark: solid(0xffb84b) };
    const group = new T.Group();
    group.name = 'sketchbook-plane-crash';
    scene.add(group);
    const mesh = (geometry, mat) => {
      const m = new T.Mesh(geometry, mat);
      group.add(m);
      return m;
    };
    const core = Array.from({ length: reduced ? 2 : performance ? 3 : 5 }, (_, i) =>
      mesh(sphere, i % 2 ? material.gold : material.amber));
    const ring = circle ? mesh(circle, fade(0xffbe65)) : null;
    if (ring) ring.rotation.x = -Math.PI / 2;
    const smoke = Array.from({ length: reduced ? 2 : performance ? 4 : 7 }, (_, i) =>
      mesh(sphere, fade(i % 2 ? 0x5b535d : 0x817177)));
    const sparks = Array.from({ length: reduced ? 0 : performance ? 6 : 12 }, () => mesh(shard, material.spark));
    return { group, core, ring, smoke, sparks, age: 0, strength: 1, phase: 0 };
  }

  function place(b) {
    const { age: t, strength: s, phase } = b;
    const bloom = reduced ? .45 : Math.min(1, t / .12);
    const ember = (1 - Math.max(0, (t - .13) / .29)) * s;
    b.core.forEach((m, i) => {
      m.visible = t < .42;
      const a = phase + i * 2.39996;
      const spread = i ? (.25 + bloom * (i % 2 ? 1.19 : 1.45)) * s : 0;
      m.position.set(Math.cos(a) * spread, (.45 + i % 3 * .38) * s, Math.sin(a) * spread);
      const size = i ? .42 + i % 3 * .075 : 1;
      m.scale.setScalar(Math.max(.001, ember * (.52 + bloom * 1.55) * size));
    });
    if (b.ring) {
      b.ring.visible = t < .55;
      b.ring.position.y = .12;
      b.ring.scale.setScalar((1.0 + 7.5 * t) * s);
      b.ring.material.opacity = Math.max(0, .60 * (1 - t / .55));
    }
    b.sparks.forEach((m, i) => {
      const a = phase + i * 2.39996;
      const reach = (.20 + t * (5.4 + i % 4 * .82)) * s;
      m.visible = t < .63;
      m.position.set(Math.cos(a) * reach, (.30 + t * (2 + i % 3) - 2.9 * t * t) * s, Math.sin(a) * reach);
      m.rotation.set(t * 7 + i, -a, t * 4 + i);
      m.scale.setScalar(Math.max(.001, (1 - t / .65) * s));
    });
    b.smoke.forEach((m, i) => {
      const age = t - i * .045;
      const a = phase + i * 2.39996;
      const swell = Math.max(0, age);
      const drift = reduced ? .43 * i : (.42 + swell * (1.2 + i % 3 * .25));
      m.visible = age >= 0 && age < 1.09;
      m.position.set(Math.cos(a) * drift * s, (reduced ? .65 + i * .38 : .51 + swell * (1.55 + .15 * i)) * s, Math.sin(a) * drift * s);
      m.scale.setScalar((.56 + (reduced ? .17 : swell * .88)) * s);
      m.material.opacity = Math.max(0, Math.min(.64, age * 4) * (1 - age / 1.09));
    });
  }

  return {
    spawn({ x, y, z, strength }) {
      let burst = bursts.find(b => !b.group.visible);
      if (!burst && bursts.length < limit) {
        burst = makeBurst();
        bursts.push(burst);
      }
      if (!burst) burst = bursts.reduce((a, b) => a.age > b.age ? a : b);
      burst.age = 0;
      burst.strength = strength;
      burst.phase = x + z;
      burst.group.position.set(x, y, z);
      burst.group.visible = true;
      place(burst);
    },
    update(dt) {
      if (!(dt > 0)) return;
      for (const b of bursts) {
        if (!b.group.visible) continue;
        b.age += dt;
        if (b.age >= 1.42) b.group.visible = false;
        else place(b);
      }
    },
    clear() {
      for (const b of bursts) b.group.visible = false;
    }
  };
}
