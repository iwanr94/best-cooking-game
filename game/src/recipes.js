// Dapur Kilat's ingredients and recipes. Every dish is an original warung
// recipe: a set of ingredient kinds, each prepped its own way before plating.
export const INGREDIENTS = {
  rice: { name: 'Nasi', prep: 'scoop', colour: '#f7f3e8', dark: '#d8cfb4' },
  egg: { name: 'Telur', prep: 'fry', colour: '#f6e27a', dark: '#e0a83c' },
  chicken: { name: 'Ayam', prep: 'chop-fry', colour: '#c98a4b', dark: '#8a5a2b' },
  chili: { name: 'Cabai', prep: 'chop', colour: '#e5534b', dark: '#a8322b' },
  veg: { name: 'Sayur', prep: 'chop', colour: '#58b368', dark: '#2f7a44' },
};

/** An item is raw, chopped, cooked or ready (ready means it may go on a plate). */
export function freshItem(kind) {
  return { kind, state: kind === 'rice' ? 'ready' : 'raw', chop: 0 };
}

export function itemDisplayName(item) {
  const base = INGREDIENTS[item.kind].name;
  if (item.state === 'chopped') return `${base} cincang`;
  if (item.state === 'cooked') return `${base} matang`;
  if (item.state === 'burnt') return `${base} gosong`;
  return base;
}

/** Whether this item, as it is now, may be added to a plate. */
export function isPlateReady(item) {
  return item.state === 'ready' || item.state === 'cooked';
}

/** Whether the item still needs the chopping board. */
export function needsChop(item) {
  return item.state === 'raw' && (item.kind === 'chicken' || item.kind === 'chili' || item.kind === 'veg');
}

/** Whether the item still needs a stove burner. */
export function needsFry(item) {
  return (item.kind === 'egg' && item.state === 'raw') || (item.kind === 'chicken' && item.state === 'chopped');
}

export const RECIPES = [
  { id: 'nasi-telur', name: 'Nasi Telur', items: ['rice', 'egg'], price: 14 },
  { id: 'nasi-sayur', name: 'Nasi Sayur', items: ['rice', 'veg'], price: 12 },
  { id: 'nasi-goreng', name: 'Nasi Goreng', items: ['rice', 'egg', 'chili'], price: 20 },
  { id: 'ayam-geprek', name: 'Ayam Geprek', items: ['chicken', 'chili'], price: 22 },
  { id: 'sayur-ayam', name: 'Sayur Ayam', items: ['chicken', 'veg'], price: 18 },
];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

/** Whether the plate's items are exactly this recipe, in any order. */
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const wanted = [...recipe.items].sort();
  const held = plateItems.map((item) => item.kind).sort();
  return wanted.every((kind, index) => kind === held[index]);
}

/** The open order this plate completes, if any. */
export function findMatchingOrder(plateItems, orders) {
  for (const order of orders) {
    if (plateMatchesRecipe(plateItems, recipeById(order.recipeId))) return order;
  }
  return null;
}
