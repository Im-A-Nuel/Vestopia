"use client";

import { QUESTS } from "@/config";
import { useUiStore } from "@/stores";

export function QuestTracker() {
  const done = useUiStore((state) => state.quests);
  const open = useUiStore((state) => state.questsOpen);
  const setOpen = useUiStore((state) => state.setQuestsOpen);
  const completed = QUESTS.filter((quest) => done.includes(quest.id)).length;
  const finished = completed === QUESTS.length;
  const next = QUESTS.find((quest) => !done.includes(quest.id));

  if (!open) {
    return (
      <div className="absolute top-3 left-3 z-10">
        <button
          type="button"
          className="btn btn-secondary shadow-sm"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          Getting started {completed}/{QUESTS.length}
        </button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="quest-title"
      className="panel absolute top-3 left-3 z-10 flex w-[min(18rem,calc(100%-5rem))] flex-col gap-2 p-3 shadow-sm"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 id="quest-title" className="text-sm font-extrabold">
          Getting started {completed}/{QUESTS.length}
        </h2>
        <button type="button" className="btn btn-ghost btn-chip" aria-expanded onClick={() => setOpen(false)}>
          Hide
        </button>
      </header>
      <progress className="meter" value={completed} max={QUESTS.length} aria-label="Quest progress" />
      <ol className="flex flex-col gap-1.5">
        {QUESTS.map((quest) => {
          const complete = done.includes(quest.id);
          return (
            <li key={quest.id} className="flex items-start gap-2 text-sm">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border text-[0.625rem] font-extrabold ${
                  complete ? "border-main bg-main text-white" : "border-line"
                }`}
              >
                {complete ? "✓" : ""}
              </span>
              <span className={complete ? "text-soft line-through" : "font-bold"}>
                {quest.title}
                <span className="sr-only">{complete ? " (done)" : " (to do)"}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-soft">
        {finished ? "All done. Your village is in good hands." : `Next: ${next?.hint}`}
      </p>
    </section>
  );
}
