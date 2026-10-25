/**
 * Joins skills to the jobs and projects that list them, so every chart on the
 * skills page is built from evidence in the database rather than self-ratings.
 */
export function buildSkillIndex(data) {
  const uses = new Map();
  const addUse = (name, use) => {
    if (!uses.has(name)) uses.set(name, []);
    uses.get(name).push(use);
  };

  data.experience.forEach((role) =>
    role.skills.forEach((name) =>
      addUse(name, { kind: "role", label: `${role.role}, ${role.company}`, href: "/experience" }),
    ),
  );
  data.projects.forEach((project) =>
    project.skills.forEach((name) =>
      addUse(name, { kind: "project", label: project.title, href: `/projects/${project.slug}` }),
    ),
  );

  const categories = data.skill_categories
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      skills: category.skills.map((skill) => ({
        name: skill.name,
        level: skill.level,
        featured: skill.is_featured,
        category: category.name,
        uses: uses.get(skill.name) ?? [],
      })),
    }))
    .filter((category) => category.skills.length > 0);

  const all = categories.flatMap((category) => category.skills);

  return {
    categories,
    totalSkills: all.length,
    usedSkills: all.filter((skill) => skill.uses.length > 0).length,
    // Most evidence first; featured skills break ties.
    ranked: [...all]
      .filter((skill) => skill.uses.length > 0)
      .sort((a, b) => b.uses.length - a.uses.length || Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name)),
  };
}
