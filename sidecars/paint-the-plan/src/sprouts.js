// INKWAVE inside Little Sprouts (turf-riot.html?sprouts=1): straight into a match, with this
// learner's questions worked into the play.
//
//   Super ink   Every so often the match pauses for a question. A right answer fills your
//               special and your ink tank at once.
//   Splatted    When you get splatted, a question comes up. A right answer jumps you back in,
//               charged up. The match waits while you answer.
//
// A wrong answer leaves the same question up until the right one is picked. When the match
// ends, the results show for a moment and then Little Sprouts shows the stars.
import { G } from './core/ctx.js';
import { PLAYER } from './config.js';
import { makeQuiz } from '/lib/sidecar-quiz.mjs?v=quiz1';

const SUPER_EVERY = 40;   // seconds of play between Super ink questions
const FIRST_SUPER = 15;   // the first one comes sooner
const RESULTS_HOLD = 6000;

export function initSprouts(game) {
  const quiz = makeQuiz();
  if (!quiz.live) return null;
  let superT = SUPER_EVERY - FIRST_SUPER;
  let over = false;

  const local = () => game.match?.local;
  const playing = () => !!game.match && !game.match.attract && game.match.state === 'playing';

  function charge(actor) {
    if (!actor) return;
    actor.special = actor.specialCost();
    actor.ink = PLAYER.inkMax;
    G.audio?.play('special_ready');
    game.hud?.banner('special', 'SUPER INK!');
  }

  /** Pause the match, show the question, and resume once it is answered right. */
  async function askPaused(title, note) {
    const match = game.match;
    // Playing a friend: the match can't stop for one player, so the card holds this player still
    // and safe instead (src/friend.js) while the match goes on.
    const shared = !!game.friend?.live;
    if (!shared) match.paused = true;
    game.input.exitLock();
    G.audio?.duck?.(0.4, 99);
    await quiz.ask({ title, note });
    G.audio?.duck?.(1, 0.2);
    if (game.match === match) match.paused = false;
    return game.match === match;
  }

  return {
    get busy() { return quiz.busy; },
    splatted(actor) {
      if (!actor?.isLocal || quiz.cleared || quiz.busy || !playing()) return;
      actor.sproutsHold = true;
      askPaused('Splatted!', 'Answer right to jump back in with super ink.').then(still => {
        actor.sproutsHold = false;
        if (!still) return;
        actor.respawnTimer = Math.min(actor.respawnTimer, 0.4);
        actor.sproutsCharge = true;
      });
    },
    tick(dt) {
      const me = local();
      if (me?.sproutsCharge && me.alive) { me.sproutsCharge = false; charge(me); }
      if (!playing() || game.match.paused || quiz.busy || quiz.cleared || !me?.alive) return;
      superT += dt;
      if (superT < SUPER_EVERY) return;
      superT = 0;
      askPaused('Super ink!', 'Answer right to fill your special and your ink.').then(still => { if (still) charge(local()); });
    },
    matchOver(won) {
      if (over) return;
      over = true;
      quiz.progress(won ? 'Your team won!' : 'Good match!');
      setTimeout(() => quiz.finish('round'), RESULTS_HOLD);
    },
    quit() { quiz.quit(); },
  };
}
