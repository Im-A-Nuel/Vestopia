import { Pixels } from "../canvas.mjs";
import { INK, P } from "../palette.mjs";

const SIZE = 32;

const canvas = () => {
  const c = new Pixels(SIZE, SIZE);
  c.softShadow(16, 29, 14, 2.5, 64);
  return c;
};

export const buildingHome = () => {
  const c = canvas();
  c.planks(5, 15, 22, 13, P.dirt, false);
  c.roof(2, 6, 28, 10, P.red, 0.25);
  c.bricks(21, 2, 4, 8, P.redDark, "#5e2620");
  c.box(20, 1, 6, 2, P.stoneDeep);
  c.windowPane(7, 18, 6, 6, P.sky, P.cream);
  c.windowPane(19, 18, 6, 6, P.sky, P.cream);
  c.box(7, 24, 6, 2, P.woodDark);
  c.px(8, 23, P.pink);
  c.px(10, 23, P.gold);
  c.px(12, 23, P.pink);
  c.box(14, 19, 5, 9, P.wood);
  c.px(17, 24, P.gold);
  c.px(13, 19, P.gold);
  c.px(13, 20, P.goldLight);
  return c.outline(INK);
};

export const buildingShop = () => {
  const c = canvas();
  c.planks(4, 14, 24, 14, P.woodLight, false);
  for (let x = 2; x < 30; x += 4) {
    c.rect(x, 8, 2, 7, P.green);
    c.rect(x + 2, 8, 2, 7, P.cream);
  }
  c.hline(2, 8, 28, P.grassDeep);
  c.hline(2, 14, 28, P.grassDark);
  for (let x = 2; x < 30; x += 4) c.px(x + 1, 15, P.grassDark);
  c.box(13, 18, 6, 10, P.woodDark);
  c.px(17, 23, P.gold);
  c.windowPane(5, 18, 7, 6, P.sky, P.cream);
  c.windowPane(20, 18, 7, 6, P.sky, P.cream);
  c.box(5, 24, 6, 4, P.wood);
  c.rect(6, 22, 2, 2, P.red);
  c.rect(9, 23, 2, 1, P.gold);
  c.box(21, 24, 6, 4, P.wood);
  c.orb(23, 23, 1.5, 1.5, P.sand);
  c.orb(26, 23, 1.5, 1.5, P.sand);
  c.ellipse(16, 4, 3.5, 3.5, P.gold);
  c.ellipse(16, 4, 2, 2, P.goldDark);
  c.px(16, 3, P.goldLight);
  return c.outline(INK);
};

export const buildingBank = () => {
  const c = canvas();
  c.box(4, 14, 24, 14, P.stone);
  c.poly(
    [
      [2, 14],
      [16, 4],
      [30, 14],
    ],
    P.blue,
  );
  c.poly(
    [
      [6, 14],
      [16, 7],
      [26, 14],
    ],
    "#5a96d8",
  );
  c.hline(2, 14, 28, P.waterDark);
  c.ellipse(16, 11, 2.5, 2.5, P.gold);
  c.px(16, 10, P.goldLight);
  [6, 10, 20, 24].forEach((x) => {
    c.box(x, 15, 3, 13, P.white);
    c.vline(x + 1, 15, 13, "#e6e1d4");
  });
  c.box(13, 17, 6, 11, P.slate);
  c.ellipse(16, 22, 2, 2, P.goldDark);
  c.px(16, 22, P.goldLight);
  c.hline(3, 27, 26, P.stoneDark);
  return c.outline(INK);
};
