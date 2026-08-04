# Tap AI

**Put your experts' knowledge to work.** The people who understand your business already
know the answers — what counts as revenue, which claims are appealable, when a contract is
evergreen. That knowledge just has no way to reach the systems that depend on it. Tap AI
turns it into one question they can answer in seconds, and hands engineers an explicit
decision to build against.

Three things have to be true at once, and the whole design follows from them:

1. **Lightweight** — a subject-matter expert contributes in five seconds, from a tool they
   already have open. One question, three lines of context, a few buttons. Nothing to
   install, no login, no new vocabulary.
2. **Safe and governed** — non-technical people can change what the business *means*
   without being able to break how it *runs*. Company-level decisions open a pull request
   for your engineers. Every decision is logged with who, when and what changed. SSO
   decides who is allowed to answer. Unanswered privacy questions fail closed.
3. **Drives real change** — the right person is asked at the moment the decision matters,
   rather than shown a chart and left to notice. A dashboard has to be opened by someone
   who already suspects a problem; a tap reaches out, and escalates if ignored.

---

## Two projects, deliberately decoupled

| | `site/` | root (this project) |
|---|---|---|
| What | The public website | The working MVP |
| Dependencies | next, react, react-dom | + DuckDB, yaml |
| Data layer | **None** | DuckDB warehouse, YAML config |
| Output | Static `out/` folder | Next server |
| Deploy | GitHub Pages, Vercel, S3, a USB stick | Local |

The split exists so the website can be shared without the warehouse. A demo that can fail
because a local database was not built is a demo that will fail. The MVP keeps the full
architecture to build on.

```bash
# the website
cd site && npm install && npm run dev     # http://localhost:3100
cd site && npm run build                  # -> site/out/  (static, no server)

# the MVP
npm install && npm run setup && npm run dev   # http://localhost:3000
```

See [`site/README.md`](site/README.md) for the three ways to publish — GitHub Pages via the
included Actions workflow, Vercel, or handing someone a zipped folder.

---

## Run it

Requires Node 20+ and Python 3 (only for regenerating seeds).

```bash
npm install          # must run on your machine -- @duckdb/node-api is a native module
npm run setup        # generate seeds -> build db/tap-ai.duckdb -> export decisions
npm run dev          # http://localhost:3000
```

`npm run setup` is `seeds:build` (Python, writes `seeds/*.csv`) then `db:build`
(Node, loads them into DuckDB). Seeds are committed, so `npm run db:build` alone is
enough if you haven't changed the generator.

If `@duckdb/node-api` fails to resolve, pin it explicitly:
`npm i @duckdb/node-api@latest`. It's specified as `latest` because the package is
still publishing on a fast-moving version line.

**Verify the data** at any time — this does not require DuckDB:

```bash
python3 scripts/verify.py
```

It checks referential integrity, the status/response/write-back contracts, and that every
column the app's SQL references actually exists — parsed out of `db/schema.sql` rather than
hand-listed, because a hand-listed version silently passed a broken page once already.

`npm run verify` runs that plus `scripts/tone_audit.py`, which fails the build on copy that
frames engineers as the problem or reintroduces a removed concept (tap budget, incentive
pool, overage). The messaging position is checked rather than remembered.

---

## What's real and what's faked

### Pages

| Route | Purpose |
|---|---|
| `/` | MVP overview — real activity from the warehouse, with a route into each surface. |
| `/inbox` | Real taps from the warehouse, plus an end-to-end trace of any single one. |
| `/tap-types` | The registry, lint report, and precision gate. |
| `/analytics` | Funnel, per-type decay, routing quality, contributor breadth. |
| `/pricing` | Capability tiers, adoption, and value shown as arithmetic. |
| `/config` | Source connection, SSO, domain ownership, delivery pacing. |
| `/notes` | The design findings and the what-this-proves framing. |

**One nav on every route** — `src/components/shell.tsx`. On a phone it is a horizontally
scrollable strip rather than a wrapping grid or a hamburger, so the current location stays
visible and costs one line. `/billing` redirects to `/pricing`.

The marketing homepage and its components moved to `site/`. The stubs left behind under
`src/components/` and `src/lib/` say where they went and are safe to delete.

### Scenarios (now in `site/src/lib/scenarios.ts`)

Six industries x three tap classes = 18 hand-written scenarios, each carrying content for
all six stages of the flow. `Vertical.scenarios` is a `Record<TapClass, Scenario>`, so the
type system guarantees every industry/class combination resolves.

Triggers are **business events, not file paths**. Six event types can open a tap and only
one of them is a code change:

| Event type | Example |
|---|---|
| logic change | How net patient revenue is calculated changed |
| conflicting definitions | 41 dashboards compute "active customer" three ways |
| new value | A product launched with no revenue category |
| data anomaly | A closed-won deal's ARR dropped $48k overnight |
| record needs judgment | 84 storm claims: wind or flood? |
| unused metric | Something maintained that nobody appears to query |

| Concern | In this MVP | Next step |
|---|---|---|
| Org context (IdP) | `org/*.yml` + `org/employees.csv` read off disk | Okta OIDC — identity and authority claims only |
| Delivery surface | Local webapp at `/inbox`, rendered as Slack/email/assistant | Slack app with Block Kit |
| Source system | Seeded CSVs in DuckDB | dbt platform Discovery + Administrative APIs against the sandbox project |
| Classification | Path-prefix hints in `config/sources.yml` | LLM domain inference, gated on precision |
| Write-back | Simulated PR refs and override tables | Real commits via the GitHub API |

Four trigger sources exist in the design. Three are modeled here; `llm_audit` is
**off on purpose** in `config/sources.yml` — see "precision is the product" below.

---

## Architecture

```
org/                 IdP stand-in. Identity, authority, domain ownership, notification policy.
config/              Admin configuration: source connections, SSO, commercial plan.
tap-types/           The tap type registry. One YAML file per type, plus _SPEC.yml.
seeds/               Simulated activity as CSV. Committed -- this is the demo fixture.
db/schema.sql        Loads seeds into DuckDB and defines the analytical views.
scripts/             Seed generator, database builder, verifier.
src/app/page.tsx     Customer-facing homepage. No database dependency -- a demo that
                     can fail because a local warehouse wasn't built is a demo that will.
src/app/notes/       Internal design notes (the three findings). Off the customer path.
src/app/             The rest of the product surface: inbox, tap types, analytics, billing, config.
src/lib/scenarios.ts       18 curated scenarios, 6 industries x 3 tap classes. Hand-written.
src/lib/decision-ledger.ts The AI-facing decision record format and MCP surface.
src/components/            walkthrough, mobile-surfaces, tap-anatomy, ai-ledger, visuals.
src/lib/             DuckDB access, config loaders, tap type lint, formatters.
```

**Config is code; activity is data.** Everything under `org/`, `config/`, and
`tap-types/` is YAML read directly off disk on every request — edit a file, refresh the
browser, watch routing change. Activity lives in DuckDB and is queried with SQL. That
split isn't an MVP shortcut; it's the intended production shape. Config that lives in git
inherits review, blame, and rollback for free, which is the same argument the product
makes to its own users.

### The spine

```
Trigger  →  Classify  →  Route  →  Tap  →  Write back
```

- **Trigger** — code change, code annotation, behavioral anomaly, or LLM audit.
- **Classify** — infer the business domain touched; estimate blast radius from lineage.
- **Route** — CODEOWNERS first, then `org/domains.yml`. The IdP supplies authority only.
- **Tap** — delivered in the persona-appropriate channel, capped and batched by seniority.
- **Write back** — a pull request for strategic taps; an override table for tactical ones.

### The adapter interface

A source is anything that can satisfy four calls: `discover()`, `diff(a, b)`,
`annotations()`, `write_back()`. That's the entire portability claim, and it's worth
keeping honest — dbt is the first adapter because the semantic layer is where business
intent gets explicit enough to detect disagreement cleanly, not because Tap AI is a dbt
product.

---

## The TapType primitive

A tap type is to a tap what a dbt test definition is to a test failure: a versioned,
declarative spec that generates instances. Making it first-class moves the four hardest
questions out of application code and into config a customer can author and audit:

1. When should we bother a human? → `trigger`
2. Who is allowed to answer this? → `routing.min_authority`
3. What shape is a valid answer? → `question.response`
4. Where does the answer become durable? → `write_back`

It also makes the economics legible. `reward_weight` and `est_minutes_saved` live on the
**type**, not the instance, so the CFO's ROI page is auditable arithmetic rather than a
black box. If a payoff assumption is wrong, you can see it, argue with it, and change it
in one file.

Consequence: **new tap types are configuration, not a release.** See
`tap-types/_SPEC.yml` for the full field reference and the lint rules, which are enforced
in `src/lib/config.ts` and surfaced at `/tap-types`.

---

## Three findings from building this

Each one changed a design decision. They're the reason this repo is worth more than a
clickable mock.

### 1. Write-back has to fork by tap class

The original spine said write-back is "a PR into a Git repo," universally. That doesn't
survive contact with tactical volume. A record-level answer — *this denial is a coding
issue* — is **data**, not a code change. A PR per tactical tap drowns the repo and buries
the strategic taps that genuinely need human review.

So: strategic → pull request, reviewed. Tactical → override table, batched daily, no
review. `phi_column_classification` sits between the two and uses a batched metadata
patch. The lint rules enforce this.

### 2. Most tap types exhaust their own question space

This is the big one, and it has commercial teeth.

`denial_reason_classification` dedupes on `(payer, payer_code)` with a 180-day cooldown.
There are 10 payers and 12 codes, so the type can only ever ask **120 distinct
questions** — and never re-asks within six months. Seven of the eight tap types here are
similarly bounded by a fixed taxonomy. Their volume decays to near zero once the org has
answered them.

That's the product **working**: *every tap densifies the organization's knowledge, so the
system asks fewer dumb questions*. Only `phi_column_classification` sustains volume, and
only because new columns are created continuously by ordinary engineering work.

The commercial consequence: `config/plan.yml` originally assumed 25,000 included resolved
taps per year. Honest steady state for this account is ~200–260/month, or about 2,600/year
— **10x lower**. Worse, metering on a number that structurally decays means revenue falls
as the product succeeds.

> **Resolved: pricing is now capability tiers.** Taps are unlimited on every plan. Price is
> a function of connectors, whether strategic (company-level) taps are included, channels,
> decision-ledger export and AI agent access, and governance features. Charging per tap
> would have put us in the business of sending more of them, and metering a number that
> structurally decays means revenue falls as the product succeeds.
>
> **Also removed: the incentive pool.** Paying people per contribution added real
> administrative weight — eligibility, caps, durability windows, payout cycles — to buy
> something the product should earn on its own: an interaction lighter than the effort of
> ignoring it. If a tap needs a bounty attached, the tap is too much work.
>
> The design corollary is sharper than the pricing one: **a tap type tied to a fixed
> taxonomy is a one-time migration; a tap type tied to ongoing creation is a
> subscription.** Prefer the second kind.

### 3. Routing has a hidden ontology, and deflection is how you pay for it

Okta knows org structure and group membership. It does **not** know who owns "the
canonical revenue definition." Mapping business domain → owner is a real ontology, and
it's the one piece Tap AI can't avoid owning something like.

Three things keep the cost low:

- `org/domains.yml` is small and flat — CODEOWNERS for business meaning, not a semantic graph.
- Where the repo's own CODEOWNERS resolves an owner, prefer it. Ride what exists.
- Make **"not me, ask Dana"** a first-class button. Deflections are the highest-signal
  training data for the ownership map, so the file can start wrong on purpose and converge.

Deflection rate is therefore a feature metric, not an error rate. It's on `/analytics`.

---

## Precision is the product

A good tap saves an hour. A bad tap costs you the channel permanently. Notification
products die of false positives, not of missed true positives — so **precision beats recall
in every design decision here.**

Every tap carries a "was this worth asking?" rating from tap #1. `charge_capture_variance`
is in the registry with `status: paused` and 41% precision as a deliberate worked example:
statistical outliers turned out to be a poor proxy for *a human knows something the
pipeline doesn't*. The ability to kill a tap type in one file is a feature.

Two consequences:

- `llm_audit` triggers are **off**. Generating taps from an LLM audit is the highest-magic,
  lowest-precision path. Test it on paper before building it (below).
- v1 should keep a **human gate** on outbound taps — an analytics engineer approving the
  queue — even though it doesn't scale. Prove the ceiling before automating toward it.

---

## What this MVP does and does not prove

**Does:** loop mechanics. A tap can be routed to the right person, answered in seconds,
and turned into an artifact that lands. Every tap here was generated by a tap type a
human authored, so relevance is *assumed*.

**Does not:** tap quality. Whether a machine can generate questions people find worth
answering is a separate, riskier bet. Bundling the two makes failure unattributable — if
taps are mediocre nobody answers, and you learn nothing about the mechanics.

**Run that as a paper experiment first.** Take a real dbt project, hand-generate 30
candidate taps, show them to 3–5 actual business stakeholders, ask one question per tap:
*would you have wanted to be asked this?* If fewer than ~60% clear the bar, no amount of
routing engineering fixes it. Zero code, one week, highest information per unit effort of
anything on the roadmap.

---

## Roadmap

1. **Paper precision test** (no code) — validate that generated taps clear 60%.
2. **Live dbt adapter** — swap seeded CSVs for the dbt platform Discovery and
   Administrative APIs. Lineage gives real blast radius; manifest diffs give real triggers.
3. **Real Slack delivery** — Block Kit, one question per message, buttons, deflect action.
4. **Real write-back** — GitHub API commits onto the triggering branch.
5. **Okta OIDC** — replace the simulated SSO. Identity and authority claims only.
6. **Resolve the pricing model** — see finding #2.

## Open questions

- What's the honest unit of value to meter, given tap volume decays?
- Does the tap ledger, not the tap, turn out to be the sellable artifact? The audit trail
  ("who decided this, when, and what changed downstream") may be worth more to a
  compliance buyer than the time savings are to a data team.
- Can strategic taps sustain on their own? They're ~4% of volume and most of the modeled
  value. A product that only does strategic taps is much smaller but much more defensible.
- Does the incentive pool actually change behavior, or does it just add administrative
  overhead to something people would do anyway when asked well?
