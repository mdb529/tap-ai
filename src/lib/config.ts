import "server-only";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse } from "yaml";

/**
 * Config-as-code loader.
 *
 * Everything under org/, config/, and tap-types/ is read straight off disk on
 * each request. That is deliberate: in the MVP you want to edit a YAML file,
 * refresh the browser, and see the routing change. No cache, no restart.
 *
 * In production these same files would be read from the customer's repo at the
 * commit that triggered the tap -- which is the whole "ride systems that already
 * exist" claim. Config that lives in git gets version control, review, blame,
 * and rollback for free.
 */

const root = () => process.cwd();
const read = <T>(rel: string): T => parse(readFileSync(resolve(root(), rel), "utf8")) as T;

// --------------------------------------------------------------------------
// types
// --------------------------------------------------------------------------
export type AuthorityKey = "ic" | "lead" | "manager" | "director" | "vp" | "cxo";
export type TapClass = "tactical" | "strategic";

export interface AuthorityLevel {
  key: AuthorityKey;
  rank: number;
  label: string;
  can_resolve: TapClass[];
  strategic_scope?: string;
  idp_group: string;
}

export interface Domain {
  key: string;
  label: string;
  department: string;
  owner: string;
  backup: string;
  min_authority_strategic: AuthorityKey;
  description?: string;
}

export interface Employee {
  employee_id: string;
  email: string;
  full_name: string;
  title: string;
  department: string;
  authority_level: AuthorityKey;
  manager_email: string;
  domains_owned: string;
  slack_handle: string;
}

export interface TapType {
  id: string;
  name: string;
  version: number;
  status: "active" | "paused" | "draft";
  class: TapClass;
  description: string;
  paused_reason?: string;
  trigger: {
    source: "code_change" | "annotation" | "anomaly" | "llm_audit";
    match: Record<string, unknown>;
    rate_limit?: number;
  };
  classification: {
    domain: string;
    blast_radius: { method: string; thresholds: Record<string, number> };
  };
  routing: {
    domain_key: string;
    min_authority: AuthorityKey;
    fallback: string;
    deflection_allowed: boolean;
  };
  question: {
    template: string;
    context: string[];
    response: {
      kind: "single_select" | "multi_select" | "approve_reject" | "free_text" | "numeric";
      options?: string[];
      require_rationale_on?: string[];
    };
  };
  sla: { respond_within_hours: number; on_timeout: string; default_response: string | null };
  write_back: {
    target: "pull_request" | "override_table" | "metadata_patch";
    path?: string;
    table?: string;
    batch: string;
    requires_review: boolean;
  };
  dedupe: { key: string[]; cooldown_days: number };
  economics: { reward_weight: number; est_minutes_saved: number };
}

// --------------------------------------------------------------------------
// loaders
// --------------------------------------------------------------------------
export const authority = () =>
  read<{ levels: AuthorityLevel[]; escalation: Record<string, unknown> }>("org/authority.yml");

export const domains = () =>
  read<{ default_steward: string; domains: Domain[] }>("org/domains.yml");

export const notifications = () =>
  read<Record<string, unknown>>("org/notifications.yml");

export const sources = () => read<Record<string, unknown>>("config/sources.yml");
export const sso = () => read<Record<string, unknown>>("config/sso.yml");
export const plan = () => read<Record<string, unknown>>("config/plan.yml");

/** Parse org/employees.csv -- the IdP directory mirror. */
export function employees(): Employee[] {
  const text = readFileSync(resolve(root(), "org/employees.csv"), "utf8").trim();
  const [head, ...lines] = text.split("\n");
  const cols = head.split(",");
  return lines.map((line) => {
    // Quoted fields exist (names like O'Brien are fine, but be safe about commas).
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    const row: Record<string, string> = {};
    cols.forEach((c, i) => (row[c] = (cells[i] ?? "").trim()));
    return row as unknown as Employee;
  });
}

export function tapTypes(): TapType[] {
  const dir = resolve(root(), "tap-types");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yml") && !f.startsWith("_"))
    .map((f) => parse(readFileSync(join(dir, f), "utf8")) as TapType)
    .sort((a, b) => a.class.localeCompare(b.class) || a.id.localeCompare(b.id));
}

export const tapType = (id: string) => tapTypes().find((t) => t.id === id);

// --------------------------------------------------------------------------
// lint -- mirrors the rules declared in tap-types/_SPEC.yml
//
// A tap type is a place a customer can misconfigure themselves into noise.
// Every rule here corresponds to a real failure mode, not a style preference.
// --------------------------------------------------------------------------
export interface LintFinding {
  tapTypeId: string;
  severity: "error" | "warning";
  rule: string;
  message: string;
}

export function lintTapType(t: TapType): LintFinding[] {
  const f: LintFinding[] = [];
  const add = (severity: "error" | "warning", rule: string, message: string) =>
    f.push({ tapTypeId: t.id, severity, rule, message });

  if (t.class === "strategic") {
    if (t.write_back?.target !== "pull_request")
      add("error", "strategic-writeback", "Strategic taps must write back as a pull request -- shared logic needs review.");
    if (t.write_back?.requires_review !== true)
      add("error", "strategic-review", "Strategic taps must require engineer review before landing.");
  }
  if (t.class === "tactical" && t.write_back?.target === "pull_request" && t.write_back?.batch !== "daily")
    add("error", "tactical-batch", "Tactical PR write-back must batch daily, or it drowns the repo and buries strategic taps.");

  if (!t.dedupe?.key?.length)
    add("error", "dedupe-required", "No dedupe key. This type will eventually ask the same person the same question twice.");

  if (t.sla?.on_timeout === "default" && !t.sla?.default_response)
    add("error", "timeout-default", "on_timeout=default requires an explicit default_response.");

  const kind = t.question?.response?.kind;
  if ((kind === "single_select" || kind === "multi_select") && (t.question.response.options?.length ?? 0) < 2)
    add("error", "select-options", "Select responses need at least two options.");

  if ((t.question?.context?.length ?? 0) > 3)
    add("warning", "context-length", "More than three context lines. This is a notification, not a report.");

  if (["anomaly", "llm_audit"].includes(t.trigger?.source) && !t.trigger?.rate_limit)
    add("error", "rate-limit", `${t.trigger.source} triggers need a rate_limit as a safety valve.`);

  const opts = t.question?.response?.options ?? [];
  if (opts.length && !opts.some((o) => /not sure|need to check|don'?t know/i.test(o)))
    add("warning", "uncertainty-option", "No uncertainty option. Forcing a guess poisons the ledger.");

  return f;
}

export const lintAll = (): LintFinding[] => tapTypes().flatMap(lintTapType);
