"use client";

import { COPY } from "@/config";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="text-soft">{COPY.errors.generic}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
