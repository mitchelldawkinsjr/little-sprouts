// Original short melodic patterns generated with Web Audio. No music downloads required.
// Sequences use diatonic semitone offsets from each theme's root; -1 is a rest.
const PRESETS = {
  meadow: { root: 261.63, bpm: 84, notes: [0,-1,4,-1,7,-1,4,-1,2,-1,5,-1,7,-1,4,-1], bass: [0,5,7,5], ambience: 'birds' },
  arcade: { root: 293.66, bpm: 114, notes: [0,4,7,4,2,5,9,5,0,4,9,7,5,4,2,-1], bass: [0,7,5,7], ambience: 'sparkle' },
  drive: { root: 196, bpm: 128, notes: [0,-1,7,5,4,-1,7,9,5,-1,4,2,0,-1,7,-1], bass: [0,5,7,5], ambience: 'wind' },
  sky: { root: 329.63, bpm: 96, notes: [0,-1,2,7,9,-1,7,4,5,-1,4,2,7,-1,5,-1], bass: [0,5,9,7], ambience: 'wind' },
  chase: { root: 220, bpm: 124, notes: [0,-1,3,0,5,-1,3,7,0,3,5,-1,7,5,3,-1], bass: [0,3,5,7], ambience: 'wind' },
  puzzle: { root: 261.63, bpm: 76, notes: [0,-1,-1,7,4,-1,-1,2,5,-1,4,-1,2,-1,0,-1], bass: [0,5,7,5], ambience: 'sparkle' }
};

const IDS = {
  drive: ['sketchbook','race','lanes','rocket','city','glide','bike','rally','dash','canyon-pods','deliveries'],
  sky: ['skybound','sky','flight','moon-swing','planet','lunar','hoop'],
  chase: ['boss','chase','pinecone-trail','ink-trail','gulp','cube','hop','pebble'],
  puzzle: ['puzzle','match','maze','roll','sort','merge','crayon','words','build','missing','verse','clue','quickmath'],
  meadow: ['blocks','grass','walk','cabin','lily','path','paint','station','fishing','aisle','inkwave']
};
export function themeForGame(id) {
  for (const [theme, names] of Object.entries(IDS)) if (names.includes(id)) return theme;
  return 'arcade';
}
export function audioPreset(id) { return PRESETS[PRESETS[id] ? id : themeForGame(id)]; }
export const hzForNote = (root, offset) => root * Math.pow(2, offset / 12);
