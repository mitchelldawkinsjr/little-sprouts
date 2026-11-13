/**
 * Paint Sphere players are garden buddies (ADR 0001).
 *
 * The built game asks window.SproutsPaintBuddy for its player and rival models,
 * passing its own three.js classes and its toon material, so the buddy gets the
 * game's flat shading and ink outline. The model matches the game's "sheet kid":
 * limbs named armL / armR / legL / legR, a material named "Team" (the paint pack),
 * and it faces -z. If this file fails to load, the game draws its own kids.
 *
 * You are the buddy on your profile. The rival is the next buddy in the list,
 * so the two never look the same.
 */
import { makeBuddy, buddyKind, BUDDIES } from '/lib/buddy3d.mjs?v=ball2';

window.SproutsPaintBuddy = (T, toon, mine) => {
  try {
    const own = buddyKind();
    const kind = mine ? own : BUDDIES[(BUDDIES.indexOf(own) + 1) % BUDDIES.length];
    const buddy = makeBuddy(T, kind, { material: (color) => toon(color), shadow: false });
    buddy.arms[0].name = 'armL';
    buddy.arms[1].name = 'armR';
    buddy.legs[0].name = 'legL';
    buddy.legs[1].name = 'legR';
    // The paint pack on the buddy's back takes the team color.
    const pack = new T.Mesh(new T.SphereGeometry(0.17, 16, 12), toon(mine ? 0x3a9cff : 0xff5c9a, 'Team'));
    pack.scale.set(1.1, 1.25, 0.7);
    pack.position.set(0, 0.5, -0.27);
    buddy.body.add(pack);
    const root = new T.Group();
    root.userData.sheetKid = true;
    root.userData.buddy = kind;
    buddy.group.rotation.y = Math.PI;
    buddy.group.scale.setScalar(1.3);
    root.add(buddy.group);
    return root;
  } catch (err) {
    console.warn('Garden buddy unavailable; using the default kids.', err);
    return null;
  }
};
