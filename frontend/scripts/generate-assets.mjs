import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pixels } from "./assets/canvas.mjs";
import { ARTWORK_SPRITES } from "./assets/sprites/artwork.mjs";
import { buildingBank, buildingHome, buildingShop } from "./assets/sprites/buildings.mjs";
import * as items from "./assets/sprites/items.mjs";
import * as lots from "./assets/sprites/lots.mjs";
import { npcBanker, npcGuide, npcMerchant } from "./assets/sprites/npc.mjs";
import { pwaIcon, titleBackground } from "./assets/sprites/title.mjs";
import { districtGround, fogBank, padlockFence, treeSprite, villageBase } from "./assets/sprites/world.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "public");
const layout = JSON.parse(readFileSync(join(here, "..", "src", "config", "layout.json"), "utf8"));

const base = villageBase(layout);

const outputs = [
  ["assets/lots/aapl.png", lots.lotAapl(), 4],
  ["assets/lots/nvda.png", lots.lotNvda(), 4],
  ["assets/lots/nem.png", lots.lotNem(), 4],
  ["assets/lots/xom.png", lots.lotXom(), 4],
  ["assets/lots/ko.png", lots.lotKo(), 4],
  ["assets/lots/pg.png", lots.lotPg(), 4],
  ["assets/lots/de.png", lots.lotDe(), 4],
  ["assets/lots/adm.png", lots.lotAdm(), 4],
  ["assets/lots/available.png", lots.lotAvailable(), 4],
  ["assets/lots/decor-lv2.png", lots.decorLevelTwo(), 4],
  ["assets/lots/decor-lv3.png", lots.decorLevelThree(), 4],
  ["assets/buildings/home.png", buildingHome(), 4],
  ["assets/buildings/shop.png", buildingShop(), 4],
  ["assets/buildings/bank.png", buildingBank(), 4],
  ...layout.districts.map((district) => [
    `assets/districts/${district.id}-ground.png`,
    districtGround(district, layout),
    4,
  ]),
  ["assets/map/village-base.png", base, 4],
  ["assets/map/tree-0.png", treeSprite(0), 4],
  ["assets/map/tree-1.png", treeSprite(1), 4],
  ["assets/fx/bird-0.png", items.fxBird(true), 4],
  ["assets/fx/bird-1.png", items.fxBird(false), 4],
  ["assets/fx/glow.png", items.fxGlow(), 4],
  ["assets/fx/firefly.png", items.fxFirefly(), 4],
  ["assets/fx/butterfly.png", items.fxButterfly(), 4],
  ["assets/fx/shimmer.png", items.fxShimmer(), 4],
  ["assets/fx/fog-locked.png", fogBank(), 4],
  ["assets/fx/padlock-fence.png", padlockFence(), 4],
  ["assets/fx/sparkle.png", items.fxSparkle(), 4],
  ["assets/fx/coin.png", items.fxCoin(), 4],
  ["assets/fx/lock-badge.png", items.fxLockBadge(), 4],
  ["assets/fx/cloud.png", items.fxCloud(), 4],
  ["assets/fx/rain.png", items.fxRain(), 4],
  ["assets/fx/rainbow.png", items.fxRainbow(), 4],
  ["assets/harvest/chip.png", items.harvestChip(), 4],
  ["assets/harvest/gold-cart.png", items.harvestGoldCart(), 4],
  ["assets/harvest/oil-barrel.png", items.harvestOilBarrel(), 4],
  ["assets/harvest/goods-crate.png", items.harvestGoodsCrate(), 4],
  ["assets/harvest/harvest-basket.png", items.harvestBasket(), 4],
  ["assets/harvest/tap-hand.png", items.harvestTapHand(), 4],
  ["assets/icons/aapl.png", items.iconAapl(), 2],
  ["assets/icons/nvda.png", items.iconNvda(), 2],
  ["assets/icons/nem.png", items.iconNem(), 2],
  ["assets/icons/xom.png", items.iconXom(), 2],
  ["assets/icons/ko.png", items.iconKo(), 2],
  ["assets/icons/pg.png", items.iconPg(), 2],
  ["assets/icons/de.png", items.iconDe(), 2],
  ["assets/icons/adm.png", items.iconAdm(), 2],
  ["assets/icons/koin.png", items.iconKoin(), 2],
  ["assets/icons/sector-tech.png", items.iconSectorTech(), 2],
  ["assets/icons/sector-commodity.png", items.iconSectorCommodity(), 2],
  ["assets/icons/sector-consumer.png", items.iconSectorConsumer(), 2],
  ["assets/icons/sector-agri.png", items.iconSectorAgri(), 2],
  ["assets/icons/sector-media.png", items.iconSectorMedia(), 2],
  ["assets/icons/sector-retail.png", items.iconSectorRetail(), 2],
  ["assets/ui/weather-sunny.png", items.weatherSunny(), 2],
  ["assets/ui/weather-cloudy.png", items.weatherCloudy(), 2],
  ["assets/ui/weather-stormy.png", items.weatherStormy(), 2],
  ["assets/ui/theme-night.png", items.iconMoon(), 2],
  ["assets/npc/guide.png", npcGuide(), 4],
  ["assets/npc/merchant.png", npcMerchant(), 4],
  ["assets/npc/banker.png", npcBanker(), 4],
  ["assets/title/title-bg.png", titleBackground(), 8],
  ["icons/icon-192.png", pwaIcon(), 6],
  ["icons/icon-512.png", pwaIcon(), 16],
];

const removeVectorAssets = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) removeVectorAssets(path);
    else if (entry.endsWith(".svg")) rmSync(path);
  }
};

for (const folder of ["buildings", "districts", "fx", "harvest", "icons", "lots", "map", "npc", "title", "ui"]) {
  const directory = join(root, "assets", folder);
  if (statSync(directory, { throwIfNoEntry: false })) removeVectorAssets(directory);
}

for (const [id, draw] of Object.entries(ARTWORK_SPRITES)) {
  const target = join(root, "assets", "artwork", `${id}.svg`);
  mkdirSync(dirname(target), { recursive: true });
  const sprite = draw();
  writeFileSync(target, sprite.toSvg(4));
  const icon = new Pixels(sprite.width, sprite.width);
  icon.blit(sprite, 0, Math.floor((sprite.width - sprite.height) / 2));
  writeFileSync(join(root, "assets", "artwork", "icons", `${id}.svg`), icon.toSvg(1));
}

for (const [relativePath, pixels, scale] of outputs) {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, pixels.toPng(scale));
}

writeFileSync(join(root, "assets", "map", "trees.json"), JSON.stringify(base.trees));

process.stdout.write(`generated ${outputs.length} images\n`);
