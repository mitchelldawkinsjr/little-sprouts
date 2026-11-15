// Tidewater inside Little Sprouts: when a fish takes the bait, this learner's question comes up.
// A right answer hooks the fish (no tricky timing for little hands); a wrong one leaves the same
// question up until the right one is picked, and the fish waits. On its own page there are no
// questions and the strike works as the game made it.
import { makeQuiz } from '/lib/sidecar-quiz.mjs?v=quiz1';

const quiz = makeQuiz();

if (quiz.live) {
  window.__sproutsTake = (fishing, bite) => {
    if (quiz.cleared || quiz.busy) return;
    bite.held = true;
    // The card needs the mouse back.
    try { document.exitPointerLock?.(); } catch { /* not locked */ }
    quiz.ask({ title: 'A fish took the bait!', note: 'Answer right to hook it.' }).then(() => {
      if (fishing.bite !== bite) return;
      bite.held = false;
      fishing.strike();
      quiz.progress('Fish on!');
    });
  };
}
