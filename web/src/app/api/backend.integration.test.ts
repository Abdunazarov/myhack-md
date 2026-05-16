import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma as appPrisma } from "@/lib/db";
import { seedDatabase, prisma as seedPrisma } from "../../../prisma/seed";
import { GET as healthGET } from "./health/route";
import { GET as programmesGET } from "./programmes/route";
import { POST as applicationsPOST } from "./applications/route";
import { GET as dashboardGET } from "./admin/dashboard/route";
import { POST as loginPOST } from "./auth/login/route";
import { GET as demoUsersGET } from "./auth/demo-users/route";
import { GET as mentorDashboardGET } from "./mentor/dashboard/route";
import { GET as investorDashboardGET } from "./investor/dashboard/route";

const validApplication = {
  founderName: "Maya Tan",
  founderEmail: "founder@demo.com",
  companyName: "LedgerPilot",
  country: "Malaysia",
  sector: "SaaS",
  stage: "MVP",
  incorporated: true,
  companyAgeMonths: 10,
  problem: "SMEs lose hours every week reconciling invoices and payments manually.",
  solution: "An AI-assisted finance workspace that reconciles invoices, bank feeds, and reminders.",
  targetCustomers: "Malaysia-based SMEs with recurring B2B invoices.",
  tractionSummary: "Three paid pilots and a waitlist of 80 SMEs.",
  mrr: 8000,
  activeUsers: 200,
  pilots: 3,
  revenueGrowthPct: 18,
  cac: 130,
  burnMonthly: 25000,
  runwayMonths: 6,
  grossMarginPct: 70,
  fundingAsk: 250000,
  useOfFunds: "Hire two engineers and expand sales to Klang Valley SMEs.",
  pitchText: "LedgerPilot automates invoice reconciliation for Malaysian SMEs.",
};

async function loginAs(email: string, password = "demo123") {
  const response = await loginPOST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
  const body = await response.json();
  expect(response.status).toBe(200);
  return body.token as string;
}

function authRequest(url: string, token: string, init?: RequestInit) {
  return new Request(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

describe("backend API routes", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await appPrisma.$disconnect();
    await seedPrisma.$disconnect();
  });

  it("reports backend health and AI configuration state", async () => {
    const response = await healthGET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.module).toBe("smart-intake-auto-routing");
  });

  it("returns seeded programmes", async () => {
    const response = await programmesGET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.programmes.length).toBeGreaterThanOrEqual(5);
    expect(body.programmes.some((p: { slug: string }) => p.slug === "cradle-grant")).toBe(true);
  });

  it("lists demo users for hackathon login screen", async () => {
    const response = await demoUsersGET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(4);
  });

  it("creates and audits an application end-to-end as founder", async () => {
    const token = await loginAs("founder@demo.com");
    const request = authRequest("http://localhost/api/applications", token, {
      method: "POST",
      body: JSON.stringify(validApplication),
    });

    const response = await applicationsPOST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.applicationId).toBeTruthy();
    expect(body.audit.readinessScore).toBeGreaterThan(60);
    expect(body.application.routingDecisions[0]).toBeTruthy();
  });

  it("returns admin dashboard metrics for admin role", async () => {
    const token = await loginAs("admin@cradle.com");
    const response = await dashboardGET(
      authRequest("http://localhost/api/admin/dashboard", token),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totals.applications).toBeGreaterThan(0);
    expect(Array.isArray(body.latestApplications)).toBe(true);
  });

  it("returns mentor dashboard preview", async () => {
    const token = await loginAs("mentor@cradle.com");
    const response = await mentorDashboardGET(
      authRequest("http://localhost/api/mentor/dashboard", token),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.module).toBe("dynamic-cohort-orchestration");
    expect(body.assignedStartups.length).toBeGreaterThan(0);
  });

  it("returns investor dashboard with graduated startups", async () => {
    const token = await loginAs("investor@cradle.com");
    const response = await investorDashboardGET(
      authRequest("http://localhost/api/investor/dashboard", token),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.portfolio.length).toBeGreaterThanOrEqual(2);
  });
});
