import bcrypt from "bcryptjs";
import { jsonError, jsonOk, OPTIONS } from "@/lib/api";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export { OPTIONS };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", 400, parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401);
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = await signToken(authUser);

    return jsonOk({
      token,
      user: authUser,
    });
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return jsonError(error instanceof Error ? error.message : "Internal error", 500);
  }
}
