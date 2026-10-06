import Phaser from "phaser";
import { COLORS, DEPTH, TEXTURE } from "./constants";

interface FloatTextOptions {
  fontFamily: string;
  color?: string;
  size?: number;
  rise?: number;
  duration?: number;
}

export const floatText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  { fontFamily, color = COLORS.white, size = 14, rise = 56, duration = 1100 }: FloatTextOptions,
): void => {
  const label = scene.add
    .text(x, y, text, { fontFamily, fontSize: `${size}px`, color, stroke: COLORS.ink, strokeThickness: 4 })
    .setOrigin(0.5)
    .setDepth(DEPTH.fx);
  scene.tweens.add({
    targets: label,
    y: y - rise,
    alpha: { from: 1, to: 0 },
    duration,
    ease: "Sine.easeOut",
    onComplete: () => label.destroy(),
  });
};

interface BurstOptions {
  tint: number[];
  count?: number;
  speed?: { min: number; max: number };
  gravityY?: number;
  lifespan?: number;
  scale?: { start: number; end: number };
  texture?: string;
}

export const burst = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  { tint, count = 14, speed = { min: 50, max: 160 }, gravityY = 0, lifespan = 800, scale = { start: 0.7, end: 0 }, texture = TEXTURE.sparkle }: BurstOptions,
): void => {
  const emitter = scene.add
    .particles(x, y, texture, { speed, lifespan, gravityY, scale, alpha: { start: 1, end: 0 }, tint, emitting: false })
    .setDepth(DEPTH.fx);
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 200, () => emitter.destroy());
};

export const flashWhite = (scene: Phaser.Scene, target: Phaser.GameObjects.Image, duration = 300): void => {
  target.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
  scene.time.delayedCall(duration, () => {
    if (target.active) target.clearTint();
  });
};
