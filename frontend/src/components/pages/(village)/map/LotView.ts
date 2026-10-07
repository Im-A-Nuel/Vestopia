import Phaser from "phaser";
import { LEVEL_SCALES, LOT_SIZE } from "@/config";
import { formatCoins } from "@/lib";
import type { LotLevel, StockConfig, StockView, VillageBridge } from "@/types";
import { COLORS, DEPTH, HARVEST_STACK_THRESHOLDS, TEXTURE } from "./constants";
import { burst, flashWhite, floatText, shakeCamera } from "./effects";
import { onTap } from "./input";
import type { LabelRegistry } from "./labels";
import { prefersReducedMotion } from "./motion";
import { effectsFor, type EffectSpec } from "./specialEffects";

const levelScale = (level: LotLevel): number => (level === 0 ? 0.92 : LEVEL_SCALES[level]);

const GHOST_TINT = 0xb4bccb;

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
  private readonly labels: LabelRegistry;
  private readonly building: Phaser.GameObjects.Image;
  private readonly availableLabel: Phaser.GameObjects.Text;
  private readonly levelBadge: Phaser.GameObjects.Text;
  private readonly lockBadge: Phaser.GameObjects.Image;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly harvestItems: Phaser.GameObjects.Image[];
  private readonly tapHand: Phaser.GameObjects.Image;
  private readonly hit: Phaser.GameObjects.Zone;
  private readonly glow: Phaser.GameObjects.Image;
  private night = false;
  private level: LotLevel = 0;
  private stack = 0;
  private visibleLot = false;

  constructor(
    scene: Phaser.Scene,
    bridge: VillageBridge,
    labels: LabelRegistry,
    stock: StockConfig,
    x: number,
    y: number,
  ) {
    this.scene = scene;
    this.bridge = bridge;
    this.labels = labels;
    this.stock = stock;
    this.x = x;
    this.y = y;

    this.building = scene.add.image(x, y, TEXTURE.lot(stock.id)).setDepth(DEPTH.lot);
    this.availableLabel = labels.add(
      scene.add
        .text(x, y, "Available", {
          fontFamily: bridge.fontFamily,
          fontSize: "10px",
          color: COLORS.white,
          backgroundColor: COLORS.ink,
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.lot + 1),
    );
    this.levelBadge = labels.add(
      scene.add
        .text(x - LOT_SIZE / 2 + 10, y - LOT_SIZE / 2 + 14, "", {
          fontFamily: bridge.fontFamily,
          fontSize: "10px",
          color: COLORS.ink,
          backgroundColor: COLORS.gold,
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0, 0.5)
        .setDepth(DEPTH.lot + 2)
        .setVisible(false),
    );
    this.lockBadge = scene.add
      .image(x + 68, y - 56, TEXTURE.lockBadge)
      .setDepth(DEPTH.lot + 2)
      .setVisible(false);
    this.tag = labels.add(
      scene.add
        .text(x, y + LOT_SIZE / 2 - 6, stock.ticker, {
          fontFamily: bridge.fontFamily,
          fontSize: "11px",
          color: COLORS.white,
          backgroundColor: COLORS.ink,
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.label),
    );

    this.harvestItems = [0, 1, 2].map((index) => {
      const item = scene.add
        .image(x - 26 + index * 26, y - 84, TEXTURE.harvest(stock.harvest))
        .setDepth(DEPTH.harvest)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
      onTap(item, () => this.bridge.harvest(stock.id));
      return item;
    });
    this.tapHand = scene.add
      .image(x, y - 124, TEXTURE.tapHand)
      .setDepth(DEPTH.harvest)
      .setVisible(false);

    this.hit = scene.add
      .zone(x, y, LOT_SIZE - 24, LOT_SIZE - 24)
      .setDepth(DEPTH.lot + 3)
      .setInteractive({ useHandCursor: true });
    onTap(this.hit, () => this.handleSelect());

    this.glow = scene.add
      .image(x, y - 10, TEXTURE.glow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.3)
      .setAlpha(0)
      .setDepth(DEPTH.nightGlow);

    this.parts().forEach((part) => (part as Phaser.GameObjects.Image).setAlpha(0));
    this.setInputEnabled(false);
  }

  setVisibleLot(visible: boolean, animate: boolean): void {
    if (visible === this.visibleLot) return;
    this.visibleLot = visible;
    this.setInputEnabled(visible);
    const delay = animate && visible ? 500 : 0;
    this.scene.tweens.add({
      targets: this.parts(),
      alpha: visible ? 1 : 0,
      duration: animate ? (visible ? 700 : 900) : 0,
      delay,
    });
    if (visible) this.scene.time.delayedCall(delay, () => this.renderHarvest(this.stack, animate));
    else this.renderHarvest(0, false);
  }

  apply(view: StockView, animate: boolean): void {
    const previousLevel = this.level;
    this.level = view.level;
    this.syncBuilding(previousLevel, animate);
    this.syncDecor();
    this.lockBadge.setVisible(view.collateralShares > 1e-6);
    this.syncHarvest(stackSize(view.pendingHarvest), animate);
    this.refreshGlow();
  }

  setNight(night: boolean): void {
    this.night = night;
    this.refreshGlow();
  }

  private refreshGlow(): void {
    const lit = this.night && this.visibleLot && this.level > 0;
    this.scene.tweens.add({ targets: this.glow, alpha: lit ? 0.55 : 0, duration: 900 });
  }

  floatChange(text: string, color: string): void {
    floatText(this.scene, this.x, this.y - 70, text, {
      fontFamily: this.bridge.fontFamily,
      color,
      scale: this.labels.current,
    });
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

  celebrateSell(profit: number): void {
    if (profit > 0.005) {
      this.floatChange(`Profit +${formatCoins(profit)} Coins`, COLORS.gold);
      burst(this.scene, this.x, this.y - 20, {
        tint: [0xf2c14e, 0xfbe39a],
        texture: TEXTURE.coin,
        count: 12,
        gravityY: 200,
        speed: { min: 80, max: 180 },
      });
      return;
    }
    this.floatChange("Sold", COLORS.neutral);
    burst(this.scene, this.x, this.y - 20, { tint: [0xcfd6e0, 0x9aa0ad], count: 10, speed: { min: 60, max: 140 } });
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
      shakeCamera(this.scene, 260, 0.0025);
      this.playSpecial(effectsFor(this.stock)[rising ? "up" : "down"]);
    }
  }

  private playSpecial(effect: EffectSpec): void {
    burst(this.scene, this.x, this.y - 30, {
      tint: effect.tint,
      texture: effect.texture,
      count: effect.count,
      gravityY: effect.gravityY,
      speed: effect.speed,
      scale: effect.scale,
      lifespan: 1400,
    });
    if (prefersReducedMotion() || !this.building.visible) return;
    const target = this.building;
    if (effect.pulse === "flicker") {
      this.scene.tweens.add({ targets: target, alpha: 0.35, yoyo: true, repeat: 6, duration: 70 });
    } else if (effect.pulse === "shake") {
      this.scene.tweens.add({
        targets: target,
        x: this.x + 5,
        yoyo: true,
        repeat: 6,
        duration: 45,
        onComplete: () => target.setX(this.x),
      });
    } else if (effect.pulse === "bob") {
      this.scene.tweens.add({
        targets: target,
        y: this.y - 6,
        yoyo: true,
        repeat: 3,
        duration: 160,
        onComplete: () => target.setY(this.y),
      });
    } else if (effect.pulse === "dim") {
      target.setTint(0x777777);
      this.scene.time.delayedCall(2200, () => {
        if (target.active) target.clearTint();
      });
    }
  }

  celebrateLevel(level: LotLevel): void {
    flashWhite(this.scene, this.building);
    this.floatChange(`Level ${level}!`, COLORS.gold);
  }

  collectHarvest(amount: number): void {
    burst(this.scene, this.x, this.y - 84, {
      tint: [0xf2c14e],
      texture: TEXTURE.coin,
      count: 10,
      gravityY: 240,
      speed: { min: 80, max: 200 },
    });
    floatText(this.scene, this.x, this.y - 100, `+${formatCoins(amount)} Coins`, {
      fontFamily: this.bridge.fontFamily,
      color: COLORS.gold,
      scale: this.labels.current,
    });
  }

  private setInputEnabled(enabled: boolean): void {
    [this.hit, ...this.harvestItems].forEach((target) => {
      if (target.input) target.input.enabled = enabled;
    });
  }

  private parts(): Phaser.GameObjects.GameObject[] {
    return [this.availableLabel, this.building, this.levelBadge, this.lockBadge, this.tag];
  }

  private handleSelect(): void {
    if (this.level === 0) this.bridge.openShop({ stockId: this.stock.id });
    else this.bridge.openDistrict(this.stock.sector);
  }

  private syncBuilding(previous: LotLevel, animate: boolean): void {
    const filled = this.level > 0;
    const targetScale = this.scaleFor(this.level);
    this.availableLabel.setVisible(!filled);
    this.building.setVisible(true).setTexture(TEXTURE.lot(this.stock.id));

    if (!filled) {
      this.building.setTint(GHOST_TINT).setTintMode(Phaser.TintModes.FILL);
      this.scene.tweens.add({ targets: this.building, scale: targetScale, duration: animate ? 400 : 0 });
      return;
    }

    this.building.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
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
    this.scene.tweens.add({
      targets: this.building,
      scale: targetScale,
      duration: animate ? 360 : 0,
      ease: "Back.easeOut",
    });
  }

  private scaleFor(level: LotLevel): number {
    return levelScale(level) * (LOT_SIZE / Math.max(this.building.width, this.building.height));
  }

  private syncDecor(): void {
    this.levelBadge.setVisible(this.level > 0).setText(`Lv ${this.level}`);
  }

  private syncHarvest(next: number, animate: boolean): void {
    const previous = this.stack;
    this.stack = next;
    this.renderHarvest(animate ? previous : next, animate);
  }

  private renderHarvest(previous: number, animate: boolean): void {
    const next = this.stack;
    this.harvestItems.forEach((item, index) => {
      const shown = index < next && this.visibleLot;
      item.setVisible(shown);
      if (shown && index >= previous && animate) {
        item.setScale(0.2);
        this.scene.tweens.add({ targets: item, scale: 1, duration: 420, delay: index * 140, ease: "Back.easeOut" });
      }
    });
    const showHand = next > 0 && this.visibleLot;
    this.tapHand.setVisible(showHand);
    this.scene.tweens.killTweensOf(this.tapHand);
    this.tapHand.setY(this.y - 124);
    if (showHand) {
      this.scene.tweens.add({
        targets: this.tapHand,
        y: this.y - 112,
        yoyo: true,
        repeat: -1,
        duration: 600,
        ease: "Sine.easeInOut",
      });
    }
  }
}
