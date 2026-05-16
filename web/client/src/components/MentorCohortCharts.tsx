import type { MentorDashboard } from "../api/types";

const MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function CohortHealthTrendChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        Cohort health trend (avg)
      </h4>
      <div className="flex items-end gap-2 h-32">
        {values.map((v, i) => (
          <div key={MONTH_LABELS[i]} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold">{v}%</span>
            <div
              className="w-full bg-primary rounded-t-md"
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            />
            <span className="text-[10px] text-on-surface-variant">{MONTH_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthByStartupChart({
  items,
}: {
  items: Array<{ name: string; healthScore: number }>;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        Health by startup
      </h4>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="truncate pr-2">{item.name}</span>
              <span>{Math.round(item.healthScore)}%</span>
            </div>
            <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  item.healthScore >= 75
                    ? "bg-primary"
                    : item.healthScore >= 50
                      ? "bg-tertiary"
                      : "bg-error"
                }`}
                style={{ width: `${item.healthScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorBreakdownChart({
  sectors,
}: {
  sectors: Array<{ sector: string; count: number }>;
}) {
  const max = Math.max(...sectors.map((s) => s.count), 1);
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        Active cohort by sector
      </h4>
      <div className="space-y-3">
        {sectors.map((s) => (
          <div key={s.sector}>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>{s.sector}</span>
              <span>{s.count}</span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutcomeBreakdownChart({
  outcomes,
}: {
  outcomes: { success: number; fail: number; pivot: number };
}) {
  const total = outcomes.success + outcomes.fail + outcomes.pivot || 1;
  const slices = [
    { label: "Success", value: outcomes.success, color: "bg-primary" },
    { label: "Fail", value: outcomes.fail, color: "bg-error" },
    { label: "Pivot", value: outcomes.pivot, color: "bg-tertiary" },
  ];
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        Historical outcomes (all time)
      </h4>
      <div className="flex h-4 rounded-full overflow-hidden mb-4">
        {slices.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.label}
                className={`${s.color} h-full`}
                style={{ width: `${(s.value / total) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ),
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${s.color}`} />
            <span>
              {s.label}: <strong>{s.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopSkillsChart({ skills }: { skills: Array<{ tag: string; score: number }> }) {
  if (skills.length === 0) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        Mentor expertise (historical)
      </h4>
      <div className="space-y-2">
        {skills.map((s) => (
          <div key={s.tag} className="flex justify-between items-center text-sm">
            <span>{s.tag}</span>
            <span className="font-semibold text-primary">{s.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MentorCohortCharts({ dashboard }: { dashboard: MentorDashboard }) {
  const analytics = dashboard.analytics;
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {analytics.cohortHealthTrend?.length > 0 && (
        <CohortHealthTrendChart values={analytics.cohortHealthTrend} />
      )}
      {analytics.healthDistribution?.length > 0 && (
        <HealthByStartupChart items={analytics.healthDistribution} />
      )}
      {analytics.sectorBreakdown?.length > 0 && (
        <SectorBreakdownChart sectors={analytics.sectorBreakdown} />
      )}
      {analytics.outcomeBreakdown && (
        <OutcomeBreakdownChart outcomes={analytics.outcomeBreakdown} />
      )}
      {analytics.topSkills?.length > 0 && <TopSkillsChart skills={analytics.topSkills} />}
    </div>
  );
}
