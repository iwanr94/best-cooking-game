// The screenshot scenes behind ?shot=start|play|serve|rush. Each one plays
// the real rules forward from a fresh world, steered by a scripted driver
// that walks the chef between the stations and presses the buttons, so the
// frame is what a short game really looks like and the same seed always
// gives the same frame. The rush scene instead sets a late-shift state
// through the world's own calls, then settles it for half a second.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Interact points: below each counter, the plate island, the window. */
const AT = {
  rice: [96, 168],
  egg: [232, 168],
  chicken: [368, 168],
  chili: [504, 168],
  veg: [640, 168],
  board: [776, 168],
  burner0: [916, 168],
  burner1: [1036, 168],
  plate: [640, 352],
  window: [1172, 360],
};

/** A driver that walks a list of steps: move somewhere, tap, hold, or wait. */
function createDriver(script) {
  let index = 0;
  let timer = 0;
  return {
    done() {
      return index >= script.length;
    },
    input(chef) {
      if (index >= script.length) return { dx: 0, dy: 0, interactPressed: false, interactHeld: false };
      const step = script[index];
      if (step.move) {
        const [tx, ty] = step.move;
        const ox = tx - chef.x;
        const oy = ty - chef.y;
        const distance = Math.hypot(ox, oy);
        if (distance < 14) {
          index += 1;
          return { dx: 0, dy: 0, interactPressed: false, interactHeld: false };
        }
        return { dx: ox / distance, dy: oy / distance, interactPressed: false, interactHeld: false };
      }
      if (step.press) {
        index += 1;
        return { dx: 0, dy: 0, interactPressed: true, interactHeld: false };
      }
      if (step.hold) {
        if (timer <= 0) timer = step.hold;
        timer -= STEP;
        if (timer <= 0) {
          index += 1;
          timer = 0;
        }
        return { dx: 0, dy: 0, interactPressed: false, interactHeld: true };
      }
      if (step.wait) {
        if (timer <= 0) timer = step.wait;
        timer -= STEP;
        if (timer <= 0) {
          index += 1;
          timer = 0;
        }
        return { dx: 0, dy: 0, interactPressed: false, interactHeld: false };
      }
      index += 1;
      return { dx: 0, dy: 0, interactPressed: false, interactHeld: false };
    },
  };
}

/** Run the driver until its script ends (or the shift does). */
function runScript(world, script) {
  const driver = createDriver(script);
  for (let index = 0; index < 60 * 180 && !driver.done(); index += 1) {
    world.step(STEP, driver.input(world.state.chef), false);
  }
}

const IDLE = { dx: 0, dy: 0, interactPressed: false, interactHeld: false };

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Any other name stages the title scene.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    world.spawnOrder('nasi-goreng');
    world.spawnOrder('nasi-telur');
    world.spawnOrder('ayam-geprek');
    runScript(world, [
      { move: AT.rice }, { press: true },
      { move: AT.plate }, { press: true },
      { move: AT.egg }, { press: true },
      { move: AT.burner0 }, { press: true },
      { wait: 4.6 },
      { press: true },
      { move: AT.plate }, { press: true },
      { move: AT.egg }, { press: true },
      { move: AT.burner1 }, { press: true },
      { move: AT.chili }, { press: true },
      { move: AT.board }, { hold: 2.4 },
      { move: [700, 380] },
    ]);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    world.spawnOrder('nasi-telur');
    world.spawnOrder('nasi-goreng');
    runScript(world, [
      { move: AT.rice }, { press: true },
      { move: AT.plate }, { press: true },
      { move: AT.egg }, { press: true },
      { move: AT.burner0 }, { press: true },
      { wait: 4.6 },
      { press: true },
      { move: AT.plate }, { press: true },
      { move: AT.plate }, { press: true },
      { move: AT.window },
    ]);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'rush') {
    world.state.timeLeft = 28;
    world.state.elapsed = 117;
    world.state.level = 3;
    world.state.coins = 86;
    world.state.served = 5;
    world.state.combo = 2;
    world.state.comboTimer = 5;
    world.spawnOrder('ayam-geprek', 14);
    world.spawnOrder('nasi-goreng', 18);
    world.spawnOrder('sayur-ayam', 11);
    world.spawnOrder('nasi-telur', 22);
    world.state.burners[0] = { item: { kind: 'chicken', state: 'chopped', chop: 0 }, progress: 4.2 };
    world.state.burners[1] = { item: { kind: 'egg', state: 'raw', chop: 0 }, progress: 2 };
    world.state.plateItems = [
      { kind: 'rice', state: 'ready', chop: 0 },
      { kind: 'chili', state: 'ready', chop: 0 },
    ];
    world.state.chef.x = 900;
    world.state.chef.y = 300;
    world.state.chef.dx = -1;
    world.state.chef.dy = 0;
    world.state.chef.carrying = { kind: 'item', item: { kind: 'chicken', state: 'chopped', chop: 0 } };
    for (let index = 0; index < 30; index += 1) world.step(STEP, IDLE, false);
    return { screen: SCREEN_PLAY, best: 86 };
  }
  // Title scene: a few seconds of kitchen bustle behind the title card.
  world.spawnOrder('nasi-goreng');
  world.spawnOrder('ayam-geprek');
  for (let index = 0; index < 6 / STEP; index += 1) world.step(STEP, IDLE, true);
  return { screen: SCREEN_TITLE, best: 0 };
}
