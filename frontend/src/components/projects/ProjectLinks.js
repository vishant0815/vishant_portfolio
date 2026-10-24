import { ExternalLink, FolderGit2 } from "lucide-react";

const base =
  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-offset-2";

/**
 * Shows a button for each link that exists, and nothing for a missing one:
 * repo only -> GitHub button; live only -> live site button; both -> both; neither -> renders nothing.
 */
export default function ProjectLinks({ repoUrl, liveUrl, title }) {
  if (!repoUrl && !liveUrl) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the live site for ${title} (opens in a new tab)`}
          className={`${base} bg-accent text-bg hover:opacity-90`}
        >
          <ExternalLink size={16} aria-hidden />
          Live site
        </a>
      )}
      {repoUrl && (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View the code for ${title} on GitHub (opens in a new tab)`}
          className={`${base} border border-line hover:border-accent hover:text-accent`}
        >
          <FolderGit2 size={16} aria-hidden />
          GitHub
        </a>
      )}
    </div>
  );
}
