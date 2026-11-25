// Dapur Kilat: every tuning number, colour and station position in one place.
// The playfield is a fixed 1280x480 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 480 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One work shift lasts this long, in seconds. */
export const SHIFT_SECONDS = 150;

export const CHEF = {
  radius: 20,
  speed: 300,
  startX: 640,
  startY: 380,
};

export const INTERACT_RADIUS = 78;

/** Counter row: the ingredient crates, chopping board and stove along the top. */
export const COUNTER_Y = 84;
export const COUNTER_H = 56;
export const CRATES = [
  { kind: 'rice', label: 'NASI', x: 36 },
  { kind: 'egg', label: 'TELUR', x: 172 },
  { kind: 'chicken', label: 'AYAM', x: 308 },
  { kind: 'chili', label: 'CABAI', x: 444 },
  { kind: 'veg', label: 'SAYUR', x: 580 },
];
export const CRATE_W = 120;

/** Chopping board and stove sit right of the crates. */
export const BOARD = { x: 716, width: 120 };
export const STOVE = { x: 852, width: 256 };
export const BURNERS = [
  { x: 916, y: COUNTER_Y + COUNTER_H / 2 },
  { x: 1036, y: COUNTER_Y + COUNTER_H / 2 },
];

/** Plating counter: the island in the middle of the floor where dishes are built. */
export const PLATE_COUNTER = { x: 540, y: 268, width: 200, height: 56 };

/** Serving window on the right wall, and the trash bin at bottom-left. */
export const WINDOW = { x: 1196, y: 300, width: 72, height: 120 };
export const TRASH = { x: 36, y: 396, width: 84, height: 64 };

/** Seconds to chop one item, and to fry one item on a burner. */
export const CHOP_SECONDS = { chicken: 3, chili: 2, veg: 2 };
export const FRY_SECONDS = { egg: 4, chicken: 5 };
/** Seconds a finished fry may sit on the burner before it burns. */
export const BURN_GRACE_SECONDS = 6;

/** Orders: how fast they arrive and how long a customer waits, by level. */
export const ORDERS = {
  firstAfterSeconds: 2,
  baseInterval: 14,
  minInterval: 8,
  intervalPerLevel: 1.5,
  baseMax: 2,
  maxOrders: 4,
  basePatience: 55,
  patiencePerLevel: 5,
  minPatience: 30,
  /** A new level every this many seconds of the shift. */
  levelEverySeconds: 45,
};

export const HEARTS = 3;
export const COMBO_WINDOW_SECONDS = 8;

export const PALETTE = {
  floorA: '#b98a56',
  floorB: '#a87a48',
  wall: '#7c4a2d',
  wallTrim: '#5d3620',
  counterTop: '#d9a05b',
  counterSide: '#8a5a2b',
  counterEdge: '#f2c078',
  board: '#e8c98f',
  stove: '#3a3f4a',
  stoveTop: '#22252d',
  plate: '#fdfdf8',
  hud: '#2b1a12',
  hudPanel: '#3d2718',
  ticket: '#fff6e0',
  ticketText: '#3a2415',
  text: '#fff3d6',
  muted: '#d8b98a',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#58b368',
  chefHat: '#fdfdf8',
  chefSkin: '#f2c09a',
  chefShirt: '#e8e4da',
  chefApron: '#3f6fb5',
  chefPants: '#2e3440',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-kilat.best';
