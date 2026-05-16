import { jsonOk, OPTIONS } from "@/lib/api";

export { OPTIONS };

export async function GET() {
  return jsonOk({
    service: "LinkRouter",
    modules: ["smart-intake-auto-routing", "dynamic-cohort-orchestration"],
    version: "2.0.0",
    documentation: "See web/README.md",
    ui: "Built client in web/client — run npm run dev for API + UI",
    endpoints: {
      health: "GET /api/health",
      authLogin: "POST /api/auth/login",
      authMe: "GET /api/auth/me",
      authDemoUsers: "GET /api/auth/demo-users",
      founderDashboard: "GET /api/founder/dashboard",
      founderRoadblock: "POST /api/founder/roadblock",
      programmes: "GET /api/programmes",
      applications: "GET|POST /api/applications",
      adminDashboard: "GET /api/admin/dashboard",
    },
  });
}
