// Keyboard and mouse input: WASD or arrows to walk, E or Space to use a
// station (hold at the board to chop), P to pause, Enter or Space to start.
// A mouse click sets a walk target; clicking a station walks there and uses
// it on arrival. The canvas reports its own size so clicks map to the field.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

export function createInput(canvas, world) {
  const keys = new Set();
  let clickTarget = null;
  let clickStation = false;
  let interactHeld = false;
  let interactPressed = false;
  let actions = 0;

  function fieldPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  function stationAt(point) {
    const station = world.nearestStation({ x: point.x, y: point.y });
    return station;
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (event.code === 'Space') event.preventDefault();
      return;
    }
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'KeyE') {
      interactHeld = true;
      interactPressed = true;
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    }
    if (event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (event.code === 'Space' || event.code === 'KeyE') interactHeld = false;
  });
  window.addEventListener('blur', () => {
    keys.clear();
    interactHeld = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = fieldPoint(event);
    clickTarget = point;
    clickStation = Boolean(stationAt(point));
    actions |= ACTION_CONFIRM;
  });

  /** The movement vector for this frame, from keys or the click target. */
  function direction() {
    let dx = 0;
    let dy = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      clickTarget = null;
      return { dx, dy };
    }
    if (clickTarget) {
      const chef = world.state.chef;
      const ox = clickTarget.x - chef.x;
      const oy = clickTarget.y - chef.y;
      const distance = Math.hypot(ox, oy);
      if (distance < 14) {
        clickTarget = null;
        if (clickStation) {
          clickStation = false;
          interactPressed = true;
        }
        return { dx: 0, dy: 0 };
      }
      return { dx: ox / distance, dy: oy / distance };
    }
    return { dx: 0, dy: 0 };
  }

  return {
    direction,
    /** The step input for this frame: movement plus interact edges. */
    takeStepInput() {
      const move = direction();
      const input = { dx: move.dx, dy: move.dy, interactPressed, interactHeld };
      interactPressed = false;
      return input;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
