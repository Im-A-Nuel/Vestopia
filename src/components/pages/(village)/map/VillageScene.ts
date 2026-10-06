import Phaser from "phaser";
import { ASSETS, SECTORS, STOCKS, WORLD } from "@/config";
import { diffPlayers } from "@/lib";
import type { PlayerView, SectorId, StockId, VillageBridge } from "@/types";
import { BUILDING_POSITIONS, COLORS, DEPTH, MIN_ZOOM, TEXTURE } from "./constants";
import { DistrictView } from "./DistrictView";
import type { LotView } from "./LotView";
import { onTap } from "./input";
import { WeatherLayer } from "./WeatherLayer";

interface SvgEntry {
  key: string;
  url: string;
  width: number;
  height: number;
}

const buildManifest = (): SvgEntry[] => {
  const entries: SvgEntry[] = [
    { key: TEXTURE.base, url: ASSETS.map.base, width: 1600, height: 1000 },
    { key: TEXTURE.home, url: ASSETS.buildings.home, width: 128, height: 128 },
    { key: TEXTURE.shop, url: ASSETS.buildings.shop, width: 128, height: 128 },
    { key: TEXTURE.bank, url: ASSETS.buildings.bank, width: 128, height: 128 },
    { key: TEXTURE.available, url: ASSETS.lotAvailable, width: 192, height: 192 },
    { key: TEXTURE.decorTwo, url: ASSETS.decor.two, width: 192, height: 192 },
    { key: TEXTURE.decorThree, url: ASSETS.decor.three, width: 192, height: 192 },
    { key: TEXTURE.fog, url: ASSETS.fx.fog, width: 512, height: 256 },
    { key: TEXTURE.padlock, url: ASSETS.fx.padlock, width: 128, height: 64 },
    { key: TEXTURE.sparkle, url: ASSETS.fx.sparkle, width: 64, height: 64 },
    { key: TEXTURE.coin, url: ASSETS.fx.coin, width: 32, height: 32 },
    { key: TEXTURE.lockBadge, url: ASSETS.fx.lockBadge, width: 48, height: 48 },
    { key: TEXTURE.cloud, url: ASSETS.fx.cloud, width: 320, height: 192 },
    { key: TEXTURE.rain, url: ASSETS.fx.rain, width: 16, height: 64 },
    { key: TEXTURE.tapHand, url: ASSETS.tapHand, width: 48, height: 48 },
  ];
  SECTORS.forEach((sector) =>
    entries.push({ key: TEXTURE.ground(sector.id), url: ASSETS.district(sector.id), width: 512, height: 256 }),
  );
  STOCKS.forEach((stock) => {
    entries.push({ key: TEXTURE.lot(stock.id), url: ASSETS.lot(stock.id), width: 192, height: 192 });
    entries.push({ key: TEXTURE.harvest(stock.harvest), url: ASSETS.harvest(stock.harvest), width: 48, height: 48 });
  });
  return entries;
};

export class VillageScene extends Phaser.Scene {
  private readonly bridge: VillageBridge;
  private readonly districts = new Map<SectorId, DistrictView>();
  private readonly lots = new Map<StockId, LotView>();
  private weather: WeatherLayer | null = null;
  private unsubscribe: (() => void) | null = null;
  private center = { x: WORLD.width / 2, y: WORLD.height / 2 };
  private canPan = false;

  constructor(bridge: VillageBridge) {
    super("village");
    this.bridge = bridge;
  }

  preload(): void {
    const loaded = new Set<string>();
    buildManifest().forEach(({ key, url, width, height }) => {
      if (loaded.has(key)) return;
      loaded.add(key);
      this.load.svg(key, url, { width, height });
    });
  }

  create(): void {
    this.add.rectangle(WORLD.width / 2, WORLD.height / 2, 8000, 6000, 0x7bb661).setDepth(DEPTH.base - 1);
    this.add.image(WORLD.width / 2, WORLD.height / 2, TEXTURE.base).setDepth(DEPTH.base);
    this.createBuildings();
    this.setUpCamera();

    SECTORS.forEach((sector) => {
      const district = new DistrictView(this, this.bridge, sector);
      this.districts.set(sector.id, district);
      district.lots.forEach((lot) => this.lots.set(lot.stock.id, lot));
    });

    this.weather = new WeatherLayer(this);

    const player = this.bridge.getPlayer();
    if (player) this.apply(player, false);

    this.unsubscribe = this.bridge.subscribe((next, previous) => this.handleUpdate(next, previous));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  private createBuildings(): void {
    this.add.image(BUILDING_POSITIONS.home.x, BUILDING_POSITIONS.home.y, TEXTURE.home).setDepth(DEPTH.lot);
    this.createLandmark(TEXTURE.shop, BUILDING_POSITIONS.shop, "Village Shop", () => this.bridge.openShop({}));
    this.createLandmark(TEXTURE.bank, BUILDING_POSITIONS.bank, "Village Bank", () => this.bridge.openBank());
  }

  private createLandmark(key: string, position: { x: number; y: number }, label: string, onSelect: () => void): void {
    const image = this.add
      .image(position.x, position.y, key)
      .setDepth(DEPTH.lot)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", function (this: Phaser.GameObjects.Image) {
        this.setTint(0xfff2cc);
      })
      .on("pointerout", function (this: Phaser.GameObjects.Image) {
        this.clearTint();
      });
    onTap(image, onSelect);
    this.add
      .text(position.x, position.y + 78, label, {
        fontFamily: this.bridge.fontFamily,
        fontSize: "10px",
        color: COLORS.white,
        backgroundColor: COLORS.ink,
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.label);
  }

  private setUpCamera(): void {
    this.fitCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.fitCamera());
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.canPan) return;
      const camera = this.cameras.main;
      this.center.x -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
      this.center.y -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
      this.clampCenter();
    });
  }

  private fitCamera(): void {
    const camera = this.cameras.main;
    const fit = Math.min(this.scale.width / WORLD.width, this.scale.height / WORLD.height);
    camera.setZoom(Math.max(fit, MIN_ZOOM));
    this.canPan = camera.zoom > fit + 0.001;
    this.center = { x: WORLD.width / 2, y: WORLD.height / 2 };
    this.clampCenter();
  }

  private clampCenter(): void {
    const camera = this.cameras.main;
    const halfWidth = this.scale.width / (2 * camera.zoom);
    const halfHeight = this.scale.height / (2 * camera.zoom);
    this.center.x =
      halfWidth * 2 >= WORLD.width ? WORLD.width / 2 : Phaser.Math.Clamp(this.center.x, halfWidth, WORLD.width - halfWidth);
    this.center.y =
      halfHeight * 2 >= WORLD.height ? WORLD.height / 2 : Phaser.Math.Clamp(this.center.y, halfHeight, WORLD.height - halfHeight);
    camera.centerOn(this.center.x, this.center.y);
  }

  private handleUpdate(next: PlayerView, previous: PlayerView | null): void {
    this.apply(next, previous !== null);
    if (!previous) return;

    diffPlayers(previous, next).forEach((change) => {
      if (change.type === "price") this.lots.get(change.stockId)?.reactToPrice(change.percent);
      if (change.type === "value") {
        const lot = this.lots.get(change.stockId);
        if (change.delta > 0) lot?.celebrateBuy(change.delta);
        else lot?.celebrateSell();
      }
      if (change.type === "level" && change.to > change.from) this.lots.get(change.stockId)?.celebrateLevel(change.to);
      if (change.type === "harvest-collected") this.lots.get(change.stockId)?.collectHarvest(change.amount);
    });
  }

  private apply(player: PlayerView, animate: boolean): void {
    player.sectors.forEach((sector) => this.districts.get(sector.id)?.setUnlocked(sector.unlocked, animate));
    player.stocks.forEach((stock) => this.lots.get(stock.id)?.apply(stock, animate));
    this.weather?.set(player.weather, animate);
  }

  private cleanup(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.weather?.destroy();
  }
}
