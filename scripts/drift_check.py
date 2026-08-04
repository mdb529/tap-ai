"""Drift check between the MVP and the site.

The two projects are decoupled on purpose — the site has no data layer so it can
be published anywhere. The cost of that decision is a small number of DUPLICATED
FACTS, and duplicated facts drift silently. This script names them and fails when
they disagree.

What is duplicated, and why it could not be shared:

  * PRICING TIERS. The MVP reads config/plan.yml so an admin can edit it. The site
    cannot: it has no filesystem at runtime and no YAML dependency. So
    site/src/lib/tiers.ts holds a hand-maintained copy.
  * THE PRODUCT NAME. Appears in prose in both projects.
  * TAP CLASSES. The MVP derives them from tap-types/*.yml; the site declares them
    as a union type.
  * END-USER CAPS. The commercial gate that a buyer will quote back at us. Lives in
    plan.yml gates and again in tiers.ts as display strings.
  * TAP FAMILIES and DETECTION MODES. plan.yml gates them per tier;
    site/src/lib/taxonomy.ts defines them and derives per-plan availability.
  * THE ROI MODEL. plan.yml holds `value_assumptions` and `roi_scenarios`; the site
    recomputes every figure from copies in site/src/lib/roi.ts. This is the most
    dangerous duplication on the list -- if these drift, the pricing page shows
    arithmetic that does not match its own stated inputs, which is worse than
    showing no numbers at all.

Run: python3 scripts/drift_check.py   (also part of `npm run check`)
"""

import pathlib
import re
import sys

PLANS = ["starter", "growth", "enterprise"]

FAIL: list[str] = []
NOTE: list[str] = []


def fail(msg: str) -> None:
    FAIL.append(msg)


def read(p: str) -> str:
    return pathlib.Path(p).read_text()


# --------------------------------------------------------------------- pricing
def check_pricing() -> None:
    """Tier names and annual fees must match between plan.yml and tiers.ts."""
    plan = read("config/plan.yml")
    tiers_ts = read("site/src/lib/tiers.ts")

    # MVP: name + annual_fee pairs from the plan_tiers block
    block = plan[plan.index("plan_tiers:") :]
    block = block[: block.index("\n# ")] if "\n# " in block else block
    mvp = dict(
        zip(
            re.findall(r"- name: (\w+)", block),
            [int(x) for x in re.findall(r"annual_fee: (\d+)", block)],
        )
    )

    # Site: name + price, read PER TIER BLOCK rather than by adjacency. The old
    # regex required `price` to be the line after `name`, so inserting any field
    # between them broke the check -- and a pricing check that silently stops
    # matching is worse than no check.
    site = {}
    for block in re.split(r"\n  \{\n", tiers_ts)[1:]:
        nm = re.search(r'name: "(\w+)"', block)
        pr = re.search(r'price: "([^"]+)"', block)
        if nm and pr:
            price = pr.group(1)
            site[nm.group(1)] = (
                0 if price.lower() == "free" else int(re.sub(r"[^\d]", "", price))
            )

    if set(mvp) != set(site):
        fail(
            f"tier NAMES differ\n      plan.yml : {sorted(mvp)}\n      tiers.ts : {sorted(site)}"
        )
        return

    for name in mvp:
        if mvp[name] != site[name]:
            fail(
                f"tier '{name}' PRICE differs — plan.yml ${mvp[name]:,} vs tiers.ts ${site[name]:,}"
            )

    if not FAIL:
        NOTE.append(f"pricing: {len(mvp)} tiers agree ({', '.join(mvp)})")


# ------------------------------------------------------------------ tap classes
def check_tap_classes() -> None:
    """The site's TapClass union must cover every class used by the MVP's specs."""
    mvp = {
        m.group(1)
        for p in pathlib.Path("tap-types").glob("*.yml")
        if p.stem != "_SPEC"
        for m in [re.search(r"^class:\s*(\w+)", p.read_text(), re.M)]
        if m
    }
    site = set(
        re.findall(
            r'"(\w+)"',
            re.search(
                r"export type TapClass = ([^;]+);", read("site/src/lib/scenarios.ts")
            ).group(1),
        )
    )
    missing = mvp - site
    if missing:
        fail(f"tap classes in tap-types/ not present in site TapClass: {sorted(missing)}")
    else:
        NOTE.append(f"tap classes: site covers all {len(mvp)} used by the MVP specs")


# ------------------------------------------------------------------ product name
def check_name() -> None:
    """One spelling. 'TapIQ' was the old name and must not reappear anywhere."""
    stale = []
    for root in ("src", "site/src", "config", "org", "tap-types", "scripts"):
        base = pathlib.Path(root)
        if not base.exists():
            continue
        for f in base.rglob("*"):
            # Skip this file: it names the old spelling in order to look for it.
            if f.name == "drift_check.py":
                continue
            if f.is_file() and f.suffix in {".ts", ".tsx", ".yml", ".py", ".sql", ".md"}:
                if re.search(r"TapIQ|tapiq", f.read_text()):
                    stale.append(str(f))
    for f in ("README.md", "site/README.md"):
        if pathlib.Path(f).exists() and re.search(r"TapIQ|tapiq", read(f)):
            stale.append(f)
    if stale:
        fail(f"old product name still present in: {', '.join(sorted(set(stale))[:6])}")
    else:
        NOTE.append("product name: 'Tap AI' only, no stale 'TapIQ'")


# ----------------------------------------------------------------- three values
def check_values() -> None:
    """The three values are the messaging spine. They should be stated in both the
    site's values component and the root README, or the positioning has drifted."""
    site = read("site/src/components/values.tsx").lower()
    readme = read("README.md").lower()
    for v in ("lightweight", "governed", "active"):
        where = [n for n, t in (("site", site), ("README", readme)) if v not in t]
        if where:
            fail(f"value '{v}' missing from: {', '.join(where)}")
    if not any("value '" in f for f in FAIL):
        NOTE.append("three values: present in both the site and the README")


# ------------------------------------------------------------- site portability
def check_site_isolated() -> None:
    """The site's whole point is that it can be published without the warehouse.
    A stray import would silently reintroduce the dependency."""
    banned = ("duckdb", '"yaml"', "server-only", "node:fs")
    hits = []
    for f in pathlib.Path("site/src").rglob("*.ts*"):
        t = f.read_text()
        for b in banned:
            # only flag real imports, not prose in comments
            if re.search(rf'^\s*import[^\n]*{re.escape(b)}', t, re.M):
                hits.append(f"{f.relative_to('site')} imports {b}")
    if hits:
        fail("site/ is no longer data-free:\n      " + "\n      ".join(hits))
    else:
        NOTE.append("site/: no data layer — still publishable anywhere")


# --------------------------------------------------------------- end-user caps
def check_end_users() -> None:
    """Plan tiers cap how many people may ANSWER taps. The site restates those caps
    as display strings, so compare the integers inside them."""
    plan = yaml_tiers()
    tiers_ts = read("site/src/lib/tiers.ts")

    # Site: the digits in the "End users who can tap" row, per tier block.
    site = {}
    for block in re.split(r'\n  \{\n', tiers_ts)[1:]:
        nm = re.search(r'name: "(\w+)"', block)
        row = re.search(r'endUsers: \{ text: "([^"]+)"', block)
        if nm and row:
            val = row.group(1)
            # "50+, unlimited" states a floor AND no cap. The word wins -- reading
            # the leading digits would report Enterprise as capped at 50.
            digits = re.findall(r"\d+", val)
            site[nm.group(1)] = (
                "unlimited" if "unlimited" in val.lower() else int(digits[0]) if digits else None
            )

    mvp = {t["name"]: t["gates"]["end_users"] for t in plan}
    if not site:
        fail("tiers.ts has no endUsers cell -- the contributor cap is unstated")
        return
    for name, cap in mvp.items():
        want = "unlimited" if cap == "unlimited" else int(cap)
        got = site.get(name)
        if got != want:
            fail(f"end-user cap for '{name}' differs -- plan.yml {want} vs tiers.ts {got}")
    if not any("end-user cap" in f for f in FAIL):
        NOTE.append(
            "end-user caps agree (" + ", ".join(f"{k} {v}" for k, v in mvp.items()) + ")"
        )


# ----------------------------------------------------- families and detection
def check_taxonomy() -> None:
    """plan.yml gates families and detection modes per tier. taxonomy.ts declares
    them and derives availability. The two vocabularies must be identical, and the
    site's cheapest-plan-per-cell must not contradict the tier gates."""
    plan = yaml_tiers()
    tax = read("site/src/lib/taxonomy.ts")

    site_families = set(re.findall(r'\n    id: "(\w+)",\n    label:', tax))
    mvp_families = {f for t in plan for f in t["gates"]["tap_families"]}
    if site_families != mvp_families:
        fail(
            "tap FAMILIES differ\n"
            f"      plan.yml   : {sorted(mvp_families)}\n"
            f"      taxonomy.ts: {sorted(site_families)}"
        )
    else:
        NOTE.append(f"tap families: {len(site_families)} agree ({', '.join(sorted(site_families))})")

    site_modes = set(
        re.findall(
            r'"(\w+)"',
            re.search(r"export type DetectionMode = ([^;]+);", tax).group(1),
        )
    )
    mvp_modes = {m for t in plan for m in t["gates"]["detection_modes"]}
    if site_modes != mvp_modes:
        fail(
            "DETECTION MODES differ\n"
            f"      plan.yml   : {sorted(mvp_modes)}\n"
            f"      taxonomy.ts: {sorted(site_modes)}"
        )
    else:
        NOTE.append(f"detection modes: {len(site_modes)} agree ({', '.join(sorted(site_modes))})")

    # PER-CELL CONSISTENCY. The union comparison above only proves the two files
    # share a vocabulary. It does NOT catch a family dropped from one tier, because
    # the union is unchanged as long as some other tier still lists it. So walk each
    # family block and check every cell against the tier it claims to be in.
    gates = {t["name"].lower(): t["gates"] for t in plan}

    # Split taxonomy.ts into per-family blocks so a cell knows its own family.
    blocks = re.split(r'\n  \{\n    id: "', tax)[1:]
    checked = 0
    for block in blocks:
        fam = block[: block.index('"')]
        for m in re.finditer(
            r'plan: "(\w+)",\s*\n\s*detection: "(\w+)"', block
        ):
            pl, mode = m.group(1), m.group(2)
            checked += 1
            g = gates.get(pl)
            if not g:
                fail(f"taxonomy.ts cell names plan '{pl}', which is not in plan.yml")
                continue
            if mode not in g["detection_modes"]:
                fail(
                    f"taxonomy.ts gates {fam} to '{pl}' with detection '{mode}', "
                    f"but plan.yml gives {pl} only {g['detection_modes']}"
                )
            if fam not in g["tap_families"]:
                fail(
                    f"taxonomy.ts unlocks family '{fam}' at '{pl}', "
                    f"but plan.yml does not list it in {pl}'s tap_families"
                )
            # And every tier ABOVE the unlocking one must also carry the family,
            # or the site shows a cell as included on a plan that does not gate it.
            for higher in PLANS[PLANS.index(pl) + 1 :]:
                hg = gates.get(higher)
                if hg and fam not in hg["tap_families"]:
                    fail(
                        f"family '{fam}' is unlocked at '{pl}' but missing from "
                        f"'{higher}' tap_families -- a higher tier cannot include less"
                    )
    if not any("taxonomy.ts" in f or "tap_families" in f for f in FAIL):
        NOTE.append(f"cell gating: {checked} cells consistent with their tier gates")


# ------------------------------------------------------------------ ROI model
def check_roi() -> None:
    """Every ROI figure on the site is computed from these constants. If they drift
    from plan.yml the page shows arithmetic that contradicts its stated inputs."""
    import yaml

    doc = yaml.safe_load(read("config/plan.yml"))
    va = doc["value_assumptions"]
    roi = read("site/src/lib/roi.ts")

    def num(pattern: str):
        m = re.search(pattern, roi)
        return float(m.group(1)) if m else None

    pairs = [
        ("engineer rate", va["blended_hourly_cost_analytics_engineer"], num(r"engineer: ([\d.]+)")),
        ("stakeholder rate", va["blended_hourly_cost_business_stakeholder"], num(r"stakeholder: ([\d.]+)")),
        ("rework/strategic", va["rework_hours_avoided_per_strategic_decision"], num(r"reworkHoursPerStrategic: ([\d.]+)")),
        ("rework/routine", va["rework_hours_avoided_per_routine_decision"], num(r"reworkHoursPerRoutine: ([\d.]+)")),
        ("incident cost", va["incident_cost_avoided_per_prevented_inconsistency"], num(r"incidentCost: ([\d.]+)")),
        ("attribution haircut", va["attribution_haircut"], num(r"attribution: ([\d.]+)")),
    ]
    for label, want, got in pairs:
        if got is None:
            fail(f"ROI constant '{label}' not found in roi.ts")
        elif abs(float(want) - got) > 1e-9:
            fail(f"ROI '{label}' differs -- plan.yml {want} vs roi.ts {got}")

    # Scenario volumes, keyed by scenario key.
    mvp_sc = {s["key"]: s for s in doc["roi_scenarios"]}
    site_sc = {}
    for block in re.split(r"\n  \{\n", roi)[1:]:
        k = re.search(r'key: "(\w+)"', block)
        if not k:
            continue
        g = lambda pat: (  # noqa: E731
            int(m.group(1).replace("_", "")) if (m := re.search(pat, block)) else None
        )
        site_sc[k.group(1)] = {
            "contributors": g(r"contributors: (\d+)"),
            "strategic_per_year": g(r"strategicPerYear: (\d+)"),
            "routine_per_year": g(r"routinePerYear: (\d+)"),
            "inconsistencies_prevented": g(r"inconsistenciesPrevented: (\d+)"),
            "meeting_hours_avoided": g(r"meetingHoursAvoided: (\d+)"),
        }
    if set(mvp_sc) != set(site_sc):
        fail(f"ROI scenarios differ -- plan.yml {sorted(mvp_sc)} vs roi.ts {sorted(site_sc)}")
    else:
        for key, want in mvp_sc.items():
            for field, got in site_sc[key].items():
                if want[field] != got:
                    fail(f"ROI scenario '{key}.{field}' -- plan.yml {want[field]} vs roi.ts {got}")

    if not any("ROI" in f for f in FAIL):
        NOTE.append(
            f"ROI model: {len(pairs)} assumptions and {len(mvp_sc)} scenarios agree"
        )


def yaml_tiers():
    import yaml

    return yaml.safe_load(read("config/plan.yml"))["plan_tiers"]


for fn in (
    check_pricing,
    check_end_users,
    check_tap_classes,
    check_taxonomy,
    check_roi,
    check_name,
    check_values,
    check_site_isolated,
):
    try:
        fn()
    except Exception as e:  # a parse failure is itself drift worth reporting
        fail(f"{fn.__name__} could not run: {type(e).__name__}: {e}")

print("drift check — MVP vs site")
for n in NOTE:
    print(f"  ok   {n}")
if FAIL:
    print()
    for f in FAIL:
        print(f"  FAIL {f}")
    sys.exit(1)
print("  in sync")
