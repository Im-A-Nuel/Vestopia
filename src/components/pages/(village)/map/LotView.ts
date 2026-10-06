import Phaser from "phaser";
import { LEVEL_SCALES, LOT_SIZE } from "@/config";
import { formatCoins } from "@/lib";
import type { LotLevel, StockConfig, StockView, VillageBridge } from "@/types";
import { COLORS, DEPTH, HARVEST_STACK_THRESHOLDS, TEXTURE } from "./constants";
import { burst, flashWhite, floatText } from "./effects";

const levelScale = (level: LotLevel): number => (level === 0 ? 1 : LEVEL_SCALES[level]);

const stackSize = (amount: number): number => {
  if (amount <= 0) return 0;
  if (amount >= HARVEST_STACK_THRESHOLDS.three) return 3;
  if (amount >= HARVEST_STACK_THRESHOLDS.two) return 2;
  return 1;
};

export class LotView {
  readonly stock: StockConfig;
  readonly x: number;
  readonly y: number;

  private readonly scene: Phaser.Scene;
  private readonly bridge: VillageBridge;
  private readonly building: Phaser.GameObjects.Image;
  private readonly available: Phaser.GameObjects.Image;
  private readonly availableLabel: Phaser.GameObjects.Text;
  private readonly decorTwo: Phaser.GameObjects.Image;
  private readonly decorThree: Phaser.GameObjects.Image;
  private readonly lockBadge: Phaser.GameObjects.Image;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly harvestItems: Phaser.GameObjects.Image[];
  private readonly tapHand: Phaser.GameObjects.Image;
  private readonly hit: Phaser.GameObjects.Zone;
  private level: LotLevel = 0;
  private stack = 0;
  private visibleLot = false;

  constructor(scene: Phaser.Scene, bridge: VillageBridge, stock: StockConfig, x: number, y: number) {
    this.scene = scene;
    this.bridge = bridge;
    this.stock = stock;
    this.x = x;
    this.y = y;

    this.available = scene.add.image(x, y, TEXTURE.available).setDepth(DEPTH.lot);
    this.availableLabel = scene.add
      .text(x, y - 36, "Available", { fontFamily: bridge.fontFamily, fontSize: "9px", color: COLORS.ink })
      .setOrigin(0.5)
      .setDepth(DEPTH.lot + 1);
    this.building = scene.add.image(x, y, TEXTURE.lot(stock.id)).setDepth(DEPTH.lot).setVisible(false);
    this.decorTwo = scene.add.image(x, y, TEXTURE.decorTwo).setDepth(DEPTH.lot + 1).setVisible(false);
    this.decorThree = scene.add.image(x, y, TEXTURE.decorThree).setDepth(DEPTH.lot + 1).setVisible(false);
    this.lockBadge = scene.add.image(x + 68, y - 56, TEXTURE.lockBadge).setDepth(DEPTH.lot + 2).setVisible(false);
    this.tag = scene.add
      .text(x, y + LOT_SIZE / 2 - 6, stock.ticker, {
        fontFamily: bridge.fontFamily,
        fontSize: "10px",
        color: COLORS.white,
        backgroundColor: COLORS.ink,
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.label);

    this.harvestItems = [0, 1, 2].map((index) =>
      scene.add
        .image(x - 26 + index * 26, y - 84, TEXTURE.harvest(stock.harvest))
        .setDepth(DEPTH.harvest)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.bridge.harvest(stock.id)),
    );
    this.tapHand = scene.add.image(x, y - 124, TEXTURE.tapHand).setDepth(DEPTH.harvest).setVisible(false);

    this.hit = scene.add
      .zone(x, y, LOT_SIZE - 24, LOT_SIZE - 24)
      .setDepth(DEPTH.lot + 3)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleSelect());

    this.parts().forEach((part) => (part as Phaser.GameObjects.Image).setAlpha(0));
    this.setInputEnabled(false);
  }

  setVisibleLot(visible: boolean, animate: boolean): void {
    if (visible === this.visibleLot) return;
    this.visibleLot = visible;
    this.setInputEnabled(visible);
    this.scene.tweens.add({
      targets: this.parts(),
      alpha: visible ? 1 : 0,
      duration: animate ? (visible ? 700 : 900) : 0,
      delay: animate && visible ? 500 : 0,
    });
  }

  apply(view: StockView, animate: boolean): void {
    const previousLevel = this.level;
    this.level = view.level;
    this.syncBuilding(previousLevel, animate);
    this.syncDecor();
    this.lockBadge.setVisible(view.collateralShares > 1e-6);
    this.syncHarvest(stackSize(view.pendingHarvest), animate);
  }

  floatChange(text: string, color: string): void {
    floatText(this.scene, this.x, this.y - 70, text, { fontFamily: this.bridge.fontFamily, color });
  }

  celebrateBuy(delta: number): void {
    this.floatChange(`+${formatCoins(delta)} Coins`, COLORS.gold);
    this.scene.tweens.add({
      targets: this.building,
      scaleY: { from: this.building.scaleY * 0.88, to: this.building.scaleY },
      scaleX: { from: this.building.scaleX * 1.06, to: this.building.scaleX },
      duration: 320,
      ease: "Back.easeOut",
    });
  }

  celebrateSell(): void {
    this.floatChange("Sold", COLORS.neutral);
    burst(this.scene, this.x, this.y - 20, { tint: [0xcfd6e0, 0xf2c14e], count: 10, speed: { min: 60, max: 140 } });
  }

  reactToPrice(percent: number): void {
    const rising = percent > 0;
    const sign = rising ? "+" : "-";
    this.floatChange(`${sign}${Math.abs(percent).toFixed(0)}%`, rising ? COLORS.up : COLORS.down);
    if (Math.abs(percent) >= 5) {
      burst(this.scene, this.x, this.y - 30, {
        tint: rising ? [0x9be8a6, 0xf2c14e] : [0x9c7a4d, 0xc8a26b],
        count: 12,
        gravityY: rising ? -60 : 160,
        speed: { min: 30, max: 90 },
        lifespan: 1000,
      });
    }
    if (Math.abs(percent) > 20) {
      this.scene.cameras.main.shake(260, 0.0025);
    }
  }

  celebrateLevel(level: LotLevel): void {
    flashWhite(this.scene, this.building);
    this.floatChange(`Level ${level}!`, COLORS.gold);
  }

  collectHarvest(amount: number): void {
    burst(this.scene, this.x, this.y - 84, { tint: [0xf2c14e], texture: TEXTURE.coin, count: 10, gravityY: 240, speed: { min: 80, max: 200 } });
    floatText(this.scene, this.x, this.y - 100, `+${formatCoins(amount)} Coins`, {
      fontFamily: this.bridge.fontFamily,
      color: COLORS.gold,
    });
  }

  private setInputEnabled(enabled: boolean): void {
    [this.hit, ...this.harvestItems].forEach((target) => {
      if (target.input) target.input.enabled = enabled;
    });
  }

  private parts(): Phaser.GameObjects.GameObject[] {
    return [
      this.available,
      this.availableLabel,
      this.building,
      this.decorTwo,
      this.decorThree,
      this.lockBadge,
      this.tag,
      this.tapHand,
      ...this.harvestItems,
    ];
  }

  private handleSelect(): void {
    if (this.level === 0) this.bridge.openShop({ stockId: this.stock.id });
    else this.bridge.openDistrict(this.stock.sector);
  }

  private syncBuilding(previous: LotLevel, animate: boolean): void {
    const filled = this.level > 0;
    const targetScale = levelScale(this.level);
    this.available.setVisible(!filled);
    this.availableLabel.setVisible(!filled);

    if (!filled) {
      if (previous > 0 && animate) {
        this.building.setVisible(true);
        this.scene.tweens.add({
          targets: this.building,
          alpha: 0,
          duration: 500,
          onComplete: () => this.building.setVisible(false).setAlpha(1),
        });
      } else {
        this.building.setVisible(false);
      }
      return;
    }

    this.building.setVisible(true).setTexture(TEXTURE.lot(this.stock.id));
    if (previous === 0 && animate) {
      this.building.setScale(targetScale, 0.05);
      this.scene.tweens.add({ targets: this.building, scaleY: targetScale, duration: 600, ease: "Back.easeOut" });
      burst(this.scene, this.x, this.y + 40, { tint: [0xc8a26b, 0x9c7a4d], count: 14, gravityY: 80 });
      burst(this.scene, this.x, this.y - 10, { tint: [0xf2c14e, 0xfbe39a], count: 12 });
      return;
    }
    if (previous > this.level && animate) {
      this.scene.tweens.add({ targets: this.building, alpha: 0.3, yoyo: true, repeat: 2, duration: 90 });
    }
    this.scene.tweens.add({ targets: this.building, scale: targetScale, duration: animate ? 360 : 0, ease: "Back.easeOut" });
  }

  private syncDecor(): void {
    this.decorTwo.setVisible(this.level >= 2);
    this.decorThree.setVisible(this.level >= 3);
  }

  private syncHarvest(next: number, animate: boolean): void {
    const previous = this.stack;
    this.stack = next;
    this.harvestItems.forEach((item, index) => {
      const shown = index < next;
      const wasShown = index < previous;
      item.setVisible(shown);
      if (shown && !wasShown && animate) {
        item.setScale(0.2);
        this.scene.tweens.add({ targets: item, scale: 1, duration: 420, delay: index * 140, ease: "Back.easeOut" });
      }
    });
    this.tapHand.setVisible(next > 0);
    this.scene.tweens.killTweensOf(this.tapHand);
    if (next > 0) {
      this.scene.tweens.add({ targets: this.tapHand, y: this.y - 112, yoyo: true, repeat: -1, duration: 600, ease: "Sine.easeInOut" });
    } else {
      this.tapHand.setY(this.y - 124);
    }
  }
}
