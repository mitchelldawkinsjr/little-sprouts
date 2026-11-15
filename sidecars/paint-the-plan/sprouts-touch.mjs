// INKWAVE on a phone or tablet, through the Little Sprouts touch controls (lib/touch-controls.mjs).
//
// The match already reads a standard controller (src/core/input.js), so the touch sticks and
// buttons show up to it as one: no change to the game's own code.
//
//   Left thumb, left half       move
//   Right thumb, right half     look around; pushed out, it also shoots ink
//   🖌 (right trigger)          shoot ink while standing still
//   ⬆️ (A)                      jump
//   🦑 (left trigger)           swim in your ink, and refill
//   ✨ (Y)                      special, when it is ready
//
// The sticks and buttons hide while a menu, the pause screen, or a question card is up.
// A real controller, when one is plugged in, still comes first.

import { attachTouchGamepad, isTouchDevice } from '/lib/touch-controls.mjs?v=touch3';

if (isTouchDevice()) {
  // A phone on its side, with the game framed in the app, is short: smaller buttons leave room to look.
  const r = innerHeight < 420 ? 38 : 48;
  const touch = attachTouchGamepad({
    aim: true,
    fire: 'rt',
    buttons: [
      { button: 'rt', label: '🖌', slot: 0, radius: r },
      { button: 'a', label: '⬆️', slot: 1, radius: r },
      { button: 'lt', label: '🦑', slot: 2, radius: r },
      { button: 'y', label: '✨', slot: 3, radius: r },
    ],
    hints: { move: 'Move', aim: 'Look' },
    tint: '#ff8a14',
    ignore: '#sprouts-quiz, #ui-root .menu, #ui-root button',
  });

  const inMatch = () => {
    const game = window.__inkwave;
    const match = game?.match;
    return window.__G?.mode === 'match' && !!match && !match.attract && !match.paused && !game.menus?.current;
  };
  const tick = () => {
    const on = inMatch();
    touch.setVisible(on);
    // In a menu or a question card, a stray thumb shouldn't walk the menu focus around.
    if (!on) touch.touch.reset();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
