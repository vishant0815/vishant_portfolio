"use client";

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const toDate = (iso) => new Date(`${iso}T00:00:00Z`);

function TrafficTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold">{fullDay.format(toDate(point.date))}</p>
      <p className="mt-1 flex items-center gap-2 text-muted">
        <span aria-hidden className="size-2 rounded-full bg-accent" />
        {point.views} {point.views === 1 ? "view" : "views"}
      </p>
      <p className="flex items-center gap-2 text-muted">
        <span aria-hidden className="size-2 rounded-full bg-ok" />
        {point.visitors} {point.visitors === 1 ? "visitor" : "visitors"}
      </p>
    </div>
  );
}

/** Daily views and visitors over the stats window. */
export default function TrafficChart({ daily, animate }) {
  return (
    <AreaChart
      responsive
      data={daily}
      margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
      style={{ width: "100%", height: 280 }}
      accessibilityLayer
    >
      <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
      <XAxis
        dataKey="date"
        tickFormatter={(iso) => dayLabel.format(toDate(iso))}
        tick={{ fill: "var(--muted)", fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        minTickGap={28}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fill: "var(--muted)", fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        width={48}
      />
      <Tooltip content={<TrafficTooltip />} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />
      <Area
        type="monotone"
        dataKey="views"
        name="Views"
        stroke="var(--accent)"
        strokeWidth={2}
        fill="var(--accent)"
        fillOpacity={0.14}
        isAnimationActive={animate}
        animationDuration={1100}
      />
      <Area
        type="monotone"
        dataKey="visitors"
        name="Visitors"
        stroke="var(--ok)"
        strokeWidth={2}
        fill="var(--ok)"
        fillOpacity={0.08}
        isAnimationActive={animate}
        animationDuration={1100}
      />
    </AreaChart>
  );
}
