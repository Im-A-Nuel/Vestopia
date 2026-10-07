import Phaser from "phaser";
import { getStocksBySector, lotCenter } from "@/config";
import type { SectorConfig, VillageBridge } from "@/types";
import { COLORS, DEPTH, TEXTURE } from "./constants";
import { burst } from "./effects";
import { onTap } from "./input";
import type { LabelRegistry } from "./labels";
import { LotView } from "./LotView";

export class DistrictView {
  readonly sector: SectorConfig;
  readonly lots: LotView[];

  private readonly scene: Phaser.Scene;
  private readonly fog: Phaser.GameObjects.Image;
  private readonly padlock: Phaser.GameObjects.Image;
  private readonly hit: Phaser.GameObjects.Zone;
  private unlocked: boolean | null = null;

  constructor(scene: Phaser.Scene, bridge: VillageBridge, labels: LabelRegistry, sector: SectorConfig) {
    this.scene = scene;
    this.sector = sector;
    const { x, y } = sector.center;
    const { frame } = sector;

    scene.add.image(x, y, TEXTURE.ground(sector.id)).setDisplaySize(frame.width, frame.height).setDepth(DEPTH.ground);
    labels.add(
      scene.add
        .text(x, frame.top + 28, sector.district, {
          fontFamily: bridge.fontFamily,
          fontSize: "12px",
          color: COLORS.white,
          backgroundColor: COLORS.ink,
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.lock + 2),
    );

    this.lots = getStocksBySector(sector.id).map((stock, index) => {
      const position = lotCenter(frame, index);
      return new LotView(scene, bridge, labels, stock, position.x, position.y);
    });

    this.fog = scene.add
      .image(x, y, TEXTURE.fog)
      .setDisplaySize(frame.width + 24, frame.height + 24)
      .setDepth(DEPTH.fog)
      .setAlpha(0);
    this.padlock = scene.add
      .image(x, y + 24, TEXTURE.padlock)
      .setDepth(DEPTH.lock)
      .setAlpha(0);
    this.hit = scene.add
      .zone(x, y, frame.width, frame.height)
      .setDepth(DEPTH.lock + 1)
      .setInteractive({ useHandCursor: true });
    onTap(this.hit, () => bridge.openDistrict(sector.id));
  }

  setUnlocked(unlocked: boolean, animate: boolean): void {
    if (unlocked === this.unlocked) return;
    const wasLocked = this.unlocked === false;
    this.unlocked = unlocked;
    this.lots.forEach((lot) => lot.setVisibleLot(unlocked, animate));
    if (this.hit.input) this.hit.input.enabled = !unlocked;
    this.hit.setDepth(unlocked ? DEPTH.base : DEPTH.lock + 1);

    if (!animate) {
      this.fog.setAlpha(unlocked ? 0 : 0.96);
      this.padlock.setAlpha(unlocked ? 0 : 1);
      return;
    }

    if (unlocked && wasLocked) {
      this.playUnlock();
    } else if (!unlocked) {
      this.playRelock();
    } else {
      this.fog.setAlpha(0);
      this.padlock.setAlpha(0);
    }
  }

  private playUnlock(): void {
    const { x, y } = this.sector.center;
    this.scene.tweens.add({
      targets: this.padlock,
      x: { from: x - 6, to: x + 6 },
      yoyo: true,
      repeat: 3,
      duration: 60,
    });
    this.scene.tweens.add({
      targets: this.padlock,
      y: y + 140,
      alpha: 0,
      delay: 300,
      duration: 500,
      ease: "Quad.easeIn",
      onComplete: () => this.padlock.setPosition(x, y + 24),
    });
    const baseScaleX = this.fog.scaleX;
    const baseScaleY = this.fog.scaleY;
    this.scene.tweens.add({
      targets: this.fog,
      alpha: 0,
      scaleX: baseScaleX * 1.25,
      scaleY: baseScaleY * 1.25,
      delay: 700,
      duration: 1000,
      onComplete: () => this.fog.setScale(baseScaleX, baseScaleY),
    });
    this.scene.time.delayedCall(900, () =>
      burst(this.scene, x, y, {
        tint: [0xf2c14e, 0xfbe39a, 0xffffff],
        count: 26,
        speed: { min: 80, max: 260 },
        lifespan: 1100,
      }),
    );
  }

  private playRelock(): void {
    this.scene.tweens.add({ targets: this.fog, alpha: 0.96, duration: 1500 });
    this.scene.tweens.add({ targets: this.padlock, alpha: 1, delay: 900, duration: 500 });
  }
}
