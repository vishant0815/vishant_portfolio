"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";

import { formatDuration, formatRange } from "@/lib/format";

/** Career timeline. The line on the left fills in as you scroll through it. */
export default function Timeline({ roles }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <div ref={ref} className="relative">
      <div aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-line">
        <motion.div className="h-full w-full origin-top bg-accent" style={{ scaleY: progress }} />
      </div>

      <ol className="space-y-14">
        {roles.map((role) => {
          const duration = formatDuration(role.start_date, role.end_date);
          return (
            <li key={role.id} className="relative pl-10">
              <span
                aria-hidden
                className={`absolute left-0 top-1.5 size-[15px] rounded-full border-2 bg-bg ${
                  role.is_current ? "border-ok" : "border-accent"
                }`}
              />
              <p className="text-sm text-muted">
                <time dateTime={role.start_date}>{formatRange(role.start_date, role.end_date)}</time>
                {duration && <span className="ml-3">{duration}</span>}
              </p>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight">{role.role}</h3>
              <p className="mt-0.5 font-medium text-accent">
                {role.company}
                {role.location && <span className="font-normal text-muted">, {role.location}</span>}
              </p>
              {role.summary && <p className="mt-4 max-w-2xl leading-relaxed text-muted">{role.summary}</p>}
              {role.highlights.length > 0 && (
                <ul className="mt-4 max-w-3xl space-y-2.5">
                  {role.highlights.map((point) => (
                    <li key={point} className="relative pl-5 leading-relaxed">
                      <span aria-hidden className="absolute left-0 top-[0.7em] h-px w-2.5 bg-muted" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
              {role.skills.length > 0 && (
                <ul aria-label="Technologies used" className="mt-5 flex flex-wrap gap-2">
                  {role.skills.map((skill) => (
                    <li key={skill} className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-muted">
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
