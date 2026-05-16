import { useEffect, useState } from "react";
import {
  RefreshCw,
  FileText,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  User,
  Loader2,
} from "lucide-react";
import { getApplication } from "../api/client";
import type {
  ApplicationDetailResponse,
  ApplicationStatus,
  AuditPayload,
  RiskFlag,
} from "../api/types";
import AuditCharts from "../components/AuditCharts";
import { useAuth } from "../context/AuthContext";
import type { ViewType } from "../App";
import { PageShell, PageHeader, FadeIn, StaggerGrid, StaggerItem } from "../components/layout/PageShell";
import Button from "../components/ui/Button";
import SurfaceCard from "../components/ui/SurfaceCard";

function statusLabel(status: ApplicationStatus): string {
  return status.replace(/_/g, " ");
}

function riskTitle(flag: RiskFlag): string {
  const labels: Record<string, string> = {
    missing_data: "Data gaps to address",
    low_runway: "Runway pressure",
    runway_pressure: "Runway pressure",
    high_cac: "Elevated customer acquisition cost",
    pre_revenue: "Pre-revenue stage",
    not_incorporated: "Incorporation pending",
    single_pilot_dependency: "Pilot concentration",
    enterprise_concentration: "Pipeline concentration",
    geographic_concentration: "Geographic concentration",
    mrr_gap: "Revenue below grant threshold",
  };
  return labels[flag.code] ?? flag.code.replace(/_/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseAuditFromResponse(data: ApplicationDetailResponse): AuditPayload | null {
  if (data.audit) return data.audit;
  const row = data.application.intakeAudits?.[0];
  if (!row) return null;
  return {
    readinessScore: row.readinessScore,
    scoreBreakdown: JSON.parse(row.scoreBreakdown || "{}"),
    benchmarkDeltas: JSON.parse(row.benchmarkDeltas || "[]"),
    strengths: JSON.parse(row.strengths || "[]"),
    riskFlags: JSON.parse(row.riskFlags || "[]"),
    aiSummary: row.aiSummary ?? "",
    founderReport: row.founderReport ?? "",
    aiFallback: false,
  };
}

export default function ResultView({
  onNavigate,
  applicationId,
}: {
  onNavigate: (view: ViewType) => void;
  applicationId: string | null;
}) {
  const { token, loginAsRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApplicationDetailResponse | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      setError("No application selected. Submit an application first.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let authToken = token;
        if (!authToken) {
          await loginAsRole("Founder");
          authToken = localStorage.getItem("cradle_auth_token");
        }
        if (!authToken) throw new Error("Not signed in");
        const result = await getApplication(authToken, applicationId!);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load results");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId, token, loginAsRole]);

  if (loading) {
    return (
      <PageShell>
        <FadeIn className="flex justify-center py-32">
          <Loader2 className="animate-spin text-primary" size={40} />
        </FadeIn>
      </PageShell>
    );
  }

  if (error || !data?.application) {
    return (
      <PageShell className="text-center">
        <FadeIn className="py-24 space-y-4">
          <p className="text-error font-medium">{error ?? "Application not found"}</p>
          <Button onClick={() => onNavigate("apply")}>Submit application</Button>
        </FadeIn>
      </PageShell>
    );
  }

  const app = data.application;
  const audit = parseAuditFromResponse(data);
  const routing = data.routing ?? app.routingDecisions?.[0];
  const programmeName =
    routing?.recommendedProgramme?.name ??
    app.routingDecisions?.[0]?.recommendedProgramme?.name ??
    "Pending review";
  const score = Math.round(audit?.readinessScore ?? 0);
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference * (1 - score / 100);
  const breakdown = audit?.scoreBreakdown;

  return (
    <PageShell className="pb-12">
      <PageHeader
        title={app.ecosystemProject.name}
        description={`Submitted ${formatDate(app.submittedAt)} · ${statusLabel(app.status)}`}
        action={
          <Button variant="secondary" onClick={() => onNavigate("apply")}>
            <RefreshCw size={18} />
            Apply again
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0">
        <div className="lg:col-span-8 min-w-0 space-y-6">
          <StaggerGrid className="space-y-6">
            <StaggerItem>
              <SurfaceCard padding="lg">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        className="text-surface-container-high"
                        cx="96"
                        cy="96"
                        fill="transparent"
                        r="88"
                        strokeWidth="12"
                        stroke="currentColor"
                      />
                      <circle
                        className="text-primary transition-all duration-700"
                        cx="96"
                        cy="96"
                        fill="transparent"
                        r="88"
                        strokeWidth="12"
                        stroke="currentColor"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-bold tabular-nums">{score}</span>
                      <span className="text-xs font-semibold text-on-surface-variant">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="text-xl font-semibold mb-4">Readiness score</h3>
                    {breakdown && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          ["Eligibility", breakdown.eligibilityFit],
                          ["Traction", breakdown.tractionStrength],
                          ["Financials", breakdown.financialHealth],
                          ["Market fit", breakdown.marketSectorFit],
                        ].map(([label, value]) => (
                          <div key={label} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{label}</span>
                              <span className="tabular-nums">{Math.round(value as number)}%</span>
                            </div>
                            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SurfaceCard>
            </StaggerItem>

            <StaggerItem>
              <SurfaceCard
                padding="lg"
                hover={false}
                className="border-primary/25 bg-gradient-to-br from-primary-container/40 to-surface-container-lowest"
              >
                <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                  {routing?.decisionType?.replace(/_/g, " ") ?? "Routed"}
                </span>
                <h2 className="text-2xl font-semibold mt-3 text-on-background">{programmeName}</h2>
                <p className="text-base text-on-surface-variant mt-4 leading-relaxed">
                  {routing?.explanation ??
                    "Programme routing will appear once the audit completes."}
                </p>
              </SurfaceCard>
            </StaggerItem>

            <StaggerItem>
              <SurfaceCard padding="lg" className="bg-surface-container-low">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-primary" size={22} />
                  <h3 className="text-xl font-semibold">Audit summary</h3>
                </div>
                <p className="text-base text-on-surface-variant leading-relaxed">
                  {audit?.founderReport || audit?.aiSummary || "No audit narrative available."}
                </p>
              </SurfaceCard>
            </StaggerItem>

            {audit && (
              <StaggerItem>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Performance analytics</h3>
                  <AuditCharts
                    audit={audit}
                    metricsHistoryJson={app.ecosystemProject.metricsHistory}
                  />
                </div>
              </StaggerItem>
            )}

            {audit && audit.benchmarkDeltas.length > 0 && (
              <StaggerItem>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Benchmark highlights</h3>
                  <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {audit.benchmarkDeltas.slice(0, 3).map((b) => (
                      <StaggerItem key={b.metricName}>
                        <SurfaceCard padding="sm" className="h-full">
                          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                            {b.metricName.replace(/_/g, " ")}
                          </p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl font-bold tabular-nums">
                              {b.value.toLocaleString()}
                            </span>
                            <span
                              className={`text-xs font-semibold flex items-center ${
                                b.status === "above"
                                  ? "text-primary"
                                  : b.status === "below"
                                    ? "text-error"
                                    : "text-on-surface-variant"
                              }`}
                            >
                              {b.status === "above" ? (
                                <ArrowUp size={14} />
                              ) : b.status === "below" ? (
                                <ArrowDown size={14} />
                              ) : null}
                              {b.status}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                            {b.message}
                          </p>
                        </SurfaceCard>
                      </StaggerItem>
                    ))}
                  </StaggerGrid>
                </div>
              </StaggerItem>
            )}
          </StaggerGrid>
        </div>

        <div className="lg:col-span-4 min-w-0">
          <StaggerGrid className="space-y-6">
            <StaggerItem>
              <SurfaceCard padding="lg">
                <h4 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">
                  Strengths
                </h4>
                <ul className="space-y-3">
                  {(audit?.strengths ?? []).map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={18} />
                      <p className="text-sm leading-relaxed">{s}</p>
                    </li>
                  ))}
                  {!audit?.strengths?.length && (
                    <li className="text-sm text-on-surface-variant">No strengths listed yet.</li>
                  )}
                </ul>
              </SurfaceCard>
            </StaggerItem>

            <StaggerItem>
              <SurfaceCard padding="lg">
                <h4 className="text-sm font-semibold text-error mb-4 uppercase tracking-wide">
                  Risk flags
                </h4>
                <ul className="space-y-4">
                  {(audit?.riskFlags ?? []).map((r) => (
                    <li key={`${r.code}-${r.message}`} className="flex items-start gap-2">
                      <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-semibold">{riskTitle(r)}</p>
                        <p className="text-sm text-on-surface-variant leading-relaxed mt-0.5">
                          {r.message}
                        </p>
                        <span
                          className={`inline-block mt-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            r.severity === "high"
                              ? "bg-error-container/30 text-error"
                              : r.severity === "medium"
                                ? "bg-tertiary-container text-on-tertiary-container"
                                : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {r.severity}
                        </span>
                      </div>
                    </li>
                  ))}
                  {!audit?.riskFlags?.length && (
                    <li className="text-sm text-on-surface-variant">No risk flags flagged.</li>
                  )}
                </ul>
              </SurfaceCard>
            </StaggerItem>

            <StaggerItem>
              <SurfaceCard padding="sm" className="bg-surface-container-low">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{app.ecosystemProject.founderName}</p>
                    <p className="text-sm text-on-surface-variant truncate">
                      {app.ecosystemProject.sector} · {app.ecosystemProject.founderEmail}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </StaggerItem>
          </StaggerGrid>
        </div>
      </div>
    </PageShell>
  );
}
