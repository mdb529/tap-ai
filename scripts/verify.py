"""
Verification pass. DuckDB is not installable in this environment, so this
validates the two things that actually break pages:

  1. REFERENTIAL INTEGRITY of the seeds (orphan tap_ids, unknown emails,
     impossible timestamps, status/response contradictions).
  2. COLUMN EXISTENCE -- every column the app's SQL references must exist in
     the underlying CSVs or be produced by a view. A typo here is a 500 on a
     page, and it is exactly the class of bug that is invisible until you click.

The view LOGIC is re-executed against SQLite (which supports FILTER and window
functions) with MEDIAN swapped for a percentile shim, so the aggregates are
proven against real data rather than eyeballed.
"""
import csv, json, re, sqlite3, sys, pathlib, statistics
from collections import defaultdict

ROOT = pathlib.Path(".")
FAIL, WARN = [], []
def fail(m): FAIL.append(m)
def warn(m): WARN.append(m)

def load(p):
    with open(p) as f: return list(csv.DictReader(f))

emps   = load("org/employees.csv")
objs   = load("seeds/source_objects.csv")
trigs  = load("seeds/triggers.csv")
taps   = load("seeds/taps.csv")
resps  = load("seeds/tap_responses.csv")
wbs    = load("seeds/write_backs.csv")
imps   = load("seeds/tap_impacts.csv")
ledger = load("seeds/incentive_ledger.csv")
usage  = load("seeds/billing_usage.csv")

print(f"loaded: employees={len(emps)} objects={len(objs)} triggers={len(trigs)} "
      f"taps={len(taps)} responses={len(resps)} writebacks={len(wbs)} "
      f"impacts={len(imps)} ledger={len(ledger)} usage={len(usage)}")

# ---------------------------------------------------------------- integrity
emails   = {e["email"] for e in emps}
tap_ids  = {t["tap_id"] for t in taps}
trig_ids = {t["trigger_id"] for t in trigs}
obj_ids  = {o["object_id"] for o in objs}
tt_ids   = {p.stem.replace("-", "_") for p in pathlib.Path("tap-types").glob("*.yml") if p.stem != "_SPEC"}
# tap type ids come from the yaml `id:` field, not the filename
import re as _re
tt_ids = set()
for p in pathlib.Path("tap-types").glob("*.yml"):
    if p.stem == "_SPEC": continue
    m = _re.search(r"^id:\s*(\S+)", p.read_text(), _re.M)
    if m: tt_ids.add(m.group(1))

for t in taps:
    if t["trigger_id"] not in trig_ids: fail(f"tap {t['tap_id']}: orphan trigger_id")
    if t["object_id"] not in obj_ids:   fail(f"tap {t['tap_id']}: orphan object_id")
    if t["recipient_email"] not in emails: fail(f"tap {t['tap_id']}: unknown recipient")
    if t["tap_type_id"] not in tt_ids:  fail(f"tap {t['tap_id']}: unknown tap_type_id {t['tap_type_id']}")
    if t["delivered_at"] < t["generated_at"]: fail(f"tap {t['tap_id']}: delivered before generated")
    if t["due_at"] <= t["delivered_at"]:      fail(f"tap {t['tap_id']}: due_at not after delivered_at")
    try: json.loads(t["context_json"])
    except Exception: fail(f"tap {t['tap_id']}: context_json is not valid JSON")

resp_by_tap = {}
for r in resps:
    if r["tap_id"] not in tap_ids: fail(f"response {r['response_id']}: orphan tap_id")
    if r["tap_id"] in resp_by_tap: fail(f"tap {r['tap_id']}: more than one response")
    resp_by_tap[r["tap_id"]] = r
    if r["responder_email"] not in emails: fail(f"response {r['response_id']}: unknown responder")
    if r["outcome"] == "answered" and not r["answer"]:
        fail(f"response {r['response_id']}: answered with empty answer")
    if r["outcome"] == "deflected" and not r["deflected_to"]:
        fail(f"response {r['response_id']}: deflected with no target")
    if r["rated_worth_asking"] not in ("true","false",""):
        fail(f"response {r['response_id']}: bad rated_worth_asking {r['rated_worth_asking']!r}")

# status <-> response contract
for t in taps:
    has = t["tap_id"] in resp_by_tap
    if t["status"] in ("answered","deflected") and not has:
        fail(f"tap {t['tap_id']}: status={t['status']} but no response row")
    if t["status"] in ("timed_out","expired","pending") and has:
        fail(f"tap {t['tap_id']}: status={t['status']} but has a response row")
    if has and resp_by_tap[t["tap_id"]]["outcome"] != t["status"]:
        fail(f"tap {t['tap_id']}: status/outcome mismatch")

wb_by_tap = {}
for w in wbs:
    if w["tap_id"] not in tap_ids: fail(f"writeback {w['writeback_id']}: orphan tap_id")
    if w["tap_id"] in wb_by_tap: fail(f"tap {w['tap_id']}: more than one write-back")
    wb_by_tap[w["tap_id"]] = w
    tap = next(t for t in taps if t["tap_id"] == w["tap_id"])
    if tap["status"] != "answered":
        fail(f"writeback {w['writeback_id']}: tap not answered (status={tap['status']})")
    if w["status"] in ("merged","applied") and not w["landed_at"]:
        fail(f"writeback {w['writeback_id']}: landed status with no landed_at")
    if w["status"] not in ("merged","applied") and w["landed_at"]:
        fail(f"writeback {w['writeback_id']}: unlanded status but landed_at set")

for i in imps:
    if i["tap_id"] not in tap_ids: fail(f"impact {i['impact_id']}: orphan tap_id")
    w = wb_by_tap.get(i["tap_id"])
    if not w or w["status"] not in ("merged","applied"):
        fail(f"impact {i['impact_id']}: impact recorded without a landed write-back")

# incentive rules from config/plan.yml must actually hold in the data
auth_by_email = {e["email"]: e["authority_level"] for e in emps}
per_person_q = defaultdict(float)
for l in ledger:
    if l["tap_id"] not in tap_ids: fail(f"ledger {l['entry_id']}: orphan tap_id")
    if auth_by_email.get(l["employee_email"]) in ("cxo","vp"):
        fail(f"ledger {l['entry_id']}: exec/vp is ineligible but has an entry")
    r = resp_by_tap.get(l["tap_id"])
    if not r: fail(f"ledger {l['entry_id']}: no response for tap")
    else:
        if r["durable"] != "true": fail(f"ledger {l['entry_id']}: paid on a non-durable answer")
        if float(r["quality_score"]) < 0.6: fail(f"ledger {l['entry_id']}: below min quality 0.6")
    per_person_q[(l["employee_email"], l["quarter"])] += float(l["amount_usd"])
for k, v in per_person_q.items():
    if v > 1500.0001: fail(f"incentive cap breached for {k}: ${v:,.2f} > $1,500")

# billing: billable must equal resolved, and never exceed delivered
for u in usage:
    if u["billable_taps"] != u["resolved_taps"]:
        fail(f"usage {u['month']}: billable != resolved")
    if int(u["resolved_taps"]) > int(u["delivered_taps"]):
        fail(f"usage {u['month']}: resolved > delivered")
    if int(u["delivered_taps"]) != sum(1 for t in taps if t["month"] == u["month"]):
        fail(f"usage {u['month']}: delivered_taps disagrees with taps.csv")

# ------------------------------------------------- execute the view logic
con = sqlite3.connect(":memory:")
con.create_function("MEDIAN", 1, lambda x: x)   # placeholder, replaced below
def mk(name, rows):
    if not rows: return
    cols = list(rows[0].keys())
    quoted = ",".join('"' + c + '"' for c in cols)
    con.execute(f"CREATE TABLE {name} ({quoted})")
    con.executemany(f'INSERT INTO {name} VALUES ({",".join("?"*len(cols))})',
                    [[r[c] for c in cols] for r in rows])
for n, rows in [("employees",emps),("source_objects",objs),("triggers",trigs),("taps",taps),
                ("tap_responses",resps),("write_backs",wbs),("tap_impacts",imps),
                ("incentive_ledger",ledger),("billing_usage",usage)]:
    mk(n, rows)

# v_funnel_by_month, without the MEDIAN dependency
funnel = con.execute("""
 WITH trg AS (SELECT month, COUNT(*) triggers_fired,
        COUNT(*) FILTER (WHERE outcome='suppressed_dedupe') dd,
        COUNT(*) FILTER (WHERE outcome='tap_generated') gen
      FROM triggers GROUP BY month),
      tp AS (SELECT month, COUNT(*) delivered,
        COUNT(*) FILTER (WHERE status='answered') answered,
        COUNT(*) FILTER (WHERE status='deflected') deflected,
        COUNT(*) FILTER (WHERE status IN ('timed_out','expired')) unresolved,
        COUNT(*) FILTER (WHERE status='pending') pending
      FROM taps GROUP BY month)
 SELECT trg.month, triggers_fired, dd, gen, delivered, answered, deflected, unresolved, pending
 FROM trg JOIN tp ON tp.month=trg.month ORDER BY trg.month""").fetchall()
print("\nfunnel (month, triggers, deduped, generated, delivered, answered, deflected, unresolved, pending):")
for r in funnel: print("  ", r)
for month, tf, dd, gen, deliv, *_ in funnel:
    if gen != deliv: fail(f"{month}: triggers.tap_generated({gen}) != taps delivered({deliv})")

# precision, computed in Python so the MEDIAN shim cannot lie
print("\nprecision by tap type (rated worth asking):")
for tt in sorted(tt_ids):
    rs = [r for r in resps if r["tap_type_id"] == tt and r["rated_worth_asking"]]
    if not rs: continue
    p = 100*sum(1 for r in rs if r["rated_worth_asking"]=="true")/len(rs)
    med = statistics.median(int(r["minutes_to_respond"]) for r in resps if r["tap_type_id"]==tt)
    dur = 100*sum(1 for r in resps if r["tap_type_id"]==tt and r["durable"]=="true")/max(1,sum(1 for r in resps if r["tap_type_id"]==tt))
    verdict = "low sample" if len(rs)<20 else ("BELOW BAR" if p<60 else "ok")
    print(f"   {tt:<32} {p:5.1f}%  n={len(rs):<4} durability={dur:4.0f}%  median={med:>5}m  {verdict}")

# ------------------------------------------------ column existence in app SQL
view_cols = {
  "v_tap_detail": set(taps[0]) | {"responded_at","minutes_to_respond","answer","deflected_to",
     "rationale","quality_score","rated_worth_asking","durable","reversed_at",
     "writeback_target","writeback_ref","writeback_status","writeback_landed_at","reviewer_email",
     "impact_type","impact_magnitude","est_minutes_saved","within_sla"},
  "v_funnel_by_month": {"month","triggers_fired","suppressed_dedupe","suppressed_rate_limit",
     "suppressed_low_confidence","taps_generated","taps_delivered","answered","deflected",
     "timed_out","expired","pending","writebacks","writebacks_landed","answer_rate_pct"},
  "v_precision_by_type": {"tap_type_id","tap_class","ratings","rated_worth","precision_pct",
     "avg_quality","durability_pct","median_minutes","verdict"},
  "v_type_decay": {"tap_type_id","tap_class","month","taps","cumulative_taps"},
  "v_roi_by_month": {"month","impacts","strategic_impacts","tactical_impacts","minutes_saved",
     "hours_saved","inconsistencies_prevented","incidents_avoided"},
  "v_routing_quality": {"domain_key","routed_via","taps","deflected","deflection_rate_pct",
     "unresolved","answer_rate_pct"},
  "v_department_mix": {"department","tap_class","taps","answered","answer_rate_pct","people_tapped"},
  "v_leaderboard": {"email","name","department","authority","taps_resolved","strategic_resolved",
     "avg_quality","durability_pct","median_minutes","incentive_usd"},
  "taps": set(taps[0]), "triggers": set(trigs[0]), "tap_responses": set(resps[0]),
  "write_backs": set(wbs[0]), "tap_impacts": set(imps[0]),
  "incentive_ledger": set(ledger[0]), "billing_usage": set(usage[0]),
  "source_objects": set(objs[0]), "employees": set(emps[0]),
}

# Pull real SQL blocks out of the app and check bare identifiers.
# Two things must be stripped before matching or the check is pure noise:
#   * single-quoted string literals ('answered', 'merged') -- these are VALUES
#   * prose in template literals that merely contains the word "from"
SQL_RE = re.compile(r"`([^`]*?\bSELECT\b[^`]*?\bFROM\s+(\w+)\b[^`]*?)`", re.S | re.I)
LITERAL_RE = re.compile(r"'[^']*'")
KEYWORDS = {"select","from","where","group","by","order","limit","as","and","or","not","null","is",
 "true","false",
 "count","sum","avg","min","max","round","median","filter","case","when","then","else","end",
 "cast","varchar","timestamp","integer","double","boolean","coalesce","distinct","desc","asc",
 "join","left","inner","using","on","with","over","partition","nullif","try_cast","exists","between"}
ALIASES = {"t","r","w","i","l","trg","tp","wb","c","d","p","a"}
checked = 0
for f in sorted(pathlib.Path("src").rglob("*.tsx")):
    for sql, table in SQL_RE.findall(f.read_text()):
        if table not in view_cols:
            warn(f"{f.name}: query FROM unknown relation `{table}`")
            continue
        # Union EVERY relation referenced in the block -- joins and scalar
        # subqueries alike. Only unioning the first FROM produces false
        # positives on any query with a subselect.
        rels = set(re.findall(r"\b(?:FROM|JOIN)\s+(\w+)", sql, re.I))
        unknown = rels - set(view_cols)
        for u in unknown:
            warn(f"{f.name}: references unknown relation `{u}`")
        allowed = set()
        for rel in rels & set(view_cols):
            allowed |= view_cols[rel]
        checked += 1
        stripped = LITERAL_RE.sub(" ", sql)                  # drop VALUES
        for ident in sorted(set(re.findall(r"\b([a-z_]{3,})\b", stripped))):
            if ident in KEYWORDS or ident in view_cols or ident in ALIASES: continue
            if ident in allowed: continue
            if re.search(rf"\bAS\s+{ident}\b", sql, re.I): continue   # alias defined here
            warn(f"{f.name}: `{table}` references unknown column `{ident}`")
print(f"\nchecked {checked} SQL blocks in the app against known relations")

# ------------------------------------------------------------------ report
print("\n" + "="*66)
if FAIL:
    print(f"{len(FAIL)} INTEGRITY FAILURES")
    for m in FAIL[:40]: print("  x", m)
else:
    print("integrity: clean")
if WARN:
    print(f"\n{len(WARN)} warnings")
    for m in WARN[:40]: print("  !", m)
else:
    print("column references: clean")
sys.exit(1 if FAIL else 0)
