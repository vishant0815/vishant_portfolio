"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import StatusBadge from "./StatusBadge";

const MAX_CARD_SKILLS = 5;
const COLLAPSED_FILTERS = 8;

/** Card with a soft light that follows the pointer. */
function ProjectCard({ project }) {
  function trackPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  const extra = project.skills.length - MAX_CARD_SKILLS;

  return (
    <Link
      href={`/projects/${project.slug}`}
      onPointerMove={trackPointer}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel p-6 transition-colors hover:border-accent/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--x) var(--y), var(--accent-soft), transparent 70%)" }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold leading-snug tracking-tight">{project.title}</h2>
        <ArrowUpRight
          aria-hidden
          size={20}
          className="mt-1 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
      <div className="relative mt-2">
        <StatusBadge status={project.status} />
      </div>
      <p className="relative mt-3 leading-relaxed text-muted">{project.tagline}</p>
      <ul aria-label="Technologies" className="relative mt-auto flex flex-wrap gap-2 pt-6">
        {project.skills.slice(0, MAX_CARD_SKILLS).map((skill) => (
          <li key={skill} className="rounded-md bg-panel-2 px-2.5 py-1 text-xs text-muted">
            {skill}
          </li>
        ))}
        {extra > 0 && <li className="px-1 py-1 text-xs text-muted">+{extra} more</li>}
      </ul>
    </Link>
  );
}

/** Project grid with filtering by technology. Filtering is instant and happens in the browser. */
export default function ProjectBrowser({ projects }) {
  const [skill, setSkill] = useState(null);
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Every technology used, most common first, so the useful filters lead.
  const skills = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) => p.skills.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
  }, [projects]);

  const shown = skill ? projects.filter((p) => p.skills.includes(skill)) : projects;

  // Show the most used technologies first; the rest sit behind "Show all". The active filter always stays visible.
  const canCollapse = skills.length > COLLAPSED_FILTERS;
  let filters = showAllFilters || !canCollapse ? skills : skills.slice(0, COLLAPSED_FILTERS);
  if (skill && !filters.includes(skill)) filters = [...filters, skill];

  return (
    <div>
      <div role="group" aria-label="Filter projects by technology" className="flex flex-wrap gap-2">
        {[null, ...filters].map((name) => {
          const active = skill === name;
          return (
            <button
              key={name ?? "all"}
              type="button"
              onClick={() => setSkill(name)}
              aria-pressed={active}
              className={`relative rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active ? "border-accent text-text" : "border-line text-muted hover:text-text"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="project-filter"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-accent-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{name ?? "All projects"}</span>
            </button>
          );
        })}
        {canCollapse && (
          <button
            type="button"
            onClick={() => setShowAllFilters((value) => !value)}
            aria-expanded={showAllFilters}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:underline"
          >
            {showAllFilters ? "Show fewer" : `Show all ${skills.length}`}
          </button>
        )}
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {skill
          ? `${shown.length} ${shown.length === 1 ? "project uses" : "projects use"} ${skill}`
          : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
      </p>

      <motion.ul layout className="mt-4 grid gap-5 md:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((project) => (
            <motion.li
              key={project.slug}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <ProjectCard project={project} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
