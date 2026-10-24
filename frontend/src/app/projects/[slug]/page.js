import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import ContentUnavailable from "@/components/ContentUnavailable";
import ProjectLinks from "@/components/projects/ProjectLinks";
import StatusBadge from "@/components/projects/StatusBadge";
import { getPortfolio, getProject } from "@/lib/api";

/**
 * Dynamic route: one page per project in the database.
 * Projects that exist at build time are prerendered; a project added later in the
 * Django admin gets its page generated on its first visit, then cached.
 */
export async function generateStaticParams() {
  const data = await getPortfolio();
  const slugs = data?.projects.map((project) => ({ slug: project.slug })) ?? [];
  // Cache Components needs at least one param. If the API was down during the build,
  // this placeholder renders "not found" and real pages are generated on first visit.
  return slugs.length ? slugs : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { project } = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.tagline };
}

/** Previous and next projects, in the same order as the projects page. */
async function ProjectPager({ slug }) {
  const data = await getPortfolio();
  const projects = data?.projects ?? [];
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1 || projects.length < 2) return null;
  const previous = projects[index - 1];
  const next = projects[index + 1];

  return (
    <nav aria-label="More projects" className="grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
      {previous ? (
        <Link href={`/projects/${previous.slug}`} className="group rounded-xl border border-line p-5 hover:border-accent/60">
          <span className="flex items-center gap-2 text-sm text-muted">
            <ArrowLeft size={15} aria-hidden className="transition-transform group-hover:-translate-x-0.5" />
            Previous project
          </span>
          <span className="mt-1 block font-semibold group-hover:text-accent">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={`/projects/${next.slug}`}
          className="group rounded-xl border border-line p-5 text-right hover:border-accent/60 sm:col-start-2"
        >
          <span className="flex items-center justify-end gap-2 text-sm text-muted">
            Next project
            <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1 block font-semibold group-hover:text-accent">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}

async function ProjectDetails({ params }) {
  const { slug } = await params;
  const result = await getProject(slug);
  if (result.notFound) notFound();
  if (result.unavailable) return <ContentUnavailable />;
  const { project } = result;

  return (
    <article className="space-y-12">
      <header className="max-w-3xl">
        <StatusBadge status={project.status} />
        <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em]">
          {project.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{project.tagline}</p>
        <div className="mt-7">
          <ProjectLinks repoUrl={project.repo_url} liveUrl={project.live_url} title={project.title} />
        </div>
      </header>

      {project.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- image hosts are set in the admin, so they can't be listed for next/image ahead of time
        <img
          src={project.image_url}
          alt={`Screenshot of ${project.title}`}
          className="w-full rounded-xl border border-line"
          loading="lazy"
        />
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-10">
          {project.description && (
            <section aria-labelledby="overview">
              <h2 id="overview" className="mb-3 text-xl font-bold tracking-tight">
                Overview
              </h2>
              <p className="max-w-2xl text-[17px] leading-relaxed text-muted">{project.description}</p>
            </section>
          )}
          {project.highlights.length > 0 && (
            <section aria-labelledby="what-i-built">
              <h2 id="what-i-built" className="mb-4 text-xl font-bold tracking-tight">
                What I built
              </h2>
              <ul className="max-w-2xl space-y-3">
                {project.highlights.map((point) => (
                  <li key={point} className="relative pl-5 leading-relaxed">
                    <span aria-hidden className="absolute left-0 top-[0.7em] h-px w-2.5 bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {project.skills.length > 0 && (
          <aside aria-labelledby="stack" className="h-fit rounded-xl border border-line bg-panel p-5">
            <h2 id="stack" className="text-sm font-semibold">
              Technologies
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <li key={skill} className="rounded-md bg-panel-2 px-2.5 py-1 text-xs text-muted">
                  {skill}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <ProjectPager slug={slug} />
    </article>
  );
}

function DetailsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading project" className="max-w-3xl space-y-4">
      <div className="h-10 w-3/4 animate-pulse rounded-lg bg-panel-2" />
      <div className="h-5 w-full animate-pulse rounded bg-panel-2" />
      <div className="h-5 w-2/3 animate-pulse rounded bg-panel-2" />
    </div>
  );
}

export default function ProjectPage(props) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href="/projects"
        className="group mb-10 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={15} aria-hidden className="transition-transform group-hover:-translate-x-0.5" />
        All projects
      </Link>
      {/* params are read inside Suspense, so pages for new projects stream in instead of blocking. */}
      <Suspense fallback={<DetailsSkeleton />}>
        <ProjectDetails params={props.params} />
      </Suspense>
    </div>
  );
}
