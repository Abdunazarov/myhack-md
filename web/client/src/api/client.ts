import { formatApiValidationDetails } from "../lib/validateApplication";
import type {
  AdminDashboard,
  ApplicationDetailResponse,
  ApplicationFormData,
  AuthUser,
  CreateApplicationResponse,
  DemoUser,
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
