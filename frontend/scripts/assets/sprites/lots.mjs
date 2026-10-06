import { Pixels } from "../canvas.mjs";
import { CLEAR, INK, P } from "../palette.mjs";

const SIZE = 48;

const canvas = () => {
  const c = new Pixels(SIZE, SIZE);
  c.softShadow(24, 42, 20, 3.5, 64);
  return c;
};

const finish = (c) => c.outline(INK);

const tree = (c, cx, cy, radius, base, fruit) => {
  c.box(cx - 1, cy + radius - 2, 3, 9, P.wood);
  c.orb(cx, cy, radius, radius, base);
  c.orb(cx - 3, cy - 2, radius * 0.55, radius * 0.5, "#6fb352");
  fruit.forEach(([dx, dy]) => {
    c.px(cx + dx, cy + dy, P.red);
    c.px(cx + dx, cy + dy - 1, P.redLight);
  });
};

const barrel = (c, x, y, h = 6) => {
  c.box(x, y, 5, h, P.ink2);
  c.hline(x, y + 1, 5, P.stoneDeep);
  c.hline(x, y + h - 2, 5, P.stoneDeep);
  c.px(x + 1, y + 2, P.stoneDark);
};

export const lotAapl = () => {
  const c = canvas();
  c.box(4, 21, 32, 20, P.white);
  c.box(2, 15, 36, 7, P.stoneDark);
  c.hline(2, 15, 36, P.stone);
  c.hline(4, 21, 32, P.stoneDeep);
  c.rect(16, 18, 8, 3, P.cream);
  c.hline(17, 19, 6, P.stoneDark);
  c.windowPane(6, 24, 10, 12, P.sky, P.cream);
  c.windowPane(24, 24, 10, 12, P.sky, P.cream);
  c.rect(8, 31, 2, 4, P.ink);
  c.rect(8, 32, 2, 2, P.white);
  c.rect(11, 33, 4, 2, P.slate);
  c.rect(26, 32, 6, 3, P.stoneDeep);
  c.rect(27, 29, 4, 3, P.slate);
  c.px(28, 30, P.green);
  c.box(18, 27, 6, 14, P.wood);
  c.px(22, 34, P.gold);
  c.hline(18, 27, 6, P.woodDark);
  tree(c, 40, 27, 7, P.grassDark, [
    [-3, -2],
    [2, -3],
    [3, 1],
    [-1, 3],
    [0, -5],
  ]);
  c.rect(34, 40, 12, 1, "#3f6b3080", true);
  return finish(c);
};

export const lotNvda = () => {
  const c = canvas();
  c.box(5, 19, 31, 22, P.slate);
  c.hline(5, 19, 31, P.stoneDeep);
  [8, 12, 16].forEach((x) => c.vline(x, 22, 17, P.greenDark));
  c.hline(8, 28, 12, P.greenDark);
  c.hline(12, 34, 8, P.greenDark);
  c.px(8, 22, P.green);
  c.px(12, 28, P.green);
  c.px(16, 34, P.green);
  c.box(11, 8, 14, 11, P.greenDark);
  c.rect(14, 11, 8, 5, P.green);
  c.rect(16, 12, 4, 3, "#bff5d8");
  [11, 15, 19, 23].forEach((x) => {
    c.px(x, 7, P.gold);
    c.px(x, 19, P.gold);
  });
  [10, 14, 18].forEach((y) => {
    c.px(10, y + 1, P.gold);
    c.px(25, y + 1, P.gold);
  });
  c.windowPane(22, 24, 11, 9, "#0f1a1f", P.stoneDeep);
  [26, 29].forEach((x) => [26, 28, 30].forEach((y) => c.px(x, y, (x + y) % 2 ? P.green : "#1f6b4a")));
  c.box(14, 33, 6, 8, P.ink2);
  c.px(18, 37, P.green);
  c.orb(41, 30, 5, 5, P.stoneDark);
  c.rect(41, 26, 1, 9, P.slate);
  c.rect(37, 30, 9, 1, P.slate);
  c.px(41, 30, P.stone);
  return finish(c);
};

export const lotNem = () => {
  const c = canvas();
  c.orb(24, 31, 22, 17, P.hill);
  c.rect(0, 41, SIZE, 7, CLEAR);
  c.dither(6, 22, 8, 4, P.hill, "#8a7a6b", 0);
  c.dither(32, 24, 9, 5, P.hill, "#aa9a89", 1);
  c.rect(15, 28, 17, 13, P.ink2);
  c.ellipse(23.5, 28, 8.5, 5, P.ink2);
  c.box(13, 27, 3, 14, P.wood);
  c.box(31, 27, 3, 14, P.wood);
  c.box(13, 23, 21, 3, P.woodLight);
  c.rect(11, 30, 2, 4, P.goldDark);
  c.px(11, 31, P.goldLight);
  c.rect(34, 30, 2, 4, P.goldDark);
  c.px(34, 31, P.goldLight);
  c.hline(4, 40, 40, P.stoneDeep);
  [6, 14, 22, 30, 38].forEach((x) => c.rect(x, 41, 3, 1, P.woodDark));
  c.box(29, 34, 11, 6, P.stoneDeep);
  [31, 34, 37].forEach((x, i) => c.orb(x + 0.5, 33 - (i % 2), 2, 2, P.gold));
  c.orb(32, 40, 1.5, 1.5, P.ink2);
  c.orb(37, 40, 1.5, 1.5, P.ink2);
  return finish(c);
};

export const lotXom = () => {
  const c = canvas();
  c.box(27, 15, 15, 26, "#b8bdc9");
  c.ellipse(34.5, 15, 7.5, 3, "#d8dde6");
  c.hline(27, 21, 15, P.stoneDeep);
  c.hline(27, 28, 15, P.stoneDeep);
  c.hline(27, 35, 15, P.stoneDeep);
  c.vline(30, 16, 24, "#d8dde6");
  c.vline(39, 16, 24, P.stoneDark);
  c.box(4, 35, 15, 5, "#4a4f5a");
  c.box(8, 22, 3, 13, P.goldDark);
  c.line(3, 21, 20, 16, P.goldDark);
  c.line(3, 22, 20, 17, P.goldDark);
  c.line(3, 20, 20, 15, P.goldLight);
  c.orb(5, 25, 3, 3, P.goldDark);
  c.rect(19, 15, 3, 6, P.goldDark);
  c.vline(21, 21, 14, P.stoneDeep);
  c.line(19, 38, 27, 38, P.stoneDeep);
  c.line(19, 39, 27, 39, P.stoneDeep);
  barrel(c, 21, 35);
  barrel(c, 16, 36, 5);
  c.px(23, 37, P.gold);
  return finish(c);
};

export const lotKo = () => {
  const c = canvas();
  c.bricks(4, 21, 29, 20, P.red, P.redDark);
  c.box(2, 16, 33, 5, P.redDark);
  c.hline(2, 16, 33, P.redLight);
  c.bricks(27, 5, 7, 12, P.redDark, "#5e2620");
  c.box(26, 4, 9, 2, P.stoneDeep);
  c.orb(30, 2, 3, 2, P.white);
  c.orb(34, 1, 3, 2, "#e8e8ee");
  c.windowPane(7, 25, 12, 9, "#f0e4c0", P.cream);
  [9, 12, 15].forEach((x) => {
    c.rect(x, 29, 2, 4, P.red);
    c.px(x, 28, P.stoneDark);
  });
  c.hline(8, 34, 10, P.stoneDeep);
  c.box(22, 28, 7, 13, P.wood);
  c.px(27, 35, P.gold);
  c.box(35, 33, 8, 8, P.wood);
  c.hline(35, 36, 8, P.woodDark);
  c.vline(39, 33, 8, P.woodDark);
  c.rect(36, 30, 2, 3, P.red);
  c.rect(40, 31, 2, 2, P.red);
  return finish(c);
};

export const lotPg = () => {
  const c = canvas();
  c.box(4, 21, 29, 20, "#a8d4ef");
  c.box(2, 15, 33, 6, P.blue);
  c.hline(2, 15, 33, "#7fb0e0");
  c.dither(2, 19, 33, 2, P.blue, "#2f5f9a", 0);
  c.box(26, 8, 6, 8, P.stoneDeep);
  [
    [29, 5, 3],
    [34, 3, 2.5],
    [26, 2, 2],
    [31, 0, 1.5],
  ].forEach(([x, y, r]) => {
    c.ellipse(x, y, r, r, "#ffffffcc", true);
    c.px(x - 1, y - 1, "#ffffff");
  });
  c.windowPane(7, 25, 13, 9, P.white, P.cream);
  [9, 13, 17].forEach((x, i) => {
    c.rect(x, 28, 2, 5, [P.red, P.blue, P.gold][i]);
    c.px(x, 27, P.white);
  });
  c.box(23, 28, 7, 13, P.wood);
  c.px(28, 35, P.gold);
  c.box(35, 31, 6, 10, P.gold);
  c.rect(36, 34, 4, 3, P.white);
  c.box(40, 36, 5, 5, P.blue);
  c.rect(41, 38, 3, 1, P.white);
  return finish(c);
};

export const lotDe = () => {
  const c = canvas();
  c.planks(4, 25, 27, 16, P.red, true);
  c.roof(2, 11, 31, 14, P.redDark, 0.3);
  c.box(14, 29, 12, 12, P.cream);
  c.line(14, 29, 25, 40, P.wood);
  c.line(25, 29, 14, 40, P.wood);
  c.frame(14, 29, 12, 12, P.wood);
  c.windowPane(17, 17, 6, 5, P.cream, P.wood);
  c.box(33, 33, 11, 5, P.grassDark);
  c.box(38, 28, 5, 6, P.grass);
  c.rect(39, 29, 3, 3, P.sky);
  c.rect(34, 29, 2, 4, P.stoneDeep);
  c.orb(36, 38, 4.5, 4.5, P.ink2);
  c.orb(36, 38, 1.5, 1.5, P.gold);
  c.orb(43, 39, 3, 3, P.ink2);
  c.orb(43, 39, 1, 1, P.gold);
  return finish(c);
};

export const lotAdm = () => {
  const c = canvas();
  c.box(4, 11, 11, 30, "#c9ced8");
  c.vline(6, 12, 28, P.white);
  c.vline(13, 12, 28, P.stoneDark);
  [17, 25, 33].forEach((y) => c.hline(4, y, 11, P.stoneDeep));
  c.ellipse(9.5, 11, 5.5, 4, P.stoneDark);
  c.box(8, 5, 3, 3, P.stoneDeep);
  c.vline(16, 12, 28, P.stoneDeep);
  c.planks(17, 28, 24, 13, P.wood, true);
  c.roof(15, 20, 28, 9, P.woodDark, 0.25);
  c.box(24, 31, 6, 10, P.ink2);
  c.orb(20, 40, 3, 2.5, P.sand);
  c.px(19, 39, P.goldLight);
  c.orb(37, 40, 3, 2.5, P.sand);
  c.orb(41, 38, 2.5, 3, P.sand);
  c.px(36, 38, P.gold);
  c.rect(31, 38, 5, 2, P.stoneDeep);
  c.orb(33, 41, 1.5, 1.5, P.ink2);
  return finish(c);
};

export const lotAvailable = () => {
  const c = new Pixels(SIZE, SIZE);
  c.softShadow(24, 42, 20, 3, 50);
  c.ellipse(24, 36, 20, 7, P.dirt);
  c.ellipse(24, 38, 19, 5, P.dirtDark);
  c.ellipse(24, 36, 17, 5, P.dirt);
  c.dither(10, 33, 28, 2, P.dirt, P.dirtLight, 0);
  [
    [10, 35],
    [34, 38],
    [28, 33],
  ].forEach(([x, y]) => {
    c.rect(x, y, 3, 2, P.stoneDark);
    c.px(x, y, P.stone);
  });
  [
    [14, 38],
    [38, 35],
    [20, 40],
  ].forEach(([x, y]) => {
    c.vline(x, y - 2, 2, P.grassDark);
    c.vline(x + 1, y - 3, 3, P.grass);
  });
  c.box(23, 19, 3, 19, P.wood);
  c.box(9, 8, 31, 12, P.woodLight);
  c.frame(9, 8, 31, 12, P.woodDark);
  c.rect(11, 10, 27, 8, P.dirtLight);
  c.hline(11, 10, 27, P.dirt);
  return finish(c);
};

export const decorLevelTwo = () => {
  const c = new Pixels(SIZE, SIZE);
  c.box(2, 35, 8, 7, P.wood);
  c.hline(2, 38, 8, P.woodDark);
  c.vline(6, 35, 7, P.woodDark);
  c.box(37, 35, 8, 7, P.wood);
  c.hline(37, 38, 8, P.woodDark);
  c.vline(41, 35, 7, P.woodDark);
  c.rect(38, 33, 3, 2, P.redLight);
  c.vline(44, 8, 28, P.stone);
  c.poly(
    [
      [38, 9],
      [44, 12],
      [38, 15],
    ],
    P.red,
  );
  c.px(39, 10, P.redLight);
  c.hline(2, 6, 10, P.woodDark);
  [4, 9].forEach((x) => {
    c.vline(x, 7, 2, P.stoneDeep);
    c.box(x - 1, 9, 3, 4, P.gold);
    c.px(x, 10, P.goldLight);
  });
  c.box(21, 38, 6, 4, P.redDark);
  c.vline(24, 33, 5, P.grassDark);
  c.px(23, 32, P.pink);
  c.px(25, 33, P.gold);
  c.px(24, 31, P.white);
  return finish(c);
};

export const decorLevelThree = () => {
  const c = new Pixels(SIZE, SIZE);
  c.hline(2, 36, 44, P.white);
  c.hline(2, 40, 44, P.white);
  for (let x = 2; x < 46; x += 4) {
    c.rect(x, 34, 2, 8, P.white);
    c.px(x, 34, "#d8d4c8");
    c.px(x + 1, 41, "#d8d4c8");
  }
  [1, 45].forEach((x) => {
    c.box(x, 12, 2, 24, P.slate);
    c.box(x - 1, 8, 4, 4, P.goldLight);
    c.px(x, 9, P.white);
  });
  c.box(21, 27, 6, 4, P.goldDark);
  c.box(22, 22, 4, 5, P.gold);
  c.ellipse(24, 20, 4, 3, P.goldLight);
  c.px(23, 19, P.white);
  [
    [8, 4],
    [38, 6],
    [24, 2],
    [14, 14],
    [34, 18],
  ].forEach(([x, y]) => {
    c.px(x, y, P.goldLight);
    c.px(x - 1, y, "#f2c14e99", true);
    c.px(x + 1, y, "#f2c14e99", true);
    c.px(x, y - 1, "#f2c14e99", true);
    c.px(x, y + 1, "#f2c14e99", true);
  });
  c.orb(7, 33, 4, 3, P.grassDark);
  c.orb(40, 33, 4, 3, P.grassDark);
  [
    [6, 32],
    [8, 33],
    [39, 32],
    [41, 33],
  ].forEach(([x, y], i) => c.px(x, y, i % 2 ? P.pink : P.gold));
  return finish(c);
};
