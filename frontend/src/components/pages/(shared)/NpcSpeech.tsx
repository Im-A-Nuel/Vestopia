import { NPC_NAMES, ASSETS } from "@/config";
import type { NpcId } from "@/types";
import { GameImage } from "./GameImage";

interface NpcSpeechProps {
  npc: NpcId;
  text: string;
  compact?: boolean;
}

export function NpcSpeech({ npc, text, compact = false }: NpcSpeechProps) {
  return (
    <div className="flex items-start gap-3 rounded-control bg-muted p-3">
      <GameImage
        src={ASSETS.npc(npc)}
        alt=""
        width={compact ? 40 : 56}
        className="shrink-0 rounded-control bg-surface"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold">{NPC_NAMES[npc]}</p>
        <p className="text-sm text-soft">{text}</p>
      </div>
    </div>
  );
}
