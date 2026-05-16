import { describe, expect, it } from "vitest";
import { parseFinancialCsv } from "./parseFinancialCsv";

describe("parseFinancialCsv", () => {
  it("parses standard financial model columns from last row", () => {
    const csv = `mrr,burn_monthly,runway_months,cac
5000,20000,8,95
8000,25000,6,130`;

    const result = parseFinancialCsv(csv);
    expect(result.summary.mrr).toBe(8000);
    expect(result.summary.burnMonthly).toBe(25000);
    expect(result.summary.runwayMonths).toBe(6);
    expect(result.summary.cac).toBe(130);
    expect(result.rawRowCount).toBe(2);
  });

  it("throws when header has no recognizable metrics", () => {
    expect(() => parseFinancialCsv("foo,bar\n1,2")).toThrow(/Could not parse metrics/);
  });

  it("throws when only header row present", () => {
    expect(() => parseFinancialCsv("mrr,burn")).toThrow(/header row and at least one data row/);
  });
});
