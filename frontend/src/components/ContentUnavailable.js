/** Shown when the content API can't be reached. Says what happened and what to do. */
export default function ContentUnavailable() {
  return (
    <div className="max-w-xl rounded-xl border border-line bg-panel p-6">
      <h2 className="text-lg font-semibold">This content is temporarily unavailable</h2>
      <p className="mt-2 text-muted">
        The content API isn&rsquo;t responding right now. Reload the page in a minute; the homepage shows which service
        is down.
      </p>
    </div>
  );
}
