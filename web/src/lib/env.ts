import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  BACKEND_CORS_ORIGIN: z.string().default("*"),
  ENABLE_DEMO_RESET: z.string().default("false"),
  AUTH_SECRET: z.string().min(16).default("linkrouter-hackathon-demo-secret-key"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  BACKEND_CORS_ORIGIN: process.env.BACKEND_CORS_ORIGIN,
  ENABLE_DEMO_RESET: process.env.ENABLE_DEMO_RESET,
  AUTH_SECRET: process.env.AUTH_SECRET,
});

export const isDemoResetEnabled =
  env.ENABLE_DEMO_RESET === "true" || process.env.NODE_ENV !== "production";
