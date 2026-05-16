import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { loginAs, jsonAuth, parseJson } from "@/test/apiHelpers";
import { GET as mentorsGET } from "./matching/mentors/route";
import { GET as matchingHistoryGET } from "./matching/history/route";
import { POST as roadblockPOST } from "./founder/roadblock/route";
import { GET as mentorDashboardGET } from "./mentor/dashboard/route";
import { GET as mentorLinkagesGET } from "./mentor/linkages/route";
import { GET as cohortHealthGET } from "./admin/cohort-health/route";
import { GET as adminMentorsGET } from "./admin/mentors/route";
import { POST as rebuildSkillsPOST } from "./admin/mentors/rebuild-skills/route";
import { GET as linkageGET, PATCH as linkagePATCH } from "./linkages/[id]/route";
import { POST as linkageFeedbackPOST } from "./linkages/[id]/feedback/route";
import { matchMentorToRoadblock } from "@/server/services/mentor/matchMentor";

describe("Module 2 — Dynamic Cohort Orchestration", () => {
  describe("mentor entities & skill matrices (Feature 2.1)", () => {
    it("seeds five mentors with historical outcomes and skill matrices", async () => {
      const mentors = await prisma.mentorNode.findMany({
        include: { _count: { select: { historicalOutcomes: true } } },
      });
      expect(mentors.length).toBe(5);
      for (const m of mentors) {
        const matrix = JSON.parse(m.dynamicSkillMatrix) as Record<string, number>;
        expect(Object.keys(matrix).length).toBeGreaterThan(0);
        expect(m._count.historicalOutcomes).toBeGreaterThan(0);
      }
    });

    it("GET /api/matching/mentors exposes public skill catalog", async () => {
      const res = await mentorsGET();
      const body = await parseJson<{
        mentors: { name: string; dynamicSkillMatrix: Record<string, number> }[];
      }>(res);
      expect(res.status).toBe(200);
      expect(body.mentors.length).toBe(5);
      expect(body.mentors.some((m) => m.name.includes("Sarah"))).toBe(true);
      const sarah = body.mentors.find((m) => m.name.includes("Sarah"));
      expect(sarah?.dynamicSkillMatrix.B2B_Enterprise ?? 0).toBeGreaterThan(0);
    });

    it("POST /api/admin/mentors/rebuild-skills recomputes all matrices", async () => {
      const token = await loginAs("admin@linkrouter.my");
      const res = await rebuildSkillsPOST(
        jsonAuth("http://localhost/api/admin/mentors/rebuild-skills", token, {
          method: "POST",
        }),
      );
      const body = await parseJson<{ rebuilt: number }>(res);
      expect(res.status).toBe(200);
      expect(body.rebuilt).toBe(5);
    });

    it("GET /api/admin/mentors returns mentor admin view", async () => {
      const token = await loginAs("admin@linkrouter.my");
      const res = await adminMentorsGET(
        jsonAuth("http://localhost/api/admin/mentors", token),
      );
      const body = await parseJson<{ mentors: { historicalOutcomes: number }[] }>(res);
      expect(res.status).toBe(200);
      expect(body.mentors.length).toBe(5);
    });
  });

  describe("autonomous matching (Feature 2.2)", () => {
    it("matchMentorToRoadblock ranks B2B enterprise mentor for enterprise sales roadblock", async () => {
      const match = await matchMentorToRoadblock({
        roadblock:
          "We need help closing enterprise B2B pilots with large fleet operators and shortening our sales cycle.",
        sector: "Fintech",
        stage: "Revenue",
      });
      expect(match.matchScore).toBeGreaterThan(0.5);
      expect(match.explanation).toMatch(/Matched|B2B|Enterprise/i);
      expect(match.mentor.name).toContain("Sarah");
    });

    it("POST /api/founder/roadblock creates LinkageEntity and RoadblockRequest", async () => {
      const token = await loginAs("founder@demo.com");
      const project = await prisma.ecosystemProject.findFirst({
        where: { founderEmail: "founder@demo.com", name: "GreenRoute" },
      });
      expect(project).toBeTruthy();

      const res = await roadblockPOST(
        jsonAuth("http://localhost/api/founder/roadblock", token, {
          method: "POST",
          body: JSON.stringify({
            ecosystemProjectId: project!.id,
            roadblock:
              "We need enterprise fleet operators to pilot our emissions tracking — struggling with B2B sales pipeline.",
            problemCategory: "B2B_Enterprise",
          }),
        }),
      );
      const body = await parseJson<{
        linkage: { id: string; mentorNodeId: string; status: string };
        match: { matchScore: number; explanation: string; mentor: { name: string } };
        request: { id: string; status: string };
      }>(res);

      expect(res.status).toBe(200);
      expect(body.linkage.status).toBe("Active");
      expect(body.match.matchScore).toBeGreaterThan(0);
      expect(body.match.explanation.length).toBeGreaterThan(20);
      expect(body.request.status).toBe("matched");

      const stored = await prisma.linkageEntity.findUnique({
        where: { id: body.linkage.id },
      });
      expect(stored?.matchExplanation).toBe(body.match.explanation);
    });

    it("GET /api/matching/history returns requests and linkages for project", async () => {
      const token = await loginAs("founder@demo.com");
      const project = await prisma.ecosystemProject.findFirst({
        where: { founderEmail: "founder@demo.com" },
      });
      expect(project).toBeTruthy();

      const res = await matchingHistoryGET(
        jsonAuth(
          `http://localhost/api/matching/history?projectId=${project!.id}`,
          token,
        ),
      );
      const body = await parseJson<{ linkages: unknown[]; requests: unknown[] }>(res);
      expect(res.status).toBe(200);
      expect(body.linkages.length).toBeGreaterThan(0);
    });

    it("mentor@linkrouter.my is linked to Dr. Sarah Chen profile", async () => {
      const user = await prisma.user.findUnique({
        where: { email: "mentor@linkrouter.my" },
        include: { mentorNode: true },
      });
      expect(user?.mentorNode?.name).toContain("Sarah");
    });
  });

  describe("seeded linkage integrity", () => {
    it("PayFlow has active linkage with explainable match", async () => {
      const linkages = await prisma.linkageEntity.findMany({
        where: { ecosystemProject: { name: "PayFlow MY" } },
        include: { mentor: true },
      });
      expect(linkages.some((l) => l.status === "Active")).toBe(true);
      expect(linkages[0].matchExplanation).toBeTruthy();
    });

    it("GreenRoute has Requires_Intervention linkage for admin demo", async () => {
      const linkage = await prisma.linkageEntity.findFirst({
        where: {
          ecosystemProject: { name: "GreenRoute" },
          status: "Requires_Intervention",
        },
      });
      expect(linkage).toBeTruthy();
      expect(linkage!.healthScore).toBeLessThan(50);
    });
  });

  describe("mentor operations", () => {
    it("GET /api/mentor/dashboard shows live assigned startups", async () => {
      const token = await loginAs("mentor@linkrouter.my");
      const res = await mentorDashboardGET(
        jsonAuth("http://localhost/api/mentor/dashboard", token),
      );
      const body = await parseJson<{
        status: string;
        stats: { assignedStartups: number };
        assignedStartups: { name: string }[];
        mentor: { dynamicSkillMatrix: Record<string, number> };
      }>(res);

      expect(res.status).toBe(200);
      expect(body.status).toBe("live");
      expect(body.stats.assignedStartups).toBeGreaterThan(0);
      expect(body.assignedStartups.some((s) => s.name === "PayFlow MY")).toBe(true);
      expect(body.mentor.dynamicSkillMatrix.B2B_Enterprise).toBeGreaterThan(0);
    });

    it("GET /api/mentor/linkages returns mentor linkage list", async () => {
      const token = await loginAs("mentor@linkrouter.my");
      const res = await mentorLinkagesGET(
        jsonAuth("http://localhost/api/mentor/linkages", token),
      );
      const body = await parseJson<{ linkages: { ecosystemProject: { name: string } }[] }>(res);
      expect(res.status).toBe(200);
      expect(body.linkages.length).toBeGreaterThan(0);
    });
  });

  describe("cohort health & linkage lifecycle (Feature 2.3)", () => {
    it("GET /api/admin/cohort-health returns intervention queue and alerts", async () => {
      const token = await loginAs("admin@linkrouter.my");
      const res = await cohortHealthGET(
        jsonAuth("http://localhost/api/admin/cohort-health", token),
      );
      const body = await parseJson<{
        totals: { activeLinkages: number; requiresIntervention: number };
        interventionQueue: { startup: string }[];
        alerts: { type: string }[];
      }>(res);

      expect(res.status).toBe(200);
      expect(body.totals.activeLinkages).toBeGreaterThan(0);
      expect(body.totals.requiresIntervention).toBeGreaterThan(0);
      expect(
        body.interventionQueue.some((q) => q.startup === "GreenRoute") ||
          body.alerts.length > 0,
      ).toBe(true);
    });

    it("POST /api/linkages/:id/feedback lowers health on negative sentiment", async () => {
      const linkage = await prisma.linkageEntity.findFirst({
        where: { status: "Active", ecosystemProject: { name: "PayFlow MY" } },
      });
      expect(linkage).toBeTruthy();
      const before = linkage!.healthScore;

      const token = await loginAs("mentor@linkrouter.my");
      const res = await linkageFeedbackPOST(
        jsonAuth(`http://localhost/api/linkages/${linkage!.id}/feedback`, token, {
          method: "POST",
          body: JSON.stringify({
            note: "Founder missed second sync — no progress on enterprise pipeline.",
            sentiment: "negative",
          }),
        }),
        { params: Promise.resolve({ id: linkage!.id }) },
      );
      const body = await parseJson<{ linkage: { healthScore: number; feedbackLogs: string } }>(
        res,
      );
      expect(res.status).toBe(200);
      expect(body.linkage.healthScore).toBeLessThan(before);

      const logs = JSON.parse(body.linkage.feedbackLogs) as unknown[];
      expect(logs.length).toBeGreaterThan(0);
    });

    it("PATCH /api/linkages/:id allows admin to resolve intervention", async () => {
      const linkage = await prisma.linkageEntity.findFirst({
        where: { status: "Requires_Intervention" },
      });
      expect(linkage).toBeTruthy();

      const token = await loginAs("admin@linkrouter.my");
      const res = await linkagePATCH(
        jsonAuth(`http://localhost/api/linkages/${linkage!.id}`, token, {
          method: "PATCH",
          body: JSON.stringify({ status: "Active", healthScore: 75 }),
        }),
        { params: Promise.resolve({ id: linkage!.id }) },
      );
      const body = await parseJson<{ linkage: { status: string; healthScore: number } }>(res);
      expect(res.status).toBe(200);
      expect(body.linkage.status).toBe("Active");
      expect(body.linkage.healthScore).toBe(75);
    });

    it("GET /api/linkages/:id returns linkage detail", async () => {
      const linkage = await prisma.linkageEntity.findFirst({
        include: { mentor: true, ecosystemProject: true },
      });
      expect(linkage).toBeTruthy();

      const res = await linkageGET(new Request(`http://localhost/api/linkages/${linkage!.id}`), {
        params: Promise.resolve({ id: linkage!.id }),
      });
      const body = await parseJson<{ linkage: { id: string; matchExplanation: string | null } }>(
        res,
      );
      expect(res.status).toBe(200);
      expect(body.linkage.id).toBe(linkage!.id);
    });
  });

});
