import Phaser from "phaser";
import { WORLD } from "@/config";
import type { VillageBridge } from "@/types";
import { VillageScene } from "./VillageScene";

export const createVillageGame = (parent: HTMLElement, bridge: VillageBridge): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: "#7BB661",
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: new VillageScene(bridge),
  });
