/**
 * Site sections. Each one is its own page; a section is added here once its page exists.
 * The homepage uses the descriptions for its "explore" links.
 */
export const SECTIONS = [
  {
    href: "/experience",
    label: "Experience",
    description: "Where I've worked, what I built there, and the results it delivered.",
  },
];

export const NAV = [{ href: "/", label: "Overview" }, ...SECTIONS];
