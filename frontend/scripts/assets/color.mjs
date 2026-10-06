const cache = new Map();

export const parseColor = (value) => {
  if (Array.isArray(value)) return value;
  const cached = cache.get(value);
  if (cached) return cached;
  const hex = value.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
  const parsed = [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
    full.length >= 8 ? parseInt(full.slice(6, 8), 16) : 255,
  ];
  cache.set(value, parsed);
  return parsed;
};

export const toHex = ([r, g, b, a = 255]) =>
  `#${[r, g, b, a].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

export const mix = (from, to, amount) => {
  const a = parseColor(from);
  const b = parseColor(to);
  return toHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
    a[3] + (b[3] - a[3]) * amount,
  ]);
};

const LIGHT = "#fff6dc";
const SHADE = "#2b2b3a";

export const ramp = (base) => ({
  hi: mix(base, LIGHT, 0.32),
  base: toHex(parseColor(base)),
  lo: mix(base, SHADE, 0.32),
  deep: mix(base, SHADE, 0.58),
});

export const createRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
