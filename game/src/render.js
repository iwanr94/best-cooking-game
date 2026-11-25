// Dapur Kilat's renderer: every pixel is drawn on one canvas — the kitchen,
// the chef, the food and the order board — with no image files at all.
import {
  BOARD,
  BURNERS,
  CRATES,
  CRATE_W,
  COUNTER_H,
  COUNTER_Y,
  FIELD,
  FRY_SECONDS,
  PALETTE,
  PLATE_COUNTER,
  STOVE,
  TRASH,
  WINDOW,
} from './config.js';
import { INGREDIENTS, itemDisplayName, recipeById } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'left', bold = true) {
  ctx.fillStyle = colour;
  ctx.font = `${bold ? '700' : '400'} ${size}px ${'system-ui, -apple-system, "Segoe UI", sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** A clock reading such as 02:30. */
function clock(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** Draw one ingredient as a little vector picture, centred on (x, y). */
export function drawIngredientIcon(ctx, kind, state, x, y, size) {
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'rice') {
    ctx.fillStyle = '#3f6fb5';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.95, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#f7f3e8';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.1, r * 0.42, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.15, r * 0.45, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.4, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'egg') {
    if (state === 'raw') {
      ctx.fillStyle = '#e8d9b0';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.7, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a86a';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.45, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fdfdf8';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = state === 'burnt' ? '#3a2a1a' : '#f6c945';
      ctx.beginPath();
      ctx.arc(r * 0.1, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'chicken') {
    const colour = state === 'cooked' ? '#a86a2f' : state === 'burnt' ? '#3a2a1a' : state === 'chopped' ? '#d98a6a' : '#e8a08a';
    if (state === 'chopped') {
      ctx.fillStyle = colour;
      for (const [ox, oy] of [[-0.4, -0.2], [0.35, -0.3], [0, 0.35]]) {
        ctx.fillRect(ox * r - r * 0.32, oy * r - r * 0.32, r * 0.64, r * 0.64);
      }
    } else {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(-r * 0.15, -r * 0.1, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fdfdf8';
      ctx.lineWidth = r * 0.22;
      ctx.beginPath();
      ctx.moveTo(r * 0.35, r * 0.25);
      ctx.lineTo(r * 0.85, r * 0.7);
      ctx.stroke();
    }
  } else if (kind === 'chili') {
    ctx.strokeStyle = state === 'chopped' ? '#e5534b' : '#d63c32';
    ctx.lineWidth = r * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (state === 'chopped') {
      ctx.moveTo(-r * 0.6, -r * 0.3);
      ctx.lineTo(r * 0.6, -r * 0.3);
      ctx.moveTo(-r * 0.6, r * 0.3);
      ctx.lineTo(r * 0.6, r * 0.3);
    } else {
      ctx.arc(0, -r * 0.25, r * 0.75, Math.PI * 1.15, Math.PI * 1.95);
    }
    ctx.stroke();
    ctx.strokeStyle = '#2f7a44';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.75);
    ctx.lineTo(r * 0.8, -r * 1.05);
    ctx.stroke();
  } else if (kind === 'veg') {
    ctx.fillStyle = '#58b368';
    for (const angle of [-0.6, 0, 0.6]) {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.34, r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#2f7a44';
    ctx.fillRect(-r * 0.08, -r * 0.2, r * 0.16, r * 1.1);
  }
  ctx.restore();
}

/** A white plate, empty or holding the given items in a row. */
function drawPlate(ctx, x, y, items, radius) {
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc8b0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.7, radius * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();
  const count = items.length;
  items.forEach((item, index) => {
    const ox = count === 1 ? 0 : (index - (count - 1) / 2) * radius * 0.7;
    drawIngredientIcon(ctx, item.kind, item.state, x + ox, y - 4, radius * 0.62);
  });
}

/** The kitchen itself: floor, wall, counters, stove, board, window and trash. */
function drawKitchen(ctx, state) {
  // Floor tiles.
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(col * 80, 64 + row * 84, 80, 84);
    }
  }
  // Wall strip above the counters.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 60, FIELD.width, 4);
  text(ctx, 'DAPUR KILAT', 16, 34, 26, PALETTE.text, 'left');

  // Ingredient crates.
  for (const crate of CRATES) {
    const cx = crate.x;
    ctx.fillStyle = PALETTE.counterSide;
    roundRect(ctx, cx, COUNTER_Y, CRATE_W, COUNTER_H, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, cx, COUNTER_Y, CRATE_W, 14, 8);
    ctx.fill();
    drawIngredientIcon(ctx, crate.kind, 'raw', cx + 30, COUNTER_Y + 34, 34);
    text(ctx, crate.label, cx + 56, COUNTER_Y + 26, 15, PALETTE.text, 'left');
    text(ctx, INGREDIENTS[crate.kind].prep === 'scoop' ? 'siap saji' : INGREDIENTS[crate.kind].prep === 'fry' ? 'digoreng' : INGREDIENTS[crate.kind].prep === 'chop' ? 'dipotong' : 'potong+goreng', cx + 56, COUNTER_Y + 44, 11, PALETTE.muted, 'left', false);
  }

  // Chopping board.
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, BOARD.x, COUNTER_Y, BOARD.width, COUNTER_H, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, BOARD.x + 10, COUNTER_Y + 8, BOARD.width - 20, COUNTER_H - 16, 6);
  ctx.fill();
  ctx.strokeStyle = '#8a8a7a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BOARD.x + 62, COUNTER_Y + 14);
  ctx.lineTo(BOARD.x + 88, COUNTER_Y + 40);
  ctx.stroke();
  text(ctx, 'TALENAN', BOARD.x + 60, COUNTER_Y + 48, 11, PALETTE.muted, 'center', false);

  // Stove with two burners.
  ctx.fillStyle = PALETTE.stove;
  roundRect(ctx, STOVE.x, COUNTER_Y, STOVE.width, COUNTER_H, 8);
  ctx.fill();
  state.burners.forEach((burner, index) => {
    const bx = BURNERS[index].x;
    const by = BURNERS[index].y;
    ctx.fillStyle = PALETTE.stoveTop;
    ctx.beginPath();
    ctx.arc(bx, by, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#565d6e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, 30, 0, Math.PI * 2);
    ctx.stroke();
    if (burner.item) {
      drawIngredientIcon(ctx, burner.item.kind, burner.item.state, bx, by - 2, 34);
      const fryTime = FRY_SECONDS[burner.item.kind];
      const fraction = Math.min(1, burner.progress / fryTime);
      ctx.strokeStyle = burner.item.state === 'burnt' ? '#e5534b' : burner.item.state === 'cooked' ? '#58b368' : '#f2c94c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(bx, by, 38, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
      ctx.stroke();
      if (burner.item.state === 'cooked') text(ctx, 'MATANG!', bx, COUNTER_Y + COUNTER_H + 16, 12, '#58b368', 'center');
      if (burner.item.state === 'burnt') text(ctx, 'GOSONG!', bx, COUNTER_Y + COUNTER_H + 16, 12, '#e5534b', 'center');
    } else {
      text(ctx, 'KOMPOR', bx, by, 11, '#8b93a3', 'center', false);
    }
  });

  // Plating counter island.
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, PLATE_COUNTER.x, PLATE_COUNTER.y, PLATE_COUNTER.width, PLATE_COUNTER.height, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, PLATE_COUNTER.x, PLATE_COUNTER.y, PLATE_COUNTER.width, 14, 10);
  ctx.fill();
  drawPlate(ctx, PLATE_COUNTER.x + 100, PLATE_COUNTER.y + 34, state.plateItems, 46);
  text(ctx, 'MEJA RACIK', PLATE_COUNTER.x + 100, PLATE_COUNTER.y + PLATE_COUNTER.height + 14, 11, PALETTE.muted, 'center', false);

  // Serving window on the right wall.
  ctx.fillStyle = '#5d3620';
  roundRect(ctx, WINDOW.x, WINDOW.y, WINDOW.width, WINDOW.height, 8);
  ctx.fill();
  ctx.fillStyle = '#f2c078';
  ctx.fillRect(WINDOW.x + 6, WINDOW.y + 6, WINDOW.width - 12, 26);
  text(ctx, 'LAYANAN', WINDOW.x + WINDOW.width / 2, WINDOW.y + 19, 12, '#3a2415', 'center');
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(WINDOW.x + 10, WINDOW.y + 40, WINDOW.width - 20, WINDOW.height - 50);
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(WINDOW.x + WINDOW.width / 2, WINDOW.y + 62, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(WINDOW.x + WINDOW.width / 2 - 14, WINDOW.y + 62, 28, 4);
  text(ctx, 'ANTAR', WINDOW.x + WINDOW.width / 2, WINDOW.y + 100, 13, PALETTE.text, 'center');

  // Trash bin.
  ctx.fillStyle = '#565d6e';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.width, TRASH.height, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(TRASH.x - 4, TRASH.y - 6, TRASH.width + 8, 10);
  text(ctx, 'SAMPAH', TRASH.x + TRASH.width / 2, TRASH.y + TRASH.height / 2 + 12, 11, PALETTE.text, 'center');
}

/** The chef: white hat, apron, and whatever they carry held overhead. */
function drawChef(ctx, chef) {
  const { x, y } = chef;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = PALETTE.chefShirt;
  roundRect(ctx, x - 18, y - 8, 36, 26, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefApron;
  roundRect(ctx, x - 12, y + 2, 24, 16, 6);
  ctx.fill();
  // Head and hat.
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(x, y - 18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefHat;
  roundRect(ctx, x - 14, y - 40, 28, 12, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 8, y - 30, 7, 0, Math.PI * 2);
  ctx.arc(x, y - 33, 8, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 30, 7, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look where the chef walks.
  ctx.fillStyle = '#2b1a12';
  const look = Math.sign(chef.dx) || 1;
  ctx.beginPath();
  ctx.arc(x - 5 + look * 2, y - 19, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5 + look * 2, y - 19, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held up high.
  if (chef.carrying) {
    if (chef.carrying.kind === 'item') {
      drawIngredientIcon(ctx, chef.carrying.item.kind, chef.carrying.item.state, x, y - 52, 30);
      if (chef.chopping) {
        const fraction = chef.carrying.item.chop;
        ctx.strokeStyle = '#f2c94c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y - 52, 22, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
        ctx.stroke();
      }
      text(ctx, itemDisplayName(chef.carrying.item), x, y - 72, 11, PALETTE.text, 'center', false);
    } else {
      drawPlate(ctx, x, y - 52, chef.carrying.items, 30);
    }
  }
}

/** The order board: one ticket per open order, with its patience bar. */
function drawOrderBoard(ctx, state) {
  const tickets = state.orders;
  tickets.forEach((order, index) => {
    const recipe = recipeById(order.recipeId);
    const x = 208 + index * 192;
    const y = 8;
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, x, y, 186, 48, 8);
    ctx.fill();
    const fraction = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = fraction > 0.5 ? '#58b368' : fraction > 0.25 ? '#f2c94c' : '#e5534b';
    ctx.fillRect(x + 8, y + 40, 170 * fraction, 5);
    text(ctx, recipe.name, x + 10, y + 13, 15, PALETTE.ticketText, 'left');
    text(ctx, `${recipe.price} koin`, x + 176, y + 13, 12, '#8a5a2b', 'right');
    recipe.items.forEach((kind, itemIndex) => {
      drawIngredientIcon(ctx, kind, kind === 'rice' ? 'ready' : 'cooked', x + 14 + itemIndex * 26, y + 30, 20);
    });
  });
  if (tickets.length === 0) {
    text(ctx, 'Belum ada pesanan — siap-siap!', 208, 32, 14, PALETTE.muted, 'left', false);
  }
}

/** Timer, coins, hearts and level, top-right of the wall strip. */
function drawStatus(ctx, state) {
  const urgent = state.timeLeft <= 30;
  text(ctx, clock(state.timeLeft), 1030, 34, 30, urgent ? '#ff8a7a' : PALETTE.text, 'center');
  text(ctx, `LEVEL ${state.level}`, 1030, 52, 11, PALETTE.muted, 'center', false);
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(1108, 32, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2b';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¢', 1108, 33);
  text(ctx, String(state.coins), 1125, 33, 20, PALETTE.text, 'left');
  for (let index = 0; index < 3; index += 1) {
    ctx.fillStyle = index < state.hearts ? '#e5534b' : '#5d3620';
    ctx.beginPath();
    ctx.arc(1210 + index * 24, 30, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1210 + index * 24 - 5, 27, 5, 0, Math.PI * 2);
    ctx.arc(1210 + index * 24 + 5, 27, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.combo > 1 && state.comboTimer > 0) {
    text(ctx, `KOMBO x${state.combo}`, 640, 158, 16, '#58b368', 'center');
  }
}

/** Floating score popups and the hint line at the bottom. */
function drawOverlays(ctx, state) {
  for (const popup of state.popups) {
    ctx.globalAlpha = Math.min(1, popup.ttl);
    text(ctx, popup.text, popup.x, popup.y, 20, popup.colour, 'center');
    ctx.globalAlpha = 1;
  }
  if (state.messageTimer > 0) {
    ctx.fillStyle = 'rgba(43,26,18,0.85)';
    roundRect(ctx, 340, 428, 600, 34, 10);
    ctx.fill();
    text(ctx, state.message, 640, 446, 15, PALETTE.text, 'center', false);
  }
  text(ctx, 'WASD / panah: jalan   •   E / Spasi: pakai stasiun (tahan di talenan)   •   Klik: jalan ke sana   •   P: jeda', 640, 470, 12, 'rgba(255,243,214,0.75)', 'center', false);
}

/** Title, pause and game-over screens, drawn over the kitchen. */
function drawScreen(ctx, state, screen, best) {
  if (screen === SCREEN_PLAY) return;
  ctx.fillStyle = 'rgba(20,12,8,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (screen === SCREEN_TITLE) {
    text(ctx, 'DAPUR KILAT', 640, 120, 64, PALETTE.gold, 'center');
    text(ctx, 'Warung cepat saji — masak, rakit, antar sebelum pelanggan kabur!', 640, 168, 20, PALETTE.text, 'center', false);
    text(ctx, '1. Ambil bahan dari peti   2. Potong di talenan, goreng di kompor', 640, 216, 17, PALETTE.text, 'center', false);
    text(ctx, '3. Rakit hidangan di Meja Racik   4. Antar ke jendela LAYANAN', 640, 244, 17, PALETTE.text, 'center', false);
    text(ctx, 'Nasi Goreng: nasi + telur goreng + cabai cincang  •  Ayam Geprek: ayam cincang goreng + cabai', 640, 282, 15, PALETTE.muted, 'center', false);
    text(ctx, 'TEKAN SPASI ATAU KLIK UNTUK MULAI', 640, 340, 22, '#58b368', 'center');
    if (best > 0) text(ctx, `Skor terbaik: ${best} koin`, 640, 380, 16, PALETTE.muted, 'center', false);
  } else if (screen === SCREEN_PAUSED) {
    text(ctx, 'JEDA', 640, 210, 48, PALETTE.text, 'center');
    text(ctx, 'Tekan P atau Spasi untuk lanjut', 640, 260, 18, PALETTE.muted, 'center', false);
  } else if (screen === SCREEN_OVER) {
    text(ctx, 'SHIFT SELESAI!', 640, 130, 52, PALETTE.gold, 'center');
    text(ctx, `Koin: ${state.coins}   •   Pesanan diantar: ${state.served}   •   Gagal: ${state.failed}`, 640, 196, 20, PALETTE.text, 'center', false);
    if (state.coins >= best && state.coins > 0) text(ctx, 'Skor terbaik baru!', 640, 232, 20, '#58b368', 'center');
    else text(ctx, `Skor terbaik: ${best} koin`, 640, 232, 18, PALETTE.muted, 'center', false);
    text(ctx, 'TEKAN SPASI UNTUK MAIN LAGI', 640, 300, 20, '#58b368', 'center');
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
  }

  function draw(state, screen, best) {
    resize();
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const offsetX = (canvas.width - FIELD.width * scale) / 2;
    const offsetY = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 6 * state.shake, (Math.random() - 0.5) * 6 * state.shake);
    }
    drawKitchen(ctx, state);
    drawOrderBoard(ctx, state);
    drawStatus(ctx, state);
    drawChef(ctx, state.chef);
    drawOverlays(ctx, state);
    drawScreen(ctx, state, screen, best);
  }

  return { draw };
}
