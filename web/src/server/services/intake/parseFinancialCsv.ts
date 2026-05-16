/**
 * Parses a simple financial model CSV (Feature 1.1 input extension).
 * Expects header row with columns like mrr, burn, runway, cac (case-insensitive).
 */
export function parseFinancialCsv(csvText: string): {
  summary: Record<string, number>;
  rawRowCount: number;
} {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("Financial CSV must have a header row and at least one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const lastRow = lines[lines.length - 1].split(",").map((c) => c.trim());

  const summary: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    mrr: ["mrr", "monthly_revenue", "revenue"],
    burnMonthly: ["burn", "burn_monthly", "monthly_burn"],
    runwayMonths: ["runway", "runway_months"],
    cac: ["cac", "customer_acquisition_cost"],
    grossMarginPct: ["gross_margin", "margin", "gross_margin_pct"],
  };

  for (const [key, names] of Object.entries(aliases)) {
    const idx = headers.findIndex((h) => names.includes(h));
    if (idx >= 0) {
      const val = parseFloat(lastRow[idx]?.replace(/[^0-9.-]/g, "") ?? "");
      if (!Number.isNaN(val)) summary[key] = val;
    }
  }

  if (Object.keys(summary).length === 0) {
    throw new Error("Could not parse metrics from CSV — include columns: mrr, burn, runway, or cac");
  }

  return { summary, rawRowCount: lines.length - 1 };
}
