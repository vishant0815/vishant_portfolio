import LiveDashboard from "@/components/live/LiveDashboard";
import PageHeader from "@/components/PageHeader";
import { getPortfolio, getVisitorStats } from "@/lib/api";

export const metadata = {
  title: "Live",
  description: "Live visitor numbers for this site, from its own FastAPI analytics service. No cookies.",
};

export default async function LivePage() {
  const [stats, data] = await Promise.all([getVisitorStats(), getPortfolio()]);
  // Project pages are listed by their title rather than their web address.
  const projectTitles = Object.fromEntries((data?.projects ?? []).map((p) => [`/projects/${p.slug}`, p.title]));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <PageHeader title="Live">
        Who&rsquo;s visiting this site, served by my own FastAPI analytics service and PostgreSQL. No cookies and no
        IP addresses are stored: visitors are counted with an anonymous ID that changes every day.
      </PageHeader>
      <LiveDashboard initialStats={stats} projectTitles={projectTitles} />
    </div>
  );
}
