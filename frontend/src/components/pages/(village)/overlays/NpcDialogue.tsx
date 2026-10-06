"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores";
import type { DialogueActionKind } from "@/types";
import { NpcSpeech } from "@/components/pages/(shared)";

export function NpcDialogue() {
  const dialogue = useUiStore((state) => state.dialogue);
  const panel = useUiStore((state) => state.panel);
  const dismiss = useUiStore((state) => state.dismissDialogue);
  const openBank = useUiStore((state) => state.openBank);

  useEffect(() => {
    if (!dialogue) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogue, dismiss]);

  if (!dialogue || panel) return null;

  const runAction = (kind: DialogueActionKind): void => {
    dismiss();
    if (kind === "repay") openBank("loan", "repay");
    else openBank("collateral");
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-start px-4 pb-4">
      <section
        key={dialogue.id}
        aria-live="polite"
        className="panel animate-sheet-rise flex w-full max-w-xl flex-col gap-2 p-2 sm:gap-3 sm:p-3"
      >
        <NpcSpeech npc={dialogue.npc} text={dialogue.text} />
        <div className="flex flex-wrap justify-end gap-2">
          {dialogue.actions.map((action) => (
            <button
              key={action.kind}
              type="button"
              className="btn btn-caution animate-attention"
              onClick={() => runAction(action.kind)}
            >
              {action.label}
            </button>
          ))}
          <button type="button" className="btn btn-primary" onClick={dismiss}>
            Got it
          </button>
        </div>
      </section>
    </div>
  );
}
