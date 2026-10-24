import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start px-5 py-28 sm:px-8">
      <p className="font-mono text-sm text-timing">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">This page doesn&rsquo;t exist</h1>
      <p className="mt-4 max-w-md text-muted">
        The link may be out of date, or the project may have been removed. Try the projects list instead.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/projects" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg">
          See all projects
        </Link>
        <Link href="/" className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold hover:border-accent">
          Go to the overview
        </Link>
      </div>
    </div>
  );
}
