import { applicationFormSchema, type ApplicationFormData } from "@/lib/validation/applicationSchema";
import { extractPitchDeckText } from "@/server/services/intake/extractPitchDeckText";

export type ParsedApplicationRequest = {
  data: ApplicationFormData | Partial<ApplicationFormData>;
  pitchDeck?: {
    fileName: string;
    mimeType: string;
    text: string;
  };
};

const updateApplicationSchema = applicationFormSchema.partial();

export async function parseApplicationRequest(
  request: Request,
  mode: "create" | "update" = "create",
): Promise<{ ok: true; value: ParsedApplicationRequest } | { ok: false; error: unknown; status: number }> {
  const schema = mode === "create" ? applicationFormSchema : updateApplicationSchema;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const rawJson = form.get("application");
    if (typeof rawJson !== "string") {
      return { ok: false, error: "Missing application JSON field", status: 400 };
    }
    let body: unknown;
    try {
      body = JSON.parse(rawJson);
    } catch {
      return { ok: false, error: "Invalid application JSON", status: 400 };
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.flatten(), status: 400 };
    }

    const file = form.get("pitchDeck");
    if (!file || !(file instanceof File) || file.size === 0) {
      return { ok: true, value: { data: parsed.data } };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "application/pdf";
      const text = await extractPitchDeckText(buffer, mimeType);
      return {
        ok: true,
        value: {
          data: parsed.data,
          pitchDeck: {
            fileName: file.name,
            mimeType,
            text,
          },
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Pitch deck processing failed",
        status: 400,
      };
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Invalid JSON body", status: 400 };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten(), status: 400 };
  }
  return { ok: true, value: { data: parsed.data } };
}
