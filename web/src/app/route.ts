import { jsonOk, OPTIONS } from "@/lib/api";

export { OPTIONS };

export async function GET() {
  return jsonOk({
    service: "Cradle LinkRouter Backend",
    modules: ["smart-intake-auto-routing", "dynamic-cohort-orchestration"],
    version: "2.0.0",
    documentation: "See web/README.md",
    endpoints: {
      health: "GET /api/health",
      authLogin: "POST /api/auth/login",
      authMe: "GET /api/auth/me",
      authDemoUsers: "GET /api/auth/demo-users",
      founderDashboard: "GET /api/founder/dashboard",
      founderRoadblock: "POST /api/founder/roadblock",
      programmes: "GET /api/programmes",
      programmeBySlug: "GET /api/programmes/:slug",
      applications: "GET|POST /api/applications",
      application: "GET|PATCH /api/applications/:id",
      audit: "POST /api/applications/:id/audit",
      matchingMentors: "GET /api/matching/mentors",
      matchingHistory: "GET /api/matching/history?projectId=",
      mentorDashboard: "GET /api/mentor/dashboard",
      mentorLinkages: "GET /api/mentor/linkages",
      linkage: "GET|PATCH /api/linkages/:id",
      linkageFeedback: "POST /api/linkages/:id/feedback",
      investorDashboard: "GET /api/investor/dashboard",
      adminDashboard: "GET /api/admin/dashboard",
      adminCohortHealth: "GET /api/admin/cohort-health",
      adminMentors: "GET /api/admin/mentors",
      adminRebuildSkills: "POST /api/admin/mentors/rebuild-skills",
      adminIntake: "GET /api/admin/intake",
      adminReview: "GET /api/admin/intake/:id",
      adminDecision: "POST /api/admin/intake/:id/decision",
      demoReset: "POST /api/admin/demo/reset",
    },
  });
}
