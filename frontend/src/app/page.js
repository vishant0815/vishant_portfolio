import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { HeroItem, HeroReveal } from "@/components/home/HeroReveal";
import TracePanel, { TracePanelSkeleton } from "@/components/home/TracePanel";
import { getPortfolio, traceBackends } from "@/lib/api";
import { SECTIONS } from "@/lib/nav";

/** Runs on every request (not cached), so each visitor sees freshly measured timings. */
async function LiveTrace() {
  await connection();
  const trace = await traceBackends();
  return <TracePanel trace={trace} />;
}

function Hero({ profile }) {
  return (
    <HeroReveal className="max-w-xl">
      {profile.open_to_work && (
        <HeroItem className="mb-6 flex items-start gap-2.5 text-sm text-muted">
          <span aria-hidden className="relative mt-1.5 flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-ok" />
          </span>
          <span>
            {profile.availability_note || "Open to work"}
            {profile.location && `, based in ${profile.location}`}
          </span>
        </HeroItem>
      )}
      <HeroItem as="h1" className="text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.035em]">
        {profile.full_name}
      </HeroItem>
      <HeroItem as="p" className="mt-4 text-lg font-medium text-accent sm:text-xl">
        {profile.headline}
      </HeroItem>
      <HeroItem as="p" className="mt-6 text-[17px] leading-relaxed text-muted">
        {profile.summary}
      </HeroItem>
      <HeroItem className="mt-8 flex flex-wrap gap-3">
        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            <Mail size={16} aria-hidden />
            Email me
          </a>
        )}
        {profile.linkedin_url && (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            LinkedIn
          </a>
        )}
        {profile.cv_url && (
          <a
            href={profile.cv_url}
            className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            Download CV
          </a>
        )}
      </HeroItem>
    </HeroReveal>
  );
}

/** A live detail for each section, taken from the API, so the links say what's behind them. */
function sectionDetail(href, data) {
  if (!data) return null;
  if (href === "/projects") {
    const n = data.projects.length;
    const building = data.projects.filter((project) => project.status === "in_progress").length;
    return `${n} ${n === 1 ? "project" : "projects"}${building ? `, ${building} in progress` : ""}`;
  }
  if (href === "/skills") {
    const total = data.skill_categories.reduce((sum, category) => sum + category.skills.length, 0);
    return `${total} skills across ${data.skill_categories.length} areas`;
  }
  if (href === "/experience") {
    const n = data.experience.length;
    return `${n} ${n === 1 ? "role" : "roles"}, ${data.stats.length} measured results`;
  }
  return null;
}

function Explore({ data }) {
  return (
    <section aria-labelledby="explore" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <h2 id="explore" className="mb-6 text-2xl font-bold tracking-tight">
        Explore
      </h2>
      <ul className="divide-y divide-line border-y border-line">
        {SECTIONS.map((section) => {
          const detail = sectionDetail(section.href, data);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className="group grid gap-1 py-6 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center sm:gap-8"
              >
                <span className="text-xl font-bold tracking-tight transition-colors group-hover:text-accent">
                  {section.label}
                </span>
                <span className="text-muted">
                  {section.description}
                  {detail && <span className="mt-1 block text-sm text-text/80">{detail}</span>}
                </span>
                <ArrowUpRight
                  aria-hidden
                  size={22}
                  className="hidden text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent sm:block"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ContentUnavailable() {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight">Vishant Bhavsar</h1>
      <p className="mt-4 text-muted">
        The content API isn&rsquo;t reachable right now, so this page can&rsquo;t show my profile. The live check on the
        right shows which service is down. Try again in a minute.
      </p>
    </div>
  );
}

export default async function HomePage() {
  const data = await getPortfolio();

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-start gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16">
        {data?.profile ? <Hero profile={data.profile} /> : <ContentUnavailable />}
        <div className="lg:sticky lg:top-24">
          <Suspense fallback={<TracePanelSkeleton />}>
            <LiveTrace />
          </Suspense>
        </div>
      </section>
      <Explore data={data} />
    </>
  );
}
