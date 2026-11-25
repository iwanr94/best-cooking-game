// Dapur Kilat's world: the chef, the stations, the orders and the shift.
// One fixed-step update per call; rendering reads only `state`, never writes.
import {
  BOARD,
  BURNERS,
  BURN_GRACE_SECONDS,
  CHEF,
  CHOP_SECONDS,
  COMBO_WINDOW_SECONDS,
  CRATES,
  FIELD,
  FRY_SECONDS,
  HEARTS,
  INTERACT_RADIUS,
  ORDERS,
  PLATE_COUNTER,
  SHIFT_SECONDS,
  STOVE,
  TRASH,
  WINDOW,
} from './config.js';
import { findMatchingOrder, freshItem, isPlateReady, needsChop, needsFry, recipeById, RECIPES } from './recipes.js';

export const EVENT_SERVED = 1;
export const EVENT_FAILED = 2;
export const EVENT_OVER = 4;
export const EVENT_DING = 8;
export const EVENT_BURNT = 16;

/** Distance between two points. */
function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** The station whose interact point is nearest the chef, within reach. */
function nearestStation(chef) {
  const points = [];
  for (const crate of CRATES) {
    points.push({ kind: 'crate', crate, x: crate.x + 60, y: 168 });
  }
  points.push({ kind: 'board', x: BOARD.x + 60, y: 168 });
  for (let index = 0; index < BURNERS.length; index += 1) {
    points.push({ kind: 'burner', burner: index, x: BURNERS[index].x, y: 168 });
  }
  points.push({ kind: 'plate', x: PLATE_COUNTER.x + 100, y: PLATE_COUNTER.y + 84 });
  points.push({ kind: 'window', x: WINDOW.x - 24, y: WINDOW.y + 60 });
  points.push({ kind: 'trash', x: TRASH.x + 42, y: TRASH.y - 20 });
  let best = null;
  let bestDistance = INTERACT_RADIUS;
  for (const point of points) {
    const d = distance(chef.x, chef.y, point.x, point.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = point;
    }
  }
  return best;
}

export function createWorld(random) {
  const state = {
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    level: 1,
    coins: 0,
    served: 0,
    failed: 0,
    hearts: HEARTS,
    combo: 0,
    comboTimer: 0,
    orders: [],
    nextOrderId: 1,
    spawnTimer: ORDERS.firstAfterSeconds,
    chef: { x: CHEF.startX, y: CHEF.startY, dx: 0, dy: 1, carrying: null, chopping: false },
    burners: [{ item: null, progress: 0 }, { item: null, progress: 0 }],
    plateItems: [],
    plateCarried: false,
    popups: [],
    shake: 0,
    message: '',
    messageTimer: 0,
  };

  function level() {
    return 1 + Math.floor(state.elapsed / ORDERS.levelEverySeconds);
  }

  function spawnOrder(recipeId, patienceOverride) {
    const patience = patienceOverride ?? Math.max(ORDERS.minPatience, ORDERS.basePatience - ORDERS.patiencePerLevel * (level() - 1));
    state.orders.push({
      id: state.nextOrderId,
      recipeId: recipeId ?? random.pick(RECIPES).id,
      patience,
      maxPatience: patience,
    });
    state.nextOrderId += 1;
  }

  function popup(x, y, text, colour) {
    state.popups.push({ x, y, text, colour, ttl: 1.4 });
  }

  function say(text, seconds = 2.5) {
    state.message = text;
    state.messageTimer = seconds;
  }

  /** Serve the plate the chef carries at the window, if it matches an order. */
  function servePlate() {
    const order = findMatchingOrder(state.chef.carrying.items, state.orders);
    if (!order) {
      say('Pesanan tidak cocok — cek papan pesanan!');
      state.shake = 0.3;
      return EVENT_FAILED;
    }
    const recipe = recipeById(order.recipeId);
    const tip = Math.round((order.patience / order.maxPatience) * 6);
    const comboBonus = state.comboTimer > 0 ? state.combo * 2 : 0;
    const earned = recipe.price + tip + comboBonus;
    state.coins += earned;
    state.served += 1;
    state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
    state.comboTimer = COMBO_WINDOW_SECONDS;
    state.orders = state.orders.filter((item) => item.id !== order.id);
    state.chef.carrying = null;
    popup(WINDOW.x - 40, WINDOW.y - 10, `+${earned} koin`, '#f2c94c');
    if (state.combo > 1) popup(WINDOW.x - 40, WINDOW.y - 34, `Kombo x${state.combo}!`, '#58b368');
    return EVENT_SERVED;
  }

  /** One tap of the interact button at the station the chef stands by. */
  function interact() {
    const chef = state.chef;
    const station = nearestStation(chef);
    if (!station) return 0;
    if (station.kind === 'crate') {
      if (chef.carrying) return 0;
      chef.carrying = { kind: 'item', item: freshItem(station.crate.kind) };
      return 0;
    }
    if (station.kind === 'board') {
      // Chopping is a hold, handled in step(); a tap here does nothing.
      return 0;
    }
    if (station.kind === 'burner') {
      const burner = state.burners[station.burner];
      if (burner.item && !chef.carrying) {
        chef.carrying = { kind: 'item', item: burner.item };
        burner.item = null;
        burner.progress = 0;
        return 0;
      }
      if (!burner.item && chef.carrying && chef.carrying.kind === 'item' && needsFry(chef.carrying.item)) {
        burner.item = chef.carrying.item;
        burner.progress = 0;
        chef.carrying = null;
        return 0;
      }
      return 0;
    }
    if (station.kind === 'plate') {
      if (chef.carrying && chef.carrying.kind === 'item' && isPlateReady(chef.carrying.item) && state.plateItems.length < 3) {
        state.plateItems.push(chef.carrying.item);
        chef.carrying = null;
        return 0;
      }
      if (!chef.carrying && state.plateItems.length > 0) {
        chef.carrying = { kind: 'plate', items: state.plateItems };
        state.plateItems = [];
        return 0;
      }
      if (chef.carrying && chef.carrying.kind === 'plate' && state.plateItems.length === 0) {
        state.plateItems = chef.carrying.items;
        chef.carrying = null;
        return 0;
      }
      return 0;
    }
    if (station.kind === 'window') {
      if (chef.carrying && chef.carrying.kind === 'plate') return servePlate();
      return 0;
    }
    if (station.kind === 'trash') {
      if (chef.carrying) {
        chef.carrying = null;
        say('Dibuang ke tempat sampah.');
        return 0;
      }
      return 0;
    }
    return 0;
  }
  /** Hold-to-chop: while the interact button is held at the board. */
  function chopStep(dt) {
    const chef = state.chef;
    const station = nearestStation(chef);
    if (!station || station.kind !== 'board') {
      chef.chopping = false;
      return;
    }
    if (!chef.carrying || chef.carrying.kind !== 'item' || !needsChop(chef.carrying.item)) {
      chef.chopping = false;
      return;
    }
    const item = chef.carrying.item;
    chef.chopping = true;
    item.chop += dt / CHOP_SECONDS[item.kind];
    if (item.chop >= 1) {
      item.chop = 0;
      item.state = item.kind === 'chicken' ? 'chopped' : 'ready';
      chef.chopping = false;
    }
  }

  /** Advance burners, order patience, popups and the shift clock. */
  function step(dt, input, attract) {
    let events = 0;
    const chef = state.chef;

    // Move the chef; the floor is the whole playfield below the counters.
    const length = Math.hypot(input.dx, input.dy);
    if (length > 0.01) {
      const nx = input.dx / length;
      const ny = input.dy / length;
      chef.x = clamp(chef.x + nx * CHEF.speed * dt, 24, FIELD.width - 24);
      chef.y = clamp(chef.y + ny * CHEF.speed * dt, 152, FIELD.height - 44);
      chef.dx = nx;
      chef.dy = ny;
    }
    if (input.interactPressed) events |= interact();
    if (input.interactHeld) chopStep(dt);
    else chef.chopping = false;

    if (attract) {
      // Title-screen bustle: orders arrive, patience ticks, nothing fails.
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0 && state.orders.length < 3) {
        spawnOrder();
        state.spawnTimer = 12;
      }
      for (const order of state.orders) order.patience = Math.max(order.patience - dt, order.maxPatience * 0.4);
      return events;
    }

    state.elapsed += dt;
    state.timeLeft -= dt;
    state.level = level();
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.shake > 0) state.shake -= dt;
    for (let index = state.popups.length - 1; index >= 0; index -= 1) {
      const popupItem = state.popups[index];
      popupItem.ttl -= dt;
      popupItem.y -= 24 * dt;
      if (popupItem.ttl <= 0) state.popups.splice(index, 1);
    }

    // Burners cook, then burn.
    for (const burner of state.burners) {
      if (!burner.item) continue;
      burner.progress += dt;
      const fryTime = FRY_SECONDS[burner.item.kind];
      if (burner.progress >= fryTime && burner.item.state !== 'cooked' && burner.item.state !== 'burnt') {
        burner.item.state = 'cooked';
        events |= EVENT_DING;
      } else if (burner.progress >= fryTime + BURN_GRACE_SECONDS && burner.item.state !== 'burnt') {
        burner.item.state = 'burnt';
        events |= EVENT_BURNT;
        say('Gosong! Angkat sebelum hangus.');
      }
    }

    // Orders arrive faster as the level rises.
    state.spawnTimer -= dt;
    const maxOrders = Math.min(ORDERS.maxOrders, ORDERS.baseMax + state.level - 1);
    if (state.spawnTimer <= 0 && state.orders.length < maxOrders) {
      spawnOrder();
      const interval = Math.max(ORDERS.minInterval, ORDERS.baseInterval - ORDERS.intervalPerLevel * (state.level - 1));
      state.spawnTimer = interval;
    }

    // A patience bar that empties costs a heart.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.failed += 1;
        state.hearts -= 1;
        state.combo = 0;
        state.comboTimer = 0;
        events |= EVENT_FAILED;
        say('Pesanan kedaluwarsa — pelanggan kecewa!');
      }
    }

    if (state.timeLeft <= 0 || state.hearts <= 0) {
      state.timeLeft = Math.max(0, state.timeLeft);
      events |= EVENT_OVER;
    }
    return events;
  }

  function reset() {
    state.screen = 'title';
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.level = 1;
    state.coins = 0;
    state.served = 0;
    state.failed = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.comboTimer = 0;
    state.orders = [];
    state.nextOrderId = 1;
    state.spawnTimer = ORDERS.firstAfterSeconds;
    state.chef = { x: CHEF.startX, y: CHEF.startY, dx: 0, dy: 1, carrying: null, chopping: false };
    state.burners = [{ item: null, progress: 0 }, { item: null, progress: 0 }];
    state.plateItems = [];
    state.plateCarried = false;
    state.popups = [];
    state.shake = 0;
    state.message = '';
    state.messageTimer = 0;
  }

  return { state, step, reset, spawnOrder, interact, nearestStation, say, popup };
}
