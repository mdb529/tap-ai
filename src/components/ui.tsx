import type { ReactNode } from "react";

/* ------------------------------------------------------------------ layout */

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0 text-xs text-slate-500">{right}</div>}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {lede && <p className="mt-2 text-sm leading-relaxed text-slate-600">{lede}</p>}
      </div>
      {children}
    </div>
  );
}

/** A framed aside for design rationale. Used a lot on purpose -- this repo is
 *  as much an argument as it is an app. */
export function Note({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="rounded-md border-l-2 border-amber-400 bg-amber-50/60 px-4 py-3">
      {title && <p className="mb-1 text-xs font-semibold text-amber-900">{title}</p>}
      <div className="text-xs leading-relaxed text-amber-950/80">{children}</div>
    </aside>
  );
}

/* -------------------------------------------------------------------- stats */

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const tones = {
    default: "text-slate-900",
    good: "text-teal-700",
    warn: "text-amber-700",
    bad: "text-rose-700",
  } as const;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs leading-snug text-slate-500">{sub}</p>}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

/* ------------------------------------------------------------------ badges */

const BADGE_TONES = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-800 ring-teal-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = "slate",
  title,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export const classTone = (c: string): BadgeTone => (c === "strategic" ? "violet" : "blue");
export const statusTone = (s: string): BadgeTone =>
  s === "answered" || s === "merged" || s === "applied"
    ? "teal"
    : s === "deflected" || s === "pending" || s === "open"
      ? "amber"
      : s === "timed_out" || s === "expired" || s === "closed"
        ? "rose"
        : "slate";
export const radiusTone = (r: string): BadgeTone =>
  r === "high" ? "rose" : r === "medium" ? "amber" : "slate";

/* ------------------------------------------------------------------- table */

export function Table({
  head,
  children,
  dense = false,
}: {
  head: (string | ReactNode)[];
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {head.map((h, i) => (
              <th
                key={i}
                className={`px-5 ${dense ? "pb-1.5" : "pb-2"} text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 first:pl-5`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className = "",
  mono = false,
}: {
  children: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td className={`px-5 py-2.5 align-top text-slate-700 ${mono ? "font-mono text-xs" : ""} ${className}`}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ charts
 * Hand-rolled SVG rather than a chart library. Three reasons: no extra
 * dependency to fail on install, full control of the axis labels, and these
 * are simple shapes. If the charts get more ambitious, revisit.
 * ---------------------------------------------------------------------- */

export const PALETTE = [
  "#0f766e", "#7c3aed", "#0369a1", "#b45309", "#be123c",
  "#4d7c0f", "#a21caf", "#0e7490", "#c2410c", "#4338ca",
];

export function StackedBars({
  categories,
  series,
  height = 190,
  valueLabel = "",
}: {
  categories: string[];
  series: { name: string; values: number[]; color?: string }[];
  height?: number;
  valueLabel?: string;
}) {
  const totals = categories.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const barW = 100 / categories.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2="100"
            y1={height - f * (height - 22)}
            y2={height - f * (height - 22)}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {categories.map((c, i) => {
          let acc = 0;
          return (
            <g key={c}>
              {series.map((s, si) => {
                const v = s.values[i] ?? 0;
                if (!v) return null;
                const h = (v / max) * (height - 22);
                const y = height - 22 - acc - h;
                acc += h;
                return (
                  <rect
                    key={s.name}
                    x={i * barW + barW * 0.16}
                    y={y}
                    width={barW * 0.68}
                    height={Math.max(h, 0.6)}
                    fill={s.color ?? PALETTE[si % PALETTE.length]}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex text-[10px] text-slate-500">
        {categories.map((c, i) => (
          <div key={c} className="flex-1 text-center">
            <div className="tabular-nums font-medium text-slate-700">{totals[i]}</div>
            <div>{c}</div>
          </div>
        ))}
      </div>
      {valueLabel && <p className="mt-1 text-[10px] text-slate-400">{valueLabel}</p>}
      <Legend items={series.map((s, i) => ({ name: s.name, color: s.color ?? PALETTE[i % PALETTE.length] }))} />
    </div>
  );
}

export function Lines({
  categories,
  series,
  height = 190,
}: {
  categories: string[];
  series: { name: string; values: (number | null)[]; color?: string }[];
  height?: number;
}) {
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const max = Math.max(1, ...all);
  const inner = height - 24;
  const x = (i: number) => (categories.length === 1 ? 50 : (i / (categories.length - 1)) * 96 + 2);
  const y = (v: number) => height - 24 - (v / max) * inner;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2="100"
            y1={height - 24 - f * inner}
            y2={height - 24 - f * inner}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {series.map((s, si) => {
          const color = s.color ?? PALETTE[si % PALETTE.length];
          const pts = s.values
            .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
            .filter(Boolean) as string[];
          if (!pts.length) return null;
          return (
            <g key={s.name}>
              <polyline
                points={pts.join(" ")}
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
              {s.values.map((v, i) =>
                v === null ? null : (
                  <circle key={i} cx={x(i)} cy={y(v)} r="1.1" fill={color} vectorEffect="non-scaling-stroke" />
                )
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex text-[10px] text-slate-500">
        {categories.map((c) => (
          <div key={c} className="flex-1 text-center">
            {c}
          </div>
        ))}
      </div>
      <Legend items={series.map((s, i) => ({ name: s.name, color: s.color ?? PALETTE[i % PALETTE.length] }))} />
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
      {items.map((it) => (
        <span key={it.name} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: it.color }} />
          {it.name}
        </span>
      ))}
    </div>
  );
}

/** Horizontal bar list -- better than a pie for ranked comparison. */
export function BarList({
  rows,
  unit = "",
  colorFor,
}: {
  rows: { label: string; value: number; note?: string }[];
  unit?: string;
  colorFor?: (r: { label: string; value: number }) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-slate-700">{r.label}</span>
            <span className="shrink-0 tabular-nums font-medium text-slate-900">
              {r.value.toLocaleString()}
              {unit}
              {r.note && <span className="ml-1.5 font-normal text-slate-400">{r.note}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.max(1.5, (r.value / max) * 100)}%`,
                background: colorFor ? colorFor(r) : PALETTE[0],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Funnel with explicit drop-off between stages. */
export function Funnel({ stages }: { stages: { label: string; value: number; note?: string }[] }) {
  const first = Math.max(1, stages[0]?.value ?? 1);
  return (
    <ol className="space-y-2.5">
      {stages.map((s, i) => {
        const prev = i === 0 ? null : stages[i - 1].value;
        const drop = prev === null ? null : prev - s.value;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium text-slate-700">{s.label}</span>
              <span className="shrink-0 text-xs tabular-nums text-slate-900">
                {s.value.toLocaleString()}
                <span className="ml-1.5 text-slate-400">{Math.round((s.value / first) * 100)}%</span>
              </span>
            </div>
            <div className="mt-1 h-5 w-full rounded bg-slate-100">
              <div
                className="flex h-5 items-center rounded bg-teal-600/85 px-2 text-[10px] font-medium text-white"
                style={{ width: `${Math.max(3, (s.value / first) * 100)}%` }}
              />
            </div>
            {drop !== null && drop > 0 && (
              <p className="mt-0.5 text-[10px] text-rose-600">
                −{drop.toLocaleString()} lost here{s.note ? ` (${s.note})` : ""}
              </p>
            )}
            {drop === null && s.note && <p className="mt-0.5 text-[10px] text-slate-400">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
