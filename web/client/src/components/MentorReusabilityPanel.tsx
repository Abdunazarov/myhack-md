import { useState } from "react";
import { Sparkles, UserPlus } from "lucide-react";
import type { MentorDashboard } from "../api/types";
import SuggestedAssignmentCard from "./SuggestedAssignmentCard";
import SurfaceCard from "./ui/SurfaceCard";
import { FadeIn, StaggerGrid } from "./layout/PageShell";
import { cardHover } from "./layout/motion";

export default function MentorReusabilityPanel({ dashboard }: { dashboard: MentorDashboard }) {
  const trackRecord = dashboard.trackRecord;
  const suggestions = dashboard.suggestedAssignments ?? [];
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  if (!trackRecord && suggestions.length === 0) return null;

  return (
    <section className="space-y-6">
      <SurfaceCard
        hover
        padding="lg"
        className="border-primary/20 bg-gradient-to-br from-primary-container/25 via-surface-container-lowest to-surface-container-lowest"
      >
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-background tracking-tight">
              Track record
            </h2>

            {trackRecord && (
              <>
                <p className="text-base font-semibold text-primary mt-3 line-clamp-2">
                  {trackRecord.headline}
                </p>
              </>
            )}
          </div>
        </div>
      </SurfaceCard>

      {suggestions.length > 0 && (
        <FadeIn delay={0.05}>
          <SurfaceCard hover padding="lg" className="space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-on-background">
                <UserPlus className="text-primary shrink-0" size={22} />
                Suggested matches
              </h3>

            </div>

            <StaggerGrid className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {suggestions.map((s) => (
                <SuggestedAssignmentCard
                  key={s.projectId}
                  assignment={s}
                  acknowledged={acknowledged.has(s.projectId)}
                  onRequest={() =>
                    setAcknowledged((prev) => new Set(prev).add(s.projectId))
                  }
                />
              ))}
            </StaggerGrid>
          </SurfaceCard>
        </FadeIn>
      )}
    </section>
  );
}
