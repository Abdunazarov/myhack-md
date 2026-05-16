import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { isDemoResetEnabled } from "@/lib/env";

export { OPTIONS };

const DEMO_USERS = [
  {
    role: "Founder",
    email: "founder@demo.com",
    password: "demo123",
    name: "Demo Founder",
    landingPath: "/apply",
  },
  {
    role: "Admin",
    email: "admin@cradle.com",
    password: "demo123",
    name: "Cradle Admin",
    landingPath: "/admin",
  },
  {
    role: "Mentor",
    email: "mentor@cradle.com",
    password: "demo123",
    name: "Demo Mentor",
    landingPath: "/mentor",
  },
  {
    role: "Investor",
    email: "investor@cradle.com",
    password: "demo123",
    name: "Demo Investor",
    landingPath: "/investor",
  },
];

export async function GET() {
  if (!isDemoResetEnabled) {
    return jsonError("Demo users list is disabled", 403);
  }
  return jsonOk({ users: DEMO_USERS });
}
