import Phaser from "phaser";
import { COLORS, DEPTH, TEXTURE } from "./constants";
import { prefersReducedMotion } from "./motion";

interface FloatTextOptions {
  fontFamily: string;
  color?: string;
  size?: number;
  rise?: number;
  duration?: number;
  scale?: number;
}

export const floatText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  { fontFamily, color = COLORS.white, size = 14, rise = 56, duration = 1100, scale = 1 }: FloatTextOptions,
): void => {
  const label = scene.add
    .text(x, y, text, { fontFamily, fontSize: `${size}px`, color, stroke: COLORS.ink, strokeThickness: 4 })
    .setOrigin(0.5)
    .setScale(scale)
    .setDepth(DEPTH.fx);
  scene.tweens.add({
    targets: label,
    y: y - rise * scale,
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
  {
    tint,
    count = 14,
    speed = { min: 50, max: 160 },
    gravityY = 0,
    lifespan = 800,
    scale = { start: 0.7, end: 0 },
    texture = TEXTURE.sparkle,
  }: BurstOptions,
): void => {
  const emitter = scene.add
    .particles(x, y, texture, { speed, lifespan, gravityY, scale, alpha: { start: 1, end: 0 }, tint, emitting: false })
    .setDepth(DEPTH.fx);
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 200, () => emitter.destroy());
};

interface Point {
  x: number;
  y: number;
}

export const hudPoint = (scene: Phaser.Scene): Point => {
  const camera = scene.cameras.main;
  return { x: camera.worldView.x + 90 / camera.zoom, y: camera.worldView.y - 20 / camera.zoom };
};

export const flyCoins = (scene: Phaser.Scene, from: Point, to: Point, count = 6): void => {
  if (prefersReducedMotion()) return;
  for (let index = 0; index < count; index += 1) {
    const coin = scene.add.image(from.x, from.y, TEXTURE.coin).setDepth(DEPTH.fx).setScale(0.9);
    scene.tweens.add({
      targets: coin,
      x: to.x + (index - count / 2) * 4,
      y: to.y,
      delay: index * 70,
      duration: 650,
      ease: "Cubic.easeInOut",
      onComplete: () => coin.destroy(),
    });
  }
};

export const shakeCamera = (scene: Phaser.Scene, duration: number, intensity: number): void => {
  if (prefersReducedMotion()) return;
  scene.cameras.main.shake(duration, intensity);
};

export const flashWhite = (scene: Phaser.Scene, target: Phaser.GameObjects.Image, duration = 300): void => {
  target.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
  scene.time.delayedCall(duration, () => {
    if (target.active) target.clearTint();
  });
};
