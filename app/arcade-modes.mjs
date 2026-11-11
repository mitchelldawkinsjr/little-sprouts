// One row per arcade game: free-play prompt, screen-reader hint, and which chrome it paints.
// reveal: show the word-peek button. said: speak each prompt once. stat: tally suffix (lives, clock, score).
export const ARCADE = {
  toast: { prompt: 'Tap the toasts.', aria: 'Tap that toast before it lands.', reveal: true, stat: 'lives' },
  aisle: { prompt: 'Walk the market and pick things up.', aria: 'Walk to it before time runs out.', stat: 'clock' },
  lily: { prompt: 'Hop to a lily pad.', aria: 'Hop to that lily pad.', reveal: true, stat: 'lives' },
  cube: { prompt: 'Dodge the red cubes.', aria: 'Steer into that cube.', reveal: true, said: true, stat: 'lives' },
  mole: { prompt: 'Whack the moles.', aria: 'Tap that mole before it hides.', reveal: true, said: true, stat: 'lives' },
  stack: { prompt: 'Drop the blocks.', aria: 'Drop that block on the tower.', reveal: true, stat: 'lives' },
  lamp: { prompt: 'Set the stones.', aria: 'Set that stone on the tower.', reveal: true },
  bust: { prompt: 'Bust the ghosts.', aria: 'Tap that ghost before it ducks.', reveal: true, said: true, stat: 'score' },
  hop: { prompt: 'Bounce up the leaves.', aria: 'Green leaves bounce. A wrong answer breaks.', reveal: true },
  glide: { prompt: 'Hold to climb. Grab the gems.', aria: 'Hold to climb. Let go to dive.' }
};
