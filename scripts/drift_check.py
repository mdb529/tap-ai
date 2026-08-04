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

Run: python3 scripts/drift_check.py   (also part of `npm run check`)
"""

import pathlib
import re
import sys

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

    # Site: name + price string
    site = {}
    for m in re.finditer(r'name: "(\w+)",\s*\n\s*price: "([^"]+)"', tiers_ts):
        name, price = m.group(1), m.group(2)
        site[name] = 0 if price.lower() == "free" else int(re.sub(r"[^\d]", "", price))

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


for fn in (check_pricing, check_tap_classes, check_name, check_values, check_site_isolated):
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
