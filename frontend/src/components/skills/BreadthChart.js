"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from "recharts";

/** Short labels so the radar stays readable on small screens. */
const SHORT = {
  "Backend and APIs": "Backend",
  "Data and machine learning": "Data and ML",
  "Databases and messaging": "Databases",
  "Cloud and DevOps": "Cloud",
  "Engineering and security": "Engineering",
};

function BreadthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const area = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold">{area.full}</p>
      <p className="text-muted">
        {area.skills} skills, {area.used} used in my work
      </p>
    </div>
  );
}

/** Radar of breadth per area: skills known (outer shape) against skills used in jobs or projects (filled). */
export default function BreadthChart({ categories, animate }) {
  const data = categories.map((category) => ({
    area: SHORT[category.name] ?? category.name,
    full: category.name,
    skills: category.skills.length,
    used: category.skills.filter((skill) => skill.uses.length > 0).length,
  }));

  return (
    <div>
      <RadarChart
        responsive
        data={data}
        outerRadius="70%"
        margin={{ top: 8, right: 36, bottom: 8, left: 36 }}
        style={{ width: "100%", height: 300 }}
        accessibilityLayer
      >
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis dataKey="area" tick={{ fill: "var(--muted)", fontSize: 12 }} />
        <Tooltip content={<BreadthTooltip />} />
        <Radar
          name="Skills"
          dataKey="skills"
          stroke="var(--muted)"
          strokeDasharray="4 4"
          fill="transparent"
          isAnimationActive={animate}
        />
        <Radar
          name="Used in my work"
          dataKey="used"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.22}
          isAnimationActive={animate}
          animationDuration={1000}
        />
      </RadarChart>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-0 w-4 border-t border-dashed border-muted" />
          Skills I know
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-sm bg-accent/40 ring-1 ring-accent" />
          Used in jobs or projects
        </li>
      </ul>
    </div>
  );
}
