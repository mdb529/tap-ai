export const money = (n: number, cents = false) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

export const pct = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined || Number.isNaN(n) ? "--" : `${n.toFixed(digits)}%`;

/** Humanize minutes. Response latency is the product's core felt quality, so
 *  it should read like a human would say it, not as "412 min". */
export function duration(mins: number | null | undefined): string {
  if (mins === null || mins === undefined) return "--";
  if (mins < 1) return "<1m";
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = mins / 60;
  if (h < 24) return `${h < 10 ? h.toFixed(1) : Math.round(h)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
};

export const titleize = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const ago = (iso: string | null | undefined, now = new Date("2026-08-04T09:30:00")) => {
  if (!iso) return "--";
  const d = new Date(iso);
  const mins = (now.getTime() - d.getTime()) / 60000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

/** Fill {placeholders} in a tap question template from its context payload. */
export function renderTemplate(tpl: string, ctx: Record<string, unknown>): string {
  return tpl
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\{(\w+)\}/g, (_m, k) => {
      const v = ctx[k];
      return v === undefined || v === null ? `{${k}}` : String(v);
    });
}
