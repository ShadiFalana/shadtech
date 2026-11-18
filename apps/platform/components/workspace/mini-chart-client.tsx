"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartDatum = {
  label: string;
  value: number;
};

const motionListeners = new Set<() => void>();
let cachedMotion: boolean | null = null;

function subscribeMotion(listener: () => void) {
  motionListeners.add(listener);
  if (typeof window === "undefined" || !window.matchMedia) return () => {
    motionListeners.delete(listener);
    cachedMotion = null;
  };
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handleChange = () => {
    cachedMotion = media.matches;
    listener();
  };
  media.addEventListener("change", handleChange);
  cachedMotion = media.matches;
  return () => {
    media.removeEventListener("change", handleChange);
    motionListeners.delete(listener);
    if (motionListeners.size === 0) cachedMotion = null;
  };
}

function getMotionSnapshot() {
  return cachedMotion ?? true;
}

function getMotionServerSnapshot() {
  return true;
}

export function MiniChartClient({
  title,
  data,
  dir,
  labels,
  summary,
}: {
  title: string;
  data: ChartDatum[];
  dir: "ltr" | "rtl";
  labels: { noData: string; name: string; value: string };
  summary: string;
}) {
  const reduceMotion = useSyncExternalStore(subscribeMotion, getMotionSnapshot, getMotionServerSnapshot);

  if (data.length === 0) {
    return <p className="p-2 text-sm text-muted-foreground">{labels.noData}</p>;
  }

  return (
    <div dir={dir} className="space-y-3">
      <div
        role="img"
        aria-label={summary}
        className="h-56 w-full rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            accessibilityLayer
            margin={{
              top: 8,
              right: dir === "rtl" ? 8 : 16,
              bottom: 4,
              left: dir === "rtl" ? 16 : 8,
            }}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.12} />
            <XAxis
              dataKey="label"
              type="category"
              reversed={dir === "rtl"}
              interval={0}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 13)}…` : value)}
              height={48}
            />
            <YAxis
              type="number"
              allowDecimals={false}
              orientation={dir === "rtl" ? "right" : "left"}
              width={32}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "currentColor", opacity: 0.06 }}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar
              dataKey="value"
              name={labels.value}
              fill="#F79432"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduceMotion}
              animationDuration={350}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.name}</th>
            <th scope="col">{labels.value}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
