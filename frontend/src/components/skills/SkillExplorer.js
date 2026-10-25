"use client";

import { Briefcase, FolderGit2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";

import useReveal from "@/components/ui/useReveal";

import BreadthChart from "./BreadthChart";
import UsageChart from "./UsageChart";

const TOP_SKILLS = 12;

function LevelDots({ level }) {
  if (!level) return null;
  return (
    <span className="ml-1.5 inline-flex gap-0.5 align-middle" aria-label={`Self-rated ${level} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden className={`size-1 rounded-full ${i <= level ? "bg-accent" : "bg-line"}`} />
      ))}
    </span>
  );
}

function SkillPanel({ skill, onClear }) {
  if (!skill) {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 text-muted">
        <p className="font-semibold text-text">Pick a skill</p>
        <p className="mt-1 text-sm leading-relaxed">
          Choose any skill, or click a bar in the chart, to see the jobs and projects where I used it.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={skill.name}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-accent/50 bg-panel p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{skill.category}</p>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight">
            {skill.name}
            <LevelDots level={skill.level} />
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-panel-2 hover:text-text"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
      {skill.uses.length ? (
        <ul className="mt-5 space-y-2">
          {skill.uses.map((use) => (
            <li key={`${use.kind}${use.label}`}>
              <Link
                href={use.href}
                className="group flex items-start gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-panel-2"
              >
                {use.kind === "role" ? (
                  <Briefcase size={16} aria-hidden className="mt-0.5 shrink-0 text-muted" />
                ) : (
                  <FolderGit2 size={16} aria-hidden className="mt-0.5 shrink-0 text-muted" />
                )}
                <span>
                  <span className="block text-xs text-muted">{use.kind === "role" ? "Job" : "Project"}</span>
                  <span className="font-medium group-hover:text-accent">{use.label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Part of my toolkit, but not yet listed against a specific job or project here.
        </p>
      )}
    </motion.div>
  );
}

export default function SkillExplorer({ index }) {
  const [selectedName, setSelectedName] = useState(null);
  const chartsRef = useRef(null);
  const panelRef = useRef(null);
  const chartsVisible = useReveal(chartsRef);
  const reduceMotion = useReducedMotion();

  const all = index.categories.flatMap((category) => category.skills);
  const selected = all.find((skill) => skill.name === selectedName) ?? null;
  const top = index.ranked.slice(0, TOP_SKILLS);

  function select(name) {
    setSelectedName((current) => (current === name ? null : name));
    // On small screens the panel sits below the list, so bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" }),
      );
    }
  }

  return (
    <div className="space-y-16">
      <div ref={chartsRef} className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="most-used" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
          <h2 id="most-used" className="text-lg font-semibold">
            Most used in my work
          </h2>
          <p className="mt-1 text-sm text-muted">Number of jobs and projects that used each skill.</p>
          <div className="mt-5 min-h-[200px]">
            {chartsVisible && (
              <UsageChart skills={top} selected={selectedName} onSelect={select} animate={!reduceMotion} />
            )}
          </div>
        </section>
        <section aria-labelledby="breadth" className="rounded-xl border border-line bg-panel p-5 sm:p-6">
          <h2 id="breadth" className="text-lg font-semibold">
            Breadth by area
          </h2>
          <p className="mt-1 text-sm text-muted">
            {index.usedSkills} of {index.totalSkills} skills are backed by a job or project.
          </p>
          <div className="mt-3 min-h-[300px]">
            {chartsVisible && <BreadthChart categories={index.categories} animate={!reduceMotion} />}
          </div>
        </section>
      </div>

      <section aria-labelledby="all-skills" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h2 id="all-skills" className="mb-6 text-2xl font-bold tracking-tight">
            All skills
          </h2>
          <div className="space-y-8">
            {index.categories.map((category) => (
              <div key={category.slug}>
                <h3 className="mb-3 text-sm font-semibold text-muted">{category.name}</h3>
                <ul className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => {
                    const active = selectedName === skill.name;
                    return (
                      <li key={skill.name}>
                        <button
                          type="button"
                          onClick={() => select(skill.name)}
                          aria-pressed={active}
                          className={`relative rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            active
                              ? "border-accent text-text"
                              : "border-line text-text/85 hover:border-accent/60 hover:text-text"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="skill-active"
                              aria-hidden
                              className="absolute inset-0 rounded-lg bg-accent-soft"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                          <span className="relative">
                            {skill.name}
                            {skill.uses.length > 0 && (
                              <span className="ml-1.5 text-xs text-muted tabular-nums">{skill.uses.length}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div ref={panelRef} className="lg:sticky lg:top-24 lg:h-fit" aria-live="polite">
          <AnimatePresence mode="wait">
            <SkillPanel skill={selected} onClear={() => setSelectedName(null)} />
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
