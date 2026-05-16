import { jsonOk, OPTIONS } from "@/lib/api";

export { OPTIONS };

export async function GET() {
  return jsonOk({
    service: "Cradle LinkRouter Backend",
    module: "smart-intake-auto-routing",
    version: "1.0.0",
    documentation: "See web/README.md",
    endpoints: {
      health: "GET /api/health",
      authLogin: "POST /api/auth/login",
      authMe: "GET /api/auth/me",
      authDemoUsers: "GET /api/auth/demo-users",
      programmes: "GET /api/programmes",
      programmeBySlug: "GET /api/programmes/:slug",
      applications: "GET|POST /api/applications (auth required)",
      application: "GET|PATCH /api/applications/:id",
      audit: "POST /api/applications/:id/audit",
      mentorDashboard: "GET /api/mentor/dashboard",
      investorDashboard: "GET /api/investor/dashboard",
      adminDashboard: "GET /api/admin/dashboard",
      adminIntake: "GET /api/admin/intake",
      adminReview: "GET /api/admin/intake/:id",
      adminDecision: "POST /api/admin/intake/:id/decision",
      demoReset: "POST /api/admin/demo/reset",
    },
  });
}
