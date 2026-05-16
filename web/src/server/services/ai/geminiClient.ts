import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

export function getGeminiModel() {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
}
