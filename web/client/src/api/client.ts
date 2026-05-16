import { formatApiValidationDetails } from "../lib/validateApplication";
import type {
  AdminDashboard,
  AdminDecision,
  AdminIntakeDetailResponse,
  ApplicationDetailResponse,
  ApplicationFormData,
  ApplicationRecord,
  AuthUser,
  CreateApplicationResponse,
  DemoUser,
  FounderDashboard,
  MentorDashboard,
  Programme,
  RoadblockRequest,
  RoadblockResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ApiErrorBody = {
  error?: { message?: string; details?: unknown };
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: (T & ApiErrorBody) | null = null;
  try {
    body = JSON.parse(text) as T & ApiErrorBody;
  } catch {
    if (!response.ok) {
      throw new Error(
        response.status >= 500
          ? "Server error while submitting — restart the API (npm run dev) and try again."
          : `Request failed (${response.status})`,
      );
    }
    throw new Error("Invalid response from server");
  }
  if (!response.ok) {
    const err = body.error;
    const detailText = formatApiValidationDetails(err?.details);
    const message = detailText ?? err?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

function headers(token?: string | null, extra?: HeadersInit): HeadersInit {
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDemoUsers(): Promise<DemoUser[]> {
  const response = await fetch(`${API_BASE}/api/auth/demo-users`);
  const body = await parseJson<{ users: DemoUser[] }>(response);
  return body.users;
}

export async function login(email: string, password: string): Promise<{
  token: string;
  user: AuthUser;
}> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(response);
}

export async function createApplication(
  token: string,
  data: ApplicationFormData,
): Promise<CreateApplicationResponse> {
  const response = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: headers(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function getApplication(
  token: string,
  applicationId: string,
): Promise<ApplicationDetailResponse> {
  const response = await fetch(`${API_BASE}/api/applications/${applicationId}`, {
    headers: headers(token),
  });
  return parseJson(response);
}

export async function getAdminDashboard(token: string): Promise<AdminDashboard> {
  const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: headers(token),
  });
  return parseJson(response);
}

export async function getMentorDashboard(token: string): Promise<MentorDashboard> {
  const response = await fetch(`${API_BASE}/api/mentor/dashboard`, {
    headers: headers(token),
  });
  return parseJson(response);
}

export async function getFounderDashboard(token: string): Promise<FounderDashboard> {
  const response = await fetch(`${API_BASE}/api/founder/dashboard`, {
    headers: headers(token),
  });
  return parseJson(response);
}

export async function getApplicationsList(token: string): Promise<ApplicationRecord[]> {
  const response = await fetch(`${API_BASE}/api/applications`, {
    headers: headers(token),
  });
  const body = await parseJson<{ applications: ApplicationRecord[] }>(response);
  return body.applications;
}

export async function getAdminIntake(token: string): Promise<ApplicationRecord[]> {
  const response = await fetch(`${API_BASE}/api/admin/intake`, {
    headers: headers(token),
  });
  const body = await parseJson<{ applications: ApplicationRecord[] }>(response);
  return body.applications;
}

export async function getAdminIntakeDetail(
  token: string,
  id: string,
): Promise<AdminIntakeDetailResponse> {
  const response = await fetch(`${API_BASE}/api/admin/intake/${id}`, {
    headers: headers(token),
  });
  return parseJson(response);
}

export async function submitAdminDecision(
  token: string,
  id: string,
  body: AdminDecision,
): Promise<{ success: boolean; application: ApplicationRecord }> {
  const response = await fetch(`${API_BASE}/api/admin/intake/${id}/decision`, {
    method: "POST",
    headers: headers(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return parseJson(response);
}

export async function getProgrammes(): Promise<Programme[]> {
  const response = await fetch(`${API_BASE}/api/programmes`);
  const body = await parseJson<{ programmes: Programme[] }>(response);
  return body.programmes;
}

export async function submitRoadblock(
  token: string,
  body: RoadblockRequest,
): Promise<RoadblockResponse> {
  const response = await fetch(`${API_BASE}/api/founder/roadblock`, {
    method: "POST",
    headers: headers(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return parseJson(response);
}
