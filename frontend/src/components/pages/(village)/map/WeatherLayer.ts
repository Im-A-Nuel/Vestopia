import Phaser from "phaser";
import { WORLD } from "@/config";
import type { WeatherState } from "@/types";
import { DEPTH, HEX, TEXTURE } from "./constants";
import { shakeCamera } from "./effects";
import { prefersReducedMotion } from "./motion";

const COVER = { width: 8000, height: 6000 } as const;

interface WeatherLook {
  shade: number;
  cloud: number;
  rain: boolean;
}

const LOOKS: Record<WeatherState, WeatherLook> = {
  sunny: { shade: 0, cloud: 0, rain: false },
  cloudy: { shade: 0.16, cloud: 0.55, rain: false },
  stormy: { shade: 0.36, cloud: 0.85, rain: true },
};

const CLOUD_COUNT = 6;

export class WeatherLayer {
  private readonly scene: Phaser.Scene;
  private readonly shade: Phaser.GameObjects.Rectangle;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private readonly clouds: Phaser.GameObjects.Image[];
  private readonly rain: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly rainbow: Phaser.GameObjects.Image;
  private lightningTimer: Phaser.Time.TimerEvent | null = null;
  private current: WeatherState | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.shade = scene.add
      .rectangle(WORLD.width / 2, WORLD.height / 2, COVER.width, COVER.height, HEX.storm, 0)
      .setDepth(DEPTH.weather);
    this.flash = scene.add
      .rectangle(WORLD.width / 2, WORLD.height / 2, COVER.width, COVER.height, HEX.white, 0)
      .setDepth(DEPTH.flash);

    this.clouds = Array.from({ length: CLOUD_COUNT }, (_, index) =>
      scene.add
        .image((WORLD.width / CLOUD_COUNT) * index, 120 + ((index * 163) % (WORLD.height - 200)), TEXTURE.cloud)
        .setDepth(DEPTH.weather + 1)
        .setAlpha(0)
        .setScale(1.6 + (index % 3) * 0.4),
    );
    if (!prefersReducedMotion()) {
      this.clouds.forEach((cloud, index) => this.driftCloud(cloud, 38000 + index * 4000));
    }

    this.rainbow = scene.add
      .image(WORLD.width / 2, 150, TEXTURE.rainbow)
      .setDepth(DEPTH.weather + 1)
      .setScale(2.8)
      .setAlpha(0);

    this.rain = scene.add
      .particles(0, -400, TEXTURE.rain, {
        x: { min: -1400, max: WORLD.width + 1800 },
        lifespan: 1700,
        speedY: { min: 900, max: 1100 },
        speedX: { min: -260, max: -200 },
        quantity: prefersReducedMotion() ? 3 : 9,
        frequency: 24,
        alpha: { start: 0.75, end: 0.35 },
        rotate: 14,
        emitting: false,
      })
      .setDepth(DEPTH.weather + 2);
  }

  set(weather: WeatherState, animate: boolean): void {
    if (weather === this.current) return;
    const previous = this.current;
    this.current = weather;
    const look = LOOKS[weather];
    const duration = animate ? 2000 : 0;

    this.scene.tweens.add({ targets: this.shade, fillAlpha: look.shade, duration });
    this.clouds.forEach((cloud) => {
      this.scene.tweens.add({ targets: cloud, alpha: look.cloud, duration });
      cloud.setTint(weather === "stormy" ? 0x59627a : 0xffffff);
    });

    if (previous === "stormy" && weather !== "stormy" && animate) this.playRainbow();

    if (look.rain) {
      this.rain.start();
      this.scheduleLightning(animate && previous !== null);
    } else {
      this.rain.stop();
      this.stopLightning();
    }
  }

  private playRainbow(): void {
    if (prefersReducedMotion()) return;
    this.scene.tweens.add({
      targets: this.rainbow,
      alpha: { from: 0, to: 0.6 },
      duration: 1500,
      hold: 3500,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  destroy(): void {
    this.stopLightning();
  }

  private driftCloud(cloud: Phaser.GameObjects.Image, duration: number): void {
    const travel = WORLD.width + 640;
    this.scene.tweens.add({
      targets: cloud,
      x: { from: cloud.x - 320, to: cloud.x - 320 + travel },
      duration,
      repeat: -1,
      onRepeat: () => cloud.setX(-320),
    });
  }

  private scheduleLightning(immediate: boolean): void {
    this.stopLightning();
    const strike = (): void => {
      this.strike();
      this.lightningTimer = this.scene.time.delayedCall(Phaser.Math.Between(5000, 8000), strike);
    };
    this.lightningTimer = this.scene.time.delayedCall(immediate ? 900 : Phaser.Math.Between(2500, 5000), strike);
  }

  private stopLightning(): void {
    this.lightningTimer?.remove(false);
    this.lightningTimer = null;
  }

  private strike(): void {
    if (prefersReducedMotion()) return;
    this.scene.tweens.add({ targets: this.flash, fillAlpha: { from: 0.85, to: 0 }, duration: 220, repeat: 1 });
    shakeCamera(this.scene, 180, 0.002);
  }
}
