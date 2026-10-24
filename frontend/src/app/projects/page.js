import ContentUnavailable from "@/components/ContentUnavailable";
import PageHeader from "@/components/PageHeader";
import ProjectBrowser from "@/components/projects/ProjectBrowser";
import { getPortfolio } from "@/lib/api";

export const metadata = {
  title: "Projects",
  description: "Projects by Vishant Bhavsar: big data pipelines, cloud architecture and full-stack Python systems.",
};

export default async function ProjectsPage() {
  const data = await getPortfolio();

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <PageHeader title="Projects">
        Systems I&rsquo;ve designed and built. Filter by technology, or open a project for the details.
      </PageHeader>
      {data ? (
        data.projects.length > 0 ? (
          <ProjectBrowser projects={data.projects} />
        ) : (
          <p className="text-muted">No projects are published yet. Add one in the admin and it appears here.</p>
        )
      ) : (
        <ContentUnavailable />
      )}
    </div>
  );
}
