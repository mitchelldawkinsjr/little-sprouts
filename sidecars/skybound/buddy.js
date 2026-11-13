/**
 * Skybound's climber is the learner's garden buddy (ADR 0001).
 *
 * The built game calls window.SproutsSkyBuddy(T, scene) with its own three.js
 * classes and uses only root.position, root.rotation, and
 * animate(time, speed, grounded, jumpHeight). If this file fails to load, the game
 * builds its own climber. The buddy faces -z like the original climber and is
 * scaled up to the same height (about 2 units).
 */
import { makeBuddy, buddyKind } from '/lib/buddy3d.mjs?v=ball2';

const SCALE = 1.6;

window.SproutsSkyBuddy = (T, scene) => {
  try {
    const buddy = makeBuddy(T, buddyKind(), { shadow: false });
    const root = new T.Group();
    root.name = 'GardenBuddyPlayer';
    buddy.group.rotation.y = Math.PI;
    buddy.group.scale.setScalar(SCALE);
    root.add(buddy.group);
    buddy.group.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(root);

    const shadow = new T.Mesh(
      new T.CircleGeometry(0.56, 32),
      new T.MeshBasicMaterial({ color: '#272c27', transparent: true, opacity: 0.17, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);

    let last = null;
    return {
      root,
      body: buddy.body,
      head: buddy.head,
      animate(time = 0, speed = 0, grounded = true, jumpHeight = 0) {
        const dt = last == null ? 0 : Math.max(0, Math.min(0.1, time - last));
        last = time;
        const run = grounded ? Math.min(1, speed / 8.7) : 0;
        buddy.animate(dt, run, time);
        if (!grounded) {
          // In the air: knees tucked, arms up.
          buddy.legs[0].rotation.x = -0.5;
          buddy.legs[1].rotation.x = -0.3;
          buddy.arms[0].rotation.x = -0.9;
          buddy.arms[1].rotation.x = -0.9;
        }
        shadow.position.set(root.position.x, root.position.y - 0.029 - jumpHeight, root.position.z);
        shadow.material.opacity = 0.18 * (1 - Math.min(jumpHeight / 5, 0.8));
        shadow.visible = jumpHeight < 5;
        const s = 1 + Math.min(jumpHeight, 4) * 0.14;
        shadow.scale.set(s, s, 1);
      },
      setColor() {},
      setEmotion() {}
    };
  } catch (err) {
    console.warn('Garden buddy unavailable; using the default climber.', err);
    return null;
  }
};
