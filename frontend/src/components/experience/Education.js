import { formatMonth, formatYear } from "@/lib/format";

function dates(item) {
  const show = item.show_years_only ? formatYear : formatMonth;
  const end = item.end_date ? show(item.end_date) : "present";
  return `${show(item.start_date)} – ${end}${item.is_expected ? " (expected)" : ""}`;
}

export default function Education({ education, certifications }) {
  if (!education?.length && !certifications?.length) return null;

  return (
    <section aria-labelledby="education" className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      {education?.length > 0 && (
        <div>
          <h2 id="education" className="mb-6 text-2xl font-bold tracking-tight">
            Education
          </h2>
          <ul className="space-y-8">
            {education.map((item) => (
              <li key={item.id}>
                <p className="text-sm text-muted">{dates(item)}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.qualification}</h3>
                <p className="text-accent">
                  {item.institution}
                  {item.grade && <span className="text-muted">, {item.grade}</span>}
                </p>
                {item.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-muted">
                    {item.highlights.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {certifications?.length > 0 && (
        <div>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Certification</h2>
          <ul className="space-y-4">
            {certifications.map((cert) => (
              <li key={cert.id} className="rounded-xl border border-line bg-panel p-5">
                <p className="font-semibold leading-snug">{cert.name}</p>
                <p className="mt-2 text-sm text-muted">
                  {cert.issuer}, {formatMonth(cert.issued_on)}
                </p>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                  >
                    Verify credential
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
