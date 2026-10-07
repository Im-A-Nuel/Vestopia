import { Pixels } from "../canvas.mjs";
import { mix, ramp } from "../color.mjs";
import { INK, P } from "../palette.mjs";

const WIDTH = 96;
const HEIGHT = 80;
const LIT = "#ffd27a";
const LIT_DEEP = "#e9a94b";

const canvas = () => new Pixels(WIDTH, HEIGHT);

const tree = (c, x, y, radius = 6) => {
  c.box(x - 1, y + radius - 2, 3, 5, P.wood);
  c.orb(x, y, radius, radius, P.grassDark);
  c.orb(x - 2, y - 2, radius * 0.5, radius * 0.45, "#79bf5c");
};

const lamp = (c, x, y) => {
  c.vline(x, y, 7, P.slate);
  c.rect(x - 1, y - 2, 3, 2, LIT);
};

const platform = (c, paving = "#d8d4c8") => {
  const tones = ramp(paving);
  c.rect(4, 52, 88, 20, tones.base);
  c.dither(4, 52, 88, 1, tones.hi, tones.base, 0);
  for (let x = 8; x < 92; x += 8) c.vline(x, 53, 18, mix(tones.base, tones.lo, 0.5));
  for (let y = 58; y < 72; y += 6) c.hline(5, y, 86, mix(tones.base, tones.lo, 0.5));
  c.rect(4, 72, 88, 4, tones.lo);
  c.hline(4, 75, 88, tones.deep);
  c.rect(40, 52, 16, 20, tones.hi);
  [6, 82].forEach((x) => {
    c.box(x, 56, 8, 14, P.grassDark);
    c.orb(x + 4, 57, 4, 3, "#6fb352");
  });
  tree(c, 10, 50, 6);
  tree(c, 86, 50, 6);
  lamp(c, 30, 62);
  lamp(c, 66, 62);
  c.box(20, 66, 6, 2, P.wood);
  c.box(70, 66, 6, 2, P.wood);
};

const windowRow = (c, x, y, count, gap = 2, width = 6, height = 6) => {
  for (let index = 0; index < count; index += 1) {
    const wx = x + index * (width + gap);
    c.rect(wx, y, width, height, INK);
    c.rect(wx + 1, y + 1, width - 2, height - 2, index % 3 === 1 ? LIT_DEEP : LIT);
    c.hline(wx + 1, y + 1, width - 2, "#fff0c4");
  }
};

const roofProps = (c, top, solar) => {
  c.rect(14, top - 4, 68, 4, P.stoneDeep);
  c.hline(14, top - 4, 68, P.stoneDark);
  if (solar) {
    [18, 30].forEach((x) => {
      c.rect(x, top - 9, 10, 5, "#2f5f9a");
      c.vline(x + 5, top - 9, 5, "#5d8dd0");
      c.hline(x, top - 7, 10, "#5d8dd0");
    });
  }
  [58, 66, 74].forEach((x) => {
    c.box(x, top - 8, 6, 4, P.stone);
    c.ellipse(x + 3, top - 6, 1.5, 1.5, P.stoneDeep);
  });
};

const office = (c, { wall, accent, sign, emblem, floors = 2, solar = true }) => {
  const top = 50 - floors * 12 - 4;
  roofProps(c, top, solar);
  c.box(14, top, 68, 50 - top + 2, wall);
  c.rect(14, top, 3, 50 - top + 2, accent);
  c.rect(79, top, 3, 50 - top + 2, accent);
  for (let floor = 0; floor < floors; floor += 1) {
    const y = top + 4 + floor * 12;
    windowRow(c, 19, y, 3);
    windowRow(c, 57, y, 3);
  }
  c.box(36, top + 2, 24, 10, sign);
  emblem(c, 48, top + 7);
  c.rect(40, 40, 16, 12, INK);
  c.rect(41, 41, 14, 11, "#9fd3f2");
  c.vline(48, 41, 11, INK);
  c.rect(41, 41, 6, 2, "#d8f0ff");
  c.rect(36, 38, 24, 2, accent);
};

const emblemChip = (color) => (c, x, y) => {
  c.rect(x - 3, y - 3, 6, 6, P.white);
  c.rect(x - 2, y - 2, 4, 4, color);
  [-2, 0, 2].forEach((d) => {
    c.px(x + d, y - 4, P.white);
    c.px(x + d, y + 3, P.white);
  });
};

const emblemWave = (c, x, y) => {
  c.ellipse(x, y, 4, 4, P.white);
  c.ellipse(x, y, 3, 3, "#b8282e");
  c.line(x - 3, y + 1, x - 1, y - 2, P.white);
  c.line(x - 1, y - 2, x + 1, y + 1, P.white);
  c.line(x + 1, y + 1, x + 3, y - 2, P.white);
};

const emblemRing = (c, x, y) => {
  c.ellipse(x, y, 4.5, 3.5, P.white);
  c.ellipse(x, y, 3.2, 2.2, "#1f6fc4");
};

const emblemBubbles = (c, x, y) => {
  c.ellipse(x - 2, y + 1, 2.5, 2.5, P.white);
  c.ellipse(x + 2.5, y - 1, 2, 2, P.white);
  c.px(x + 4, y + 2, P.white);
};

const finish = (c) => c.outline(INK);

export const artworkAmd = () => {
  const c = canvas();
  platform(c);
  office(c, { wall: "#3b3f48", accent: "#d32f2f", sign: "#1b1b22", emblem: emblemChip("#d32f2f"), floors: 3 });
  return finish(c);
};

export const artworkAvgo = () => {
  const c = canvas();
  platform(c, "#d6d0c2");
  office(c, { wall: "#e9e6df", accent: "#b8282e", sign: "#b8282e", emblem: emblemWave, floors: 2, solar: false });
  return finish(c);
};

export const artworkIntc = () => {
  const c = canvas();
  platform(c);
  office(c, { wall: "#dfe6ee", accent: "#1f6fc4", sign: "#1f6fc4", emblem: emblemRing, floors: 3 });
  return finish(c);
};

export const artworkPg = () => {
  const c = canvas();
  platform(c, "#d9dfe6");
  office(c, { wall: "#a8d4ef", accent: "#2f5f9a", sign: "#2f5f9a", emblem: emblemBubbles, floors: 2 });
  [
    [70, 8, 3],
    [76, 4, 2.5],
    [82, 9, 2],
  ].forEach(([x, y, r]) => c.ellipse(x, y, r, r, "#ffffffcc", true));
  c.box(84, 40, 7, 10, P.gold);
  c.box(84, 30, 7, 10, P.blue);
  return finish(c);
};

export const artworkNem = () => {
  const c = canvas();
  platform(c, "#c9b79c");
  c.orb(48, 40, 40, 26, P.hill);
  c.rect(0, 52, WIDTH, 28, "#00000000");
  platform(c, "#c9b79c");
  c.orb(48, 46, 38, 20, P.hill);
  c.rect(4, 52, 88, 1, P.dirtDark);
  c.dither(18, 30, 14, 6, P.hill, "#8a7a6b", 0);
  c.dither(62, 32, 14, 6, P.hill, "#aa9a89", 1);
  c.rect(36, 34, 24, 18, P.ink2);
  c.ellipse(48, 35, 12, 7, P.ink2);
  c.box(33, 32, 4, 20, P.wood);
  c.box(59, 32, 4, 20, P.wood);
  c.box(33, 28, 30, 4, P.woodLight);
  [30, 64].forEach((x) => {
    c.rect(x, 38, 2, 5, P.goldDark);
    c.px(x, 39, P.goldLight);
  });
  c.vline(14, 12, 40, P.woodDark);
  c.vline(24, 12, 40, P.woodDark);
  c.line(14, 20, 24, 30, P.woodDark);
  c.line(24, 20, 14, 30, P.woodDark);
  c.box(12, 8, 14, 5, P.wood);
  c.orb(19, 9, 3, 3, P.stoneDark);
  c.hline(36, 62, 40, P.stoneDeep);
  [38, 46, 54, 62, 70].forEach((x) => c.rect(x, 63, 3, 2, P.woodDark));
  [
    [44, 56],
    [64, 56],
  ].forEach(([x, y]) => {
    c.box(x, y, 12, 6, P.stoneDeep);
    [2, 5, 8].forEach((d, i) => c.orb(x + d + 1, y - 1 - (i % 2), 2, 2, P.gold));
    c.orb(x + 3, y + 6, 1.5, 1.5, P.ink2);
    c.orb(x + 9, y + 6, 1.5, 1.5, P.ink2);
  });
  c.box(70, 30, 14, 8, P.gold);
  c.ellipse(77, 34, 2.5, 2.5, P.goldDark);
  return finish(c);
};

export const artworkXom = () => {
  const c = canvas();
  platform(c, "#cfcbc0");
  [
    [20, 26, 12],
    [34, 30, 10],
  ].forEach(([x, top, w]) => {
    c.box(x, top, w, 52 - top, "#d8dde6");
    c.ellipse(x + w / 2, top, w / 2, 2.5, P.white);
    c.hline(x, top + 8, w, P.stoneDark);
    c.hline(x, top + 16, w, P.stoneDark);
  });
  c.box(52, 10, 6, 42, P.stone);
  [16, 24, 32, 40].forEach((y) => c.hline(51, y, 8, P.stoneDeep));
  c.vline(55, 2, 8, P.slate);
  c.ellipse(55, 2, 2, 2, "#f2a65a");
  c.px(55, 0, P.gold);
  c.rect(58, 28, 22, 3, P.stoneDeep);
  c.rect(58, 36, 26, 3, P.stoneDeep);
  c.rect(78, 28, 3, 24, P.stoneDeep);
  c.box(64, 40, 22, 12, "#e9e6df");
  c.box(66, 42, 18, 5, "#c62828");
  c.hline(66, 45, 18, "#1f4fa0");
  c.rect(70, 47, 3, 5, P.ink2);
  [12, 16].forEach((x) => {
    c.box(x, 46, 4, 6, P.ink2);
    c.hline(x, 48, 4, P.stoneDeep);
  });
  return finish(c);
};

export const artworkDe = () => {
  const c = canvas();
  platform(c, "#cfc6b2");
  c.box(14, 22, 68, 30, "#3f7d32");
  c.poly(
    [
      [10, 24],
      [48, 6],
      [86, 24],
    ],
    "#2f5f26",
  );
  c.hline(10, 24, 76, P.gold);
  c.rect(36, 30, 24, 22, P.cream);
  c.line(36, 30, 59, 51, P.wood);
  c.line(59, 30, 36, 51, P.wood);
  c.frame(36, 30, 24, 22, P.wood);
  windowRow(c, 18, 30, 2);
  windowRow(c, 64, 30, 2);
  c.box(40, 14, 16, 7, P.gold);
  c.ellipse(48, 17.5, 3, 2.5, "#3f7d32");
  [
    [16, 58],
    [66, 58],
  ].forEach(([x, y]) => {
    c.box(x, y, 14, 5, "#3f9b3a");
    c.box(x + 8, y - 6, 6, 6, "#57b34f");
    c.rect(x + 9, y - 5, 4, 3, P.sky);
    c.orb(x + 3, y + 6, 3.5, 3.5, P.ink2);
    c.orb(x + 3, y + 6, 1.2, 1.2, P.gold);
    c.orb(x + 12, y + 7, 2.5, 2.5, P.ink2);
    c.px(x + 12, y + 7, P.gold);
  });
  return finish(c);
};

export const artworkAdm = () => {
  const c = canvas();
  platform(c, "#d4c9b0");
  [16, 28, 40, 52].forEach((x, index) => {
    const top = index % 2 === 0 ? 12 : 16;
    c.box(x, top, 11, 52 - top, "#c9ced8");
    c.vline(x + 2, top + 1, 52 - top - 2, P.white);
    c.ellipse(x + 5.5, top, 5.5, 3, P.stoneDark);
    [top + 10, top + 20, top + 30].forEach((y) => c.hline(x, y, 11, P.stoneDeep));
  });
  c.line(63, 10, 80, 36, P.stoneDeep);
  c.line(64, 10, 81, 36, P.stoneDeep);
  c.box(66, 34, 22, 18, P.wood);
  c.planks(67, 35, 20, 16, P.woodLight, true);
  c.box(70, 28, 14, 6, "#2e7d5b");
  c.rect(73, 30, 8, 2, P.goldLight);
  [
    [22, 60],
    [32, 61],
    [76, 60],
  ].forEach(([x, y]) => {
    c.orb(x, y, 3.5, 3, P.sand);
    c.px(x - 1, y - 1, P.goldLight);
  });
  c.box(44, 56, 16, 7, "#e9e6df");
  c.box(56, 58, 6, 5, "#2e7d5b");
  c.orb(47, 64, 1.8, 1.8, P.ink2);
  c.orb(58, 64, 1.8, 1.8, P.ink2);
  return finish(c);
};

export const ARTWORK_SPRITES = {
  amd: artworkAmd,
  avgo: artworkAvgo,
  intc: artworkIntc,
  pg: artworkPg,
  nem: artworkNem,
  xom: artworkXom,
  de: artworkDe,
  adm: artworkAdm,
};
