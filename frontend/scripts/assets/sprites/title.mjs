import { Pixels } from "../canvas.mjs";
import { createRandom, mix } from "../color.mjs";
import { P } from "../palette.mjs";
import { buildingHome } from "./buildings.mjs";
import { lotDe, lotKo, lotNem, lotNvda } from "./lots.mjs";
import { fxCloud } from "./items.mjs";

const hill = (c, cx, cy, rx, ry, base) => {
  c.orb(cx, cy, rx, ry, base);
};

export const titleBackground = () => {
  const random = createRandom(2026);
  const c = new Pixels(240, 135);
  const bands = ["#9fd3f2", "#addcf4", "#bfe6f7", "#d3eefa", "#ffe9b8"];
  bands.forEach((color, index) => c.rect(0, index * 14, 240, 14, color));
  for (let index = 0; index < 4; index += 1)
    c.dither(0, index * 14 + 12, 240, 2, bands[index], bands[index + 1], index);

  c.ellipse(196, 34, 22, 22, "#ffe9b855", true);
  c.ellipse(196, 34, 15, 15, "#ffe9b8aa", true);
  c.ellipse(196, 34, 10, 10, "#fff4cf");

  const cloud = fxCloud();
  c.blit(cloud, 8, 8);
  c.blit(cloud, 150, 4);
  c.blit(cloud, 90, 24, { flipX: true });

  [
    [60, 18],
    [68, 14],
    [76, 20],
  ].forEach(([x, y]) => {
    c.px(x, y, "#2b2b3a");
    c.px(x + 1, y - 1, "#2b2b3a");
    c.px(x + 2, y, "#2b2b3a");
  });

  hill(c, 40, 100, 96, 34, "#8cc070");
  hill(c, 210, 104, 100, 36, "#85b86a");
  hill(c, 120, 112, 150, 40, P.grass);
  c.rect(0, 118, 240, 17, P.grassDark);
  c.dither(0, 112, 240, 6, P.grass, P.grassDark, 0);

  c.blit(lotNvda(), 6, 44);
  c.blit(lotKo(), 54, 50);
  c.blit(lotNem(), 148, 50);
  c.blit(lotDe(), 194, 44);

  c.poly(
    [
      [112, 96],
      [128, 96],
      [150, 135],
      [90, 135],
    ],
    P.dirt,
  );
  c.dither(98, 118, 44, 6, P.dirt, P.dirtLight, 0);
  c.blit(buildingHome(), 104, 70);

  for (let index = 0; index < 60; index += 1) {
    const x = Math.floor(random() * 238);
    const y = 100 + Math.floor(random() * 32);
    if (x > 88 && x < 152 && y > 96) continue;
    c.px(x, y, [P.gold, P.pink, P.white, P.redLight][Math.floor(random() * 4)]);
    c.px(x, y + 1, P.grassDeep);
  }
  for (let x = 4; x < 236; x += 6) {
    if (x > 86 && x < 154) continue;
    c.rect(x, 124, 2, 6, P.wood);
    c.hline(x - 2, 126, 8, P.woodLight);
  }
  return c;
};

export const pwaIcon = () => {
  const c = new Pixels(32, 32);
  c.rect(0, 0, 32, 32, P.grassDeep);
  c.rect(0, 22, 32, 10, P.grassDark);
  c.dither(0, 20, 32, 4, P.grassDeep, P.grassDark, 0);
  const letter = P.cream;
  c.poly(
    [
      [5, 7],
      [11, 7],
      [16, 19],
      [21, 7],
      [27, 7],
      [19, 25],
      [13, 25],
    ],
    mix(letter, "#2b2b3a", 0.45),
  );
  c.poly(
    [
      [5, 6],
      [11, 6],
      [16, 18],
      [21, 6],
      [27, 6],
      [19, 24],
      [13, 24],
    ],
    letter,
  );
  c.orb(16, 4, 2.4, 2.4, P.gold);
  return c;
};
