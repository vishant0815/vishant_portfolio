import Link from "next/link";

import NavLinks from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-[13px] font-bold text-bg">
            VB
          </span>
          <span>Vishant Bhavsar</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2">
          <NavLinks />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
