import Phaser from "phaser";
import type { VillageBridge } from "@/types";
import { VillageScene } from "./VillageScene";

export const createVillageGame = (parent: HTMLElement, bridge: VillageBridge): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: "100%",
    height: "100%",
    backgroundColor: "#7BB661",
    pixelArt: true,
    input: { windowEvents: false },
    scale: { mode: Phaser.Scale.RESIZE },
    scene: new VillageScene(bridge),
  });
