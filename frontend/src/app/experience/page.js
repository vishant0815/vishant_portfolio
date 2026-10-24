import ContentUnavailable from "@/components/ContentUnavailable";
import Education from "@/components/experience/Education";
import Metrics from "@/components/experience/Metrics";
import Timeline from "@/components/experience/Timeline";
import PageHeader from "@/components/PageHeader";
import { getPortfolio } from "@/lib/api";
import { formatMonth } from "@/lib/format";

export const metadata = {
  title: "Experience",
  description: "Python backend roles, measured results, education and certification.",
};

function intro(roles) {
  if (!roles.length) return null;
  const starts = roles.map((role) => role.start_date).sort();
  const count = roles.length === 1 ? "One role" : `${roles.length} roles`;
  return `${count} building Python backend services since ${formatMonth(starts[0])}, from an internship to production e-commerce platforms.`;
}

export default async function ExperiencePage() {
  const data = await getPortfolio();
  const roles = data?.experience ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-20 px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <PageHeader title="Experience">{intro(roles)}</PageHeader>
      {data ? (
        <>
          {roles.length > 0 && (
            <section aria-label="Career timeline">
              <Timeline roles={roles} />
            </section>
          )}
          <Metrics stats={data.stats} />
          <Education education={data.education} certifications={data.certifications} />
        </>
      ) : (
        <ContentUnavailable />
      )}
    </div>
  );
}
