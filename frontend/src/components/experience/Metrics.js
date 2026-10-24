import CountUp from "@/components/ui/CountUp";

import ImprovementBars from "./ImprovementBars";

/** Headline numbers from the CV: totals as counters, percentage improvements as to-scale bars. */
export default function Metrics({ stats }) {
  if (!stats?.length) return null;
  const improvements = stats.filter((stat) => stat.suffix.includes("%"));
  const totals = stats.filter((stat) => !stat.suffix.includes("%"));

  return (
    <section aria-labelledby="impact">
      <h2 id="impact" className="mb-6 text-2xl font-bold tracking-tight">
        What I&rsquo;ve delivered
      </h2>
      {totals.length > 0 && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
          {totals.map((stat) => (
            <div key={stat.id} className="flex flex-col bg-panel p-5">
              <dt className="order-2 mt-1 text-sm font-medium">{stat.label}</dt>
              <dd className="order-1 text-3xl font-bold tracking-tight">
                <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </dd>
              {stat.context && <dd className="order-3 mt-2 text-xs leading-relaxed text-muted">{stat.context}</dd>}
            </div>
          ))}
        </dl>
      )}
      {improvements.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold">Performance improvements</h3>
          <ImprovementBars items={improvements} />
        </div>
      )}
    </section>
  );
}
