/**
 * Full API coverage — runs last (z-prefix). Mutating tests avoid depending on
 * state changed by module1/module2 suites. Demo reset is the final test.
 */
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { loginAs, jsonAuth, anonJson, parseJson } from "@/test/apiHelpers";
import {
  founderApplicationPayload,
  ideaStageApplicationPayload,
  sampleFinancialCsv,
} from "@/test/fixtures";
import { GET as rootGET } from "../route";
import { GET as healthGET } from "./health/route";
import { GET as programmeBySlugGET } from "./programmes/[slug]/route";
import { GET as applicationsGET, POST as applicationsPOST } from "./applications/route";
import { GET as applicationGET } from "./applications/[id]/route";
import { POST as adminDecisionPOST } from "./admin/intake/[id]/decision/route";
import { POST as demoResetPOST } from "./admin/demo/reset/route";
import { GET as cohortHealthGET } from "./admin/cohort-health/route";
import { POST as rebuildSkillsPOST } from "./admin/mentors/rebuild-skills/route";
import { GET as investorDashboardGET } from "./investor/dashboard/route";
import { POST as roadblockPOST } from "./founder/roadblock/route";
import { POST as linkageFeedbackPOST } from "./linkages/[id]/feedback/route";
describe("Full API coverage & reliability", () => {
  describe("API index & health", () => {
    it("GET / returns service metadata and endpoint map", async () => {
      const res = await rootGET();
      const body = await parseJson<{ service: string; endpoints: Record<string, string> }>(res);
      expect(res.status).toBe(200);
      expect(body.service).toContain("Cradle LinkRouter");
      expect(body.endpoints.authLogin).toBeTruthy();
      expect(body.endpoints.founderRoadblock).toBeTruthy();
    });

    it("GET /api/health includes AI configuration flag", async () => {
      const res = await healthGET();
      const body = await parseJson<{ status: string; ai: { configured: boolean } }>(res);
      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(typeof body.ai.configured).toBe("boolean");
    });
  });

  describe("programmes edge cases", () => {
    it("GET /api/programmes/:slug returns 404 for unknown slug", async () => {
      const res = await programmeBySlugGET(new Request("http://localhost"), {
        params: Promise.resolve({ slug: "non-existent-programme" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("applications list & access control", () => {
    it("GET /api/applications as founder returns only own applications", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await applicationsGET(
        jsonAuth("http://localhost/api/applications", token),
      );
      const body = await parseJson<{
        applications: { ecosystemProject: { founderEmail: string; name: string } }[];
      }>(res);
      expect(res.status).toBe(200);
      expect(body.applications.length).toBeGreaterThan(0);
      for (const app of body.applications) {
        expect(app.ecosystemProject.founderEmail.toLowerCase()).toBe("founder@demo.com");
      }
      expect(body.applications.some((a) => a.ecosystemProject.name === "GreenRoute")).toBe(true);
      expect(body.applications.some((a) => a.ecosystemProject.name === "PayFlow MY")).toBe(false);
    });

    it("GET /api/applications as mentor returns in-program and mentor-track apps", async () => {
      const token = await loginAs("mentor@cradle.com");
      const res = await applicationsGET(
        jsonAuth("http://localhost/api/applications", token),
      );
      const body = await parseJson<{ applications: unknown[] }>(res);
      expect(res.status).toBe(200);
      expect(body.applications.length).toBeGreaterThan(0);
    });

    it("GET /api/applications as admin returns all applications", async () => {
      const token = await loginAs("admin@cradle.com");
      const res = await applicationsGET(
        jsonAuth("http://localhost/api/applications", token),
      );
      const body = await parseJson<{ applications: unknown[] }>(res);
      expect(res.status).toBe(200);
      expect(body.applications.length).toBeGreaterThanOrEqual(3);
    });

    it("GET /api/applications/:id returns 403 when founder accesses another founders app", async () => {
      const payflowApp = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "PayFlow MY" } },
      });
      expect(payflowApp).toBeTruthy();

      const token = await loginAs("founder@demo.com");
      const res = await applicationGET(
        jsonAuth(`http://localhost/api/applications/${payflowApp!.id}`, token),
        { params: Promise.resolve({ id: payflowApp!.id }) },
      );
      expect(res.status).toBe(403);
    });

    it("POST /api/applications returns 400 on invalid payload", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await applicationsPOST(
        jsonAuth("http://localhost/api/applications", token, {
          method: "POST",
          body: JSON.stringify({ companyName: "Incomplete" }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await parseJson<{ error: { message: string } }>(res);
      expect(body.error.message).toBe("Validation failed");
    });
  });

  describe("multipart application submit", () => {
    it("POST /api/applications accepts multipart with financial CSV", async () => {
      const token = await loginAs("admin@cradle.com");
      const payload = {
        ...ideaStageApplicationPayload,
        founderEmail: "csv-founder@test.com",
        companyName: "CsvMetrics Co",
      };
      const form = new FormData();
      form.append("application", JSON.stringify(payload));
      form.append(
        "financialModel",
        new File([sampleFinancialCsv], "financials.csv", { type: "text/csv" }),
      );

      const res = await applicationsPOST(
        new Request("http://localhost/api/applications", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }),
      );
      const body = await parseJson<{
        applicationId: string;
        application: { financialModelSummary: string | null };
        audit: { readinessScore: number };
      }>(res);

      expect(res.status).toBe(200);
      expect(body.applicationId).toBeTruthy();
      expect(body.audit.readinessScore).toBeGreaterThan(0);
      expect(body.application.financialModelSummary).toBeTruthy();

      const summary = JSON.parse(body.application.financialModelSummary!) as {
        summary: { mrr: number };
      };
      expect(summary.summary.mrr).toBe(8000);
    });
  });

  describe("admin decision types", () => {
    async function postDecision(
      applicationId: string,
      decision: string,
      extra?: Record<string, unknown>,
    ) {
      const token = await loginAs("admin@cradle.com");
      return adminDecisionPOST(
        jsonAuth(`http://localhost/api/admin/intake/${applicationId}/decision`, token, {
          method: "POST",
          body: JSON.stringify({ decision, adminNote: `Test ${decision}`, ...extra }),
        }),
        { params: Promise.resolve({ id: applicationId }) },
      );
    }

    it("approve_grant sets status Eligible and enrolls project", async () => {
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "PayFlow MY" } },
      });
      expect(app).toBeTruthy();

      const res = await postDecision(app!.id, "approve_grant");
      const body = await parseJson<{
        application: { status: string; ecosystemProject: { state: string } };
      }>(res);
      expect(res.status).toBe(200);
      expect(body.application.status).toBe("Eligible");

      const project = await prisma.ecosystemProject.findUnique({
        where: { id: app!.ecosystemProjectId },
      });
      expect(project?.state).toBe("In_Program");
    });

    it("reject sets status Rejected", async () => {
      const app = await prisma.application.create({
        data: {
          ecosystemProject: {
            create: {
              name: "Reject Test Co",
              sector: "SaaS",
              stage: "MVP",
              country: "Malaysia",
              founderName: "Reject User",
              founderEmail: "reject@test.com",
            },
          },
          targetProgramme: { connect: { slug: "cradle-grant" } },
          status: "Routed",
          normalizedApplication: "{}",
        },
      });

      const res = await postDecision(app.id, "reject");
      const body = await parseJson<{ application: { status: string } }>(res);
      expect(res.status).toBe(200);
      expect(body.application.status).toBe("Rejected");
    });

    it("request_info sets status Needs_Review", async () => {
      const greenApp = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "GreenRoute" } },
      });
      expect(greenApp).toBeTruthy();

      const res = await postDecision(greenApp!.id, "request_info");
      const body = await parseJson<{ application: { status: string } }>(res);
      expect(res.status).toBe(200);
      expect(body.application.status).toBe("Needs_Review");
    });

    it("returns 400 on invalid decision body", async () => {
      const app = await prisma.application.findFirst();
      expect(app).toBeTruthy();
      const token = await loginAs("admin@cradle.com");
      const res = await adminDecisionPOST(
        jsonAuth(`http://localhost/api/admin/intake/${app!.id}/decision`, token, {
          method: "POST",
          body: JSON.stringify({ decision: "invalid_action" }),
        }),
        { params: Promise.resolve({ id: app!.id }) },
      );
      expect(res.status).toBe(400);
    });
  });

  describe("investor dashboard (Module 3 preview)", () => {
    it("GET /api/investor/dashboard returns graduated portfolio with verified passports", async () => {
      const token = await loginAs("investor@cradle.com");
      const res = await investorDashboardGET(
        jsonAuth("http://localhost/api/investor/dashboard", token),
      );
      const body = await parseJson<{
        module: string;
        portfolio: { name: string; verifiedPassport: { cradleVerified?: boolean } }[];
        stats: { graduatedStartups: number };
      }>(res);
      expect(res.status).toBe(200);
      expect(body.module).toBe("verified-handoff");
      expect(body.stats.graduatedStartups).toBeGreaterThanOrEqual(2);
      expect(body.portfolio.some((p) => p.name === "NovaAnalytics")).toBe(true);
      expect(body.portfolio[0].verifiedPassport.cradleVerified).toBe(true);
    });

    it("founder cannot access investor dashboard", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await investorDashboardGET(
        jsonAuth("http://localhost/api/investor/dashboard", token),
      );
      expect(res.status).toBe(403);
    });
  });

  describe("roadblock access control", () => {
    it("POST /api/founder/roadblock returns 403 for another founders project", async () => {
      const payflow = await prisma.ecosystemProject.findFirst({
        where: { name: "PayFlow MY" },
      });
      expect(payflow).toBeTruthy();

      const token = await loginAs("founder@demo.com");
      const res = await roadblockPOST(
        jsonAuth("http://localhost/api/founder/roadblock", token, {
          method: "POST",
          body: JSON.stringify({
            ecosystemProjectId: payflow!.id,
            roadblock:
              "Trying to access another founders project for enterprise B2B sales help with long enough text.",
          }),
        }),
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 when roadblock text is too short", async () => {
      const project = await prisma.ecosystemProject.findFirst({
        where: { founderEmail: "founder@demo.com" },
      });
      const token = await loginAs("founder@demo.com");
      const res = await roadblockPOST(
        jsonAuth("http://localhost/api/founder/roadblock", token, {
          method: "POST",
          body: JSON.stringify({
            ecosystemProjectId: project!.id,
            roadblock: "Too short",
          }),
        }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("linkage health lifecycle", () => {
    it("multiple negative feedback posts can trigger Requires_Intervention", async () => {
      const mentor = await prisma.mentorNode.findFirst();
      const project = await prisma.ecosystemProject.create({
        data: {
          name: "Health Test Startup",
          sector: "SaaS",
          stage: "MVP",
          country: "Malaysia",
          founderName: "Health Test",
          founderEmail: "health-test@test.com",
          state: "In_Program",
        },
      });
      const linkage = await prisma.linkageEntity.create({
        data: {
          ecosystemProjectId: project.id,
          mentorNodeId: mentor!.id,
          goal: "Test linkage health degradation path for cohort intervention triggers.",
          status: "Active",
          healthScore: 55,
          matchScore: 0.7,
          matchExplanation: "Test linkage",
        },
      });

      const token = await loginAs("admin@cradle.com");
      for (let i = 0; i < 3; i++) {
        await linkageFeedbackPOST(
          jsonAuth(`http://localhost/api/linkages/${linkage.id}/feedback`, token, {
            method: "POST",
            body: JSON.stringify({
              note: `Negative sync ${i + 1}: no progress on milestones.`,
              sentiment: "negative",
            }),
          }),
          { params: Promise.resolve({ id: linkage.id }) },
        );
      }

      const updated = await prisma.linkageEntity.findUnique({ where: { id: linkage.id } });
      expect(updated!.healthScore).toBeLessThan(40);
      expect(updated!.status).toBe("Requires_Intervention");
    });
  });

  describe("authorization matrix", () => {
    it("founder cannot access admin cohort-health", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await cohortHealthGET(
        jsonAuth("http://localhost/api/admin/cohort-health", token),
      );
      expect(res.status).toBe(403);
    });

    it("founder cannot rebuild mentor skills", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await rebuildSkillsPOST(
        jsonAuth("http://localhost/api/admin/mentors/rebuild-skills", token, {
          method: "POST",
        }),
      );
      expect(res.status).toBe(403);
    });

    it("mentor cannot access admin dashboard", async () => {
      const token = await loginAs("mentor@cradle.com");
      const { GET: adminDashboardGET } = await import("./admin/dashboard/route");
      const res = await adminDashboardGET(
        jsonAuth("http://localhost/api/admin/dashboard", token),
      );
      expect(res.status).toBe(403);
    });
  });

  describe("audit trail", () => {
    it("creates audit events for application submission and admin decisions", async () => {
      const events = await prisma.auditEvent.findMany({
        where: { entityType: "application" },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      const types = events.map((e) => e.eventType);
      expect(types.some((t) => t.includes("application_submitted") || t.includes("audit"))).toBe(
        true,
      );
      expect(types.some((t) => t.startsWith("admin_"))).toBe(true);
    });
  });

  describe("demo reset (runs last — re-seeds database)", () => {
    it("POST /api/admin/demo/reset re-seeds demo data when enabled", async () => {
      const token = await loginAs("admin@cradle.com");
      const res = await demoResetPOST(
        jsonAuth("http://localhost/api/admin/demo/reset", token, { method: "POST" }),
      );
      const body = await parseJson<{
        success: boolean;
        seeded: { applications: number; programmes: number };
      }>(res);
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.seeded.applications).toBeGreaterThan(0);
      expect(body.seeded.programmes).toBeGreaterThanOrEqual(5);

      const mentors = await prisma.mentorNode.count();
      expect(mentors).toBe(5);
    });

    it("non-admin cannot call demo reset", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await demoResetPOST(
        jsonAuth("http://localhost/api/admin/demo/reset", token, { method: "POST" }),
      );
      expect(res.status).toBe(403);
    });
  });
});
