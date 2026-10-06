import type Phaser from "phaser";

const TARGET_SCREEN_SCALE = 0.85;

export class LabelRegistry {
  private readonly labels = new Set<Phaser.GameObjects.Text>();
  private scale = 1;

  get current(): number {
    return this.scale;
  }

  add(label: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
    this.labels.add(label);
    return label.setScale(this.scale);
  }

  update(zoom: number): void {
    this.scale = Math.max(1, TARGET_SCREEN_SCALE / zoom);
    this.labels.forEach((label) => label.setScale(this.scale));
  }
}
