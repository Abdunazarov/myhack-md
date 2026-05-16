import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { loginAs, jsonAuth, anonJson, parseJson } from "@/test/apiHelpers";
import {
  founderApplicationPayload,
  ideaStageApplicationPayload,
} from "@/test/fixtures";
import { GET as healthGET } from "./health/route";
import { GET as programmesGET } from "./programmes/route";
import { GET as programmeBySlugGET } from "./programmes/[slug]/route";
import { POST as loginPOST } from "./auth/login/route";
import { GET as authMeGET } from "./auth/me/route";
import { GET as demoUsersGET } from "./auth/demo-users/route";
import { GET as applicationsGET, POST as applicationsPOST } from "./applications/route";
import { GET as applicationGET, PATCH as applicationPATCH } from "./applications/[id]/route";
import { POST as auditPOST } from "./applications/[id]/audit/route";
import { GET as founderDashboardGET } from "./founder/dashboard/route";
import { GET as adminDashboardGET } from "./admin/dashboard/route";
import { GET as adminIntakeGET } from "./admin/intake/route";
import { GET as adminIntakeByIdGET } from "./admin/intake/[id]/route";
import { POST as adminDecisionPOST } from "./admin/intake/[id]/decision/route";

describe("Module 1 — Smart Intake & Auto-Routing", () => {
  describe("health & catalog", () => {
    it("GET /api/health returns ok", async () => {
      const res = await healthGET();
      const body = await parseJson<{ status: string; module: string }>(res);
      expect(res.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.module).toBe("smart-intake-auto-routing");
    });

    it("GET /api/programmes returns seeded programmes", async () => {
      const res = await programmesGET();
      const body = await parseJson<{ programmes: { slug: string }[] }>(res);
      expect(res.status).toBe(200);
      expect(body.programmes.length).toBeGreaterThanOrEqual(5);
      expect(body.programmes.map((p) => p.slug)).toContain("cradle-grant");
      expect(body.programmes.map((p) => p.slug)).toContain("mystartup-pre-accelerator");
    });

    it("GET /api/programmes/:slug includes eligibility rules", async () => {
      const res = await programmeBySlugGET(new Request("http://localhost"), {
        params: Promise.resolve({ slug: "cradle-grant" }),
      });
      const body = await parseJson<{ programme: { slug: string; rules: unknown[] } }>(res);
      expect(res.status).toBe(200);
      expect(body.programme.slug).toBe("cradle-grant");
      expect(body.programme.rules.length).toBeGreaterThan(0);
    });
  });

  describe("authentication", () => {
    it("rejects invalid login credentials", async () => {
      const res = await loginPOST(
        anonJson("http://localhost/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: "wrong@test.com", password: "bad" }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it("GET /api/auth/me returns user when token valid", async () => {
      const token = await loginAs("admin@cradle.com");
      const res = await authMeGET(jsonAuth("http://localhost/api/auth/me", token));
      const body = await parseJson<{ user: { role: string; email: string } }>(res);
      expect(res.status).toBe(200);
      expect(body.user.role).toBe("Admin");
      expect(body.user.email).toBe("admin@cradle.com");
    });

    it("GET /api/auth/me returns 401 without token", async () => {
      const res = await authMeGET(new Request("http://localhost/api/auth/me"));
      expect(res.status).toBe(401);
    });

    it("GET /api/auth/demo-users lists four demo roles", async () => {
      const res = await demoUsersGET();
      const body = await parseJson<{ users: unknown[] }>(res);
      expect(res.status).toBe(200);
      expect(body.users).toHaveLength(4);
    });

    it("protected routes reject unauthenticated requests", async () => {
      const res = await applicationsGET(new Request("http://localhost/api/applications"));
      expect(res.status).toBe(401);
    });
  });

  describe("application intake & audit", () => {
    it("founder submits application and receives audit + routing", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await applicationsPOST(
        jsonAuth("http://localhost/api/applications", token, {
          method: "POST",
          body: JSON.stringify(founderApplicationPayload),
        }),
      );
      const body = await parseJson<{
        applicationId: string;
        audit: { readinessScore: number };
        application: { intakeAudits: { readinessScore: number }[] };
      }>(res);

      expect(res.status).toBe(200);
      expect(body.applicationId).toBeTruthy();
      expect(body.audit.readinessScore).toBeGreaterThan(0);
      expect(body.application.intakeAudits[0]?.readinessScore).toBe(body.audit.readinessScore);
    });

    it("rejects founder submit when email does not match account", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await applicationsPOST(
        jsonAuth("http://localhost/api/applications", token, {
          method: "POST",
          body: JSON.stringify({
            ...founderApplicationPayload,
            founderEmail: "other@example.com",
          }),
        }),
      );
      expect(res.status).toBe(403);
    });

    it("idea-stage application routes away from grant (Auto_Routed)", async () => {
      const token = await loginAs("admin@cradle.com");
      const res = await applicationsPOST(
        jsonAuth("http://localhost/api/applications", token, {
          method: "POST",
          body: JSON.stringify(ideaStageApplicationPayload),
        }),
      );
      const body = await parseJson<{
        application: {
          status: string;
          routingDecisions: { decisionType: string; recommendedProgramme: { slug: string } }[];
        };
      }>(res);

      expect(res.status).toBe(200);
      expect(body.application.status).toBe("Routed");
      expect(body.application.routingDecisions[0].decisionType).toBe("Auto_Routed");
      expect(body.application.routingDecisions[0].recommendedProgramme.slug).toBe(
        "mystartup-pre-accelerator",
      );
    });

    it("GET /api/applications/:id returns audit and routing for founder", async () => {
      const token = await loginAs("founder@demo.com");
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { founderEmail: "founder@demo.com" } },
        orderBy: { submittedAt: "desc" },
      });
      expect(app).toBeTruthy();

      const res = await applicationGET(
        jsonAuth(`http://localhost/api/applications/${app!.id}`, token),
        { params: Promise.resolve({ id: app!.id }) },
      );
      const body = await parseJson<{
        audit: { readinessScore: number };
        routing: { decisionType: string };
      }>(res);

      expect(res.status).toBe(200);
      expect(body.audit).toBeTruthy();
      expect(body.routing).toBeTruthy();
    });

    it("PATCH /api/applications/:id?reaudit=true updates and re-runs audit", async () => {
      const token = await loginAs("founder@demo.com");
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { founderEmail: "founder@demo.com" } },
        orderBy: { submittedAt: "desc" },
      });
      expect(app).toBeTruthy();

      const res = await applicationPATCH(
        jsonAuth(
          `http://localhost/api/applications/${app!.id}?reaudit=true`,
          token,
          {
            method: "PATCH",
            body: JSON.stringify({ tractionSummary: "Five paid pilots and 120 SMEs on waitlist now." }),
          },
        ),
        { params: Promise.resolve({ id: app!.id }) },
      );
      const body = await parseJson<{ audit: { readinessScore: number } }>(res);
      expect(res.status).toBe(200);
      expect(body.audit?.readinessScore).toBeGreaterThan(0);
    });

    it("POST /api/applications/:id/audit re-runs audit on demand", async () => {
      const token = await loginAs("admin@cradle.com");
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "PayFlow MY" } },
      });
      expect(app).toBeTruthy();

      const res = await auditPOST(
        jsonAuth(`http://localhost/api/applications/${app!.id}/audit`, token, {
          method: "POST",
        }),
        { params: Promise.resolve({ id: app!.id }) },
      );
      const body = await parseJson<{ audit: { readinessScore: number } }>(res);
      expect(res.status).toBe(200);
      expect(body.audit.readinessScore).toBeGreaterThan(0);
    });

    it("GET /api/founder/dashboard lists founder projects and stats", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await founderDashboardGET(
        jsonAuth("http://localhost/api/founder/dashboard", token),
      );
      const body = await parseJson<{
        projects: { name: string }[];
        stats: { applications: number };
      }>(res);
      expect(res.status).toBe(200);
      expect(body.projects.some((p) => p.name === "GreenRoute")).toBe(true);
      expect(body.stats.applications).toBeGreaterThan(0);
    });
  });

  describe("admin intake pipeline", () => {
    it("GET /api/admin/dashboard returns pipeline metrics", async () => {
      const token = await loginAs("admin@cradle.com");
      const res = await adminDashboardGET(
        jsonAuth("http://localhost/api/admin/dashboard", token),
      );
      const body = await parseJson<{
        totals: { applications: number };
        latestApplications: unknown[];
      }>(res);
      expect(res.status).toBe(200);
      expect(body.totals.applications).toBeGreaterThan(0);
      expect(body.latestApplications.length).toBeGreaterThan(0);
    });

    it("GET /api/admin/intake returns full application list", async () => {
      const token = await loginAs("admin@cradle.com");
      const res = await adminIntakeGET(jsonAuth("http://localhost/api/admin/intake", token));
      const body = await parseJson<{ applications: { ecosystemProject: { name: string } }[] }>(
        res,
      );
      expect(res.status).toBe(200);
      expect(body.applications.some((a) => a.ecosystemProject.name === "PayFlow MY")).toBe(true);
    });

    it("GET /api/admin/intake/:id returns application and programmes for review", async () => {
      const token = await loginAs("admin@cradle.com");
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "PayFlow MY" } },
      });
      expect(app).toBeTruthy();

      const res = await adminIntakeByIdGET(
        jsonAuth(`http://localhost/api/admin/intake/${app!.id}`, token),
        { params: Promise.resolve({ id: app!.id }) },
      );
      const body = await parseJson<{
        application: { id: string };
        programmes: unknown[];
      }>(res);
      expect(res.status).toBe(200);
      expect(body.application.id).toBe(app!.id);
      expect(body.programmes.length).toBeGreaterThan(0);
    });

    it("POST /api/admin/intake/:id/decision confirm_route enrolls project In_Program", async () => {
      const token = await loginAs("admin@cradle.com");
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "HealthSync" } },
        include: { ecosystemProject: true },
      });
      expect(app).toBeTruthy();

      const res = await adminDecisionPOST(
        jsonAuth(`http://localhost/api/admin/intake/${app!.id}/decision`, token, {
          method: "POST",
          body: JSON.stringify({
            decision: "confirm_route",
            adminNote: "Confirmed for programme enrollment",
          }),
        }),
        { params: Promise.resolve({ id: app!.id }) },
      );
      expect(res.status).toBe(200);

      const project = await prisma.ecosystemProject.findUnique({
        where: { id: app!.ecosystemProjectId },
      });
      expect(project?.state).toBe("In_Program");
      const passport = JSON.parse(project?.passportSnapshot ?? "{}") as {
        enrollment?: { programmeSlug?: string };
      };
      expect(passport.enrollment).toBeTruthy();
    });

    it("non-admin cannot access admin dashboard", async () => {
      const token = await loginAs("founder@demo.com");
      const res = await adminDashboardGET(
        jsonAuth("http://localhost/api/admin/dashboard", token),
      );
      expect(res.status).toBe(403);
    });
  });

  describe("seeded demo data integrity", () => {
    it("PayFlow MY is audited with routing decision", async () => {
      const app = await prisma.application.findFirst({
        where: { ecosystemProject: { name: "PayFlow MY" } },
        include: {
          intakeAudits: true,
          routingDecisions: { include: { recommendedProgramme: true } },
        },
      });
      expect(app?.intakeAudits.length).toBeGreaterThan(0);
      expect(app?.routingDecisions.length).toBeGreaterThan(0);
      expect(app?.intakeAudits[0].readinessScore).toBeGreaterThan(50);
    });

    it("GreenRoute is seeded for founder demo (Idea stage)", async () => {
      const project = await prisma.ecosystemProject.findFirst({
        where: { founderEmail: "founder@demo.com", name: "GreenRoute" },
      });
      expect(project).toBeTruthy();
      expect(project?.stage).toBe("Idea");
    });
  });
});
