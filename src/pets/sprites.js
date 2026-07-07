// Bunny sprite sheets, drawn as legible string-grid pixel art and rendered
// to an offscreen canvas at runtime. 16x20 per frame, facing right.
// Legend: . transparent | K outline | B body | L belly/tail | W inner ear | E eye | N nose

const IDLE_A = [
  '....KK....KK....',
  '...KWWK..KWWK...',
  '...KWWK..KWWK...',
  '...KWWK..KWWK...',
  '...KWWK..KWWK...',
  '....KWK..KWK....',
  '....KBBKKBBK....',
  '....KBBBBBBK....',
  '...KBBBBBEBBK...',
  '...KBBBBBBBNK...',
  '...KBBBBBBBBK...',
  '..KBBBBBBBBBK...',
  '.KBBBBBBBBBBK...',
  'KBLBBBBBBBBBK...',
  'KLLBBBLLLLBBK...',
  'KBBBBLLLLLBBBK..',
  '.KBBBBLLLBBBBK..',
  '..KBBBBBBBBBK...',
  '..KBBKKKKKBBK...',
  '...KK.....KK....',
];

const IDLE_B = [ // front ear twitches
  '....KK..........',
  '...KWWK...KK....',
  '...KWWK..KWWK...',
  '...KWWK..KWWKK..',
  '...KWWK...KWWK..',
  '....KWK...KWK...',
  '....KBBKKBBK....',
  '....KBBBBBBK....',
  '...KBBBBBEBBK...',
  '...KBBBBBBBNK...',
  '...KBBBBBBBBK...',
  '..KBBBBBBBBBK...',
  '.KBBBBBBBBBBK...',
  'KBLBBBBBBBBBK...',
  'KLLBBBLLLLBBK...',
  'KBBBBLLLLLBBBK..',
  '.KBBBBLLLBBBBK..',
  '..KBBBBBBBBBK...',
  '..KBBKKKKKBBK...',
  '...KK.....KK....',
];

const CROUCH = [ // gathered, ears swept back
  '................',
  '................',
  '................',
  '................',
  '..KK............',
  '.KWWK.KK........',
  '.KWWKKWWK.......',
  '..KWWKWWK.......',
  '...KWKWK........',
  '....KBBBBK......',
  '...KBBBBBBBK....',
  '..KBBBBBEBBBK...',
  '.KBBBBBBBBBNK...',
  'KBLBBBBBBBBBK...',
  'KLLBBBLLLLBBK...',
  'KBBBBLLLLLBBBK..',
  '.KBBBBLLLBBBBK..',
  '..KBBBBBBBBBBK..',
  '..KBBKKKKKBBK...',
  '...KK.....KK....',
];

const AIR_UP = [ // stretched skyward, ears trailing
  '.........KK.....',
  '....KK..KWWK....',
  '...KWWK.KWWK....',
  '...KWWKKWWK.....',
  '....KWWKWWK.....',
  '.....KWKWK......',
  '.....KBBBBK.....',
  '....KBBBBBEBK...',
  '....KBBBBBBNK...',
  '...KBBBBBBBK....',
  '..KBBBBBBBK.....',
  '.KBBBBBBBK......',
  'KBLBBBBBBK......',
  'KLLBBLLBBK......',
  'KBBBLLLBBK......',
  '.KBBBBBBK.......',
  '..KBBBBK........',
  '..KBBK..........',
  '...KBK..........',
  '....KK..........',
];

const AIR_DOWN = [ // descending, paws reaching for the ground
  '....KK..KK......',
  '...KWWKKWWK.....',
  '...KWWKKWWK.....',
  '...KWWKKWWK.....',
  '....KWKKWK......',
  '....KBBBBK......',
  '...KBBBBBBK.....',
  '..KBBBBEBBBK....',
  '..KBBBBBBBNK....',
  '.KBBBBBBBBBK....',
  'KBLBBBBBBBK.....',
  'KLLBBLLLBBK.....',
  'KBBBLLLLBBK.....',
  '.KBBBBBBBK......',
  '..KBBBBBK.......',
  '..KBBBBK........',
  '..KBBK.KK.......',
  '..KBK..KBK......',
  '...KK...KK......',
  '................',
];

const SLEEP = [ // loaf, ears folded along the back
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.KK.............',
  'KWWKK...........',
  '.KWWKK..........',
  '..KWWKKKKKK.....',
  '...KKBBBBBBKK...',
  '..KBBBBBBBBBBK..',
  '.KBLBBLLLLLBBK..',
  'KBLLBLLLLLLBBBK.',
  '.KBBBBBBBBBBBK..',
  '..KKKKKKKKKKK...',
];

const HAPPY = [ // facing you, ears splayed, delighted
  '...KK.....KK....',
  '..KWWK...KWWK...',
  '..KWWK...KWWK...',
  '..KWWK...KWWK...',
  '...KWWK.KWWK....',
  '....KWK.KWK.....',
  '....KBKKKBK.....',
  '....KBBBBBBK....',
  '...KBBEBBBEBK...',
  '...KBBBBBBBBK...',
  '...KBBBNNBBBK...',
  '..KBBBBBBBBBK...',
  '.KBBBBBBBBBBK...',
  'KBLBBLLLLBBBK...',
  'KLLBBLLLLLBBBK..',
  '.KBBBLLLLBBBBK..',
  '..KBBBBBBBBBK...',
  '..KBBK...KBBK...',
  '..KBK.....KBK...',
  '...K.......K....',
];

export const FRAMES = { idleA: 0, idleB: 1, crouch: 2, airUp: 3, airDown: 4, sleep: 5, happy: 6 };
const GRID = [IDLE_A, IDLE_B, CROUCH, AIR_UP, AIR_DOWN, SLEEP, HAPPY];

export const PALETTES = {
  brown: {
    K: '#3a2b22', B: '#a9825f', L: '#d8c3a5', W: '#e8b4c8', E: '#1a1210', N: '#8a4b3a',
  },
  lavender: {
    K: '#2d2246', B: '#cbb7ef', L: '#efe9fb', W: '#f0c7dd', E: '#14102a', N: '#a06bd0',
  },
};

export const FRAME_W = 16;
export const FRAME_H = 20;
export const FRAME_COUNT = GRID.length;

/** Render all frames for a palette into an offscreen canvas sprite sheet. */
export function buildSheet(paletteName) {
  const pal = PALETTES[paletteName] || PALETTES.brown;
  const sheet = document.createElement('canvas');
  sheet.width = FRAME_W * FRAME_COUNT;
  sheet.height = FRAME_H;
  const ctx = sheet.getContext('2d');
  GRID.forEach((frame, f) => {
    frame.forEach((row, y) => {
      for (let x = 0; x < FRAME_W; x++) {
        const c = pal[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(f * FRAME_W + x, y, 1, 1);
      }
    });
  });
  return sheet;
}
