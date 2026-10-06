import type Phaser from "phaser";

const TAP_TOLERANCE_PX = 12;

export const onTap = (target: Phaser.GameObjects.GameObject, handler: () => void): void => {
  target.on("pointerup", (pointer: Phaser.Input.Pointer) => {
    if (pointer.getDistance() < TAP_TOLERANCE_PX) handler();
  });
};
