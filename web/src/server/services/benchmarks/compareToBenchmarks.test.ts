import { describe, expect, it } from "vitest";
import { compareToBenchmarks, detectMissingInformation } from "./compareToBenchmarks";
import { baseApplication } from "../intake/testFixtures";

describe("benchmark comparison", () => {
  it("compares application metrics against matching sector and stage benchmarks", () => {
    const deltas = compareToBenchmarks(baseApplication, [
      {
        id: "b1",
        sector: "Fintech",
        stage: "Revenue",
        metricName: "cac",
        p25: 80,
        median: 120,
        p75: 160,
        successfulCohortCount: 20,
        sourceCohortYear: 2025,
      },
      {
        id: "b2",
        sector: "SaaS",
        stage: "Revenue",
        metricName: "mrr",
        p25: 1000,
        median: 5000,
        p75: 10000,
        successfulCohortCount: 20,
        sourceCohortYear: 2025,
      },
    ]);

    expect(deltas).toHaveLength(1);
    expect(deltas[0]).toMatchObject({
      metricName: "cac",
      status: "above",
      value: 180,
      median: 120,
    });
  });

  it("detects missing information that should be resolved before review", () => {
    const missing = detectMissingInformation({
      ...baseApplication,
      pitchText: "",
      cac: 0,
      runwayMonths: 2,
    });

    expect(missing).toContain("Pitch or deck summary");
    expect(missing).toContain("CAC (customer acquisition cost)");
    expect(missing).toContain("Runway below 3 months; funding plan required");
  });
});
