import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";

export { OPTIONS };

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError("Authentication required", 401);
  }
  return jsonOk({ user });
}
