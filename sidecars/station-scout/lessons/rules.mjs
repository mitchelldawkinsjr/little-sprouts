export const skyMissions = [
  {clue:'Bring three lanterns to the lighthouse.',stock:6,required:3,already:0,stops:[0],item:'lantern',symbol:'🏮'},
  {clue:'The lighthouse needs six lanterns. Two are already there. Load only what is missing.',stock:8,required:4,already:2,stops:[0],item:'lantern',symbol:'🏮'},
  {clue:'Load all 12 seed bags. Give the same number to each of three gardens.',stock:12,required:4,already:0,stops:[0,2,1],item:'seed bag',symbol:'🌱'}
];
export const freight = (m, selected, delivered=0) => {
  const n=Math.max(0,Math.floor(selected));
  return {remaining:m.required-(n+delivered),ok:n+delivered===m.required};
};
export const paintMissions = [
  {columns:4,rows:3,target:6,pre:0,goal:'Paint exactly six tiles.'},
  {columns:4,rows:3,target:6,pre:0,goal:'Paint half of the 12 equal tiles.'},
  {columns:4,rows:4,target:12,pre:5,goal:'Five of 16 tiles are painted. Make the coverage three quarters.'}
];
export function paintTile(set, index, n, paint=true) {
  if(!Number.isInteger(index)||index<0||index>=n)return false;
  if(paint){const before=set.size;set.add(index);return set.size!==before;}
  return set.delete(index);
}
export const departures = [
  {id:'circle', icon:'🔴', name:'Hanamidai',time:'10:05',minutes:605},
  {id:'triangle', icon:'🔺', name:'Kasugano',time:'10:12',minutes:612},
  {id:'square', icon:'🟦', name:'Hanamidai',time:'10:20',minutes:620}
];
export const nextDeparture=(name,after,list=departures)=>list.filter(x=>x.name===name&&x.minutes>=after).sort((a,b)=>a.minutes-b.minutes)[0]?.id;
export const samples = {
  pier:[{species:'sergeant', marks:'dark stripes',kg:.18},{species:'grunt',marks:'blue stripes',kg:.54},{species:'silverside',marks:'silver sides',kg:.055}],
  reef:[{species:'tang',marks:'plain blue',kg:.31},{species:'yellowtail',marks:'a yellow stripe',kg:.61},{species:'chromis',marks:'plain blue',kg:.064}]
};

// Fresh missions each time, so the same level is never the same puzzle twice.
const pickOne = (list, rand = Math.random) => list[Math.floor(rand() * list.length)];
const WORDS = { 2: 'half', 3: 'a third', 4: 'a quarter' };
const SHARE = { '1/2': 'one half', '1/3': 'one third', '2/3': 'two thirds', '1/4': 'one quarter', '3/4': 'three quarters' };
/** Discover: count tiles. Practice: a unit fraction of the court. Challenge: some tiles start painted. */
export function makePaintMission(level, rand = Math.random) {
  if (level <= 0) {
    const [columns, rows] = pickOne([[3, 3], [4, 3], [4, 2]], rand);
    const target = 2 + Math.floor(rand() * (columns * rows - 3));
    return { columns, rows, target, pre: 0, goal: `Paint exactly ${target} tiles.`, done: `${target} tiles, just right.` };
  }
  if (level === 1) {
    const [columns, rows, parts] = pickOne([[4, 3, 2], [4, 2, 2], [3, 3, 3], [4, 3, 3], [4, 3, 4], [4, 4, 4], [4, 4, 2]], rand);
    const n = columns * rows;
    return { columns, rows, target: n / parts, pre: 0, goal: `Paint ${WORDS[parts]} of the ${n} equal tiles.`, done: `${n / parts} of ${n} is ${WORDS[parts]}.` };
  }
  const [columns, rows, share] = pickOne([[4, 4, '3/4'], [4, 3, '3/4'], [4, 3, '2/3'], [3, 3, '2/3'], [4, 4, '1/2'], [4, 3, '1/2']], rand);
  const n = columns * rows;
  const [top, bottom] = share.split('/').map(Number);
  const target = n * top / bottom;
  const pre = 1 + Math.floor(rand() * (target - 1));
  return { columns, rows, target, pre, goal: `${pre} of ${n} ${pre === 1 ? "tile is" : "tiles are"} painted. Make the coverage ${SHARE[share]}.`, done: `${target} of ${n} is ${SHARE[share]}.` };
}

const SYMBOLS = { circle: ['🔴', 'red circle'], triangle: ['🔺', 'red triangle'], square: ['🟦', 'blue square'] };
const PLATFORMS = ['circle', 'triangle', 'square'];
const TOWNS = ['Hanamidai', 'Kasugano'];
const clock = minutes => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
/** Discover: find a symbol. Practice: a landmark, then turn left or right. Challenge: read a fresh timetable. */
export function makeStationMission(level, rand = Math.random) {
  if (level <= 0) {
    const aim = pickOne(PLATFORMS, rand);
    return { steps: [{ aim, clue: `Find the sign with the ${SYMBOLS[aim][0]} ${SYMBOLS[aim][1]}.`, look: SYMBOLS[aim][0], options: PLATFORMS }] };
  }
  if (level === 1) {
    const left = rand() < 0.5;
    return { steps: [
      { aim: 'clock', clue: 'Walk up to the clock.', options: ['clock', 'left', 'right'] },
      { aim: left ? 'left' : 'right', clue: left ? 'Face the station. Turn left past the clock and find the sakura tree.' : 'Face the station. Turn right past the clock and find the bus stop.', options: ['left', 'right'] }
    ] };
  }
  const now = 600 + 5 * Math.floor(rand() * 7);
  const town = pickOne(TOWNS, rand);
  const other = TOWNS.find(t => t !== town);
  // One train to the town has already gone, one is next, and a train to the other town comes between.
  const plan = [[town, now - 5], [other, now + 5], [town, now + 10 + 5 * Math.floor(rand() * 2)]];
  const spots = [...PLATFORMS].sort(() => rand() - 0.5);
  const departures = plan.map(([name, minutes], i) => ({ id: spots[i], icon: SYMBOLS[spots[i]][0], name, time: clock(minutes), minutes }))
    .sort((a, b) => PLATFORMS.indexOf(a.id) - PLATFORMS.indexOf(b.id));
  const aim = nextDeparture(town, now, departures);
  const train = departures.find(d => d.id === aim);
  return { departures, steps: [{ aim, clue: `It is ${clock(now)}. Read the practice timetable. Walk to the platform for the next train to ${town}.`, options: PLATFORMS,
    done: `The ${train.time} to ${town} is the next one after ${clock(now)}. You found Platform ${PLATFORMS.indexOf(aim) + 1}.` }] };
}

const PIER_MARKS = ['blue stripes', 'dark stripes', 'silver sides'];
/** A fish to tag on Discover, and shuffled catches with slightly different sizes every time. */
export function makeFishingMission(rand = Math.random) {
  const shuffle = list => list.map(v => [rand(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const vary = f => ({ ...f, kg: Math.round(f.kg * (0.75 + rand() * 0.5) * 1000) / 1000 });
  return { want: pickOne(PIER_MARKS, rand), samples: { pier: shuffle(samples.pier).map(vary), reef: shuffle(samples.reef).map(vary) } };
}
