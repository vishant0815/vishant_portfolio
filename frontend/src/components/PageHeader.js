/** Shared heading block at the top of every inner page. */
export default function PageHeader({ title, children }) {
  return (
    <header className="max-w-2xl">
      <h1 className="text-[clamp(2.2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
      {children && <div className="mt-4 text-lg leading-relaxed text-muted">{children}</div>}
    </header>
  );
}
