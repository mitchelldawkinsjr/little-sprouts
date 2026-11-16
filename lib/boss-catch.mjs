/** Boss Chase's jaw grab, shared by any game using the boss and garden buddy rigs. */
export const BOSS_CHOMP_SECONDS = 1.4;

export function bossLungeBlend(age, dt) {
  return Math.min(1, age * 2) * dt * 5;
}

export function makeBossCatch(buddy) {
  let hold = null;
  function release() {
    if (!hold) return;
    buddy.removeFromParent();
    hold.parent?.add(buddy);
    buddy.position.copy(hold.position);
    buddy.rotation.copy(hold.rotation);
    buddy.scale.copy(hold.scale);
    hold = null;
  }
  return {
    get rig() { return hold?.rig; },
    grab(rig, size = .8, yaw = 0) {
      release();
      hold = {
        rig, parent: buddy.parent, position: buddy.position.clone(),
        rotation: buddy.rotation.clone(), scale: buddy.scale.clone()
      };
      buddy.visible = true;
      rig.holder.add(buddy);
      buddy.position.set(0, 0, 0);
      buddy.rotation.set(0, yaw, 0);
      rig.holder.getWorldScale(buddy.scale);
      buddy.scale.setScalar(size / buddy.scale.x);
    },
    wriggle(hero, time) {
      // Same flailing legs and reaching arms as in the original Boss Chase catch.
      hero.legs[0].rotation.x = Math.sin(time * 18) * .9;
      hero.legs[1].rotation.x = -hero.legs[0].rotation.x;
      hero.arms[0].rotation.x = -2 + Math.sin(time * 14) * .6;
      hero.arms[1].rotation.x = -2 - Math.sin(time * 14) * .6;
    },
    release
  };
}
