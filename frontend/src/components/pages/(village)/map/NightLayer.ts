import Phaser from "phaser";
import { PLAZA, WORLD } from "@/config";
import { BUILDING_POSITIONS, DEPTH, TEXTURE } from "./constants";

const NIGHT_ALPHA = 0.55;
const TRANSITION_MS = 1400;

export class NightLayer {
  private readonly scene: Phaser.Scene;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly glows: Phaser.GameObjects.Image[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.overlay = scene.add
      .rectangle(WORLD.width / 2, WORLD.height / 2, 8000, 6000, 0x0b1630, 0)
      .setDepth(DEPTH.night);
    const points = [
      BUILDING_POSITIONS.home,
      BUILDING_POSITIONS.shop,
      BUILDING_POSITIONS.bank,
      { x: PLAZA.x - 300, y: PLAZA.y + 40 },
      { x: PLAZA.x + 300, y: PLAZA.y + 40 },
    ];
    this.glows = points.map((point) =>
      scene.add
        .image(point.x, point.y, TEXTURE.glow)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.6)
        .setAlpha(0)
        .setDepth(DEPTH.nightGlow),
    );
  }

  set(night: boolean, animate: boolean): void {
    const duration = animate ? TRANSITION_MS : 0;
    this.scene.tweens.add({ targets: this.overlay, fillAlpha: night ? NIGHT_ALPHA : 0, duration });
    this.scene.tweens.add({ targets: this.glows, alpha: night ? 0.85 : 0, duration });
  }
}
