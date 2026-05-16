import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { env } from "./env";
import { jsonError } from "./api";
import { prisma } from "./db";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(request: Request): Promise<AuthUser | Response> {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError("Authentication required", 401);
  }
  return user;
}

export function requireRoles(user: AuthUser, roles: UserRole[]): Response | null {
  if (!roles.includes(user.role)) {
    return jsonError("Forbidden", 403);
  }
  return null;
}

export async function requireAuthWithRoles(
  request: Request,
  roles: UserRole[],
): Promise<AuthUser | Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const forbidden = requireRoles(auth, roles);
  if (forbidden) return forbidden;
  return auth;
}

export async function applicationBelongsToFounder(
  applicationId: string,
  founderEmail: string,
): Promise<boolean> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { ecosystemProject: true },
  });
  return app?.ecosystemProject.founderEmail.toLowerCase() === founderEmail.toLowerCase();
}
