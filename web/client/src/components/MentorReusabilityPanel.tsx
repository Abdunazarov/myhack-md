import { useState } from "react";
import { Sparkles, TrendingUp, UserPlus, CheckCircle2 } from "lucide-react";
import type { MentorDashboard } from "../api/types";

function SectorSuccessChart({
  sectors,
}: {
  sectors: NonNullable<MentorDashboard["trackRecord"]>["bySector"];
}) {
  return (
    <div className="space-y-3">
      {sectors.map((s) => (
        <div key={s.sector}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium">{s.sector}</span>
            <span className="text-on-surface-variant tabular-nums">
              {s.successRate}% · {s.successCount}/{s.mentored} wins
            </span>
          </div>
          <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, s.successRate)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MentorReusabilityPanel({ dashboard }: { dashboard: MentorDashboard }) {
  const trackRecord = dashboard.trackRecord;
  const suggestions = dashboard.suggestedAssignments ?? [];
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  if (!trackRecord && suggestions.length === 0) return null;

  return (
    <section className="mb-10 w-full">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-container/40 to-surface-container-lowest p-6 md:p-8 mb-8 w-full">
        <div className="flex items-start gap-3">
          <Sparkles className="text-primary shrink-0 mt-0.5" size={24} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-on-background">Reusable expertise</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Past cohort results drive who you should mentor next — not starting from zero each
              batch.
            </p>
            {trackRecord && (
              <>
                <p className="text-lg font-semibold text-primary mt-4">{trackRecord.headline}</p>
                <p className="text-sm text-on-surface-variant mt-1">{trackRecord.subheadline}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-8 w-full">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <UserPlus className="text-primary" size={22} />
            Suggested assignments for you
          </h3>
          <p className="text-sm text-on-surface-variant mb-4">
            Since you did well on similar projects, Cradle recommends these startups for your
            cohort.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {suggestions.map((s) => (
              <div
                key={s.projectId}
                className="bg-surface-container-lowest border-2 border-primary/25 rounded-xl p-5"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold">{s.name}</h4>
                    <p className="text-sm text-on-surface-variant">
                      {s.sector} · {s.stage}
                    </p>
                  </div>
                  <span className="shrink-0 bg-primary text-on-primary text-sm font-bold px-3 py-1 rounded-full">
                    {Math.round(s.matchScore * 100)}% fit
                  </span>
                </div>
                <p className="text-sm mt-3 leading-relaxed text-on-surface-variant">{s.roadblock}</p>
                <ul className="mt-3 space-y-1">
                  {s.matchedCriteria.slice(0, 3).map((c) => (
                    <li key={c} className="text-xs flex items-start gap-1.5 text-primary">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                {s.similarPastWin && (
                  <div className="mt-3 p-3 rounded-lg bg-primary-container/30 text-sm">
                    <p className="font-semibold text-xs uppercase text-on-surface-variant mb-1">
                      Because you succeeded with {s.similarPastWin.startupName}
                    </p>
                    <p className="text-on-surface-variant leading-relaxed line-clamp-3">
                      {s.similarPastWin.feedbackLog}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  disabled={acknowledged.has(s.projectId)}
                  onClick={() => setAcknowledged((prev) => new Set(prev).add(s.projectId))}
                  className="mt-4 w-full py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {acknowledged.has(s.projectId)
                    ? "Interest recorded — Cradle ops notified"
                    : "Request assignment"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {trackRecord && trackRecord.bySector.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 min-h-[200px]">
            <h3 className="text-sm font-semibold uppercase text-on-surface-variant mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              Results by sector (2024 cohort)
            </h3>
            <SectorSuccessChart sectors={trackRecord.bySector} />
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 min-h-[200px]">
            <h3 className="text-sm font-semibold uppercase text-on-surface-variant mb-4">
              Criteria you fulfilled well
            </h3>
            <div className="space-y-2">
              {trackRecord.provenSkills.map((skill) => (
                <div
                  key={skill.tag}
                  className="flex gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/60"
                >
                  <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={18} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {skill.tag}{" "}
                      <span className="text-primary">{skill.score}%</span>
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      {skill.proof}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
