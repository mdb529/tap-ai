import { redirect } from "next/navigation";

/**
 * Moved to /pricing.
 *
 * The old page metered tap consumption against an allowance and tracked an
 * incentive pool. Both are gone: taps are unlimited on every tier, and paying
 * people per contribution bought administrative weight to purchase something the
 * product should earn on its own. Redirecting rather than 404ing because the URL
 * may be in someone's history or a shared link.
 */
export default function BillingRedirect() {
  redirect("/pricing");
}
