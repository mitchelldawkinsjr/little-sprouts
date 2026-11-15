// Cloudkeep on a phone or tablet: a thumb joystick instead of the four arrow buttons.
//
// The left half of the screen is the flying stick (lib/touch-controls.mjs): push up to fly
// forward, down to fly back, and sideways to slide. It is analog, so a small push flies slowly.
// The right half stays the game's own: drag the sky to steer. Rise, Lower, Boost, Capture, and
// Lure stay as the game's buttons on the right.
//
// The -sprouts5+ bundle reads globalThis.__skyStick = { t, s } (throttle and strafe, -1..1) and
// leaves touches on the left half to the stick instead of starting a sky drag.

import { attachTouchControls, isTouchDevice } from '/lib/touch-controls.mjs?v=touch3';

if (isTouchDevice()) {
  const style = document.createElement('style');
  // The stick replaces the arrow buttons; the rest of the buttons sit together on the right.
  style.textContent = '.dpad{display:none!important}'
    + '@media (width<=700px),(pointer:coarse){.touch-controls:not([hidden]){justify-content:flex-end!important;left:auto!important}}';
  document.head.append(style);

  const stick = { t: 0, s: 0 };
  globalThis.__skyStick = stick;
  const touch = attachTouchControls({
    move: true,
    half: 'left',
    hints: { move: 'Fly' },
    tint: '#efb74a',
    // The question banner, dialogs, and the game's own buttons keep their taps.
    ignore: '#ac-banner, dialog, .touch-controls, .hud-top',
  });

  const playing = () => document.body.classList.contains('playing') && !document.querySelector('dialog[open]');
  const loop = () => {
    const on = playing();
    touch.setVisible(on);
    touch.update();
    const m = on ? touch.move : null;
    stick.t = m?.active ? -m.y : 0;
    stick.s = m?.active ? m.x : 0;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
