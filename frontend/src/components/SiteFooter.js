const LINKS = [
  { href: "https://www.linkedin.com/in/vishant810", label: "LinkedIn" },
  { href: "https://github.com/vishant0815", label: "GitHub" },
  { href: "https://github.com/vishant0815/vishant_portfolio", label: "Source code" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Built with Next.js, Django REST Framework, FastAPI and PostgreSQL.</p>
        <ul className="flex gap-5">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-text">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
