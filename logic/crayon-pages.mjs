/** Color by number picture outlines. Regions are percent coords. */

const flowerPage = {
  name: 'flower',
  regions: [
    { id: 'sky', label: [12, 18], shape: { poly: [[0, 0], [100, 0], [100, 64], [0, 64]] } },
    { id: 'grass', label: [86, 86], shape: { poly: [[0, 64], [100, 64], [100, 100], [0, 100]] } },
    {
      id: 'petals',
      label: [50, 41],
      shape: {
        parts: [
          { circle: [50, 41, 12] },
          { circle: [64, 51, 12] },
          { circle: [59, 68, 12] },
          { circle: [41, 68, 12] },
          { circle: [36, 51, 12] },
          { poly: [[47, 70], [53, 70], [53, 92], [47, 92]] },
          { ellipse: [74, 88, 8, 3.6] }
        ]
      }
    },
    { id: 'center', label: [50, 56], shape: { circle: [50, 56, 8] } }
  ]
};

const fishPage = {
  name: 'fish',
  marks: [
    { circle: [70, 51, 3.4], fill: '#fffdf8' },
    { circle: [71.2, 51, 1.5], fill: '#2c2824', stroke: false }
  ],
  regions: [
    { id: 'water', label: [12, 12], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'tail', label: [16, 54], shape: { poly: [[40, 54], [8, 36], [8, 72]] } },
    { id: 'body', label: [68, 58], shape: { ellipse: [58, 54, 20, 14] } },
    { id: 'fin', label: [52, 32], shape: { poly: [[54, 42], [42, 22], [70, 28]] } }
  ]
};

const housePage = {
  name: 'house',
  marks: [
    { poly: [[34, 52], [44, 52], [44, 62], [34, 62]], fill: '#fffdf8' },
    { line: [[39, 52], [39, 62]] },
    { line: [[34, 57], [44, 57]] }
  ],
  regions: [
    { id: 'sky', label: [16, 28], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [16, 88], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'sun', label: [82, 18], shape: { circle: [82, 18, 11] } },
    { id: 'wall', label: [66, 58], shape: { poly: [[28, 46], [76, 46], [76, 80], [28, 80]] } },
    { id: 'roof', label: [52, 36], shape: { poly: [[22, 46], [52, 24], [82, 46]] } },
    { id: 'door', label: [53, 72], shape: { poly: [[46, 62], [60, 62], [60, 80], [46, 80]] } }
  ]
};

const boatPage = {
  name: 'boat',
  marks: [{ line: [[52, 64], [52, 14]], width: 2.5 }],
  regions: [
    { id: 'sky', label: [16, 22], shape: { poly: [[0, 0], [100, 0], [100, 62], [0, 62]] } },
    { id: 'sea', label: [16, 90], shape: { poly: [[0, 58], [100, 58], [100, 100], [0, 100]] } },
    { id: 'sun', label: [82, 18], shape: { circle: [82, 18, 10] } },
    { id: 'sail', label: [62, 40], shape: { poly: [[52, 66], [52, 18], [76, 50]] } },
    { id: 'hull', label: [52, 74], shape: { poly: [[28, 62], [80, 62], [70, 82], [36, 82]] } },
    { id: 'flag', label: [58, 20], shape: { poly: [[52, 14], [68, 20], [52, 26]] } }
  ]
};

const gardenPage = {
  name: 'garden',
  marks: [
    { poly: [[62, 52], [70, 52], [70, 61], [62, 61]], fill: '#fffdf8' },
    { line: [[66, 52], [66, 61]] },
    { line: [[62, 56], [70, 56]] }
  ],
  regions: [
    { id: 'sky', label: [28, 44], shape: { poly: [[0, 0], [100, 0], [100, 68], [0, 68]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 68], [100, 68], [100, 100], [0, 100]] } },
    { id: 'sun', label: [16, 16], shape: { circle: [16, 16, 9] } },
    {
      id: 'cloud',
      label: [48, 16],
      shape: { parts: [{ circle: [40, 18, 8] }, { circle: [48, 16, 10] }, { circle: [58, 18, 7] }] }
    },
    { id: 'wall', label: [84, 56], shape: { poly: [[60, 48], [90, 48], [90, 78], [60, 78]] } },
    { id: 'roof', label: [75, 38], shape: { poly: [[54, 48], [75, 28], [96, 48]] } },
    { id: 'door', label: [75, 70], shape: { poly: [[70, 60], [80, 60], [80, 78], [70, 78]] } },
    {
      id: 'flower',
      label: [26, 70],
      shape: {
        parts: [
          { circle: [26, 70, 8] },
          { circle: [34, 76, 8] },
          { circle: [30, 86, 8] },
          { circle: [22, 86, 8] },
          { circle: [18, 76, 8] },
          { circle: [26, 78, 5] },
          { poly: [[24, 84], [28, 84], [28, 98], [24, 98]] }
        ]
      }
    }
  ]
};

const butterflyPage = {
  name: 'butterfly',
  marks: [
    { line: [[48, 34], [42, 24]] },
    { line: [[52, 34], [58, 24]] },
    { circle: [42, 24, 1.6], fill: '#2c2824', stroke: false },
    { circle: [58, 24, 1.6], fill: '#2c2824', stroke: false }
  ],
  regions: [
    { id: 'sky', label: [50, 12], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [50, 92], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'sun', label: [84, 16], shape: { circle: [84, 16, 8] } },
    { id: 'left', label: [26, 50], shape: { ellipse: [34, 48, 18, 24] } },
    { id: 'right', label: [74, 52], shape: { ellipse: [66, 48, 18, 24] } },
    { id: 'body', label: [50, 56], shape: { ellipse: [50, 50, 6, 18] } },
    { id: 'spots', label: [28, 40], shape: { parts: [{ circle: [28, 40, 6] }, { circle: [72, 40, 6] }] } },
    {
      id: 'flower',
      label: [18, 76],
      shape: {
        parts: [
          { circle: [18, 76, 7] },
          { circle: [25, 80, 7] },
          { circle: [22, 88, 7] },
          { circle: [14, 88, 7] },
          { circle: [11, 80, 7] },
          { circle: [18, 82, 4] }
        ]
      }
    }
  ]
};

const applePage = {
  name: 'apple',
  icon: '🍎',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'leaf', label: [62, 24], shape: { ellipse: [62, 24, 12, 7] } },
    { id: 'body', label: [50, 58], shape: { circle: [50, 58, 24] } },
    { id: 'stem', label: [50, 28], shape: { poly: [[47, 18], [53, 18], [53, 34], [47, 34]] } }
  ]
};

const truckPage = {
  name: 'truck',
  icon: '🚚',
  marks: [
    { circle: [28, 74, 4], fill: '#2c2824', stroke: false },
    { circle: [72, 74, 4], fill: '#2c2824', stroke: false }
  ],
  regions: [
    { id: 'sky', label: [16, 18], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'cab', label: [22, 48], shape: { poly: [[10, 42], [34, 42], [34, 70], [10, 70]] } },
    { id: 'bed', label: [64, 54], shape: { poly: [[34, 48], [90, 48], [90, 70], [34, 70]] } },
    { id: 'wheels', label: [28, 74], shape: { parts: [{ circle: [28, 74, 9] }, { circle: [72, 74, 9] }] } }
  ]
};

const sunPage = {
  name: 'sun',
  icon: '☀️',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'face', label: [50, 50], shape: { circle: [50, 50, 20] } },
    { id: 'rays', label: [50, 18], shape: { parts: [
      { poly: [[46, 8], [54, 8], [52, 26], [48, 26]] },
      { poly: [[74, 26], [88, 18], [80, 34], [70, 30]] },
      { poly: [[74, 70], [88, 78], [70, 74], [68, 64]] },
      { poly: [[46, 74], [54, 74], [52, 92], [48, 92]] },
      { poly: [[20, 70], [32, 64], [30, 74], [12, 78]] },
      { poly: [[20, 26], [32, 30], [30, 20], [12, 18]] }
    ] } },
    { id: 'cheeks', label: [38, 54], shape: { parts: [{ circle: [38, 54, 4] }, { circle: [62, 54, 4] }] } }
  ]
};

const conePage = {
  name: 'ice cream',
  icon: '🍦',
  regions: [
    { id: 'sky', label: [14, 14], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'scoop', label: [50, 36], shape: { circle: [50, 36, 18] } },
    { id: 'cone', label: [50, 72], shape: { poly: [[34, 48], [66, 48], [50, 92]] } },
    { id: 'drip', label: [62, 52], shape: { ellipse: [62, 52, 5, 8] } }
  ]
};

const treePage = {
  name: 'tree',
  icon: '🌳',
  regions: [
    { id: 'sky', label: [16, 20], shape: { poly: [[0, 0], [100, 0], [100, 72], [0, 72]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 72], [100, 72], [100, 100], [0, 100]] } },
    { id: 'sun', label: [84, 16], shape: { circle: [84, 16, 9] } },
    { id: 'leaves', label: [50, 40], shape: { circle: [50, 40, 22] } },
    { id: 'trunk', label: [50, 70], shape: { poly: [[44, 54], [56, 54], [58, 84], [42, 84]] } },
    { id: 'apple', label: [38, 36], shape: { circle: [38, 36, 5] } }
  ]
};

const rocketPage = {
  name: 'rocket',
  icon: '🚀',
  regions: [
    { id: 'sky', label: [16, 18], shape: { poly: [[0, 0], [100, 0], [100, 78], [0, 78]] } },
    { id: 'ground', label: [18, 90], shape: { poly: [[0, 78], [100, 78], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 52], shape: { poly: [[40, 28], [60, 28], [60, 74], [40, 74]] } },
    { id: 'nose', label: [50, 18], shape: { poly: [[40, 28], [50, 10], [60, 28]] } },
    { id: 'window', label: [50, 42], shape: { circle: [50, 42, 7] } },
    { id: 'flame', label: [50, 84], shape: { poly: [[42, 74], [58, 74], [50, 92]] } }
  ]
};

const puppyPage = {
  name: 'puppy',
  icon: '🐶',
  marks: [
    { circle: [42, 42, 2.2], fill: '#2c2824', stroke: false },
    { circle: [58, 42, 2.2], fill: '#2c2824', stroke: false }
  ],
  regions: [
    { id: 'sky', label: [16, 16], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 64], shape: { ellipse: [50, 64, 22, 14] } },
    { id: 'head', label: [50, 44], shape: { circle: [50, 44, 14] } },
    { id: 'ear', label: [34, 34], shape: { ellipse: [34, 34, 7, 10] } },
    { id: 'spot', label: [62, 66], shape: { circle: [62, 66, 6] } }
  ]
};

const dinoPage = {
  name: 'dinosaur',
  icon: '🦕',
  regions: [
    { id: 'sky', label: [20, 18], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'sun', label: [84, 16], shape: { circle: [84, 16, 8] } },
    { id: 'body', label: [48, 56], shape: { ellipse: [48, 56, 24, 14] } },
    { id: 'head', label: [74, 40], shape: { circle: [74, 40, 10] } },
    { id: 'neck', label: [64, 46], shape: { poly: [[54, 50], [70, 36], [74, 44], [58, 56]] } },
    { id: 'leg', label: [40, 74], shape: { poly: [[34, 64], [46, 64], [48, 82], [32, 82]] } },
    { id: 'plant', label: [16, 66], shape: { parts: [{ poly: [[16, 80], [12, 52], [20, 52]] }, { circle: [16, 48, 6] }] } }
  ]
};

const castlePage = {
  name: 'castle',
  icon: '🏰',
  regions: [
    { id: 'sky', label: [12, 12], shape: { poly: [[0, 0], [100, 0], [100, 68], [0, 68]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 68], [100, 68], [100, 100], [0, 100]] } },
    { id: 'sun', label: [86, 16], shape: { circle: [86, 16, 8] } },
    { id: 'cloud', label: [30, 18], shape: { parts: [{ circle: [24, 20, 7] }, { circle: [32, 18, 8] }, { circle: [40, 20, 6] }] } },
    { id: 'wall', label: [36, 52], shape: { poly: [[28, 44], [72, 44], [72, 78], [28, 78]] } },
    { id: 'tower', label: [50, 30], shape: { poly: [[40, 18], [60, 18], [60, 44], [40, 44]] } },
    { id: 'door', label: [50, 68], shape: { poly: [[44, 58], [56, 58], [56, 78], [44, 78]] } },
    { id: 'flag', label: [60, 14], shape: { poly: [[50, 8], [50, 22], [68, 15]] } }
  ]
};

const balloonPage = {
  name: 'balloon',
  icon: '🎈',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'balloon', label: [50, 36], shape: { ellipse: [50, 36, 18, 22] } },
    { id: 'knot', label: [50, 60], shape: { poly: [[46, 56], [54, 56], [50, 66]] } },
    { id: 'string', label: [50, 82], shape: { poly: [[48, 66], [52, 66], [52, 94], [48, 94]] } }
  ]
};

const starPage = {
  name: 'star',
  icon: '⭐',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'star', label: [50, 48], shape: { poly: [[50, 18], [58, 40], [82, 40], [64, 56], [72, 80], [50, 66], [28, 80], [36, 56], [18, 40], [42, 40]] } },
    { id: 'spark', label: [22, 24], shape: { circle: [22, 24, 4] } },
    { id: 'dot', label: [78, 72], shape: { circle: [78, 72, 5] } }
  ]
};

const chickPage = {
  name: 'chick',
  icon: '🐣',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 58], shape: { circle: [50, 58, 22] } },
    { id: 'beak', label: [72, 52], shape: { poly: [[64, 48], [82, 52], [64, 56]] } },
    { id: 'feet', label: [42, 84], shape: { parts: [{ poly: [[40, 78], [48, 78], [46, 90], [38, 90]] }, { poly: [[52, 78], [60, 78], [62, 90], [54, 90]] }] } }
  ],
  marks: [{ circle: [58, 50, 2.4], fill: '#2c2824', stroke: false }]
};

const carPage = {
  name: 'car',
  icon: '🚗',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 58], shape: { poly: [[12, 58], [28, 58], [34, 42], [66, 42], [74, 58], [90, 58], [90, 74], [12, 74]] } },
    { id: 'window', label: [50, 52], shape: { poly: [[36, 46], [62, 46], [66, 56], [38, 56]] } },
    { id: 'wheels', label: [28, 78], shape: { parts: [{ circle: [28, 78, 9] }, { circle: [72, 78, 9] }] } }
  ],
  marks: [
    { circle: [28, 78, 3.5], fill: '#2c2824', stroke: false },
    { circle: [72, 78, 3.5], fill: '#2c2824', stroke: false }
  ]
};

const cupcakePage = {
  name: 'cupcake',
  icon: '🧁',
  regions: [
    { id: 'sky', label: [14, 14], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'wrapper', label: [50, 78], shape: { poly: [[30, 60], [70, 60], [64, 92], [36, 92]] } },
    { id: 'frosting', label: [50, 44], shape: { parts: [{ circle: [50, 48, 18] }, { circle: [36, 50, 10] }, { circle: [64, 50, 10] }] } },
    { id: 'cherry', label: [50, 28], shape: { circle: [50, 28, 7] } }
  ]
};

const heartPage = {
  name: 'heart',
  icon: '❤️',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'heart', label: [50, 52], shape: { parts: [{ circle: [36, 40, 16] }, { circle: [64, 40, 16] }, { poly: [[20, 44], [50, 84], [80, 44]] }] } },
    { id: 'shine', label: [34, 34], shape: { circle: [34, 34, 5] } },
    { id: 'dot', label: [78, 78], shape: { circle: [78, 78, 4] } }
  ]
};

const catPage = {
  name: 'cat',
  icon: '🐱',
  regions: [
    { id: 'sky', label: [16, 16], shape: { poly: [[0, 0], [100, 0], [100, 70], [0, 70]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 70], [100, 70], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 64], shape: { ellipse: [50, 64, 20, 14] } },
    { id: 'head', label: [50, 42], shape: { circle: [50, 42, 14] } },
    { id: 'ear', label: [38, 28], shape: { parts: [{ poly: [[32, 36], [38, 18], [46, 34]] }, { poly: [[54, 34], [62, 18], [68, 36]] }] } },
    { id: 'tail', label: [78, 58], shape: { ellipse: [78, 58, 10, 5] } }
  ],
  marks: [
    { circle: [44, 40, 2], fill: '#2c2824', stroke: false },
    { circle: [56, 40, 2], fill: '#2c2824', stroke: false }
  ]
};

const planePage = {
  name: 'plane',
  icon: '✈️',
  regions: [
    { id: 'sky', label: [16, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 50], shape: { ellipse: [50, 50, 28, 10] } },
    { id: 'wing', label: [50, 62], shape: { poly: [[28, 52], [72, 52], [78, 70], [22, 70]] } },
    { id: 'window', label: [42, 46], shape: { circle: [42, 46, 5] } },
    { id: 'nose', label: [80, 50], shape: { poly: [[72, 42], [92, 50], [72, 58]] } },
    { id: 'tail', label: [18, 40], shape: { poly: [[22, 48], [10, 28], [28, 42]] } }
  ]
};

const trainPage = {
  name: 'train',
  icon: '🚂',
  regions: [
    { id: 'sky', label: [16, 18], shape: { poly: [[0, 0], [100, 0], [100, 72], [0, 72]] } },
    { id: 'grass', label: [50, 90], shape: { poly: [[0, 72], [100, 72], [100, 100], [0, 100]] } },
    { id: 'engine', label: [36, 56], shape: { poly: [[16, 48], [56, 48], [56, 74], [16, 74]] } },
    { id: 'cabin', label: [68, 50], shape: { poly: [[56, 36], [82, 36], [82, 74], [56, 74]] } },
    { id: 'wheel', label: [30, 78], shape: { parts: [{ circle: [28, 78, 8] }, { circle: [48, 78, 8] }, { circle: [70, 78, 8] }] } },
    { id: 'smoke', label: [30, 28], shape: { parts: [{ circle: [28, 34, 7] }, { circle: [36, 24, 6] }, { circle: [44, 30, 5] }] } }
  ]
};

const beePage = {
  name: 'bee',
  icon: '🐝',
  regions: [
    { id: 'sky', label: [16, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'body', label: [32, 54], shape: { ellipse: [50, 54, 18, 12] } },
    { id: 'stripe', label: [50, 54], shape: { poly: [[42, 42], [58, 42], [58, 66], [42, 66]] } },
    { id: 'wing', label: [40, 34], shape: { parts: [{ ellipse: [40, 34, 10, 8] }, { ellipse: [58, 34, 10, 8] }] } },
    { id: 'head', label: [72, 50], shape: { circle: [72, 50, 8] } },
    { id: 'flower', label: [20, 78], shape: { parts: [{ circle: [20, 78, 8] }, { circle: [20, 78, 4] }] } }
  ],
  marks: [{ circle: [74, 48, 1.8], fill: '#2c2824', stroke: false }]
};

const farmPage = {
  name: 'farm',
  icon: '🚜',
  regions: [
    { id: 'sky', label: [12, 14], shape: { poly: [[0, 0], [100, 0], [100, 62], [0, 62]] } },
    { id: 'grass', label: [50, 88], shape: { poly: [[0, 62], [100, 62], [100, 100], [0, 100]] } },
    { id: 'sun', label: [86, 16], shape: { circle: [86, 16, 8] } },
    { id: 'cloud', label: [28, 18], shape: { parts: [{ circle: [22, 20, 7] }, { circle: [30, 16, 8] }, { circle: [38, 20, 6] }] } },
    { id: 'barn', label: [46, 48], shape: { poly: [[40, 40], [80, 40], [80, 74], [40, 74]] } },
    { id: 'roof', label: [60, 30], shape: { poly: [[36, 40], [60, 18], [84, 40]] } },
    { id: 'door', label: [60, 62], shape: { poly: [[52, 52], [68, 52], [68, 74], [52, 74]] } },
    { id: 'hen', label: [22, 68], shape: { parts: [{ circle: [22, 66, 8] }, { poly: [[16, 72], [28, 72], [26, 82], [18, 82]] }] } }
  ]
};

const owlPage = {
  name: 'owl',
  icon: '🦉',
  regions: [
    { id: 'sky', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'moon', label: [82, 18], shape: { circle: [82, 18, 10] } },
    { id: 'branch', label: [50, 84], shape: { poly: [[10, 80], [90, 80], [90, 88], [10, 88]] } },
    { id: 'body', label: [28, 58], shape: { ellipse: [50, 58, 22, 24] } },
    { id: 'belly', label: [50, 70], shape: { ellipse: [50, 64, 12, 14] } },
    { id: 'eye', label: [40, 46], shape: { parts: [{ circle: [40, 46, 7] }, { circle: [60, 46, 7] }] } },
    { id: 'beak', label: [50, 54], shape: { poly: [[46, 50], [54, 50], [50, 60]] } },
    { id: 'ear', label: [36, 26], shape: { parts: [{ poly: [[30, 36], [36, 18], [44, 34]] }, { poly: [[56, 34], [64, 18], [70, 36]] }] } }
  ],
  marks: [
    { circle: [40, 46, 2.4], fill: '#2c2824', stroke: false },
    { circle: [60, 46, 2.4], fill: '#2c2824', stroke: false }
  ]
};

const subPage = {
  name: 'submarine',
  icon: '🛥️',
  regions: [
    { id: 'water', label: [14, 16], shape: { poly: [[0, 0], [100, 0], [100, 100], [0, 100]] } },
    { id: 'body', label: [50, 58], shape: { ellipse: [50, 58, 30, 14] } },
    { id: 'window', label: [42, 54], shape: { circle: [42, 54, 6] } },
    { id: 'tower', label: [50, 40], shape: { poly: [[42, 30], [58, 30], [58, 48], [42, 48]] } },
    { id: 'fin', label: [22, 48], shape: { poly: [[24, 58], [10, 42], [28, 50]] } },
    { id: 'prop', label: [82, 58], shape: { parts: [{ circle: [82, 58, 7] }, { circle: [82, 58, 3] }] } },
    { id: 'fish', label: [20, 82], shape: { ellipse: [20, 82, 8, 5] } },
    { id: 'bubble', label: [70, 28], shape: { parts: [{ circle: [68, 30, 4] }, { circle: [76, 22, 3] }] } }
  ]
};

const CRAYON_ICONS = {
  flower: '🌸',
  fish: '🐟',
  apple: '🍎',
  truck: '🚚',
  sun: '☀️',
  cone: '🍦',
  balloon: '🎈',
  star: '⭐',
  chick: '🐣',
  car: '🚗',
  cupcake: '🧁',
  heart: '❤️',
  house: '🏠',
  boat: '⛵',
  tree: '🌳',
  rocket: '🚀',
  puppy: '🐶',
  cat: '🐱',
  plane: '✈️',
  train: '🚂',
  bee: '🐝',
  garden: '🏡',
  butterfly: '🦋',
  dino: '🦕',
  castle: '🏰',
  farm: '🚜',
  owl: '🦉',
  submarine: '🛥️'
};

const CRAYON_PAGES = {
  4: [flowerPage, fishPage, applePage, truckPage, sunPage, conePage, balloonPage, starPage, chickPage, carPage, cupcakePage, heartPage],
  6: [housePage, boatPage, treePage, rocketPage, puppyPage, catPage, planePage, trainPage, beePage],
  8: [gardenPage, butterflyPage, dinoPage, castlePage, farmPage, owlPage, subPage]
};

export { CRAYON_PAGES, CRAYON_ICONS };
