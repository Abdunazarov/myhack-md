export const SKILL_TAGS = [
  "B2B_Sales",
  "B2B_Enterprise",
  "Marketing",
  "Fundraising",
  "Financial_Modeling",
  "Product_MVP",
  "Go_To_Market",
  "Fintech_Compliance",
  "Hiring",
  "Operations",
  "Pricing",
  "Partnerships",
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];

const ROADBLOCK_KEYWORDS: Record<SkillTag, string[]> = {
  B2B_Sales: ["sales", "pipeline", "closing", "b2b sales", "enterprise deal"],
  B2B_Enterprise: ["enterprise", "pilot", "procurement", "large account", "b2b"],
  Marketing: ["marketing", "brand", "ads", "cac", "acquisition", "growth marketing"],
  Fundraising: ["fundraising", "investor", "pitch deck", "vc", "raise", "term sheet"],
  Financial_Modeling: ["financial model", "runway", "burn", "unit economics", "forecast", "cash flow"],
  Product_MVP: ["mvp", "product", "roadmap", "feature", "ux", "prototype"],
  Go_To_Market: ["go-to-market", "gtm", "launch", "distribution", "channel"],
  Fintech_Compliance: ["compliance", "regulation", "bnm", "payment license", "fintech"],
  Hiring: ["hire", "hiring", "team", "talent", "cto", "co-founder"],
  Operations: ["operations", "process", "scaling", "logistics", "supply chain"],
  Pricing: ["pricing", "monetization", "revenue model", "subscription"],
  Partnerships: ["partnership", "strategic partner", "integration", "alliance"],
};

export function extractProblemTags(roadblock: string, category?: string | null): SkillTag[] {
  const text = `${roadblock} ${category ?? ""}`.toLowerCase();
  const matched = new Set<SkillTag>();
  for (const tag of SKILL_TAGS) {
    if (ROADBLOCK_KEYWORDS[tag].some((kw) => text.includes(kw))) {
      matched.add(tag);
    }
  }
  if (matched.size === 0) {
    matched.add("Go_To_Market");
    matched.add("Product_MVP");
  }
  return [...matched];
}

export type SkillMatrix = Record<string, number>;

export function parseSkillMatrix(json: string): SkillMatrix {
  try {
    return JSON.parse(json) as SkillMatrix;
  } catch {
    return {};
  }
}
