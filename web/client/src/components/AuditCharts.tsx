import type { AuditPayload } from "../api/types";

type MetricsHistory = {
  mrrHistory?: number[];
  pilotsHistory?: number[];
  labels?: string[];
};

function parseMetricsHistory(raw: string | undefined): MetricsHistory | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MetricsHistory;
  } catch {
    return null;
  }
}

function BarChart({
  title,
  labels,
  values,
  formatValue,
  color = "bg-primary",
}: {
  title: string;
  labels: string[];
  values: number[];
  formatValue?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(...values, 1);
  const fmt = formatValue ?? ((n: number) => String(n));

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">{title}</h4>
      <div className="flex items-end gap-2 h-36">
        {values.map((v, i) => (
          <div key={labels[i] ?? i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <span className="text-[10px] font-semibold text-on-surface-variant truncate w-full text-center">
              {fmt(v)}
            </span>
            <div
              className={`w-full rounded-t-md ${color} transition-all`}
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            />
            <span className="text-[10px] text-on-surface-variant">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRadarChart({ audit }: { audit: AuditPayload }) {
  const b = audit.scoreBreakdown;
  const items = [
    { label: "Eligibility", value: b.eligibilityFit },
    { label: "Traction", value: b.tractionStrength },
    { label: "Financials", value: b.financialHealth },
    { label: "Market", value: b.marketSectorFit },
    { label: "Data", value: b.dataCompleteness },
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        Score dimensions
      </h4>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>{item.label}</span>
              <span>{Math.round(item.value)}%</span>
            </div>
            <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenchmarkCompareChart({ audit }: { audit: AuditPayload }) {
  const deltas = audit.benchmarkDeltas.slice(0, 5);
  if (deltas.length === 0) return null;

  const maxVal = Math.max(...deltas.flatMap((d) => [d.value, d.median]), 1);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
      <h4 className="text-sm font-semibold text-on-surface-variant uppercase mb-4">
        vs 2025 cohort median
      </h4>
      <div className="space-y-4">
        {deltas.map((d) => (
          <div key={d.metricName}>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="capitalize">{d.metricName.replace(/_/g, " ")}</span>
              <span
                className={
                  d.status === "above"
                    ? "text-primary"
                    : d.status === "below"
                      ? "text-error"
                      : "text-on-surface-variant"
                }
              >
                {d.status}
              </span>
            </div>
            <div className="relative h-6 bg-surface-container-high rounded-md overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary/30 rounded-md"
                style={{ width: `${(d.value / maxVal) * 100}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-on-surface-variant"
                style={{ left: `${(d.median / maxVal) * 100}%` }}
                title={`Median: ${d.median}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
              <span>You: {d.value.toLocaleString()}</span>
              <span>Median: {d.median.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-on-surface-variant mt-3">Vertical line = cohort median</p>
    </div>
  );
}

export default function AuditCharts({
  audit,
  metricsHistoryJson,
}: {
  audit: AuditPayload;
  metricsHistoryJson?: string;
}) {
  const history = parseMetricsHistory(metricsHistoryJson);
  const labels = history?.labels ?? ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const mrrSeries = history?.mrrHistory;
  const pilotSeries = history?.pilotsHistory;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ScoreRadarChart audit={audit} />
      <BenchmarkCompareChart audit={audit} />
      {mrrSeries && mrrSeries.some((v) => v > 0) && (
        <BarChart
          title="MRR trend (RM)"
          labels={labels}
          values={mrrSeries}
          formatValue={(n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))}
        />
      )}
      {pilotSeries && (
        <BarChart
          title="Active pilots"
          labels={labels}
          values={pilotSeries}
          color="bg-secondary"
        />
      )}
      {!mrrSeries?.some((v) => v > 0) && !pilotSeries && mrrSeries && (
        <BarChart title="MRR trend (RM)" labels={labels} values={mrrSeries} />
      )}
    </div>
  );
}
