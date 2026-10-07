import Phaser from "phaser";
import { LAYOUT, WORLD } from "@/config";
import type { MapTree } from "@/types";
import { DEPTH, TEXTURE } from "./constants";
import { prefersReducedMotion } from "./motion";

interface SwayingTree {
  image: Phaser.GameObjects.Image;
  phase: number;
  speed: number;
}

const BUTTERFLY_COUNT = 8;

const randomZone = (shape: Phaser.Geom.Ellipse): Phaser.GameObjects.Particles.Zones.RandomZone =>
  new Phaser.GameObjects.Particles.Zones.RandomZone(
    shape as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource,
  );
const FLOCK_DELAY = { min: 7000, max: 13000 };

export class AmbientLayer {
  private readonly scene: Phaser.Scene;
  private readonly trees: SwayingTree[];
  private readonly butterflies: Phaser.GameObjects.Image[] = [];
  private readonly shimmer: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly fireflies: Phaser.GameObjects.Particles.ParticleEmitter[];
  private readonly calm = prefersReducedMotion();
  private flockTimer: Phaser.Time.TimerEvent | null = null;
  private night = false;

  constructor(scene: Phaser.Scene, trees: MapTree[]) {
    this.scene = scene;
    this.trees = trees.map((tree, index) => ({
      image: scene.add
        .image(tree.x, tree.y, TEXTURE.tree(tree.variant))
        .setOrigin(0.5, 1)
        .setScale(tree.scale)
        .setDepth(DEPTH.trees),
      phase: (index * 1.37) % (Math.PI * 2),
      speed: 0.0012 + (index % 5) * 0.00018,
    }));

    const lake = LAYOUT.terrain.lake;
    this.shimmer = scene.add
      .particles(0, 0, TEXTURE.shimmer, {
        emitZone: randomZone(new Phaser.Geom.Ellipse(lake.x, lake.y, lake.rx * 1.7, lake.ry * 1.6)),
        lifespan: 1600,
        frequency: this.calm ? -1 : 90,
        quantity: 1,
        alpha: {
          onEmit: () => 0,
          onUpdate: (_particle: unknown, _key: string, t: number) => Math.sin(t * Math.PI) * 0.9,
        },
        scaleX: { min: 0.8, max: 1.6 },
        speedX: { min: -6, max: 6 },
      })
      .setDepth(DEPTH.trees);

    const zones = [...LAYOUT.terrain.meadows, ...LAYOUT.terrain.forests];
    this.fireflies = zones.map((zone) =>
      scene.add
        .particles(0, 0, TEXTURE.firefly, {
          emitZone: randomZone(new Phaser.Geom.Ellipse(zone.x, zone.y, zone.rx * 2, zone.ry * 2)),
          lifespan: 2600,
          frequency: 260,
          quantity: 1,
          speed: { min: 4, max: 18 },
          alpha: {
            onEmit: () => 0,
            onUpdate: (_particle: unknown, _key: string, t: number) => Math.sin(t * Math.PI) * 0.9,
          },
          scale: { min: 0.8, max: 1.4 },
          blendMode: Phaser.BlendModes.ADD,
          emitting: false,
        })
        .setDepth(DEPTH.nightGlow),
    );

    if (!this.calm) {
      this.spawnButterflies();
      this.scheduleFlock(2500);
    }
  }

  update(time: number): void {
    if (this.calm) return;
    this.trees.forEach((tree) => {
      tree.image.setRotation(Math.sin(time * tree.speed + tree.phase) * 0.035);
    });
  }

  setNight(night: boolean): void {
    this.night = night;
    this.butterflies.forEach((butterfly) => butterfly.setVisible(!night));
    this.fireflies.forEach((emitter) => {
      if (night && !this.calm) emitter.start();
      else emitter.stop();
    });
  }

  destroy(): void {
    this.flockTimer?.remove(false);
    this.flockTimer = null;
  }

  private spawnButterflies(): void {
    const meadows = LAYOUT.terrain.meadows;
    for (let index = 0; index < BUTTERFLY_COUNT; index += 1) {
      const meadow = meadows[index % meadows.length];
      const butterfly = this.scene.add
        .image(meadow.x, meadow.y, TEXTURE.butterfly)
        .setDepth(DEPTH.harvest)
        .setTint(index % 2 === 0 ? 0xffffff : 0xfbe39a);
      this.butterflies.push(butterfly);
      this.scene.tweens.add({ targets: butterfly, scaleX: 0.3, yoyo: true, repeat: -1, duration: 140 });
      this.wander(butterfly, meadow);
    }
  }

  private wander(butterfly: Phaser.GameObjects.Image, area: { x: number; y: number; rx: number; ry: number }): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random());
    this.scene.tweens.add({
      targets: butterfly,
      x: area.x + Math.cos(angle) * area.rx * distance,
      y: area.y + Math.sin(angle) * area.ry * distance,
      duration: Phaser.Math.Between(2200, 4200),
      ease: "Sine.easeInOut",
      onComplete: () => this.wander(butterfly, area),
    });
  }

  private scheduleFlock(delay: number): void {
    this.flockTimer = this.scene.time.delayedCall(delay, () => {
      if (!this.night) this.launchFlock();
      this.scheduleFlock(Phaser.Math.Between(FLOCK_DELAY.min, FLOCK_DELAY.max));
    });
  }

  private launchFlock(): void {
    const leftToRight = Math.random() > 0.5;
    const startX = leftToRight ? -80 : WORLD.width + 80;
    const endX = leftToRight ? WORLD.width + 80 : -80;
    const baseY = Phaser.Math.Between(80, WORLD.height - 200);
    const size = Phaser.Math.Between(3, 6);
    for (let index = 0; index < size; index += 1) {
      const offsetX = (index % 2 === 0 ? 1 : -1) * Math.ceil(index / 2) * 26 * (leftToRight ? -1 : 1);
      const offsetY = Math.ceil(index / 2) * 18;
      const bird = this.scene.add
        .image(startX + offsetX, baseY + offsetY, TEXTURE.bird(0))
        .setDepth(DEPTH.birds)
        .setFlipX(!leftToRight);
      let frame = 0;
      const flap = this.scene.time.addEvent({
        delay: 160 + index * 12,
        loop: true,
        callback: () => {
          frame = 1 - frame;
          bird.setTexture(TEXTURE.bird(frame));
        },
      });
      this.scene.tweens.add({
        targets: bird,
        x: endX + offsetX,
        y: baseY + offsetY + Phaser.Math.Between(-120, 120),
        duration: Phaser.Math.Between(14000, 19000),
        ease: "Linear",
        onComplete: () => {
          flap.remove(false);
          bird.destroy();
        },
      });
    }
  }
}
