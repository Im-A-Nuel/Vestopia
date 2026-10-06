import { Pixels } from "../canvas.mjs";
import { INK, P } from "../palette.mjs";

const SKIN = "#f2c9a0";
const SKIN_SHADE = "#d9a97e";

const bust = (shoulders, accent) => {
  const c = new Pixels(32, 32);
  c.box(4, 23, 24, 9, shoulders);
  c.box(13, 20, 6, 5, SKIN_SHADE);
  c.orb(16, 14, 7, 8, SKIN);
  c.px(13, 14, INK);
  c.px(19, 14, INK);
  c.px(13, 13, "#ffffff");
  c.px(19, 13, "#ffffff");
  c.hline(14, 18, 4, "#b8624a");
  c.px(12, 16, "#eaa89a");
  c.px(20, 16, "#eaa89a");
  if (accent) accent(c);
  return c;
};

export const npcGuide = () => {
  const c = bust("#5a8f45", (canvas) => {
    canvas.poly(
      [
        [4, 23],
        [12, 23],
        [16, 32],
        [4, 32],
      ],
      "#4a7a38",
    );
    canvas.poly(
      [
        [28, 23],
        [20, 23],
        [16, 32],
        [28, 32],
      ],
      "#4a7a38",
    );
    canvas.orb(16, 20, 6.5, 5, "#f4f0e6");
    canvas.hline(13, 18, 6, "#b8624a");
    canvas.ellipse(16, 8, 12, 3, P.sand);
    canvas.box(10, 2, 12, 7, P.sand);
    canvas.hline(10, 7, 12, P.grassDark);
    canvas.hline(10, 3, 12, P.goldLight);
    canvas.frame(11, 12, 4, 4, INK);
    canvas.frame(17, 12, 4, 4, INK);
    canvas.hline(15, 13, 2, INK);
    canvas.box(3, 25, 7, 6, P.wood);
    canvas.rect(4, 26, 5, 4, P.cream);
  });
  return c.outline(INK);
};

export const npcMerchant = () => {
  const c = bust("#c8a26b", (canvas) => {
    canvas.box(9, 24, 14, 8, P.cream);
    canvas.frame(11, 27, 4, 4, P.dirtDark);
    canvas.orb(16, 8, 8, 4, P.woodDark);
    canvas.box(8, 5, 16, 4, P.red);
    canvas.hline(8, 5, 16, P.redLight);
    canvas.rect(23, 7, 4, 3, P.red);
    canvas.rect(5, 9, 3, 7, P.woodDark);
    canvas.rect(24, 9, 3, 7, P.woodDark);
    canvas.orb(26, 27, 4, 4, P.sand);
    canvas.rect(25, 22, 3, 2, P.dirtDark);
    canvas.orb(26, 28, 1.6, 1.6, P.gold);
  });
  return c.outline(INK);
};

export const npcBanker = () => {
  const c = bust(P.blue, (canvas) => {
    canvas.poly(
      [
        [4, 23],
        [12, 23],
        [16, 32],
        [4, 32],
      ],
      "#2f5f9a",
    );
    canvas.poly(
      [
        [28, 23],
        [20, 23],
        [16, 32],
        [28, 32],
      ],
      "#2f5f9a",
    );
    canvas.box(13, 24, 6, 8, P.cream);
    canvas.ellipse(16, 27, 1.6, 1.6, P.gold);
    canvas.orb(16, 8, 8, 4, "#4a3322");
    canvas.rect(8, 7, 16, 3, "#4a3322");
    canvas.rect(8, 9, 2, 5, "#4a3322");
    canvas.rect(22, 9, 2, 5, "#4a3322");
    canvas.frame(18, 12, 5, 5, P.gold);
    canvas.vline(22, 16, 6, P.gold);
    canvas.box(2, 24, 9, 7, P.wood);
    canvas.rect(4, 26, 5, 1, P.cream);
    canvas.rect(4, 28, 5, 1, P.cream);
  });
  return c.outline(INK);
};
