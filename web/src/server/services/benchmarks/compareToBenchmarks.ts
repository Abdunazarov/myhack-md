import type { BenchmarkProfile } from "@prisma/client";
import type { NormalizedApplication } from "@/lib/validation/applicationSchema";
import type { BenchmarkDelta } from "../intake/intakeTypes";

const METRIC_GETTERS: Record<string, (app: NormalizedApplication) => number> = {
  cac: (a) => a.cac,
  mrr: (a) => a.mrr,
  runway_months: (a) => a.runwayMonths,
  active_users: (a) => a.activeUsers,
  pilots: (a) => a.pilots,
  revenue_growth_pct: (a) => a.revenueGrowthPct,
};

function buildMessage(metricName: string, deltaPct: number, status: BenchmarkDelta["status"]): string {
  const label = metricName.replace(/_/g, " ").toUpperCase();
  if (status === "within") return `${label} is within the historical range of successful alumni.`;
  if (status === "above") {
    return `${label} is ${Math.abs(deltaPct).toFixed(0)}% above the successful alumni median.`;
  }
  return `${label} is ${Math.abs(deltaPct).toFixed(0)}% below the successful alumni median.`;
}

export function compareToBenchmarks(
  app: NormalizedApplication,
  profiles: BenchmarkProfile[],
): BenchmarkDelta[] {
  const relevant = profiles.filter(
    (p) =>
      p.sector.toLowerCase() === app.sector.toLowerCase() &&
      p.stage.toLowerCase() === app.stage.toLowerCase(),
  );

  const deltas: BenchmarkDelta[] = [];

  for (const profile of relevant) {
    const getter = METRIC_GETTERS[profile.metricName];
    if (!getter) continue;

    const value = getter(app);
    if (value <= 0 && profile.metricName !== "pilots") continue;

    const deltaPct = profile.median > 0 ? ((value - profile.median) / profile.median) * 100 : 0;
    let status: BenchmarkDelta["status"] = "within";
    if (value < profile.p25) status = "below";
    else if (value > profile.p75) status = "above";

    deltas.push({
      metricName: profile.metricName,
      value,
      median: profile.median,
      p25: profile.p25,
      p75: profile.p75,
      deltaPct,
      status,
      message: buildMessage(profile.metricName, deltaPct, status),
    });
  }

  return deltas;
}

export function detectMissingInformation(app: NormalizedApplication): string[] {
  const missing: string[] = [];
  if (!app.pitchText || app.pitchText.length < 50) missing.push("Pitch or deck summary");
  if (app.cac === 0) missing.push("CAC (customer acquisition cost)");
  if (app.runwayMonths < 3) missing.push("Runway below 3 months; funding plan required");
  if (app.mrr === 0 && app.stage !== "Idea") missing.push("MRR for post-Idea stage");
  if (app.grossMarginPct === 0) missing.push("Gross margin");
  return missing;
}
