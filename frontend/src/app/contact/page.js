import { FolderGit2, Mail, MapPin, UserRound } from "lucide-react";

import ContactForm from "@/components/contact/ContactForm";
import PageHeader from "@/components/PageHeader";
import { getPortfolio } from "@/lib/api";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Vishant Bhavsar about part-time roles, projects or collaboration.",
};

function OtherWays({ profile }) {
  const links = [
    profile?.email && { icon: Mail, label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    profile?.linkedin_url && {
      icon: UserRound,
      label: "LinkedIn",
      value: profile.linkedin_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      href: profile.linkedin_url,
    },
    profile?.github_url && {
      icon: FolderGit2,
      label: "GitHub",
      value: profile.github_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
      href: profile.github_url,
    },
  ].filter(Boolean);

  return (
    <aside aria-labelledby="other-ways" className="space-y-6">
      {profile?.open_to_work && profile.availability_note && (
        <p className="flex items-start gap-2.5 text-sm">
          <span aria-hidden className="relative mt-1.5 flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-ok" />
          </span>
          {profile.availability_note}
        </p>
      )}
      <div>
        <h2 id="other-ways" className="text-lg font-semibold">
          Other ways to reach me
        </h2>
        <ul className="mt-4 space-y-2">
          {links.map(({ icon: Icon, label, value, href }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="group -mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-panel"
              >
                <Icon size={18} aria-hidden className="shrink-0 text-muted group-hover:text-accent" />
                <span className="min-w-0">
                  <span className="block text-xs text-muted">{label}</span>
                  <span className="block truncate font-medium group-hover:text-accent">{value}</span>
                </span>
              </a>
            </li>
          ))}
          {profile?.location && (
            <li className="-mx-3 flex items-center gap-3 px-3 py-2.5">
              <MapPin size={18} aria-hidden className="shrink-0 text-muted" />
              <span>
                <span className="block text-xs text-muted">Based in</span>
                <span className="block font-medium">{profile.location}</span>
              </span>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}

export default async function ContactPage() {
  const data = await getPortfolio();

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <PageHeader title="Contact">
        Hiring for a part-time role, or want to talk about a project? Send me a message and I&rsquo;ll reply by email.
      </PageHeader>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ContactForm />
        <OtherWays profile={data?.profile} />
      </div>
    </div>
  );
}
