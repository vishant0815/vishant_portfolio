"use client";

import { motion } from "motion/react";

function formatMs(ms) {
  return ms < 10 ? `${ms.toFixed(1)} ms` : `${Math.round(ms)} ms`;
}

function formatBytes(bytes) {
  if (!bytes) return "–";
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;
}

/**
 * Waterfall of the real API calls made on the server for this page view.
 * Bars are drawn to scale: offset = when the call started, width = how long it took.
 */
export default function TracePanel({ trace }) {
  const { spans, totalMs } = trace;
  const scale = Math.max(totalMs, ...spans.map((s) => s.startMs + s.durationMs), 1);
  const allOk = spans.every((s) => s.ok);

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-panel">
      <figcaption className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold">This page, live</p>
          <p className="text-xs text-muted">Real requests to my APIs, timed on the server when you loaded this page.</p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            allOk ? "bg-ok/12 text-ok" : "bg-error/12 text-error"
          }`}
        >
          <span aria-hidden className={`size-1.5 rounded-full ${allOk ? "bg-ok" : "bg-error"} animate-pulse`} />
          {allOk ? "All services up" : "Service issue"}
        </span>
      </figcaption>

      <ol className="divide-y divide-line/70">
        {spans.map((span, index) => {
          const left = (span.startMs / scale) * 100;
          const width = Math.max((span.durationMs / scale) * 100, 1.5);
          return (
            <li key={`${span.service}${span.path}`} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-3 font-mono text-[13px]">
                <span className="min-w-0 truncate">
                  <span className="mr-2 text-muted">{span.method}</span>
                  {span.path}
                </span>
                <span className="shrink-0 tabular-nums text-timing">{formatMs(span.durationMs)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted">
                <span>{span.service}</span>
                <span className="tabular-nums">
                  <span className={span.ok ? "text-ok" : "text-error"}>{span.status || "failed"}</span>
                  <span className="ml-3">{formatBytes(span.bytes)}</span>
                </span>
              </div>
              <div className="relative mt-2 h-1.5 rounded-full bg-panel-2" aria-hidden>
                <motion.div
                  className={`absolute inset-y-0 rounded-full ${span.ok ? "bg-accent" : "bg-error"}`}
                  style={{ left: `${left}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: 0.25 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between border-t border-line bg-panel-2/50 px-5 py-3 text-xs text-muted">
        <span>{spans.length} requests, run in parallel</span>
        <span className="font-mono tabular-nums">
          total <span className="text-timing">{formatMs(totalMs)}</span>
        </span>
      </div>
    </figure>
  );
}

export function TracePanelSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel" aria-busy="true" aria-label="Timing the APIs">
      <div className="border-b border-line px-5 py-3.5">
        <p className="text-sm font-semibold">This page, live</p>
        <p className="text-xs text-muted">Timing the APIs…</p>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="border-b border-line/70 px-5 py-3 last:border-0">
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-panel-2" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-panel-2" />
          <div className="mt-3 h-1.5 animate-pulse rounded-full bg-panel-2" />
        </div>
      ))}
    </div>
  );
}
