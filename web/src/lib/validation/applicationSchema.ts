import { z } from "zod";

export const applicationFormSchema = z.object({
  founderName: z.string().min(2, "Founder name is required"),
  founderEmail: z.string().email("Invalid email address"),
  companyName: z.string().min(2, "Company name is required"),
  country: z.string().min(2),
  sector: z.string().min(2),
  stage: z.enum(["Idea", "MVP", "Revenue", "Growth"]),
  incorporated: z.boolean(),
  companyAgeMonths: z.number().min(0),
  problem: z.string().min(20),
  solution: z.string().min(20),
  targetCustomers: z.string().min(10),
  tractionSummary: z.string().min(10),
  mrr: z.number().min(0),
  activeUsers: z.number().min(0),
  pilots: z.number().min(0),
  revenueGrowthPct: z.number().min(0).max(1000),
  cac: z.number().min(0),
  burnMonthly: z.number().min(0),
  runwayMonths: z.number().min(0),
  grossMarginPct: z.number().min(0).max(100),
  fundingAsk: z.number().min(0),
  useOfFunds: z.string().min(20),
  pitchText: z.string().optional(),
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;

export type NormalizedApplication = ApplicationFormData & {
  submittedAt: string;
};
