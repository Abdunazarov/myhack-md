import { expect } from "vitest";
import { POST as loginPOST } from "@/app/api/auth/login/route";

export async function loginAs(email: string, password = "demo123"): Promise<string> {
  const response = await loginPOST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.token).toBeTruthy();
  return body.token as string;
}

export function jsonAuth(url: string, token: string, init?: RequestInit): Request {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Request(url, { ...init, headers });
}

export function anonJson(url: string, init?: RequestInit): Request {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Request(url, { ...init, headers });
}

export async function parseJson<T = Record<string, unknown>>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
