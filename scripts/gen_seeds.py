"""
Generate simulated TapIQ activity data as CSVs under seeds/.

Deterministic (fixed seed) so the demo is stable and diffs are meaningful.

Design intent baked into the numbers -- these are not arbitrary:
  * Volume ramps over 6 months. A real rollout starts with one tap type in one
    department; showing instant 2,000/month would be a tell.
  * charge_capture_variance runs Feb-Mar only, at 41% "worth asking", then goes
    quiet. That is the paused tap type, and the analytics page should be able to
    show you WHY it was paused. Precision is the product.
  * Strategic taps are rare (~4% of volume) but carry most of the modeled value.
  * Answer rate is high but not perfect, deflections are real, and timeouts
    exist -- a demo where every tap gets answered is not a credible demo.
"""
import csv, json, random, pathlib, datetime as dt
from collections import defaultdict

random.seed(20260804)
OUT = pathlib.Path("seeds"); OUT.mkdir(exist_ok=True)
DOM = "northharbor.health"

# --------------------------------------------------------------------------
# people (read the IdP mirror so the two never drift)
# --------------------------------------------------------------------------
emps = list(csv.DictReader(open("org/employees.csv")))
by_email = {e["email"]: e for e in emps}
by_dept = defaultdict(list)
for e in emps:
    by_dept[e["department"]].append(e)
RANK = {"ic":1,"lead":2,"manager":3,"director":4,"vp":5,"cxo":6}

DOMAIN_DEPT = {
    "finance.revenue":"Finance", "finance.claims_ar":"Finance",
    "rcm.coding":"Revenue Cycle", "rcm.denials":"Revenue Cycle",
    "clinical.encounters":"Clinical Operations", "clinical.quality":"Clinical Operations",
    "compliance.phi":"Compliance", "ops.capacity":"Clinical Operations",
    "growth.acquisition":"Growth", "platform.pipelines":"Data Platform",
}
DOMAIN_OWNER = {
    "finance.revenue":"rmarsh", "finance.claims_ar":"tchen",
    "rcm.coding":"jokafor", "rcm.denials":"lbrennan",
    "clinical.encounters":"avoss", "clinical.quality":"sramirez",
    "compliance.phi":"mgrant", "ops.capacity":"kmoreau",
    "growth.acquisition":"nfarrell", "platform.pipelines":"dpalmer",
}

# --------------------------------------------------------------------------
# source objects (counts match config/sources.yml object_counts)
# --------------------------------------------------------------------------
PATHS = [
    ("models/marts/core/",     "finance.revenue",      28),
    ("models/marts/rcm/",      "rcm.denials",          24),
    ("models/marts/clinical/", "clinical.encounters",  22),
    ("models/marts/quality/",  "clinical.quality",     14),
    ("models/input_layer/",    "platform.pipelines",   30),
]
NOUNS = ["claims","encounters","payers","providers","patients","charges","denials",
         "adjustments","appointments","admissions","discharges","procedures",
         "diagnoses","coverage","remittances","authorizations","referrals",
         "service_lines","departments","facilities","census","throughput",
         "measures","numerators","exclusions","cohorts","eligibility","balances",
         "writeoffs","aging"]
objects = []
oid = 0
for prefix, domain, n in PATHS:
    for i in range(n):
        oid += 1
        noun = NOUNS[(oid * 7) % len(NOUNS)]
        pre = "fct" if prefix.startswith("models/marts") else "stg"
        name = f"{pre}_{noun}_{i+1}" if i >= len(NOUNS) else f"{pre}_{noun}"
        dep = random.choice([0,1,1,2,3,3,4,6,8,11,15,19,26,34])
        objects.append({
            "object_id": f"OBJ{oid:04d}", "object_type": "model", "name": name,
            "path": f"{prefix}{name}.sql", "domain_key": domain,
            "dependent_count": dep,
            "exposure_count": max(0, min(dep, random.choice([0,0,1,1,2,3,5]))),
            "has_domain_mapping": "true",
        })
# unmapped stragglers -- matches sources.yml objects_unmapped_to_domain: 7
for i in range(7):
    oid += 1
    objects.append({"object_id": f"OBJ{oid:04d}", "object_type":"model",
        "name": f"stg_legacy_extract_{i+1}", "path": f"models/input_layer/stg_legacy_extract_{i+1}.sql",
        "domain_key":"", "dependent_count": random.randint(0,4), "exposure_count":0,
        "has_domain_mapping":"false"})
METRICS = ["net_patient_revenue","gross_charges","contractual_allowance","days_in_ar",
    "denial_rate","first_pass_yield","clean_claim_rate","cost_to_collect",
    "readmission_rate_30d","ed_left_without_being_seen","avg_length_of_stay",
    "bed_occupancy_rate","hedis_bcs_compliance","hedis_cbp_compliance",
    "cms_sep1_compliance","hcahps_top_box","new_patient_starts","referral_conversion",
    "charge_lag_days","coding_accuracy_rate","write_off_pct","payer_mix_commercial",
    "encounters_per_provider_day","observation_conversion_rate"]
for i, m in enumerate(METRICS):
    oid += 1
    dom = ("finance.revenue" if i < 8 else "clinical.quality" if i < 16
           else "growth.acquisition" if i < 18 else "rcm.coding")
    objects.append({"object_id": f"OBJ{oid:04d}", "object_type":"metric","name":m,
        "path":"models/marts/core/_core_schema.yml","domain_key":dom,
        "dependent_count": random.choice([2,3,4,6,9,12,18,25,31]),
        "exposure_count": random.choice([1,2,3,5,8,11]), "has_domain_mapping":"true"})
SOURCES = ["epic_clarity","epic_caboodle","waystar_claims","availity_remits","press_ganey",
    "kronos_staffing","lawson_gl","salesforce_referrals","twilio_outreach","redox_hl7",
    "labcorp_results","quest_results","surescripts_rx","cms_qpp_feedback"]
for s in SOURCES:
    oid += 1
    objects.append({"object_id": f"OBJ{oid:04d}", "object_type":"source","name":s,
        "path":"models/input_layer/_input_layer_sources.yml","domain_key":"platform.pipelines",
        "dependent_count": random.choice([3,5,7,9,12,16,21]),
        "exposure_count": random.choice([0,1,2,4]), "has_domain_mapping":"true"})

with (OUT/"source_objects.csv").open("w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(objects[0].keys())); w.writeheader(); w.writerows(objects)

by_type = defaultdict(list)
for o in objects: by_type[o["object_type"]].append(o)
by_domain_obj = defaultdict(list)
for o in objects:
    if o["domain_key"]: by_domain_obj[o["domain_key"]].append(o)

print(f"source_objects: {len(objects)} "
      f"(models={len(by_type['model'])}, metrics={len(by_type['metric'])}, sources={len(by_type['source'])})")

# ==========================================================================
# TAP GENERATION
#
# IMPORTANT MODELING DECISION -- read before changing the volume numbers.
#
# Taps are generated against an ENTITY UNIVERSE per tap type, and dedupe is
# enforced with the real cooldown from the tap type spec. That has a
# consequence the original plan did not account for:
#
#   Most tap types are SELF-EXTINGUISHING. denial_reason_classification can
#   only ever ask about (payer x payer_code) = ~120 distinct questions, and
#   never re-asks within 180 days. Once the org has answered them, the type
#   goes quiet. That is the product WORKING -- "every tap densifies the
#   organization's knowledge so the system asks fewer dumb questions" -- but
#   it means tap volume per type DECAYS.
#
#   Net volume grows only because (a) new tap types come online and (b) new
#   entities appear (new columns, new payer policies, new visit codes).
#
# So the simulation deliberately shows per-type decay under net growth. This
# is the single most commercially important thing on the analytics page.
# ==========================================================================

# entity_universe : distinct askable questions that exist at t0
# new_per_month   : genuinely novel entities appearing each month
# cooldown_days   : from the tap type spec -- enforced, not decorative
TT = {
 "denial_reason_classification": dict(cls="tactical", dom="rcm.denials",
    worth=0.88, answer=0.79, defl=0.05, med_min=34, sla=8, wb="override_table",
    reward=0.5, saved=14, auth="ic", universe=120, new_per_month=9, cooldown=180,
    live_from="2026-02", live_to=None),
 "charge_capture_variance": dict(cls="tactical", dom="rcm.coding",
    worth=0.41, answer=0.52, defl=0.11, med_min=210, sla=24, wb="override_table",
    reward=0.4, saved=11, auth="ic", universe=120, new_per_month=40, cooldown=30,
    live_from="2026-02", live_to="2026-03"),
 "encounter_type_mapping": dict(cls="tactical", dom="clinical.encounters",
    worth=0.85, answer=0.74, defl=0.09, med_min=58, sla=12, wb="override_table",
    reward=0.8, saved=26, auth="ic", universe=40, new_per_month=7, cooldown=365,
    live_from="2026-03", live_to=None),
 "phi_column_classification": dict(cls="tactical", dom="compliance.phi",
    worth=0.79, answer=0.71, defl=0.06, med_min=145, sla=24, wb="metadata_patch",
    reward=1.2, saved=34, auth="ic", universe=900, new_per_month=74, cooldown=365,
    live_from="2026-04", live_to=None),
 "revenue_definition_change": dict(cls="strategic", dom="finance.revenue",
    worth=0.97, answer=0.91, defl=0.03, med_min=430, sla=24, wb="pull_request",
    reward=5.0, saved=390, auth="director", universe=24, new_per_month=5, cooldown=30,
    live_from="2026-04", live_to=None),
 "quality_measure_criteria": dict(cls="strategic", dom="clinical.quality",
    worth=0.96, answer=0.88, defl=0.04, med_min=520, sla=48, wb="pull_request",
    reward=5.0, saved=300, auth="director", universe=16, new_per_month=5, cooldown=45,
    live_from="2026-05", live_to=None),
 "source_freshness_ownership": dict(cls="tactical", dom="platform.pipelines",
    worth=0.72, answer=0.68, defl=0.18, med_min=95, sla=6, wb="pull_request",
    reward=1.5, saved=48, auth="lead", universe=14, new_per_month=6, cooldown=60,
    live_from="2026-06", live_to=None),
 "metric_deprecation": dict(cls="strategic", dom=None,
    worth=0.91, answer=0.83, defl=0.10, med_min=640, sla=72, wb="pull_request",
    reward=2.5, saved=95, auth="manager", universe=24, new_per_month=3, cooldown=90,
    live_from="2026-06", live_to=None),
}
ANSWERS = {
 "denial_reason_classification": ["Clinical / medical necessity","Authorization or referral",
    "Eligibility or coverage","Coding or documentation","Timely filing","Not sure -- route to a coder"],
 "encounter_type_mapping": ["Inpatient","Outpatient","Emergency","Observation","Telehealth",
    "Not a real encounter -- exclude","Not sure"],
 "phi_column_classification": ["PHI -- direct identifier","PHI -- indirect / limited data set",
    "De-identified","Not patient data","Not sure -- escalate to privacy"],
 "source_freshness_ownership": ["Yes, my team owns it","No -- belongs to another team",
    "Nobody owns it, it should be retired"],
 "charge_capture_variance": ["Real -- operational change","Real -- fee schedule change",
    "Data problem","Not sure"],
 "metric_deprecation": ["Retire it","Keep it -- still needed","Keep it for now, revisit next quarter"],
 "quality_measure_criteria": ["Correct as written","Incorrect -- exclusion is too broad",
    "Incorrect -- exclusion is too narrow","Need to check the measure specification"],
 "revenue_definition_change": ["Yes, make it canonical","No, revert to the previous definition",
    "Not my call -- needs a finance review meeting"],
}
TRIGGER_SRC = {"denial_reason_classification":"anomaly","encounter_type_mapping":"anomaly",
 "phi_column_classification":"code_change","source_freshness_ownership":"annotation",
 "charge_capture_variance":"anomaly","metric_deprecation":"anomaly",
 "quality_measure_criteria":"code_change","revenue_definition_change":"code_change"}

MONTHS = ["2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08"]
PAYERS = ["Aetna","UnitedHealthcare","BCBS Michigan","Cigna","Humana","Medicare Part A",
          "Medicaid MI","Priority Health","Molina","Tricare"]
CODES  = ["CO-16","CO-97","CO-45","CO-50","PR-1","PR-204","CO-151","CO-197","CO-29","CO-11","OA-23","CO-B7"]
SERVICE_LINES = ["Cardiology","Orthopedics","Oncology","General Surgery","Neurology",
                 "OB/GYN","Emergency","Behavioral Health","Endocrinology","Pulmonology"]
VISIT_LABELS = ["Virtual urgent care","Post-op telephonic follow-up","Infusion suite visit",
    "Nurse-only wound check","Sleep study - attended","Cardiac rehab session",
    "Behavioral telehealth intake","Observation - short stay","Pre-anesthesia evaluation",
    "Mobile mammography","Home health assessment","Group therapy session",
    "Retail clinic visit","Occupational health screen","Palliative consult"]
COL_NAMES = ["mrn_alt","guarantor_dob","subscriber_ssn_last4","home_phone_e164","referring_npi",
    "patient_email_hash","zip_plus_four","member_id_raw","emergency_contact_name","policy_number",
    "device_serial","chart_note_excerpt","insurance_group_id","legal_guardian_name","dob_year_only",
    "geo_lat_rounded","account_alias","prior_auth_number","claim_note_text","employer_name"]
SRC_SYSTEMS = ["epic_clarity","epic_caboodle","waystar_claims","redox_hl7","labcorp_results"]

def month_days(ym):
    y, m = map(int, ym.split("-"))
    nxt = dt.date(y + (m == 12), 1 if m == 12 else m + 1, 1)
    return (nxt - dt.date(y, m, 1)).days

def entity_for(tt_id, i):
    """Stable entity key + rendering context for question templates."""
    if tt_id == "denial_reason_classification":
        p, c = PAYERS[i % len(PAYERS)], CODES[(i // len(PAYERS)) % len(CODES)]
        return f"{p}|{c}", {"payer_name": p, "payer_code": c,
            "claim_id": f"CLM{700000 + i * 37:07d}",
            "claim_amount": f"{random.randint(180, 41000):,}",
            "service_date": (dt.date(2026,1,1) + dt.timedelta(days=random.randint(0,200))).isoformat(),
            "similar_count": random.randint(2, 96)}
    if tt_id == "encounter_type_mapping":
        code = f"VT-{100 + (i * 13) % 900}"
        return code, {"visit_type_code": code, "visit_type_label": VISIT_LABELS[i % len(VISIT_LABELS)],
            "source_system": SRC_SYSTEMS[i % len(SRC_SYSTEMS)],
            "record_count": random.randint(6, 940),
            "first_seen_date": (dt.date(2026,2,1) + dt.timedelta(days=random.randint(0,175))).isoformat()}
    if tt_id == "phi_column_classification":
        col = COL_NAMES[i % len(COL_NAMES)]
        obj = random.choice(by_type["model"])
        return f"{obj['name']}.{col}_{i}", {"column_name": col, "model_name": obj["name"],
            "sample_values": random.choice(["'4871', '9920', '3364'","'(313) 555-0148'",
                "'a3f9…', 'b71c…'","'48226', '48201'","'1993', '1978'","'Kaiser Foods LLC'"]),
            "exposure_count": obj["exposure_count"]}
    if tt_id == "source_freshness_ownership":
        s = SOURCES[i % len(SOURCES)]
        return s, {"source_name": s, "hours_stale": random.randint(7, 61),
            "last_loaded_at": (NOW - dt.timedelta(hours=random.randint(7,61))).isoformat(timespec="minutes"),
            "top_dependent": random.choice(by_type["model"])["name"]}
    if tt_id == "charge_capture_variance":
        sl = SERVICE_LINES[i % len(SERVICE_LINES)]
        base = random.randint(900, 8400)
        return f"{sl}|{i//len(SERVICE_LINES)}", {"service_line": sl,
            "variance_pct": round(random.uniform(-38, 44), 1),
            "encounter_count": random.randint(40, 2300),
            "baseline_amount": f"{base:,}", "current_amount": f"{int(base*random.uniform(0.7,1.4)):,}"}
    if tt_id == "metric_deprecation":
        m = METRICS[i % len(METRICS)]
        return m, {"metric_name": m, "days_idle": random.randint(91, 340),
            "last_queried_date": (dt.date(2026,1,1) - dt.timedelta(days=random.randint(0,120))).isoformat(),
            "last_queried_by": random.choice(emps)["full_name"],
            "top_exposure": random.choice(["Executive Scorecard","Board Pack Q2","Payer Mix Review",
                "Denials War Room","Quality Committee Deck"])}
    if tt_id == "quality_measure_criteria":
        m = [x for x in METRICS if x.startswith(("hedis","cms","readmission","ed_","avg_"))][i % 6]
        return m, {"measure_name": m, "excluded_population": random.choice([
                "patients with hospice enrollment in the measurement year",
                "encounters flagged as observation-only",
                "members with fewer than 11 months of enrollment",
                "patients transferred from another acute facility"]),
            "denominator_delta_pct": round(random.uniform(0.4, 14.2), 1),
            "reporting_body": random.choice(["CMS","NCQA","Michigan HHS"]),
            "reporting_cadence": random.choice(["quarterly","annual"])}
    # revenue_definition_change
    m = METRICS[i % 8]
    return f"{m}|{i//8}", {"metric_name": m, "actor": random.choice(
            [e["full_name"] for e in by_dept["Data Platform"]]),
        "change_summary": random.choice([
            "excludes self-pay accounts from the numerator",
            "moves contractual allowance recognition to the service date",
            "nets out charity care before recognition",
            "switches from posted date to accrual date",
            "includes 340B pharmacy revenue"]),
        "previous_definition_date": (dt.date(2024,1,1) + dt.timedelta(days=random.randint(0,700))).isoformat(),
        "branch": f"feat/{random.choice(['rev-recog','allowance-fix','netting','accrual'])}-{random.randint(100,999)}",
        "top_exposure": random.choice(["Board Pack Q2","Monthly Close Package","Payer Mix Review"])}

RANK = {"ic":1,"lead":2,"manager":3,"director":4,"vp":5,"cxo":6}
NOW = dt.datetime(2026, 8, 4, 9, 30)

def pick_recipient(domain, min_auth, tt_cls):
    dept = DOMAIN_DEPT.get(domain, "Data Platform")
    pool = by_dept.get(dept, emps)
    need = RANK[min_auth]
    if tt_cls == "strategic":
        owner = f"{DOMAIN_OWNER.get(domain,'dpalmer')}@{DOM}"
        if owner in by_email and RANK[by_email[owner]["authority_level"]] >= need:
            return owner, "domains_yml"
        cands = [e for e in pool if RANK[e["authority_level"]] >= need]
        return (random.choice(cands)["email"], "escalation") if cands else (f"dpalmer@{DOM}", "steward")
    cands = [e for e in pool if need <= RANK[e["authority_level"]] <= 3]
    if not cands:
        cands = [e for e in pool if RANK[e["authority_level"]] >= need] or emps
    wts = [4 if RANK[e["authority_level"]] == 1 else 2 if RANK[e["authority_level"]] == 2 else 1 for e in cands]
    e = random.choices(cands, weights=wts, k=1)[0]
    return e["email"], random.choices(["codeowners","domains_yml"], weights=[3,2], k=1)[0]

def channel_for(email):
    return "email" if by_email[email]["authority_level"] in ("vp","cxo") else "slack_dm"

def blast(dep):
    return "high" if dep >= 25 else "medium" if dep >= 10 else "low"

triggers, taps, responses, writebacks, impacts = [], [], [], [], []
tid = wid = rid = bid = mid = tap_no = 0
seen = {}                    # (tap_type, entity_key) -> last asked datetime
ent_cursor = defaultdict(int)

# Explicit per-month tap TARGETS rather than a growth curve.
#
# These are constrained by each type's entity universe and cooldown, and the
# constraint is the point: 7 of the 8 tap types EXHAUST their question space.
#   denial: 10 payers x 12 codes = 120 questions, 180-day cooldown. The targets
#           below sum to 117 over six months -- the type is nearly done asking.
#   encounter / freshness / deprecation / quality / revenue: same shape.
#   phi_column_classification is the ONLY sustained type, because new COLUMNS
#           are created continuously by ordinary engineering work.
#
# That is a finding, not a modeling artifact. A tap type tied to a FIXED
# taxonomy is a one-time migration. A tap type tied to ONGOING CREATION is a
# subscription. Design and price accordingly.
TARGETS = {
 "denial_reason_classification":  {"2026-02":42,"2026-03":28,"2026-04":16,"2026-05":12,"2026-06":10,"2026-07":8,"2026-08":1},
 "charge_capture_variance":       {"2026-02":48,"2026-03":42},
 "encounter_type_mapping":        {"2026-03":18,"2026-04":8,"2026-05":5,"2026-06":4,"2026-07":3,"2026-08":1},
 "phi_column_classification":     {"2026-04":168,"2026-05":172,"2026-06":176,"2026-07":182,"2026-08":22},
 "revenue_definition_change":     {"2026-04":5,"2026-05":6,"2026-06":5,"2026-07":6,"2026-08":1},
 "quality_measure_criteria":      {"2026-05":5,"2026-06":4,"2026-07":5,"2026-08":1},
 "source_freshness_ownership":    {"2026-06":10,"2026-07":6,"2026-08":1},
 "metric_deprecation":            {"2026-06":9,"2026-07":4,"2026-08":1},
}

for ym in MONTHS:
    y, mo = map(int, ym.split("-"))
    nd = 4 if ym == "2026-08" else month_days(ym)
    for tt_id, prof in TT.items():
        target = TARGETS.get(tt_id, {}).get(ym, 0)
        if not target:
            continue
        made = 0
        attempts = 0
        while made < target and attempts < target * 14:
            attempts += 1
            day = random.randint(1, nd)
            hour = random.choices(range(7, 19), weights=[2,5,8,10,10,9,7,9,10,8,5,3], k=1)[0]
            ts = dt.datetime(y, mo, day, hour, random.randint(0, 59))
            if ts > NOW:
                continue
            dom = prof["dom"] or random.choice(["finance.revenue","clinical.quality","rcm.coding","growth.acquisition"])
            pool = by_domain_obj.get(dom) or objects
            obj = random.choice(pool)
            dep = int(obj["dependent_count"])
            # ~40% of triggers re-hit an entity already asked about; dedupe eats them
            if random.random() < 0.40 and ent_cursor[tt_id] > 0:
                idx = random.randrange(ent_cursor[tt_id])
            else:
                idx = ent_cursor[tt_id]; ent_cursor[tt_id] += 1
            ekey, ctx = entity_for(tt_id, idx)
            tid += 1
            last = seen.get((tt_id, ekey))
            if last and (ts - last).days < prof["cooldown"]:
                outcome = "suppressed_dedupe"
            elif random.random() < 0.035:
                outcome = "suppressed_rate_limit"
            elif random.random() < 0.025:
                outcome = "suppressed_low_confidence"
            else:
                outcome = "tap_generated"
            triggers.append({
                "trigger_id": f"TRG{tid:06d}", "triggered_at": ts.isoformat(timespec="seconds"),
                "month": ym, "source_connection_id": "SRC001",
                "trigger_source": TRIGGER_SRC[tt_id], "tap_type_id": tt_id,
                "object_id": obj["object_id"], "object_name": obj["name"], "object_path": obj["path"],
                "entity_key": ekey, "classified_domain": dom,
                "blast_radius": blast(dep), "dependent_count": dep, "outcome": outcome,
            })
            if outcome != "tap_generated":
                continue
            seen[(tt_id, ekey)] = ts
            made += 1
            tap_no += 1
            tap_id = f"TAP{tap_no:06d}"
            recip, via = pick_recipient(dom, prof["auth"], prof["cls"])
            ch = channel_for(recip)
            delivered = ts + dt.timedelta(minutes=random.randint(1,55) if ch == "slack_dm" else random.randint(30,900))
            due = delivered + dt.timedelta(hours=prof["sla"])
            r = random.random()
            if delivered > NOW - dt.timedelta(hours=3):
                status = "pending"
            elif r < prof["defl"]:
                status = "deflected"
            elif r < prof["defl"] + prof["answer"]:
                status = "answered"
            else:
                status = "timed_out" if random.random() < 0.75 else "expired"
            taps.append({
                "tap_id": tap_id, "trigger_id": f"TRG{tid:06d}", "tap_type_id": tt_id,
                "tap_class": prof["cls"], "domain_key": dom, "month": ym,
                "object_id": obj["object_id"], "object_name": obj["name"], "entity_key": ekey,
                "recipient_email": recip, "recipient_name": by_email[recip]["full_name"],
                "recipient_department": by_email[recip]["department"],
                "recipient_authority": by_email[recip]["authority_level"],
                "routed_via": via, "channel": ch,
                "generated_at": ts.isoformat(timespec="seconds"),
                "delivered_at": delivered.isoformat(timespec="seconds"),
                "sla_hours": prof["sla"], "due_at": due.isoformat(timespec="seconds"),
                "blast_radius": blast(dep), "dependent_count": dep, "status": status,
                "context_json": json.dumps(ctx),
            })
            if status not in ("answered","deflected"):
                continue
            rid += 1
            mins = min(int(max(1, random.lognormvariate(0,0.85) * prof["med_min"])), prof["sla"]*60)
            answered_at = delivered + dt.timedelta(minutes=mins)
            rated = random.random() < 0.62
            worth = random.random() < prof["worth"]
            if status == "deflected":
                other = [e for e in by_dept[DOMAIN_DEPT.get(dom,"Data Platform")] if e["email"] != recip] or emps
                answer, defl_to = "", random.choice(other)["email"]
            else:
                answer, defl_to = random.choice(ANSWERS[tt_id]), ""
            unsure = answer.lower().startswith("not sure") or answer.startswith("Need to check")
            quality = round(min(1.0, max(0.15, random.gauss(0.45 if unsure else 0.82, 0.13))), 2)
            durable = status == "answered" and not unsure and random.random() < 0.89
            reversed_at = ""
            if status == "answered" and not durable and random.random() < 0.5:
                reversed_at = (answered_at + dt.timedelta(days=random.randint(3,55))).isoformat(timespec="seconds")
            responses.append({
                "response_id": f"RSP{rid:06d}", "tap_id": tap_id, "tap_type_id": tt_id,
                "tap_class": prof["cls"], "month": ym,
                "responder_email": recip, "responder_name": by_email[recip]["full_name"],
                "responder_department": by_email[recip]["department"],
                "responder_authority": by_email[recip]["authority_level"],
                "responded_at": answered_at.isoformat(timespec="seconds"),
                "minutes_to_respond": mins, "outcome": status, "answer": answer,
                "deflected_to": defl_to,
                "rationale": "see thread" if answer.startswith(("No","Incorrect","Not my call")) else "",
                "quality_score": quality,
                "rated_worth_asking": "" if not rated else ("true" if worth else "false"),
                "durable": "true" if durable else "false", "reversed_at": reversed_at,
            })
            if status != "answered":
                continue
            wid += 1
            tgt = prof["wb"]
            if tgt == "override_table":
                art = "tapiq_overrides." + ("denial_reason_category" if "denial" in tt_id
                       else "visit_type_map" if "encounter" in tt_id else "charge_variance_notes")
                st, reviewer, revdelay = "applied", "", 0
            else:
                art = f"northharbor/dbt-healthcare-analytics#{1200+wid}"
                st = random.choices(["merged","open","closed"], weights=[85,10,5], k=1)[0]
                reviewer = random.choice([e["email"] for e in by_dept["Data Platform"]])
                revdelay = random.randint(20, 2600)
            landed = answered_at + dt.timedelta(minutes=revdelay)
            writebacks.append({
                "writeback_id": f"WBK{wid:06d}", "tap_id": tap_id, "tap_type_id": tt_id,
                "tap_class": prof["cls"], "target": tgt, "artifact_ref": art, "status": st,
                "created_at": answered_at.isoformat(timespec="seconds"),
                "landed_at": landed.isoformat(timespec="seconds") if st in ("merged","applied") else "",
                "reviewer_email": reviewer,
                "batched": "false" if (tgt == "pull_request" and prof["cls"] == "strategic") else "true",
            })
            if st in ("merged","applied") and durable:
                mid += 1
                if prof["cls"] == "strategic":
                    ityp = random.choices(["inconsistency_prevented","incident_avoided",
                        "downstream_models_corrected"], weights=[5,2,3], k=1)[0]
                    mag = max(1, dep)
                else:
                    ityp = random.choices(["rework_avoided","inconsistency_prevented",
                        "downstream_models_corrected"], weights=[7,2,1], k=1)[0]
                    mag = max(1, min(max(dep,1), random.randint(1,6)))
                impacts.append({
                    "impact_id": f"IMP{mid:06d}", "tap_id": tap_id, "tap_type_id": tt_id,
                    "tap_class": prof["cls"], "month": ym, "impact_type": ityp,
                    "magnitude": mag, "observed_at": landed.isoformat(timespec="seconds"),
                    "est_minutes_saved": prof["saved"],
                })

def write(name, rows):
    with (OUT/name).open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    print(f"  {name:<24} {len(rows):>6} rows")

print("\nactivity:")
write("triggers.csv", triggers)
write("taps.csv", taps)
write("tap_responses.csv", responses)
write("write_backs.csv", writebacks)
write("tap_impacts.csv", impacts)

# ---- incentive ledger ----------------------------------------------------
# Only DURABLE answers earn, execs are ineligible, caps enforced per plan.yml.
POINT_VALUE = 12.0
CAP_PERSON_Q = 1500.0
by_person_q = defaultdict(float)
ledger = []
eid = 0
resp_by_tap = {r["tap_id"]: r for r in responses}
tap_by_id = {t["tap_id"]: t for t in taps}
for r in responses:
    if r["outcome"] != "answered" or r["durable"] != "true":
        continue
    prof = TT[r["tap_type_id"]]
    if r["responder_authority"] in ("cxo","vp"):
        continue
    if float(r["quality_score"]) < 0.6:
        continue
    m = r["month"]; q = "FY27-Q1" if m <= "2026-04" else "FY27-Q2" if m <= "2026-07" else "FY27-Q3"
    pts = prof["reward"] * (1.35 if r["tap_class"] == "strategic" else 1.0)
    amt = round(pts * POINT_VALUE, 2)
    k = (r["responder_email"], q)
    if by_person_q[k] + amt > CAP_PERSON_Q:
        amt, status_l = round(max(0.0, CAP_PERSON_Q - by_person_q[k]), 2), "capped"
    else:
        status_l = "paid" if q != "FY27-Q3" else "accrued"
    by_person_q[k] += amt
    eid += 1
    ledger.append({"entry_id": f"INC{eid:06d}", "tap_id": r["tap_id"],
        "employee_email": r["responder_email"], "employee_name": r["responder_name"],
        "department": r["responder_department"], "authority_level": r["responder_authority"],
        "quarter": q, "month": m, "tap_type_id": r["tap_type_id"], "tap_class": r["tap_class"],
        "points": round(pts,2), "amount_usd": amt, "status": status_l})
write("incentive_ledger.csv", ledger)

# ---- billing usage -------------------------------------------------------
# Metered on RESOLVED taps. Delivered-but-ignored taps are never billed, which
# is the whole point: noise costs TapIQ revenue.
INCLUDED_ANNUAL = 3000
monthly_allow = INCLUDED_ANNUAL / 12
rows, cum = [], 0.0
for ym in MONTHS:
    deliv = sum(1 for t in taps if t["month"] == ym)
    resolved = sum(1 for r in responses if r["month"] == ym and r["outcome"] == "answered")
    defl = sum(1 for r in responses if r["month"] == ym and r["outcome"] == "deflected")
    to = sum(1 for t in taps if t["month"] == ym and t["status"] in ("timed_out","expired"))
    supp = sum(1 for t in triggers if t["month"] == ym and t["outcome"] != "tap_generated")
    cum += resolved
    allow_cum = monthly_allow * (MONTHS.index(ym) + 1)
    over = max(0, int(cum - allow_cum)) if cum > allow_cum else 0
    rows.append({"month": ym, "triggers": sum(1 for t in triggers if t["month"] == ym),
        "suppressed": supp, "delivered_taps": deliv, "resolved_taps": resolved,
        "deflected_taps": defl, "unresolved_taps": to,
        "billable_taps": resolved, "cumulative_resolved": int(cum),
        "included_allowance_to_date": int(allow_cum),
        "overage_taps": over, "overage_amount_usd": round(over * 9.00, 2)})
write("billing_usage.csv", rows)

# ---- console summary -----------------------------------------------------
print("\nper-month taps (watch per-type decay under net growth):")
tt_ids = list(TT.keys())
print("  month     " + "".join(f"{t[:11]:>13}" for t in tt_ids) + "    total")
for ym in MONTHS:
    cells = ""
    tot = 0
    for t in tt_ids:
        c = sum(1 for x in taps if x["month"] == ym and x["tap_type_id"] == t)
        tot += c
        cells += f"{(c or '-'):>13}"
    print(f"  {ym}" + cells + f"{tot:>9}")
print(f"\n  total taps {len(taps)}  |  resolved {sum(1 for r in responses if r['outcome']=='answered')}"
      f"  |  incentive $ {sum(l['amount_usd'] for l in ledger):,.0f}")
print("\n  precision (rated 'worth asking') by tap type:")
for t in tt_ids:
    rs = [r for r in responses if r["tap_type_id"] == t and r["rated_worth_asking"]]
    if rs:
        p = sum(1 for r in rs if r["rated_worth_asking"] == "true") / len(rs)
        flag = "  <-- BELOW 60% BAR, PAUSED" if p < 0.6 else ""
        print(f"    {t:<32} {p:5.0%}  (n={len(rs)}){flag}")
