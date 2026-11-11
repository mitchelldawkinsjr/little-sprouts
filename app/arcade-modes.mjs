// One row per arcade game: free-play prompt, screen-reader hint, and which chrome it paints.
// reveal: show the word-peek button. said: speak each prompt once. stat: tally suffix (lives, clock, score).
// fly: say the question without the full-screen listen lock, so steering keeps working.
export const ARCADE = {
  toast: { prompt: 'Tap the toasts.', aria: 'Tap that toast before it lands.', reveal: true, stat: 'lives' },
  aisle: { prompt: 'Walk the market and pick things up.', aria: 'Walk to it before time runs out.', stat: 'clock' },
  lily: { prompt: 'Hop to a flower pot.', aria: 'Hop to that flower pot.', reveal: true, stat: 'lives' },
  cube: { prompt: 'Dodge the red cubes.', aria: 'Steer into that cube.', reveal: true, said: true, stat: 'lives' },
  mole: { prompt: 'Whack the moles.', aria: 'Tap that mole before it hides.', reveal: true, said: true, stat: 'lives' },
  stack: { prompt: 'Drop the blocks.', aria: 'Drop that block on the tower.', reveal: true, stat: 'lives' },
  lamp: { prompt: 'Fill the firefly jar.', aria: 'Catch that glow bug into the jar.', reveal: true },
  bust: { prompt: 'Bust the ghosts.', aria: 'Tap that ghost before it ducks.', reveal: true, said: true, stat: 'score' },
  hop: { prompt: 'Bounce up the leaves.', aria: 'Green leaves bounce. A wrong answer breaks. Falls and wrong landings cost a life.', reveal: true, stat: 'lives' },
  glide: { prompt: 'Hold to climb. Grab the gems.', aria: 'Hold to climb. Let go to dive.' },
  city: { prompt: 'Fly through the rings.', aria: 'Steer through the ring with the answer.', reveal: true, said: true }
};
