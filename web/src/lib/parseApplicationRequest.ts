import { applicationFormSchema, type ApplicationFormData } from "@/lib/validation/applicationSchema";
import { extractPitchDeckText } from "@/server/services/intake/extractPitchDeckText";
import { parseFinancialCsv } from "@/server/services/intake/parseFinancialCsv";

export type ParsedApplicationRequest = {
  data: ApplicationFormData | Partial<ApplicationFormData>;
  pitchDeck?: {
    fileName: string;
    mimeType: string;
    text: string;
  };
  financialModelSummary?: string;
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

    let pitchDeck: ParsedApplicationRequest["pitchDeck"];
    let financialModelSummary: string | undefined;

    const pitchFile = form.get("pitchDeck");
    if (pitchFile instanceof File && pitchFile.size > 0) {
      try {
        const buffer = Buffer.from(await pitchFile.arrayBuffer());
        const mimeType = pitchFile.type || "application/pdf";
        const text = await extractPitchDeckText(buffer, mimeType);
        pitchDeck = { fileName: pitchFile.name, mimeType, text };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Pitch deck processing failed",
          status: 400,
        };
      }
    }

    const csvFile = form.get("financialModel");
    if (csvFile instanceof File && csvFile.size > 0) {
      try {
        const csvText = await csvFile.text();
        const { summary, rawRowCount } = parseFinancialCsv(csvText);
        financialModelSummary = JSON.stringify({ summary, rawRowCount, fileName: csvFile.name });
        const d = parsed.data as Record<string, unknown>;
        if (summary.mrr != null) d.mrr = summary.mrr;
        if (summary.burnMonthly != null) d.burnMonthly = summary.burnMonthly;
        if (summary.runwayMonths != null) d.runwayMonths = summary.runwayMonths;
        if (summary.cac != null) d.cac = summary.cac;
        if (summary.grossMarginPct != null) d.grossMarginPct = summary.grossMarginPct;
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Financial CSV processing failed",
          status: 400,
        };
      }
    }

    return { ok: true, value: { data: parsed.data, pitchDeck, financialModelSummary } };
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
