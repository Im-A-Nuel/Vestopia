import { Pixels } from "../canvas.mjs";
import { INK, P } from "../palette.mjs";

const small = () => new Pixels(16, 16);

const finish = (c) => c.outline(INK);

export const iconAapl = () => {
  const c = small();
  c.orb(8, 9.5, 5.5, 5, P.red);
  c.px(5, 8, P.redLight);
  c.px(5, 9, P.redLight);
  c.vline(8, 3, 3, P.woodDark);
  c.rect(9, 3, 3, 2, P.grass);
  c.px(11, 3, P.grassLight);
  return finish(c);
};

export const iconNvda = () => {
  const c = small();
  c.box(4, 4, 8, 8, P.greenDark);
  c.rect(6, 6, 4, 4, P.green);
  c.px(6, 6, "#bff5d8");
  [5, 7, 9, 11].forEach((x) => {
    c.px(x - 1, 2, P.gold);
    c.px(x - 1, 13, P.gold);
  });
  [5, 7, 9, 11].forEach((y) => {
    c.px(2, y - 1, P.gold);
    c.px(13, y - 1, P.gold);
  });
  return c;
};

export const iconNem = () => {
  const c = small();
  c.orb(8, 9.5, 5.5, 4, P.gold);
  c.orb(5.5, 8, 2.5, 2, P.goldLight);
  c.orb(11, 11, 3, 2, P.goldDark);
  c.px(11, 4, P.white);
  c.px(12, 5, P.goldLight);
  c.px(4, 4, P.goldLight);
  return finish(c);
};

export const iconXom = () => {
  const c = small();
  c.box(4, 4, 8, 10, P.ink2);
  c.hline(4, 6, 8, P.stoneDeep);
  c.hline(4, 11, 8, P.stoneDeep);
  c.rect(7, 7, 2, 3, P.gold);
  c.px(7, 7, P.goldLight);
  c.px(8, 2, P.goldDark);
  c.px(8, 3, P.gold);
  return finish(c);
};

export const iconKo = () => {
  const c = small();
  c.box(6, 2, 4, 3, P.stone);
  c.rect(6, 1, 4, 1, P.red);
  c.box(5, 5, 6, 9, P.red);
  c.vline(6, 6, 6, P.redLight);
  c.hline(5, 9, 6, P.cream);
  return finish(c);
};

export const iconPg = () => {
  const c = small();
  c.box(6, 1, 4, 3, P.white);
  c.rect(10, 2, 2, 1, P.white);
  c.box(5, 4, 6, 10, P.blue);
  c.vline(6, 5, 7, "#8fc9ef");
  c.rect(6, 8, 4, 3, P.white);
  c.px(12, 5, P.waterLight);
  c.px(13, 7, P.waterLight);
  return finish(c);
};

export const iconDe = () => {
  const c = small();
  c.box(2, 8, 9, 3, P.grassDark);
  c.box(8, 4, 4, 5, P.grass);
  c.rect(9, 5, 2, 2, P.sky);
  c.rect(3, 6, 1, 2, P.stoneDeep);
  c.orb(4.5, 11.5, 2.5, 2.5, P.ink2);
  c.px(4, 11, P.gold);
  c.orb(11.5, 12, 2, 2, P.ink2);
  c.px(11, 11, P.gold);
  return finish(c);
};

export const iconAdm = () => {
  const c = small();
  c.orb(8, 10, 5, 4.5, P.sand);
  c.box(6, 3, 4, 4, P.sand);
  c.hline(5, 5, 6, P.gold);
  c.px(7, 9, P.goldDark);
  c.px(9, 11, P.goldDark);
  c.px(8, 1, P.gold);
  c.px(7, 2, P.goldLight);
  c.px(9, 2, P.goldLight);
  return finish(c);
};

export const iconKoin = () => {
  const c = small();
  c.orb(8, 8, 6, 6, P.gold);
  c.ellipse(8, 8, 4, 4, P.goldDark);
  c.ellipse(8, 8, 3, 3, P.gold);
  c.vline(8, 5, 6, P.grassDark);
  c.rect(9, 5, 2, 2, P.grass);
  c.px(4, 4, P.goldLight);
  return finish(c);
};

export const iconSectorTech = () => {
  const c = small();
  c.box(4, 2, 8, 12, P.slate);
  [4, 7, 10].forEach((y) => {
    c.px(6, y, P.green);
    c.px(9, y, P.gold);
  });
  c.box(7, 11, 2, 3, P.ink2);
  return finish(c);
};

export const iconSectorCommodity = () => {
  const c = small();
  c.line(3, 13, 11, 5, P.wood);
  c.line(4, 13, 12, 5, P.woodLight);
  c.rect(5, 2, 8, 2, P.stoneDark);
  c.rect(11, 3, 2, 5, P.stoneDark);
  c.px(4, 3, P.stone);
  c.px(5, 4, P.stone);
  c.px(13, 8, P.stone);
  c.px(2, 12, P.gold);
  return finish(c);
};

export const iconSectorConsumer = () => {
  const c = small();
  c.box(2, 7, 12, 7, P.red);
  c.rect(9, 2, 3, 6, P.redDark);
  c.rect(9, 1, 3, 1, P.white);
  [4, 7, 10].forEach((x) => c.rect(x, 9, 2, 2, P.cream));
  return finish(c);
};

export const iconSectorAgri = () => {
  const c = small();
  c.vline(8, 4, 10, P.grassDark);
  [
    [6, 5],
    [10, 5],
    [6, 8],
    [10, 8],
  ].forEach(([x, y]) => c.rect(x, y, 2, 2, P.gold));
  c.rect(7, 2, 2, 2, P.goldLight);
  c.px(8, 1, P.gold);
  return finish(c);
};

export const weatherSunny = () => {
  const c = small();
  [
    [8, 1],
    [8, 14],
    [1, 8],
    [14, 8],
    [3, 3],
    [12, 3],
    [3, 12],
    [12, 12],
  ].forEach(([x, y]) => c.rect(x - 0.5, y - 0.5, 2, 2, P.gold));
  c.orb(8, 8, 4, 4, P.gold);
  c.px(7, 7, P.ink);
  c.px(10, 7, P.ink);
  c.hline(7, 10, 4, P.goldDark);
  return finish(c);
};

const cloud = (c, base, shadow) => {
  c.ellipse(5.5, 9, 4, 3.2, base);
  c.ellipse(10.5, 9, 4, 3.2, base);
  c.ellipse(8, 6.5, 4, 3.5, base);
  c.rect(3, 9, 11, 3, base);
  c.hline(3, 11, 11, shadow);
};

export const weatherCloudy = () => {
  const c = small();
  cloud(c, P.stone, P.stoneDark);
  c.px(7, 5, P.white);
  return finish(c);
};

export const weatherStormy = () => {
  const c = small();
  cloud(c, P.slate, P.ink2);
  c.rect(8, 11, 2, 2, P.gold);
  c.rect(7, 13, 2, 2, P.gold);
  c.px(9, 10, P.goldLight);
  c.px(4, 12, P.water);
  c.px(4, 13, P.water);
  c.px(12, 12, P.water);
  c.px(12, 13, P.water);
  return finish(c);
};

const glow = (c, color) => c.ellipse(6, 6, 5.8, 5.8, color, true);

export const harvestChip = () => {
  const c = new Pixels(12, 12);
  glow(c, "#4fd18b55");
  c.box(2, 2, 8, 8, P.greenDark);
  c.rect(4, 4, 4, 4, P.green);
  c.px(4, 4, "#bff5d8");
  [3, 5, 7, 9].forEach((v) => {
    c.px(v - 1, 1, P.gold);
    c.px(v - 1, 10, P.gold);
    c.px(1, v - 1, P.gold);
    c.px(10, v - 1, P.gold);
  });
  return finish(c);
};

export const harvestGoldCart = () => {
  const c = new Pixels(12, 12);
  glow(c, "#f2c14e55");
  c.box(1, 6, 10, 3, P.stoneDeep);
  [3, 5, 7, 9].forEach((x, i) => c.orb(x, 5 - (i % 2), 1.6, 1.6, P.gold));
  c.px(4, 4, P.goldLight);
  c.orb(3, 10, 1.4, 1.4, P.ink2);
  c.orb(9, 10, 1.4, 1.4, P.ink2);
  return finish(c);
};

export const harvestOilBarrel = () => {
  const c = new Pixels(12, 12);
  glow(c, "#ffffff44");
  c.box(3, 1, 6, 10, P.ink2);
  c.hline(3, 3, 6, P.stoneDeep);
  c.hline(3, 8, 6, P.stoneDeep);
  c.px(4, 5, P.stoneDark);
  c.px(4, 6, P.stoneDark);
  c.px(7, 5, P.gold);
  return finish(c);
};

export const harvestGoodsCrate = () => {
  const c = new Pixels(12, 12);
  glow(c, "#c8a26b55");
  c.box(2, 3, 8, 7, P.wood);
  c.hline(2, 6, 8, P.woodDark);
  c.vline(6, 3, 7, P.woodDark);
  c.px(3, 4, P.woodLight);
  c.rect(3, 1, 2, 2, P.redLight);
  c.rect(7, 1, 2, 2, P.sky);
  return finish(c);
};

export const harvestBasket = () => {
  const c = new Pixels(12, 12);
  glow(c, "#7bb66155");
  c.box(2, 6, 8, 5, P.dirt);
  c.hline(2, 8, 8, P.dirtDark);
  c.vline(5, 6, 5, P.dirtDark);
  c.orb(4, 5, 1.8, 1.8, P.grassLight);
  c.orb(7, 4.5, 1.8, 1.8, P.gold);
  c.orb(9, 6, 1.4, 1.4, P.redLight);
  return finish(c);
};

export const harvestTapHand = () => {
  const c = new Pixels(12, 12);
  c.box(4, 1, 2, 6, P.white);
  c.box(3, 6, 6, 4, P.white);
  c.box(7, 5, 2, 3, P.white);
  c.px(6, 8, "#e6dccb");
  c.px(4, 8, "#e6dccb");
  return finish(c);
};

export const fxSparkle = () => {
  const c = new Pixels(16, 16);
  c.vline(7, 0, 16, P.gold);
  c.vline(8, 0, 16, P.gold);
  c.hline(0, 7, 16, P.gold);
  c.hline(0, 8, 16, P.gold);
  c.rect(5, 5, 6, 6, P.goldLight);
  c.rect(6, 6, 4, 4, P.white);
  return c;
};

export const fxCoin = () => {
  const c = new Pixels(8, 8);
  c.orb(4, 4, 3.5, 3.5, P.gold);
  c.ellipse(4, 4, 2, 2, P.goldDark);
  c.px(3, 3, P.goldLight);
  return finish(c);
};

export const fxLockBadge = () => {
  const c = new Pixels(12, 12);
  c.frame(3, 0, 6, 6, P.slate);
  c.rect(4, 1, 4, 5, "#00000000");
  c.box(2, 5, 8, 6, P.gold);
  c.px(6, 7, P.goldDark);
  c.px(6, 8, P.goldDark);
  c.px(3, 6, P.goldLight);
  return finish(c);
};

export const fxCloud = () => {
  const c = new Pixels(80, 48);
  const puffs = [
    [40, 28, 34, 12],
    [24, 24, 18, 12],
    [54, 22, 20, 13],
    [40, 17, 15, 11],
    [12, 31, 12, 7],
    [68, 31, 11, 7],
  ];
  puffs.forEach(([cx, cy, rx, ry]) => c.ellipse(cx, cy, rx, ry, "#ffffffee", true));
  c.mapPixels((pixel, x, y) => (pixel[3] > 0 && y > 33 ? [207, 214, 224, pixel[3]] : null));
  return c;
};

export const fxRain = () => {
  const c = new Pixels(4, 16);
  c.vline(1, 0, 9, "#bcd7ef");
  c.vline(2, 9, 6, "#8fb4d6");
  return c;
};

export const fxRainbow = () => {
  const c = new Pixels(128, 64);
  const bands = ["#e8776d", "#f2a65a", "#f2c14e", "#7bb661", "#5da9e9", "#9a86d6"];
  const centerX = 64;
  const centerY = 62;
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const distance = Math.hypot(x + 0.5 - centerX, y + 0.5 - centerY);
      const index = Math.floor((58 - distance) / 4);
      if (index >= 0 && index < bands.length) c.set(x, y, `${bands[index]}cc`);
    }
  }
  return c;
};
