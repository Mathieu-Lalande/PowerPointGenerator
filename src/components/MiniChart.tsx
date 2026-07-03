"use client";

import type { ChartData } from "@/types/slide";

interface Props {
  chart: ChartData;
  colors: string[];
  textColor: string;
}

const SIZE = 220;

export default function MiniChart({ chart, colors, textColor }: Props) {
  const { type, categories, series } = chart;
  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allValues);

  if (type === "pie" || type === "donut") {
    const total = series[0]?.values.reduce((a, b) => a + b, 0) || 1;
    let cumulative = 0;
    const radius = SIZE / 2;
    const inner = type === "donut" ? radius * 0.55 : 0;
    const slices = (series[0]?.values || []).map((v, i) => {
      const start = (cumulative / total) * Math.PI * 2;
      cumulative += v;
      const end = (cumulative / total) * Math.PI * 2;
      const x1 = radius + radius * Math.sin(start);
      const y1 = radius - radius * Math.cos(start);
      const x2 = radius + radius * Math.sin(end);
      const y2 = radius - radius * Math.cos(end);
      const large = end - start > Math.PI ? 1 : 0;
      const path = `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 ${large} 1 ${x2},${y2} Z`;
      return <path key={i} d={path} fill={colors[i % colors.length]} />;
    });
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices}
        {inner > 0 && (
          <circle cx={radius} cy={radius} r={inner} className="fill-current" style={{ color: "var(--chart-bg, transparent)" }} />
        )}
      </svg>
    );
  }

  const w = 320;
  const h = 180;
  const padding = 24;
  const barGroupWidth = (w - padding * 2) / categories.length;

  if (type === "line") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {series.map((s, si) => {
          const points = s.values
            .map((v, i) => {
              const x = padding + (i / Math.max(1, categories.length - 1)) * (w - padding * 2);
              const y = h - padding - (v / max) * (h - padding * 2);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polyline
              key={si}
              points={points}
              fill="none"
              stroke={colors[si % colors.length]}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
        <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke={textColor} opacity={0.2} />
      </svg>
    );
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {categories.map((cat, ci) => {
        const groupX = padding + ci * barGroupWidth;
        const barW = (barGroupWidth * 0.6) / series.length;
        return (
          <g key={ci}>
            {series.map((s, si) => {
              const v = s.values[ci] ?? 0;
              const barH = (v / max) * (h - padding * 2);
              const x = groupX + si * barW + barGroupWidth * 0.2;
              const y = h - padding - barH;
              return (
                <rect
                  key={si}
                  x={x}
                  y={y}
                  width={barW * 0.85}
                  height={barH}
                  fill={colors[si % colors.length]}
                  rx={2}
                />
              );
            })}
          </g>
        );
      })}
      <line x1={padding} y1={h - padding} x2={w - padding} y2={h - padding} stroke={textColor} opacity={0.2} />
    </svg>
  );
}
