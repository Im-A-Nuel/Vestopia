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

const UNIT = 4;

const frameOf = (district, layout) => {
  const rows = Math.ceil(district.lots / district.cols);
  const width = district.cols * layout.cell + layout.margin.side * 2;
  const height = rows * layout.cell + layout.margin.top + layout.margin.bottom;
  return { left: district.centerX - width / 2, top: district.top, width, height };
};

const entrancePoint = (district, layout) => {
  const frame = frameOf(district, layout);
  const middleX = frame.left + frame.width / 2;
  const middleY = frame.top + frame.height / 2;
  if (district.entrance === "bottom") return { x: middleX, y: frame.top + frame.height };
  if (district.entrance === "top") return { x: middleX, y: frame.top };
  if (district.entrance === "left") return { x: frame.left, y: middleY };
  return { x: frame.left + frame.width, y: middleY };
};

const curvePoints = (from, to, bend) => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const control = { x: mx - (dy / length) * bend, y: my + (dx / length) * bend };
  const steps = Math.ceil(length / 6);
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return {
      x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * control.x + t * t * to.x,
      y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * control.y + t * t * to.y,
    };
  });
};

const stampPath = (c, points, radius, edge, fill) => {
  points.forEach(({ x, y }) => c.ellipse(x, y, radius + 1.2, radius + 1.2, edge));
  points.forEach(({ x, y }) => c.ellipse(x, y, radius, radius, fill));
};

const insideEllipse = (x, y, area, padding = 0) =>
  ((x - area.x / UNIT) / (area.rx / UNIT + padding)) ** 2 + ((y - area.y / UNIT) / (area.ry / UNIT + padding)) ** 2 <=
  1;

export const villageBase = (layout) => {
  const random = createRandom(1337);
  const width = layout.world.width / UNIT;
  const height = layout.world.height / UNIT;
  const terrain = layout.terrain;
  const c = new Pixels(width, height);
  c.rect(0, 0, width, height, P.grass);
  speckle(c, 0, 0, width, height, [P.grassDark, P.grassLight], 0.035, random);

  terrain.meadows.forEach((area) => {
    c.ellipse(area.x / UNIT, area.y / UNIT, area.rx / UNIT, area.ry / UNIT, "#8ccb6c");
    speckle(
      c,
      (area.x - area.rx) / UNIT,
      (area.y - area.ry) / UNIT,
      (area.rx * 2) / UNIT,
      (area.ry * 2) / UNIT,
      [P.gold, P.pink, P.white],
      0.012,
      random,
    );
  });

  terrain.hills.forEach((area) => {
    const cx = area.x / UNIT;
    const cy = area.y / UNIT;
    const rx = area.rx / UNIT;
    const ry = area.ry / UNIT;
    c.softShadow(cx + 6, cy + 8, rx, ry, 40);
    c.orb(cx, cy, rx, ry, "#6fae55");
    c.orb(cx - rx * 0.15, cy - ry * 0.2, rx * 0.6, ry * 0.55, "#7fbd62");
    for (let index = 0; index < 18; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * 0.8;
      const x = cx + Math.cos(angle) * rx * distance;
      const y = cy + Math.sin(angle) * ry * distance;
      if (random() > 0.6) c.orb(x, y, 2, 1.5, P.stoneDark);
      else {
        c.px(x, y, P.gold);
        c.px(x, y + 1, P.grassDeep);
      }
    }
  });

  const lake = terrain.lake;
  c.ellipse(lake.x / UNIT, lake.y / UNIT, lake.rx / UNIT + 6, lake.ry / UNIT + 6, P.sand);
  speckle(
    c,
    (lake.x - lake.rx) / UNIT - 6,
    (lake.y - lake.ry) / UNIT - 6,
    (lake.rx * 2) / UNIT + 12,
    (lake.ry * 2) / UNIT + 12,
    [P.dirtLight],
    0.0,
    random,
  );
  stampPath(
    c,
    terrain.stream
      .map(([x, y]) => ({ x: x / UNIT, y: y / UNIT }))
      .flatMap((point, index, list) => (index === 0 ? [point] : curvePoints(list[index - 1], point, 6))),
    7,
    P.sand,
    P.waterDark,
  );
  c.ellipse(lake.x / UNIT, lake.y / UNIT, lake.rx / UNIT, lake.ry / UNIT, P.waterDark);
  c.ellipse(lake.x / UNIT - 2, lake.y / UNIT - 2, lake.rx / UNIT - 4, lake.ry / UNIT - 4, P.water);
  stampPath(
    c,
    terrain.stream
      .map(([x, y]) => ({ x: x / UNIT, y: y / UNIT }))
      .flatMap((point, index, list) => (index === 0 ? [point] : curvePoints(list[index - 1], point, 6))),
    5,
    P.waterDark,
    P.water,
  );
  for (let index = 0; index < 60; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 0.9;
    const x = lake.x / UNIT + Math.cos(angle) * (lake.rx / UNIT) * distance;
    const y = lake.y / UNIT + Math.sin(angle) * (lake.ry / UNIT) * distance;
    c.hline(x, y, 3, P.waterLight);
  }
  [
    [-0.55, -0.2],
    [0.35, 0.3],
    [-0.1, 0.45],
  ].forEach(([fx, fy]) => {
    const x = lake.x / UNIT + fx * (lake.rx / UNIT);
    const y = lake.y / UNIT + fy * (lake.ry / UNIT);
    c.ellipse(x, y, 3, 2, P.grassDark);
    c.px(x + 1, y - 1, P.pink);
  });

  const rocks = terrain.rocks;
  c.ellipse(rocks.x / UNIT, rocks.y / UNIT, rocks.rx / UNIT, rocks.ry / UNIT, "#a6a17f");
  speckle(
    c,
    (rocks.x - rocks.rx) / UNIT,
    (rocks.y - rocks.ry) / UNIT,
    (rocks.rx * 2) / UNIT,
    (rocks.ry * 2) / UNIT,
    [P.stoneDark, P.dirtDark],
    0.08,
    random,
  );
  for (let index = 0; index < 40; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * 0.85;
    const x = rocks.x / UNIT + Math.cos(angle) * (rocks.rx / UNIT) * distance;
    const y = rocks.y / UNIT + Math.sin(angle) * (rocks.ry / UNIT) * distance;
    const size = 1.5 + random() * 2.5;
    c.orb(x, y, size, size * 0.8, random() > 0.5 ? P.stoneDark : P.stone);
  }

  terrain.fields.forEach((field) => {
    const x = field.x / UNIT;
    const y = field.y / UNIT;
    const w = field.width / UNIT;
    const h = field.height / UNIT;
    c.rect(x, y, w, h, "#b08b58");
    for (let row = 1; row < h; row += 3) c.hline(x, y + row, w, row % 6 === 1 ? P.gold : "#d8b45a");
    c.frame(x - 1, y - 1, w + 2, h + 2, P.wood);
    for (let post = 0; post < w; post += 6) c.rect(x + post, y - 2, 1, 3, P.woodDark);
  });

  const plaza = { x: layout.plaza.x / UNIT, y: layout.plaza.y / UNIT };
  layout.districts.forEach((district, index) => {
    const entrance = entrancePoint(district, layout);
    const points = curvePoints(plaza, { x: entrance.x / UNIT, y: entrance.y / UNIT }, index % 2 === 0 ? 14 : -14);
    stampPath(c, points, 7, P.dirtDark, P.dirt);
  });
  layout.districts.forEach((district, index) => {
    const entrance = entrancePoint(district, layout);
    curvePoints(plaza, { x: entrance.x / UNIT, y: entrance.y / UNIT }, index % 2 === 0 ? 14 : -14).forEach(
      ({ x, y }) => {
        if (random() < 0.3) c.px(x + (random() - 0.5) * 10, y + (random() - 0.5) * 10, P.dirtLight);
      },
    );
  });

  c.ellipse(plaza.x, plaza.y, 82, 34, P.dirtDark);
  for (let y = Math.floor(plaza.y - 32); y <= plaza.y + 32; y += 1) {
    for (let x = Math.floor(plaza.x - 80); x <= plaza.x + 80; x += 1) {
      if (((x - plaza.x) / 80) ** 2 + ((y - plaza.y) / 32) ** 2 > 1) continue;
      const tile = (Math.floor(x / 4) + Math.floor(y / 3)) % 2 === 0;
      const edge = x % 4 === 0 || y % 3 === 0;
      c.px(x, y, edge ? "#bfae88" : tile ? "#ddd0b0" : "#d2c39f");
    }
  }
  c.ellipse(plaza.x, plaza.y + 12, 6, 3, P.stoneDark);
  c.ellipse(plaza.x, plaza.y + 12, 4.5, 2, P.water);

  const frames = layout.districts.map((district) => frameOf(district, layout));
  const blocked = (x, y) => {
    const wx = x * UNIT;
    const wy = y * UNIT;
    if (
      frames.some(
        (f) => wx > f.left - 20 && wx < f.left + f.width + 20 && wy > f.top - 20 && wy < f.top + f.height + 20,
      )
    )
      return true;
    if (insideEllipse(x, y, lake, 8) || insideEllipse(x, y, rocks, 2)) return true;
    if (((x - plaza.x) / 90) ** 2 + ((y - plaza.y) / 42) ** 2 < 1) return true;
    if (
      terrain.fields.some((f) => wx > f.x - 16 && wx < f.x + f.width + 16 && wy > f.y - 16 && wy < f.y + f.height + 16)
    )
      return true;
    const pixel = c.get(Math.round(x), Math.round(y));
    return pixel[0] === parseInt(P.dirt.slice(1, 3), 16) && pixel[1] === parseInt(P.dirt.slice(3, 5), 16);
  };

  const trees = [];
  const plant = (x, y, radius, variant) => {
    c.softShadow(x + 1, y + radius - 1, radius, radius * 0.4, 56);
    trees.push({ x: Math.round(x * UNIT), y: Math.round((y + radius + 2) * UNIT), scale: radius / 8, variant });
  };

  terrain.forests.forEach((area) => {
    for (let index = 0; index < 70; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random());
      const x = area.x / UNIT + Math.cos(angle) * (area.rx / UNIT) * distance;
      const y = area.y / UNIT + Math.sin(angle) * (area.ry / UNIT) * distance;
      if (x < 4 || y < 4 || x > width - 4 || y > height - 4 || blocked(x, y)) continue;
      plant(x, y, 6 + Math.floor(random() * 4), random() > 0.4 ? 0 : 1);
    }
  });

  let planted = 0;
  let attempts = 0;
  while (planted < 90 && attempts < 3000) {
    attempts += 1;
    const x = 6 + random() * (width - 12);
    const y = 6 + random() * (height - 12);
    if (blocked(x, y)) continue;
    plant(x, y, 5 + Math.floor(random() * 3), random() > 0.5 ? 0 : 1);
    planted += 1;
  }
  for (let index = 0; index < 500; index += 1) {
    const x = random() * (width - 2);
    const y = random() * (height - 2);
    if (blocked(x, y)) continue;
    c.px(x, y, [P.gold, P.pink, P.white, P.redLight][Math.floor(random() * 4)]);
    c.px(x, y + 1, P.grassDeep);
  }
  trees.sort((a, b) => a.y - b.y);
  c.trees = trees;
  return c;
};

const stoneBorder = (c, w, h, color) => {
  c.rect(0, 0, w, h, INK);
  c.rect(1, 1, w - 2, h - 2, color);
  c.hline(1, 1, w - 2, mix(color, "#ffffff", 0.35));
};

const patch = (c, x, y, base, edge) => {
  c.rect(x - 1, y - 1, 50, 50, INK);
  c.rect(x, y, 48, 48, edge);
  c.rect(x + 2, y + 2, 44, 44, base);
  c.hline(x + 2, y + 2, 44, mix(base, "#ffffff", 0.25));
};

const STYLES = {
  tech: { base: "#d9dde3", speckles: ["#e9ecef", "#c0c6d0"], lot: "#eef0f3", edge: P.stoneDark, grid: "#c6ccd5" },
  media: { base: "#cfd3dc", speckles: ["#dfe2e8", "#b9bec9"], lot: "#e4e7ec", edge: P.slate, grid: "#bcc1cc" },
  retail: { base: "#d8c7ad", speckles: ["#e6d7bf", "#c4b296"], lot: "#e9dcc6", edge: P.woodDark, grid: "#c9b69a" },
  consumer: { base: "#c7c2b6", speckles: ["#b8b3a7", "#d6d1c5"], lot: "#d9d4c8", edge: P.stoneDeep, grid: null },
  agri: { base: "#8fc174", speckles: [P.grassDark, P.grassLight], lot: "#a98a5a", edge: P.woodDark, grid: null },
  commodity: {
    base: "#b9a68d",
    speckles: ["#a89478", "#cbb89c", P.dirtDark],
    lot: "#c9b79c",
    edge: P.woodDark,
    grid: null,
  },
};

export const districtGround = (district, layout) => {
  const cell = layout.cell / UNIT;
  const side = layout.margin.side / UNIT;
  const top = layout.margin.top / UNIT;
  const bottom = layout.margin.bottom / UNIT;
  const rows = Math.ceil(district.lots / district.cols);
  const width = side * 2 + district.cols * cell;
  const height = top + bottom + rows * cell;
  const style = STYLES[district.id];
  const random = createRandom(district.id.length * 977 + district.lots);
  const c = new Pixels(width, height);
  stoneBorder(c, width, height, style.base);
  speckle(c, 2, 2, width - 4, height - 4, style.speckles, 0.1, random);
  if (style.grid) {
    for (let x = 4; x < width - 4; x += 8) c.vline(x, 3, height - 6, style.grid);
    for (let y = 4; y < height - 4; y += 8) c.hline(3, y, width - 6, style.grid);
  }
  if (district.id === "agri") {
    c.rect(1, 3, width - 2, 2, P.wood);
    c.rect(1, height - 5, width - 2, 2, P.wood);
    for (let x = 6; x < width - 4; x += 10) {
      c.rect(x, 2, 2, 4, P.woodDark);
      c.rect(x, height - 6, 2, 4, P.woodDark);
    }
  }
  if (district.id === "commodity") {
    c.rect(1, height - 5, width - 2, 3, P.stoneDeep);
    for (let x = 4; x < width - 2; x += 8) c.rect(x, height - 6, 3, 5, P.woodDark);
  }
  c.rect(side, 3, width - side * 2, top - 6, mix(style.base, "#2b2b3a", 0.08));
  for (let index = 0; index < district.lots; index += 1) {
    const column = index % district.cols;
    const row = Math.floor(index / district.cols);
    const x = side + column * cell + (cell - 48) / 2;
    const y = top + row * cell + (cell - 48) / 2;
    patch(c, x, y, style.lot, style.edge);
    if (district.id === "agri") {
      for (let line = y + 4; line < y + 46; line += 5) c.hline(x + 3, line, 42, "#8a6c40");
    }
  }
  if (["tech", "media"].includes(district.id)) {
    for (let x = 4; x < width - 3; x += 5) c.orb(x, height - 3.5, 2.6, 2, P.grassDark);
    for (let y = top; y < height - 6; y += 5) {
      c.orb(3, y, 2, 2.4, P.grassDark);
      c.orb(width - 4, y, 2, 2.4, P.grassDark);
    }
  }
  if (district.id === "retail") {
    for (let x = 6; x < width - 4; x += 14) {
      c.vline(x, height - 6, 4, P.slate);
      c.rect(x - 1, height - 7, 3, 1, "#ffd27a");
      c.box(x + 4, height - 4, 6, 2, P.redDark);
      c.px(x + 5, height - 5, P.pink);
      c.px(x + 8, height - 5, P.gold);
    }
  }
  if (district.id === "consumer") {
    for (let x = 6; x < width - 10; x += 22) {
      c.box(x, height - 5, 8, 3, P.wood);
      c.hline(x, height - 4, 8, P.woodDark);
    }
  }
  return c;
};

export const fogBank = () => {
  const c = new Pixels(128, 64);
  const random = createRandom(42);
  const puffs = [];
  for (let index = 0; index < 26; index += 1) {
    puffs.push([8 + random() * 112, 8 + random() * 48, 10 + random() * 14, 7 + random() * 9]);
  }
  puffs.forEach(([cx, cy, rx, ry]) => c.ellipse(cx, cy + 2, rx, ry, "#b9c3d3c8", true));
  puffs.forEach(([cx, cy, rx, ry]) => c.ellipse(cx, cy, rx * 0.92, ry * 0.85, "#eef2f7d0", true));
  c.ellipse(64, 32, 40, 18, "#f4f7fbb8", true);
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

export const treeSprite = (variant) => {
  const base = variant === 0 ? P.grassDark : "#4f9a46";
  const c = new Pixels(20, 24);
  c.box(9, 14, 3, 9, P.wood);
  c.orb(10, 10, 8, 8, base);
  c.orb(7, 7, 4, 3.6, mix(base, "#d6f2a0", 0.25));
  return c.outline(INK);
};
