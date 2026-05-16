import { PDFParse } from "pdf-parse";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export async function extractPitchDeckText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("Pitch deck must be 5 MB or smaller");
  }
  if (mimeType !== "application/pdf") {
    throw new Error("Only PDF pitch decks are supported");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";
    if (!text) {
      throw new Error("Could not extract text from PDF — add a pitch summary in the form");
    }
    return text.slice(0, 50_000);
  } finally {
    await parser.destroy();
  }
}
