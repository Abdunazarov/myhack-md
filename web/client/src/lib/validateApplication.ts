import type { ApplicationFormData } from "../api/types";

export type FieldError = { field: string; message: string };

const RULES: Array<{
  field: keyof ApplicationFormData;
  test: (v: ApplicationFormData) => boolean;
  message: string;
}> = [
  { field: "founderName", test: (f) => f.founderName.trim().length >= 2, message: "Founder name (min 2 characters)" },
  {
    field: "founderEmail",
    test: (f) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.founderEmail.trim()),
    message: "Work email must be valid (e.g. founder@demo.com for demo)",
  },
  { field: "companyName", test: (f) => f.companyName.trim().length >= 2, message: "Company name (min 2 characters)" },
  { field: "country", test: (f) => f.country.trim().length >= 2, message: "Country" },
  { field: "sector", test: (f) => f.sector.trim().length >= 2, message: "Sector" },
  { field: "problem", test: (f) => f.problem.trim().length >= 20, message: "Problem description (min 20 characters)" },
  { field: "solution", test: (f) => f.solution.trim().length >= 20, message: "Solution description (min 20 characters)" },
  { field: "targetCustomers", test: (f) => f.targetCustomers.trim().length >= 10, message: "Target customers (min 10 characters)" },
  { field: "tractionSummary", test: (f) => f.tractionSummary.trim().length >= 10, message: "Traction summary (min 10 characters)" },
  { field: "useOfFunds", test: (f) => f.useOfFunds.trim().length >= 20, message: "Use of funds (min 20 characters)" },
];

const STEP_FIELDS: Array<Array<keyof ApplicationFormData>> = [
  ["founderName", "founderEmail", "companyName", "country", "sector"],
  ["problem", "solution", "targetCustomers"],
  ["tractionSummary"],
  ["useOfFunds"],
];

export function validateApplicationForm(form: ApplicationFormData): FieldError[] {
  return RULES.filter((r) => !r.test(form)).map((r) => ({
    field: r.field,
    message: r.message,
  }));
}

export function validateApplicationStep(
  form: ApplicationFormData,
  step: number,
): FieldError[] {
  const fields = STEP_FIELDS[step] ?? [];
  return validateApplicationForm(form).filter((e) =>
    fields.includes(e.field as keyof ApplicationFormData),
  );
}

export function formatFieldErrors(errors: FieldError[]): string {
  if (errors.length === 0) return "Validation failed";
  return errors.map((e) => e.message).join(" · ");
}

/** Zod flatten shape returned by the API in error.details */
export function formatApiValidationDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
  const parts: string[] = [];
  if (d.formErrors?.length) parts.push(...d.formErrors);
  if (d.fieldErrors) {
    for (const [field, msgs] of Object.entries(d.fieldErrors)) {
      const label = field.replace(/([A-Z])/g, " $1").trim();
      parts.push(`${label}: ${msgs.join(", ")}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
