import Phaser from "phaser";
import type { VillageBridge } from "@/types";
import { GRASS_CSS } from "./constants";
import { VillageScene } from "./VillageScene";

export const createVillageGame = (parent: HTMLElement, bridge: VillageBridge): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: "100%",
    height: "100%",
    backgroundColor: GRASS_CSS,
    pixelArt: true,
    input: { windowEvents: false },
    scale: { mode: Phaser.Scale.RESIZE },
    scene: new VillageScene(bridge),
  });
