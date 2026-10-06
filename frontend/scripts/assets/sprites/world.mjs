import { Pixels } from "../canvas.mjs";
import { createRandom, mix } from "../color.mjs";
import { INK, P } from "../palette.mjs";

const speckle = (c, x, y, w, h, colors, density, random) => {
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      if (random() < density) c.px(x + xx, y + yy, colors[Math.floor(random() * colors.length)]);
    }
  }
};

const treeCanopy = (c, cx, cy, radius, base) => {
  c.softShadow(cx + 1, cy + radius - 1, radius, radius * 0.4, 56);
  c.box(cx - 1, cy + radius - 3, 3, 6, P.wood);
  c.orb(cx, cy, radius, radius, base);
  c.orb(cx - radius * 0.35, cy - radius * 0.3, radius * 0.5, radius * 0.45, mix(base, "#d6f2a0", 0.25));
};

export const villageBase = () => {
  const random = createRandom(1337);
  const c = new Pixels(400, 250);
  c.rect(0, 0, 400, 250, P.grass);
  speckle(c, 0, 0, 400, 250, [P.grassDark, P.grassLight], 0.04, random);
  for (let index = 0; index < 220; index += 1) {
    const x = Math.floor(random() * 398);
    const y = Math.floor(random() * 246);
    c.vline(x, y, 2, P.grassDark);
    c.vline(x + 1, y + 1, 2, P.grassDark);
  }

  c.ellipse(335, 232, 82, 44, P.dirt);
  c.ellipse(335, 232, 78, 40, P.waterDark);
  c.ellipse(334, 231, 75, 37, P.water);
  speckle(c, 262, 196, 140, 54, [P.waterLight, P.waterDark], 0.025, random);

  const pathColor = P.dirt;
  c.rect(0, 108, 400, 28, pathColor);
  c.rect(186, 0, 28, 250, pathColor);
  c.rect(178, 100, 44, 44, pathColor);
  [108, 135].forEach((y) => c.hline(0, y, 400, P.dirtDark));
  [186, 213].forEach((x) => c.vline(x, 0, 250, P.dirtDark));
  speckle(c, 0, 109, 400, 26, [P.dirtLight, P.dirtDark], 0.035, random);
  speckle(c, 187, 0, 26, 250, [P.dirtLight, P.dirtDark], 0.035, random);
  speckle(c, 178, 100, 44, 44, [P.dirtLight, P.dirtDark], 0.035, random);
  for (let x = 0; x < 400; x += 2) {
    if (random() < 0.4) c.px(x, 107, P.grassDark);
    if (random() < 0.4) c.px(x, 136, P.grassDark);
  }
  for (let y = 0; y < 250; y += 2) {
    if (random() < 0.4) c.px(185, y, P.grassDark);
    if (random() < 0.4) c.px(214, y, P.grassDark);
  }

  const free = (x, y) => !((x > 176 && x < 224) || (y > 98 && y < 146));
  let planted = 0;
  let attempts = 0;
  while (planted < 46 && attempts < 600) {
    attempts += 1;
    const x = Math.floor(10 + random() * 380);
    const y = Math.floor(10 + random() * 230);
    const nearRiver = ((x - 335) / 84) ** 2 + ((y - 232) / 46) ** 2 < 1;
    if (!free(x, y) || nearRiver) continue;
    treeCanopy(c, x, y, 6 + Math.floor(random() * 3), random() > 0.5 ? P.grassDark : "#4f9a46");
    planted += 1;
  }

  for (let index = 0; index < 90; index += 1) {
    const x = Math.floor(random() * 396);
    const y = Math.floor(random() * 246);
    if (!free(x, y)) continue;
    const color = [P.gold, P.pink, P.white, P.redLight][Math.floor(random() * 4)];
    c.px(x, y, color);
    c.px(x, y + 1, P.grassDeep);
  }
  return c;
};

const stoneBorder = (c, x, y, w, h, color) => {
  c.rect(x, y, w, h, INK);
  c.rect(x + 1, y + 1, w - 2, h - 2, color);
  c.hline(x + 1, y + 1, w - 2, mix(color, "#ffffff", 0.35));
};

const patch = (c, x, y, base, edge) => {
  c.rect(x - 1, y - 1, 50, 50, INK);
  c.rect(x, y, 48, 48, edge);
  c.rect(x + 2, y + 2, 44, 44, base);
  c.hline(x + 2, y + 2, 44, mix(base, "#ffffff", 0.25));
};

const grounds = {
  tech: (c, random) => {
    c.rect(0, 0, 128, 64, "#d9dde3");
    stoneBorder(c, 1, 1, 126, 62, "#d9dde3");
    for (let x = 4; x < 124; x += 8) c.vline(x, 4, 56, "#c6ccd5");
    for (let y = 4; y < 60; y += 8) c.hline(4, y, 120, "#c6ccd5");
    speckle(c, 4, 4, 120, 56, ["#e9ecef", "#c0c6d0"], 0.05, random);
    patch(c, 8, 8, "#eef0f3", P.stoneDark);
    patch(c, 72, 8, "#eef0f3", P.stoneDark);
    [60, 62].forEach((x) => c.vline(x, 8, 6, P.slate));
    c.box(58, 8, 4, 3, P.goldLight);
    c.box(60, 52, 7, 7, P.grassDark);
    c.box(61, 53, 5, 3, P.grass);
    c.box(3, 3, 12, 4, P.grassDark);
    c.box(113, 3, 12, 4, P.grassDark);
    c.rect(62, 28, 4, 8, P.slate);
    c.rect(63, 29, 2, 2, P.green);
  },
  commodity: (c, random) => {
    c.rect(0, 0, 128, 64, "#b9a68d");
    stoneBorder(c, 1, 1, 126, 62, "#b9a68d");
    speckle(c, 3, 3, 122, 58, ["#a89478", "#cbb89c", P.dirtDark], 0.14, random);
    for (let index = 0; index < 28; index += 1) {
      const x = 4 + Math.floor(random() * 118);
      const y = 4 + Math.floor(random() * 54);
      c.rect(x, y, 2, 1, P.stoneDeep);
      c.px(x, y, P.stoneDark);
    }
    patch(c, 8, 8, "#c9b79c", P.woodDark);
    patch(c, 72, 8, "#c9b79c", P.woodDark);
    c.rect(1, 58, 126, 3, P.stoneDeep);
    c.hline(1, 58, 126, P.stoneDark);
    for (let x = 4; x < 126; x += 8) c.rect(x, 57, 3, 5, P.woodDark);
    [10, 54, 66, 116].forEach((x) => [10, 52].forEach((y) => c.box(x, y, 2, 4, P.wood)));
  },
  consumer: (c, random) => {
    c.rect(0, 0, 128, 64, "#c7c2b6");
    stoneBorder(c, 1, 1, 126, 62, "#c7c2b6");
    speckle(c, 3, 3, 122, 58, ["#b8b3a7", "#d6d1c5", "#aaa598"], 0.12, random);
    patch(c, 8, 8, "#d9d4c8", P.stoneDeep);
    patch(c, 72, 8, "#d9d4c8", P.stoneDeep);
    c.rect(1, 57, 126, 5, "#8e8a80");
    for (let x = 4; x < 124; x += 10) c.rect(x, 59, 5, 1, P.gold);
    c.box(58, 14, 12, 6, P.wood);
    c.hline(58, 17, 12, P.woodDark);
    c.box(60, 40, 8, 6, P.stoneDeep);
    c.hline(60, 43, 8, P.stoneDark);
  },
  agri: (c, random) => {
    c.rect(0, 0, 128, 64, "#8fc174");
    stoneBorder(c, 1, 1, 126, 62, "#8fc174");
    speckle(c, 3, 3, 122, 58, [P.grassDark, P.grassLight, "#7fb064"], 0.1, random);
    patch(c, 8, 8, "#a98a5a", P.woodDark);
    patch(c, 72, 8, "#a98a5a", P.woodDark);
    for (const x of [8, 72]) {
      for (let row = 12; row < 54; row += 5) c.hline(x + 3, row, 42, "#8a6c40");
    }
    c.rect(58, 2, 12, 60, P.dirt);
    speckle(c, 58, 2, 12, 60, [P.dirtLight, P.dirtDark], 0.08, random);
    c.rect(1, 3, 126, 2, P.wood);
    c.rect(1, 59, 126, 2, P.wood);
    for (let x = 6; x < 124; x += 10) {
      c.rect(x, 2, 2, 4, P.woodDark);
      c.rect(x, 58, 2, 4, P.woodDark);
    }
    c.orb(63, 14, 4, 3, P.sand);
    c.orb(66, 48, 4, 3, P.sand);
  },
};

export const districtGround = (sector) => {
  const c = new Pixels(128, 64);
  grounds[sector](c, createRandom(sector.length * 977));
  return c;
};

export const fogBank = () => {
  const c = new Pixels(128, 64);
  const layers = [
    [64, 32, 62, 28, "#d3dae5f2"],
    [30, 25, 30, 18, "#dde3ecf0"],
    [98, 27, 30, 19, "#dde3ecf0"],
    [38, 48, 34, 14, "#d3dae5ee"],
    [94, 49, 34, 13, "#d3dae5ee"],
    [64, 12, 34, 11, "#e6ebf2e6"],
    [64, 56, 36, 9, "#e6ebf2e0"],
    [8, 32, 14, 20, "#e6ebf2cc"],
    [120, 32, 14, 20, "#e6ebf2cc"],
  ];
  layers.forEach(([cx, cy, rx, ry, color]) => c.ellipse(cx, cy, rx, ry, color, true));
  const random = createRandom(42);
  c.mapPixels(([r, g, b, a], x, y) => {
    if (a === 0) return null;
    return random() < 0.08 && (x + y) % 2 === 0 ? [r, g, b, Math.max(0, a - 70)] : null;
  });
  return c;
};

export const padlockFence = () => {
  const c = new Pixels(32, 16);
  c.rect(0, 9, 32, 2, P.wood);
  c.rect(0, 5, 32, 2, P.wood);
  c.hline(0, 9, 32, P.woodLight);
  c.hline(0, 5, 32, P.woodLight);
  [1, 14, 28].forEach((x) => {
    c.box(x, 2, 3, 13, P.woodDark);
    c.hline(x, 2, 3, P.woodLight);
  });
  c.frame(11, 1, 10, 7, P.slate);
  c.rect(12, 2, 8, 5, "#00000000");
  c.rect(12, 0, 1, 3, P.slate);
  c.rect(19, 0, 1, 3, P.slate);
  c.hline(12, 0, 8, P.slate);
  c.box(10, 7, 12, 8, P.gold);
  c.rect(15, 9, 2, 3, P.goldDark);
  c.px(11, 8, P.goldLight);
  return c.outline(INK);
};
