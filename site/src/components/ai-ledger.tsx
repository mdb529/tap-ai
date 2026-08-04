"use client";

import { useState } from "react";
import {
  AGENT_COMPARISON,
  MCP_EXCHANGE,
  MCP_TOOLS,
  SAMPLE_DECISION,
} from "@/lib/decision-ledger";

/**
 * The AI-native ledger section.
 *
 * The argument has to be made in code, not adjectives. "Optimized for AI" means
 * nothing to a technical buyer; a side-by-side of what an agent writes with and
 * without the ledger means everything. So the comparison is the centerpiece and
 * the format spec is the supporting evidence, not the reverse.
 */

type Tab = "why" | "record" | "mcp";

const TABS: { key: Tab; label: string }[] = [
  { key: "why", label: "Why it matters" },
  { key: "record", label: "The record" },
  { key: "mcp", label: "Agent access" },
];

export function AiLedger() {
  const [tab, setTab] = useState<Tab>("why");

  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-full bg-white/5 p-1 ring-1 ring-inset ring-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${
              tab === t.key ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-[fadeIn_.28s_ease-out]">
        {tab === "why" && <WhyPane />}
        {tab === "record" && <RecordPane />}
        {tab === "mcp" && <McpPane />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- why */

function WhyPane() {
  const c = AGENT_COMPARISON;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2.5 ring-1 ring-inset ring-white/10">
        <span className="rounded bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
          agent task
        </span>
        <span className="text-[13px] text-slate-200">{c.task}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {[c.without, c.with].map((side, i) => {
          const good = i === 1;
          return (
            <div
              key={side.label}
              className={`overflow-hidden rounded-xl ring-1 ${
                good ? "ring-teal-400/40" : "ring-rose-400/30"
              }`}
            >
              <div
                className={`flex items-center gap-2 px-3.5 py-2 ${
                  good ? "bg-teal-500/15" : "bg-rose-500/10"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    good ? "bg-teal-400 text-slate-900" : "bg-rose-400 text-slate-900"
                  }`}
                >
                  {good ? "✓" : "✕"}
                </span>
                <span className={`text-[12.5px] font-semibold ${good ? "text-teal-200" : "text-rose-200"}`}>
                  {side.label}
                </span>
              </div>
              <pre className="overflow-x-auto bg-slate-950 px-3 py-3 text-[10.5px] leading-relaxed sm:px-3.5 sm:text-[11.5px]">
                {side.code.map((l, k) => (
                  <div
                    key={k}
                    className={l.sign === "+" ? (good ? "text-teal-300" : "text-rose-300") : "text-slate-500"}
                  >
                    <span className="select-none opacity-60">{l.sign} </span>
                    {l.text}
                  </div>
                ))}
              </pre>
              <div className="bg-slate-900 px-3.5 py-3">
                <p className={`text-[13px] font-semibold ${good ? "text-teal-300" : "text-rose-300"}`}>
                  {side.verdict}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{side.why}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 rounded-lg border-l-2 border-teal-400 bg-teal-500/10 px-4 py-3 text-[13px] leading-relaxed text-teal-100/90">
        Your agents already have your schemas and your lineage. What they lack is any record of what
        those objects were <strong className="text-white">decided</strong> to mean — so they infer
        intent, confidently. Every tap you answer writes one row of the corpus that fixes it.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- record */

function RecordPane() {
  const d = SAMPLE_DECISION;
  const [hi, setHi] = useState<string | null>(null);

  const PROPS: { key: string; label: string; note: string }[] = [
    { key: "status", label: "Explicit staleness", note: "status + supersedes. A reversed decision is unusable, not merely old." },
    { key: "scope", label: "Scope binding", note: "Names the objects it governs, so retrieval keys on lineage rather than text similarity." },
    { key: "decided_by", label: "Authority signal", note: "A CFO's call and an analyst's call are not the same evidence." },
    { key: "durability", label: "Durability signal", note: "Survived 60 days unreversed. An agent can weight on this." },
    { key: "retrieval_text", label: "One chunk", note: "Pre-rendered, so no chunking heuristic splits a decision from its scope." },
  ];

  const line = (k: string, content: React.ReactNode, indent = 1) => (
    <div
      onMouseEnter={() => setHi(k)}
      onMouseLeave={() => setHi(null)}
      className={`-mx-2 rounded px-2 transition-colors ${hi === k ? "bg-teal-500/15" : ""}`}
      style={{ paddingLeft: `${indent * 0.9 + 0.5}rem` }}
    >
      {content}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
      <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
        <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2">
          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-200">
            jsonl
          </span>
          <code className="text-[11.5px] text-slate-400">exports/decisions.jsonl</code>
          <span className="ml-auto text-[10.5px] text-slate-500">hover a property →</span>
        </div>
        <pre className="overflow-x-auto bg-slate-950 px-3 py-3 text-[10.5px] leading-[1.7] text-slate-300 sm:px-3.5 sm:text-[11.5px]">
          <div className="text-slate-500">{"{"}</div>
          {line("id", <><K>decision_id</K>: <S>{d.decision_id}</S>, <K>tap_id</K>: <S>{d.tap_id}</S>,</>)}
          {line("status", <><K>status</K>: <S hot>{d.status}</S>, <K>supersedes</K>: <S>{d.supersedes}</S>,</>)}
          {line("q", <><K>answer</K>: <S>{d.answer}</S>,</>)}
          {line("q", <><K>rationale</K>: <S>{d.rationale}</S>,</>)}
          {line("cls", <><K>class</K>: <S>{d.class}</S>, <K>domain</K>: <S>{d.domain}</S>,</>)}
          {line("scope", <><K>scope</K>: {"{"}</>)}
          {line("scope", <><K>objects</K>: [</>, 2)}
          {d.scope.objects.map((o) => line("scope", <S>{o}</S>, 3))}
          {line("scope", <>], <K>downstream_count</K>: <N>{d.scope.downstream_count}</N></>, 2)}
          {line("scope", <>{"},"}</>)}
          {line("decided_by", <><K>decided_by</K>: {"{ "}<K>name</K>: <S>{d.decided_by.name}</S>,</>)}
          {line("decided_by", <><K>role</K>: <S>{d.decided_by.role}</S>, <K>authority</K>: <S hot>{d.decided_by.authority}</S> {"},"}</>, 2)}
          {line("artifact", <><K>artifact</K>: {"{ "}<K>type</K>: <S>{d.artifact.type}</S>, <K>ref</K>: <S>{d.artifact.ref}</S> {"},"}</>)}
          {line("prov", <><K>provenance</K>: {"{ "}<K>trigger</K>: <S>{d.provenance.trigger}</S>, <K>commit</K>: <S>{d.provenance.commit}</S> {"},"}</>)}
          {line("durability", <><K>durability</K>: {"{ "}<K>survived</K>: <N>true</N>, <K>reversed_at</K>: <N>null</N> {"},"}</>)}
          {line("retrieval_text", <><K>retrieval_text</K>: <S>{d.retrieval_text.slice(0, 88)}…</S></>)}
          <div className="text-slate-500">{"}"}</div>
        </pre>
      </div>

      <div className="space-y-2">
        {PROPS.map((p) => (
          <button
            key={p.key}
            onMouseEnter={() => setHi(p.key)}
            onMouseLeave={() => setHi(null)}
            onClick={() => setHi(p.key)}
            className={`w-full rounded-lg px-3.5 py-2.5 text-left transition-all ring-1 ring-inset ${
              hi === p.key
                ? "bg-teal-500/15 ring-teal-400/40"
                : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <p className="text-[12.5px] font-semibold text-white">{p.label}</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">{p.note}</p>
          </button>
        ))}
        <p className="px-1 pt-1 text-[11px] leading-relaxed text-slate-500">
          One row per decision, not per event — an agent needs the current answer, not an event log
          to fold.
        </p>
      </div>
    </div>
  );
}

const K = ({ children }: { children: React.ReactNode }) => (
  <span className="text-sky-300">&quot;{children}&quot;</span>
);
const S = ({ children, hot = false }: { children: React.ReactNode; hot?: boolean }) => (
  <span className={hot ? "font-semibold text-teal-300" : "text-teal-400/90"}>
    {children === null ? "null" : `"${children}"`}
  </span>
);
const N = ({ children }: { children: React.ReactNode }) => (
  <span className="text-amber-300">{children}</span>
);

/* ------------------------------------------------------------------- mcp */

function McpPane() {
  const [sel, setSel] = useState(0);
  const t = MCP_TOOLS[sel];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="space-y-1.5">
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          MCP tools
        </p>
        {MCP_TOOLS.map((tool, i) => (
          <button
            key={tool.name}
            onClick={() => setSel(i)}
            className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ring-1 ring-inset ${
              i === sel ? "bg-white/10 ring-white/25" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]"
            }`}
          >
            <code className={`text-[12px] font-medium ${i === sel ? "text-teal-300" : "text-slate-300"}`}>
              {tool.name}
            </code>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{tool.returns}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <div className="bg-white/5 px-3.5 py-2">
            <code className="text-[11.5px] text-slate-300">{t.name}</code>
          </div>
          <pre className="overflow-x-auto bg-slate-950 px-3.5 py-3 text-[11.5px] leading-relaxed text-teal-400/90">
            {t.args}
          </pre>
        </div>

        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <div className="bg-white/5 px-3.5 py-2">
            <span className="text-[11px] font-medium text-slate-400">example exchange</span>
          </div>
          <pre className="overflow-x-auto bg-slate-950 px-3 py-3 text-[10.5px] leading-relaxed sm:px-3.5 sm:text-[11.5px]">
            <span className="text-slate-500">{MCP_EXCHANGE.request}</span>
            {"\n\n"}
            <span className="text-teal-300">{MCP_EXCHANGE.response}</span>
          </pre>
        </div>

        <p className="rounded-lg border-l-2 border-violet-400 bg-violet-500/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-violet-100/90">
          The last tool closes the loop: when no governing decision exists, the agent{" "}
          <strong className="text-white">opens a tap</strong> instead of guessing. A human answers in
          five seconds, and the next agent never has to ask.
        </p>
      </div>
    </div>
  );
}
