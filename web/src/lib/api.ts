import { NextResponse } from "next/server";
import { env } from "./env";

export const corsHeaders = {
  "Access-Control-Allow-Origin": env.BACKEND_CORS_ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export function jsonError(message: string, status = 500, details?: unknown) {
  return jsonOk(
    {
      error: {
        message,
        details,
      },
    },
    { status },
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
