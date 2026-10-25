import ContentUnavailable from "@/components/ContentUnavailable";
import PageHeader from "@/components/PageHeader";
import SkillExplorer from "@/components/skills/SkillExplorer";
import { getPortfolio } from "@/lib/api";
import { buildSkillIndex } from "@/lib/skills";

export const metadata = {
  title: "Skills",
  description: "Skills across backend, frontend, data, cloud and security, linked to the jobs and projects that used them.",
};

export default async function SkillsPage() {
  const data = await getPortfolio();
  const index = data ? buildSkillIndex(data) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <PageHeader title="Skills">
        {index
          ? `${index.totalSkills} skills across ${index.categories.length} areas. Every chart here is built from the jobs and projects that used each skill.`
          : null}
      </PageHeader>
      {index ? <SkillExplorer index={index} /> : <ContentUnavailable />}
    </div>
  );
}
