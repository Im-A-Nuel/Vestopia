import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-6">
      <p className="pixel-text text-xs text-accent">404</p>
      <h1 className="text-2xl font-extrabold">This path leads nowhere</h1>
      <p className="text-soft">The page you are looking for does not exist in the village.</p>
      <Link href="/" className="btn btn-primary">
        Back to the start
      </Link>
    </main>
  );
}
