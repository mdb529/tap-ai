-- ===========================================================================
-- TapIQ local warehouse
--
-- Split of concerns, deliberately:
--   * CONFIG lives in YAML under org/ and config/ and tap-types/. It is read
--     directly by the app. Config is code -- it belongs in git, reviewable,
--     diffable, and editable by a human without a migration.
--   * ACTIVITY lives here in DuckDB, loaded from seeds/*.csv. Activity is data
--     -- it belongs in a query engine.
--
-- The one exception is org/employees.csv, which is loaded into DuckDB as well
-- so activity can join to people in SQL. It is still authored as a file
-- because that is what the IdP would hand us.
-- ===========================================================================

DROP VIEW  IF EXISTS v_precision_by_type;
DROP VIEW  IF EXISTS v_funnel_by_month;
DROP VIEW  IF EXISTS v_tap_detail;
DROP VIEW  IF EXISTS v_type_decay;
DROP VIEW  IF EXISTS v_roi_by_month;
DROP VIEW  IF EXISTS v_leaderboard;
DROP VIEW  IF EXISTS v_routing_quality;
DROP VIEW  IF EXISTS v_department_mix;

-- Loads are EXPLICITLY TYPED rather than relying on read_csv_auto inference.
-- Reason: columns like rated_worth_asking and landed_at are legitimately empty
-- for some rows. Left to inference DuckDB may read them as VARCHAR, and then
-- `= true` or a timestamp comparison fails at query time instead of load time.
-- Cast once, here, where a failure is obvious.

CREATE OR REPLACE TABLE employees AS
SELECT * REPLACE (CAST(active AS BOOLEAN) AS active)
FROM read_csv_auto('org/employees.csv', header=true, all_varchar=false);

CREATE OR REPLACE TABLE source_objects AS
SELECT * REPLACE (CAST(has_domain_mapping AS BOOLEAN) AS has_domain_mapping)
FROM read_csv_auto('seeds/source_objects.csv', header=true);

CREATE OR REPLACE TABLE triggers AS
SELECT * REPLACE (CAST(triggered_at AS TIMESTAMP) AS triggered_at)
FROM read_csv_auto('seeds/triggers.csv', header=true);

CREATE OR REPLACE TABLE taps AS
SELECT * REPLACE (
    CAST(generated_at AS TIMESTAMP) AS generated_at,
    CAST(delivered_at AS TIMESTAMP) AS delivered_at,
    CAST(due_at        AS TIMESTAMP) AS due_at
)
FROM read_csv_auto('seeds/taps.csv', header=true);

CREATE OR REPLACE TABLE tap_responses AS
SELECT * REPLACE (
    CAST(responded_at AS TIMESTAMP)                     AS responded_at,
    TRY_CAST(NULLIF(reversed_at, '')       AS TIMESTAMP) AS reversed_at,
    TRY_CAST(NULLIF(rated_worth_asking,'') AS BOOLEAN)   AS rated_worth_asking,
    CAST(durable AS BOOLEAN)                             AS durable,
    CAST(minutes_to_respond AS INTEGER)                  AS minutes_to_respond,
    CAST(quality_score AS DOUBLE)                        AS quality_score
)
FROM read_csv_auto('seeds/tap_responses.csv', header=true, all_varchar=true);

CREATE OR REPLACE TABLE write_backs AS
SELECT * REPLACE (
    CAST(created_at AS TIMESTAMP)                  AS created_at,
    TRY_CAST(NULLIF(landed_at,'') AS TIMESTAMP)    AS landed_at,
    CAST(batched AS BOOLEAN)                       AS batched
)
FROM read_csv_auto('seeds/write_backs.csv', header=true, all_varchar=true);

CREATE OR REPLACE TABLE tap_impacts AS
SELECT * REPLACE (CAST(observed_at AS TIMESTAMP) AS observed_at)
FROM read_csv_auto('seeds/tap_impacts.csv', header=true);

CREATE OR REPLACE TABLE incentive_ledger AS
SELECT * FROM read_csv_auto('seeds/incentive_ledger.csv', header=true);

CREATE OR REPLACE TABLE billing_usage AS
SELECT * FROM read_csv_auto('seeds/billing_usage.csv', header=true);

-- ---------------------------------------------------------------------------
-- One row per tap with everything the UI needs. The app should prefer this
-- over re-joining in five different places.
-- ---------------------------------------------------------------------------
CREATE VIEW v_tap_detail AS
SELECT
    t.tap_id, t.tap_type_id, t.tap_class, t.domain_key, t.month,
    t.object_id, t.object_name, t.entity_key,
    t.recipient_email, t.recipient_name, t.recipient_department, t.recipient_authority,
    t.routed_via, t.channel,
    t.generated_at, t.delivered_at, t.due_at, t.sla_hours,
    t.blast_radius, t.dependent_count, t.status, t.context_json,
    r.responded_at, r.minutes_to_respond, r.answer, r.deflected_to, r.rationale,
    r.quality_score, r.rated_worth_asking, r.durable, r.reversed_at,
    w.target       AS writeback_target,
    w.artifact_ref AS writeback_ref,
    w.status       AS writeback_status,
    w.landed_at    AS writeback_landed_at,
    w.reviewer_email,
    i.impact_type, i.magnitude AS impact_magnitude, i.est_minutes_saved,
    CASE WHEN r.responded_at IS NOT NULL AND r.responded_at <= t.due_at THEN true
         WHEN r.responded_at IS NOT NULL THEN false END AS within_sla
FROM taps t
LEFT JOIN tap_responses r USING (tap_id)
LEFT JOIN write_backs   w USING (tap_id)
LEFT JOIN tap_impacts   i USING (tap_id);

-- ---------------------------------------------------------------------------
-- The funnel. Every stage that can silently drop a tap should be visible here,
-- because a tap that vanishes between trigger and delivery is the failure mode
-- nobody notices until an engineer is blocked.
-- ---------------------------------------------------------------------------
CREATE VIEW v_funnel_by_month AS
WITH trg AS (
    SELECT month,
           COUNT(*)                                                       AS triggers_fired,
           COUNT(*) FILTER (WHERE outcome = 'suppressed_dedupe')           AS suppressed_dedupe,
           COUNT(*) FILTER (WHERE outcome = 'suppressed_rate_limit')       AS suppressed_rate_limit,
           COUNT(*) FILTER (WHERE outcome = 'suppressed_low_confidence')   AS suppressed_low_confidence,
           COUNT(*) FILTER (WHERE outcome = 'tap_generated')               AS taps_generated
    FROM triggers GROUP BY month
), tp AS (
    SELECT month,
           COUNT(*)                                          AS taps_delivered,
           COUNT(*) FILTER (WHERE status = 'answered')        AS answered,
           COUNT(*) FILTER (WHERE status = 'deflected')       AS deflected,
           COUNT(*) FILTER (WHERE status = 'timed_out')       AS timed_out,
           COUNT(*) FILTER (WHERE status = 'expired')         AS expired,
           COUNT(*) FILTER (WHERE status = 'pending')         AS pending
    FROM taps GROUP BY month
), wb AS (
    SELECT t.month,
           COUNT(*)                                              AS writebacks,
           COUNT(*) FILTER (WHERE w.status IN ('merged','applied')) AS writebacks_landed
    FROM write_backs w JOIN taps t USING (tap_id) GROUP BY t.month
)
SELECT trg.month, trg.triggers_fired,
       trg.suppressed_dedupe, trg.suppressed_rate_limit, trg.suppressed_low_confidence,
       trg.taps_generated, tp.taps_delivered, tp.answered, tp.deflected,
       tp.timed_out, tp.expired, tp.pending,
       COALESCE(wb.writebacks, 0)        AS writebacks,
       COALESCE(wb.writebacks_landed, 0) AS writebacks_landed,
       ROUND(100.0 * tp.answered / NULLIF(tp.taps_delivered, 0), 1) AS answer_rate_pct
FROM trg LEFT JOIN tp USING (month) LEFT JOIN wb USING (month)
ORDER BY trg.month;

-- ---------------------------------------------------------------------------
-- PRECISION. The metric that decides whether the product lives.
-- A tap type below the 60% bar is burning a channel, not creating value.
-- ---------------------------------------------------------------------------
CREATE VIEW v_precision_by_type AS
SELECT r.tap_type_id, r.tap_class,
       COUNT(*) FILTER (WHERE r.rated_worth_asking IS NOT NULL)                            AS ratings,
       COUNT(*) FILTER (WHERE r.rated_worth_asking = true)                                 AS rated_worth,
       ROUND(100.0 * COUNT(*) FILTER (WHERE r.rated_worth_asking = true)
             / NULLIF(COUNT(*) FILTER (WHERE r.rated_worth_asking IS NOT NULL), 0), 1)     AS precision_pct,
       ROUND(AVG(r.quality_score), 2)                                                      AS avg_quality,
       ROUND(100.0 * COUNT(*) FILTER (WHERE r.durable = true) / COUNT(*), 1)               AS durability_pct,
       ROUND(MEDIAN(r.minutes_to_respond), 0)                                              AS median_minutes,
       CASE WHEN COUNT(*) FILTER (WHERE r.rated_worth_asking IS NOT NULL) < 20 THEN 'low sample'
            WHEN 100.0 * COUNT(*) FILTER (WHERE r.rated_worth_asking = true)
                 / NULLIF(COUNT(*) FILTER (WHERE r.rated_worth_asking IS NOT NULL),0) < 60
            THEN 'below bar' ELSE 'ok' END                                                 AS verdict
FROM tap_responses r
GROUP BY r.tap_type_id, r.tap_class
ORDER BY precision_pct;

-- ---------------------------------------------------------------------------
-- DECAY. Per-type monthly volume. The shape here is the commercial story:
-- types bound to a fixed taxonomy exhaust, while types bound to ongoing creation
-- sustain.
-- ---------------------------------------------------------------------------
CREATE VIEW v_type_decay AS
SELECT tap_type_id, tap_class, month, COUNT(*) AS taps,
       SUM(COUNT(*)) OVER (PARTITION BY tap_type_id ORDER BY month) AS cumulative_taps
FROM taps GROUP BY tap_type_id, tap_class, month ORDER BY tap_type_id, month;

-- ---------------------------------------------------------------------------
-- ROI. Shown as arithmetic, never as a single magic number. A CFO discounts
-- any figure whose derivation is hidden.
-- ---------------------------------------------------------------------------
CREATE VIEW v_roi_by_month AS
SELECT i.month,
       COUNT(*)                                                        AS impacts,
       COUNT(*) FILTER (WHERE i.tap_class = 'strategic')                AS strategic_impacts,
       COUNT(*) FILTER (WHERE i.tap_class = 'tactical')                 AS tactical_impacts,
       SUM(i.est_minutes_saved)                                         AS minutes_saved,
       ROUND(SUM(i.est_minutes_saved) / 60.0, 1)                        AS hours_saved,
       SUM(i.magnitude) FILTER (WHERE i.impact_type = 'inconsistency_prevented') AS inconsistencies_prevented,
       COUNT(*) FILTER (WHERE i.impact_type = 'incident_avoided')       AS incidents_avoided
FROM tap_impacts i GROUP BY i.month ORDER BY i.month;

-- ---------------------------------------------------------------------------
-- ROUTING QUALITY. Deflection rate is the honest measure of whether
-- domains.yml is right. High deflection is not a bug -- it is training data.
-- ---------------------------------------------------------------------------
CREATE VIEW v_routing_quality AS
SELECT t.domain_key, t.routed_via,
       COUNT(*)                                                  AS taps,
       COUNT(*) FILTER (WHERE t.status = 'deflected')             AS deflected,
       ROUND(100.0 * COUNT(*) FILTER (WHERE t.status = 'deflected') / COUNT(*), 1) AS deflection_rate_pct,
       COUNT(*) FILTER (WHERE t.status IN ('timed_out','expired')) AS unresolved,
       ROUND(100.0 * COUNT(*) FILTER (WHERE t.status = 'answered') / COUNT(*), 1)  AS answer_rate_pct
FROM taps t GROUP BY t.domain_key, t.routed_via ORDER BY deflection_rate_pct DESC;

CREATE VIEW v_department_mix AS
SELECT recipient_department AS department, tap_class,
       COUNT(*)                                            AS taps,
       COUNT(*) FILTER (WHERE status = 'answered')          AS answered,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status='answered') / COUNT(*), 1) AS answer_rate_pct,
       COUNT(DISTINCT recipient_email)                      AS people_tapped
FROM taps GROUP BY recipient_department, tap_class ORDER BY taps DESC;

CREATE VIEW v_leaderboard AS
SELECT r.responder_email AS email, r.responder_name AS name,
       r.responder_department AS department, r.responder_authority AS authority,
       COUNT(*)                                             AS taps_resolved,
       COUNT(*) FILTER (WHERE r.tap_class = 'strategic')     AS strategic_resolved,
       ROUND(AVG(r.quality_score), 2)                        AS avg_quality,
       ROUND(100.0 * COUNT(*) FILTER (WHERE r.durable = true) / COUNT(*), 1) AS durability_pct,
       ROUND(MEDIAN(r.minutes_to_respond), 0)                AS median_minutes,
       COALESCE((SELECT SUM(l.amount_usd) FROM incentive_ledger l
                 WHERE l.employee_email = r.responder_email), 0) AS incentive_usd
FROM tap_responses r
WHERE r.outcome = 'answered'
GROUP BY 1,2,3,4 ORDER BY taps_resolved DESC;
