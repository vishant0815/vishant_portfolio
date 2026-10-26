/**
 * Site sections. Each one is its own page; a section is added here once its page exists.
 * The homepage uses the descriptions for its "explore" links.
 */
export const SECTIONS = [
  {
    href: "/projects",
    label: "Projects",
    description: "Things I've built, from big data pipelines to cloud architecture and full-stack systems.",
  },
  {
    href: "/experience",
    label: "Experience",
    description: "Where I've worked, what I built there, and the results it delivered.",
  },
  {
    href: "/skills",
    label: "Skills",
    description: "What I work with, and the jobs and projects where I've used each skill.",
  },
  {
    href: "/live",
    label: "Live",
    description: "Real-time visitor numbers for this site, from my own FastAPI analytics service.",
  },
];

export const NAV = [{ href: "/", label: "Overview" }, ...SECTIONS];
