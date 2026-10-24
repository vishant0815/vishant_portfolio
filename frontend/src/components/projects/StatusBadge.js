/** Only work in progress is labelled; finished projects need no badge. */
export default function StatusBadge({ status }) {
  if (status !== "in_progress") return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-timing/12 px-2.5 py-1 text-xs font-medium text-timing">
      <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-timing" />
      In progress
    </span>
  );
}
