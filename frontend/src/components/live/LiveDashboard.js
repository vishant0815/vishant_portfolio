"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import CountUp from "@/components/ui/CountUp";
import useReveal from "@/components/ui/useReveal";

import TrafficChart from "./TrafficChart";

const ANALYTICS_URL = (process.env.NEXT_PUBLIC_ANALYTICS_URL || "").replace(/\/$/, "");
const REFRESH_MS = 30_000;

const PAGE_NAMES = { "/": "Overview", "/projects": "Projects", "/experience": "Experience", "/skills": "Skills", "/live": "Live" };
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/**
 * Keeps the stats fresh while the tab is open: polls every 30 seconds, pauses when the
 * tab is hidden, and refreshes straight away when the visitor comes back.
 */
function useLiveStats(initial) {
  const [stats, setStats] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_URL) return;
    let timer;
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`${ANALYTICS_URL}/api/v1/stats`, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const next = await response.json();
        if (!cancelled) {
          setStats(next);
          setUpdatedAt(new Date());
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    function schedule() {
      clearInterval(timer);
      if (document.visibilityState === "visible") timer = setInterval(refresh, REFRESH_MS);
    }
    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
      schedule();
    }

    refresh();
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { stats, updatedAt, failed };
}

function Kpi({ label, value, note }) {
  return (
    <div className="flex flex-col bg-panel p-5">
      <dt className="order-2 mt-1 text-sm font-medium">{label}</dt>
      <dd className="order-1 text-3xl font-bold tracking-tight">
        <CountUp key={value} value={value} />
      </dd>
      {note && <dd className="order-3 mt-1 text-xs text-muted">{note}</dd>}
    </div>
  );
}

/** A ranked list where each row's bar shows its share of the top entry. */
function RankedList({ title, rows, emptyText, renderLabel }) {
  const max = Math.max(...rows.map((row) => row.views), 1);
  return (
    <section aria-label={title} className="rounded-xl border border-line bg-panel p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length ? (
        <ol className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <li key={row.path} className="relative">
              <motion.span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-md bg-accent-soft"
                initial={{ width: 0 }}
                animate={{ width: `${(row.views / max) * 100}%` }}
                transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{renderLabel(row)}</span>
                <span className="shrink-0 font-medium tabular-nums">{row.views}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">{emptyText}</p>
      )}
    </section>
  );
}

export default function LiveDashboard({ initialStats, projectTitles = {} }) {
  const { stats, updatedAt, failed } = useLiveStats(initialStats);
  const chartRef = useRef(null);
  const chartVisible = useReveal(chartRef);
  const reduceMotion = useReducedMotion();

  if (!stats) {
    return (
      <div className="max-w-xl rounded-xl border border-line bg-panel p-6">
        <h2 className="text-lg font-semibold">Visitor numbers are unavailable</h2>
        <p className="mt-2 text-muted">
          The analytics service isn&rsquo;t responding right now. This page will try again every 30 seconds.
        </p>
      </div>
    );
  }

  const today = stats.daily.at(-1);
  const hasVisits = stats.views_total > 0;

  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted" aria-live="polite">
        <span className="flex items-center gap-2">
          <span aria-hidden className="relative flex size-2">
            {!failed && <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />}
            <span className={`relative inline-flex size-2 rounded-full ${failed ? "bg-error" : "bg-ok"}`} />
          </span>
          {failed ? "Connection lost, retrying" : "Live, refreshes every 30 seconds"}
        </span>
        {updatedAt && <span>Last updated {timeFormat.format(updatedAt)}</span>}
      </p>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <Kpi label="Views today" value={today?.views ?? 0} />
        <Kpi label="Visitors today" value={today?.visitors ?? 0} />
        <Kpi label={`Views, last ${stats.window_days} days`} value={stats.views_window} />
        <Kpi label={`Visitors, last ${stats.window_days} days`} value={stats.visitors_window} note="Counted per day" />
      </dl>

      <section ref={chartRef} aria-labelledby="traffic" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="traffic" className="text-lg font-semibold">
              Traffic, last {stats.window_days} days
            </h2>
            <p className="mt-1 text-sm text-muted">{stats.views_total.toLocaleString("en-GB")} views since tracking began.</p>
          </div>
          <ul className="flex gap-4 text-xs text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-4 rounded bg-accent" />
              Views
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-4 rounded bg-ok" />
              Visitors
            </li>
          </ul>
        </div>
        <div className="mt-5 min-h-[280px]">
          {hasVisits ? (
            chartVisible && <TrafficChart daily={stats.daily} animate={!reduceMotion} />
          ) : (
            <p className="grid h-[280px] place-items-center text-sm text-muted">
              No visits recorded yet. They&rsquo;ll appear here as people browse the site.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <RankedList
          title="Top pages"
          rows={stats.top_pages}
          emptyText="No page views in this period yet."
          renderLabel={(row) => {
            // Known pages link by name; anything else (an old or mistyped address) is plain text.
            const name = PAGE_NAMES[row.path] ?? projectTitles[row.path];
            return name ? (
              <Link href={row.path} className="hover:text-accent">
                {name}
              </Link>
            ) : (
              row.path
            );
          }}
        />
        <RankedList
          title="Where visitors come from"
          rows={stats.top_referrers}
          emptyText="No referring sites yet. Visits from LinkedIn, GitHub or search will show here."
          renderLabel={(row) => row.path}
        />
      </div>
    </div>
  );
}
