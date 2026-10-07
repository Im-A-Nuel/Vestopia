import Phaser from "phaser";
import { ASSETS, PLAZA, SECTORS, STOCKS, WORLD } from "@/config";
import { diffPlayers } from "@/lib";
import type { DayTheme, GameChange, MapTree, PlayerView, SectorId, StockId, VillageBridge, ZoomAction } from "@/types";
import { BUILDING_POSITIONS, COLORS, DEPTH, HEX, MAX_ZOOM, MIN_ZOOM, TEXTURE, ZOOM_STEP } from "./constants";
import { DistrictView } from "./DistrictView";
import { flyCoins, hudPoint } from "./effects";
import { prefersReducedMotion } from "./motion";
import type { LotView } from "./LotView";
import { onTap } from "./input";
import { LabelRegistry } from "./labels";
import { AmbientLayer } from "./AmbientLayer";
import { NightLayer } from "./NightLayer";
import { WeatherLayer } from "./WeatherLayer";

interface ImageEntry {
  key: string;
  url: string;
  vector?: boolean;
}

const VECTOR_SIZE = { width: 384, height: 320 } as const;

const buildManifest = (): ImageEntry[] => {
  const entries: ImageEntry[] = [
    { key: TEXTURE.base, url: ASSETS.map.base },
    { key: TEXTURE.home, url: ASSETS.buildings.home },
    { key: TEXTURE.shop, url: ASSETS.buildings.shop },
    { key: TEXTURE.bank, url: ASSETS.buildings.bank },
    { key: TEXTURE.available, url: ASSETS.lotAvailable },
    { key: TEXTURE.decorTwo, url: ASSETS.decor.two },
    { key: TEXTURE.decorThree, url: ASSETS.decor.three },
    { key: TEXTURE.fog, url: ASSETS.fx.fog },
    { key: TEXTURE.padlock, url: ASSETS.fx.padlock },
    { key: TEXTURE.sparkle, url: ASSETS.fx.sparkle },
    { key: TEXTURE.coin, url: ASSETS.fx.coin },
    { key: TEXTURE.lockBadge, url: ASSETS.fx.lockBadge },
    { key: TEXTURE.cloud, url: ASSETS.fx.cloud },
    { key: TEXTURE.rain, url: ASSETS.fx.rain },
    { key: TEXTURE.rainbow, url: ASSETS.fx.rainbow },
    { key: TEXTURE.tapHand, url: ASSETS.tapHand },
  ];
  SECTORS.forEach((sector) => entries.push({ key: TEXTURE.ground(sector.id), url: ASSETS.district(sector.id) }));
  STOCKS.forEach((stock) => {
    entries.push({ key: TEXTURE.lot(stock.id), url: ASSETS.lot(stock.id), vector: stock.artwork === "svg" });
    entries.push({ key: TEXTURE.harvest(stock.harvest), url: ASSETS.harvest(stock.harvest) });
  });
  return entries;
};

export class VillageScene extends Phaser.Scene {
  private readonly bridge: VillageBridge;
  private readonly districts = new Map<SectorId, DistrictView>();
  private readonly lots = new Map<StockId, LotView>();
  private readonly labels = new LabelRegistry();
  private weather: WeatherLayer | null = null;
  private unsubscribe: (() => void) | null = null;
  private center = { x: WORLD.width / 2, y: WORLD.height / 2 };
  private canPan = false;
  private fitZoom = 1;
  private pinchDistance = 0;
  private unsubscribeZoom: (() => void) | null = null;
  private unsubscribeTheme: (() => void) | null = null;
  private ambient: AmbientLayer | null = null;
  private nightLayer: NightLayer | null = null;

  constructor(bridge: VillageBridge) {
    super("village");
    this.bridge = bridge;
  }

  preload(): void {
    this.load.json("trees", "/assets/map/trees.json");
    [0, 1].forEach((variant) => this.load.image(TEXTURE.tree(variant), `/assets/map/tree-${variant}.png`));
    [0, 1].forEach((frame) => this.load.image(TEXTURE.bird(frame), `/assets/fx/bird-${frame}.png`));
    [
      [TEXTURE.glow, "glow"],
      [TEXTURE.firefly, "firefly"],
      [TEXTURE.butterfly, "butterfly"],
      [TEXTURE.shimmer, "shimmer"],
    ].forEach(([key, name]) => this.load.image(key, `/assets/fx/${name}.png`));
    this.load.on("loaderror", () => this.bridge.reportError());
    const loaded = new Set<string>();
    buildManifest().forEach(({ key, url, vector }) => {
      if (loaded.has(key)) return;
      loaded.add(key);
      if (vector) this.load.svg(key, url, VECTOR_SIZE);
      else this.load.image(key, url);
    });
  }

  create(): void {
    STOCKS.filter((stock) => stock.artwork === "webp").forEach((stock) =>
      this.textures.get(TEXTURE.lot(stock.id)).setFilter(Phaser.Textures.FilterMode.LINEAR),
    );
    this.add.rectangle(WORLD.width / 2, WORLD.height / 2, 8000, 6000, HEX.grass).setDepth(DEPTH.base - 1);
    this.add.image(WORLD.width / 2, WORLD.height / 2, TEXTURE.base).setDepth(DEPTH.base);
    this.createBuildings();
    this.createChimneySmoke();
    this.setUpCamera();

    SECTORS.forEach((sector) => {
      const district = new DistrictView(this, this.bridge, this.labels, sector);
      this.districts.set(sector.id, district);
      district.lots.forEach((lot) => this.lots.set(lot.stock.id, lot));
    });

    this.ambient = new AmbientLayer(this, (this.cache.json.get("trees") as MapTree[] | undefined) ?? []);
    this.nightLayer = new NightLayer(this);
    this.weather = new WeatherLayer(this);

    const player = this.bridge.getPlayer();
    if (player) this.apply(player, false);

    this.unsubscribe = this.bridge.subscribe((next, previous) => this.handleUpdate(next, previous));
    this.unsubscribeZoom = this.bridge.subscribeZoom((action) => this.handleZoom(action));
    this.applyTheme(this.bridge.getTheme(), false);
    this.unsubscribeTheme = this.bridge.subscribeTheme((theme) => this.applyTheme(theme, true));
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
    this.labels.add(
      this.add
        .text(position.x, position.y + 78, label, {
          fontFamily: this.bridge.fontFamily,
          fontSize: "11px",
          color: COLORS.white,
          backgroundColor: COLORS.ink,
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.label),
    );
  }

  private createChimneySmoke(): void {
    if (prefersReducedMotion()) return;
    const home = BUILDING_POSITIONS.home;
    this.add
      .particles(home.x + 24, home.y - 60, TEXTURE.cloud, {
        lifespan: 2800,
        speedY: { min: -26, max: -16 },
        speedX: { min: 4, max: 12 },
        scale: { start: 0.05, end: 0.14 },
        alpha: { start: 0.55, end: 0 },
        frequency: 900,
        quantity: 1,
      })
      .setDepth(DEPTH.lot + 1);
  }

  private focusOn(x: number, y: number, returnAfter?: number): void {
    if (!this.canPan || prefersReducedMotion()) return;
    this.tweens.killTweensOf(this.center);
    this.tweens.add({
      targets: this.center,
      x,
      y,
      duration: 800,
      ease: "Sine.easeInOut",
      onUpdate: () => this.clampCenter(),
    });
    if (returnAfter === undefined) return;
    this.time.delayedCall(returnAfter, () => {
      this.tweens.killTweensOf(this.center);
      this.tweens.add({
        targets: this.center,
        x: PLAZA.x,
        y: PLAZA.y,
        duration: 900,
        ease: "Sine.easeInOut",
        onUpdate: () => this.clampCenter(),
      });
    });
  }

  private focusOnChange(changes: GameChange[]): void {
    const unlocked = changes.find((change) => change.type === "unlock");
    if (unlocked && unlocked.type === "unlock") {
      const center = this.districts.get(unlocked.sector)?.sector.center;
      if (center) this.focusOn(center.x, center.y);
      return;
    }
    const filled = changes.find((change) => change.type === "lot-filled");
    if (filled && filled.type === "lot-filled") {
      const lot = this.lots.get(filled.stockId);
      if (lot) this.focusOn(lot.x, lot.y);
      return;
    }
    const moves = changes.flatMap((change) => (change.type === "price" ? [change] : []));
    if (moves.length === 0) return;
    const biggest = moves.reduce((best, change) => (Math.abs(change.percent) > Math.abs(best.percent) ? change : best));
    const lot = this.lots.get(biggest.stockId);
    if (lot) this.focusOn(lot.x, lot.y, 4200);
  }

  private setUpCamera(): void {
    this.input.addPointer(1);
    this.fitCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.fitCamera());
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerup", () => {
      this.pinchDistance = 0;
    });
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      this.setZoom(this.cameras.main.zoom * (dy < 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
    });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const first = this.input.pointer1;
    const second = this.input.pointer2;
    if (first.isDown && second.isDown) {
      const distance = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
      if (this.pinchDistance > 0 && distance > 0)
        this.setZoom(this.cameras.main.zoom * (distance / this.pinchDistance));
      this.pinchDistance = distance;
      return;
    }
    if (!pointer.isDown || !this.canPan) return;
    const camera = this.cameras.main;
    this.center.x -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
    this.center.y -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
    this.clampCenter();
  }

  private handleZoom(action: ZoomAction): void {
    if (action === "reset") this.setZoom(this.fitZoom);
    else this.setZoom(this.cameras.main.zoom * (action === "in" ? ZOOM_STEP : 1 / ZOOM_STEP));
  }

  private setZoom(zoom: number): void {
    const camera = this.cameras.main;
    camera.setZoom(Phaser.Math.Clamp(zoom, this.fitZoom, MAX_ZOOM));
    this.labels.update(camera.zoom);
    this.canPan = camera.zoom > this.fitZoom + 0.001;
    this.clampCenter();
  }

  private fitCamera(): void {
    this.fitZoom = Math.min(this.scale.width / WORLD.width, this.scale.height / WORLD.height);
    this.center = { x: PLAZA.x, y: PLAZA.y };
    this.setZoom(Math.max(this.fitZoom, MIN_ZOOM));
  }

  private clampCenter(): void {
    const camera = this.cameras.main;
    const halfWidth = this.scale.width / (2 * camera.zoom);
    const halfHeight = this.scale.height / (2 * camera.zoom);
    this.center.x =
      halfWidth * 2 >= WORLD.width
        ? WORLD.width / 2
        : Phaser.Math.Clamp(this.center.x, halfWidth, WORLD.width - halfWidth);
    this.center.y =
      halfHeight * 2 >= WORLD.height
        ? WORLD.height / 2
        : Phaser.Math.Clamp(this.center.y, halfHeight, WORLD.height - halfHeight);
    camera.centerOn(this.center.x, this.center.y);
  }

  private handleUpdate(next: PlayerView, previous: PlayerView | null): void {
    this.apply(next, previous !== null);
    if (!previous) return;

    const changes = diffPlayers(previous, next);
    this.focusOnChange(changes);
    changes.forEach((change) => {
      if (change.type === "price") this.lots.get(change.stockId)?.reactToPrice(change.percent);
      if (change.type === "value") {
        const lot = this.lots.get(change.stockId);
        if (change.delta > 0) {
          lot?.celebrateBuy(change.delta);
          if (lot) flyCoins(this, hudPoint(this), lot);
        } else {
          lot?.celebrateSell(change.profit);
          if (lot) flyCoins(this, lot, hudPoint(this));
        }
      }
      if (change.type === "debt") {
        const bank = BUILDING_POSITIONS.bank;
        if (change.delta > 0) flyCoins(this, bank, hudPoint(this));
        else flyCoins(this, hudPoint(this), bank);
      }
      if (change.type === "level" && change.to > change.from) this.lots.get(change.stockId)?.celebrateLevel(change.to);
      if (change.type === "harvest-collected") {
        const lot = this.lots.get(change.stockId);
        lot?.collectHarvest(change.amount);
        if (lot) flyCoins(this, { x: lot.x, y: lot.y - 84 }, hudPoint(this), 8);
      }
    });
  }

  private apply(player: PlayerView, animate: boolean): void {
    player.sectors.forEach((sector) => this.districts.get(sector.id)?.setUnlocked(sector.unlocked, animate));
    player.stocks.forEach((stock) => this.lots.get(stock.id)?.apply(stock, animate));
    this.weather?.set(player.weather, animate);
  }

  update(time: number): void {
    this.ambient?.update(time);
  }

  private applyTheme(theme: DayTheme, animate: boolean): void {
    const night = theme === "night";
    this.nightLayer?.set(night, animate);
    this.ambient?.setNight(night);
    this.lots.forEach((lot) => lot.setNight(night));
  }

  private cleanup(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeZoom?.();
    this.unsubscribeZoom = null;
    this.unsubscribeTheme?.();
    this.unsubscribeTheme = null;
    this.ambient?.destroy();
    this.weather?.destroy();
  }
}
