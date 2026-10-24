"use client";

import { motion } from "motion/react";
import { useRef } from "react";

import CountUp from "@/components/ui/CountUp";
import useReveal from "@/components/ui/useReveal";

/** Percentage improvements drawn to scale, so 50% really is half the track. */
export default function ImprovementBars({ items }) {
  const ref = useRef(null);
  const revealed = useReveal(ref);

  return (
    <ul ref={ref} className="divide-y divide-line rounded-xl border border-line bg-panel">
      {items.map((item, index) => (
        <li key={item.id} className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_4rem] sm:items-center">
          <div>
            <p className="text-sm font-semibold">{item.label}</p>
            {item.context && <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.context}</p>}
          </div>
          <div className="h-2 rounded-full bg-panel-2" aria-hidden>
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: revealed ? `${Math.min(item.value, 100)}%` : 0 }}
              transition={{ duration: 1.1, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="text-2xl font-bold tracking-tight sm:text-right">
            <CountUp value={item.value} prefix={item.prefix} suffix={item.suffix} />
          </p>
        </li>
      ))}
    </ul>
  );
}
