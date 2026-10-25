"use client";

import { Bar, BarChart, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";

function UsageTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const skill = payload[0].payload;
  const roles = skill.uses.filter((use) => use.kind === "role").length;
  const projects = skill.uses.length - roles;
  const parts = [];
  if (roles) parts.push(`${roles} ${roles === 1 ? "job" : "jobs"}`);
  if (projects) parts.push(`${projects} ${projects === 1 ? "project" : "projects"}`);
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold">{skill.name}</p>
      <p className="text-muted">Used in {parts.join(" and ")}</p>
    </div>
  );
}

/** Horizontal bars: how many jobs and projects used each skill. Click a bar to explore it. */
export default function UsageChart({ skills, selected, onSelect, animate }) {
  const height = skills.length * 34 + 16;
  const data = skills.map((skill) => ({ ...skill, count: skill.uses.length }));

  return (
    <BarChart
      responsive
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 32, bottom: 4, left: 0 }}
      style={{ width: "100%", height }}
      accessibilityLayer
    >
      <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
      <YAxis
        type="category"
        dataKey="name"
        width={150}
        tickLine={false}
        axisLine={false}
        tick={{ fill: "var(--muted)", fontSize: 13 }}
      />
      <Tooltip cursor={{ fill: "var(--accent-soft)" }} content={<UsageTooltip />} />
      <Bar
        dataKey="count"
        name="Jobs and projects"
        radius={[0, 6, 6, 0]}
        barSize={18}
        isAnimationActive={animate}
        animationDuration={900}
        onClick={(entry) => onSelect(entry.payload?.name ?? entry.name)}
        className="cursor-pointer"
      >
        {data.map((skill) => (
          <Cell
            key={skill.name}
            fill="var(--accent)"
            fillOpacity={!selected || selected === skill.name ? 1 : 0.28}
            style={{ transition: "fill-opacity 200ms" }}
          />
        ))}
        <LabelList
          dataKey="count"
          position="right"
          offset={8}
          style={{ fill: "var(--muted)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
        />
      </Bar>
    </BarChart>
  );
}
