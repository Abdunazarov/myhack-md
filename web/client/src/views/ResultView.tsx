import { useEffect, useState } from "react";
import {
  Rocket,
  ChevronRight,
  Waypoints,
  RefreshCw,
  FileText,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  User,
  LayoutDashboard,
  GitBranch,
  Network,
  Loader2,
} from "lucide-react";
import { getApplication } from "../api/client";
import type { ApplicationDetailResponse, ApplicationStatus, AuditPayload } from "../api/types";
import { useAuth } from "../context/AuthContext";
import type { ViewType } from "../App";

function statusLabel(status: ApplicationStatus): string {
  return status.replace(/_/g, " ");
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

  const app = data?.application;
  const audit = data ? parseAuditFromResponse(data) : null;
  const routing = data?.routing ?? app?.routingDecisions?.[0];
  const programmeName =
    routing?.recommendedProgramme?.name ??
    app?.routingDecisions?.[0]?.recommendedProgramme?.name ??
    "Pending review";
  const score = Math.round(audit?.readinessScore ?? 0);
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference * (1 - score / 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 px-6 text-center gap-4">
        <p className="text-error font-medium">{error ?? "Application not found"}</p>
        <button
          type="button"
          onClick={() => onNavigate("apply")}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl text-sm font-semibold"
        >
          Submit application
        </button>
      </div>
    );
  }

  const breakdown = audit?.scoreBreakdown;

  return (
    <>
      <header className="bg-surface-bright border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-gutter md:px-margin-desktop h-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
          <Rocket className="text-primary" size={24} />
          <span className="text-xl font-bold text-primary tracking-tight">Cradle LinkRouter</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("apply")}
          className="bg-primary text-on-primary px-6 py-2 rounded-xl text-sm font-semibold"
        >
          Apply
        </button>
      </header>

      <main className="pt-24 pb-12 px-gutter md:px-margin-desktop max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <nav className="flex items-center gap-1 text-on-surface-variant mb-2">
              <span className="text-xs font-medium">Applications</span>
              <ChevronRight size={14} />
              <span className="text-xs font-medium text-primary">Result</span>
            </nav>
            <h1 className="text-3xl font-bold text-on-background tracking-tight">
              {app.ecosystemProject.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold tracking-wide">
                <Waypoints size={14} className="mr-1" />
                {statusLabel(app.status)}
              </span>
              <p className="text-sm text-on-surface-variant">
                Submitted {formatDate(app.submittedAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("apply")}
            className="flex items-center gap-2 border border-outline px-6 py-3 rounded-xl text-sm font-semibold"
          >
            <RefreshCw size={18} />
            Apply Again
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="relative flex items-center justify-center w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
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
                      className="text-primary"
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
                    <span className="text-5xl font-bold">{score}</span>
                    <span className="text-sm font-semibold text-on-surface-variant">/ 100</span>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <h3 className="text-xl font-semibold mb-4">Readiness Score</h3>
                  {breakdown && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        ["Eligibility", breakdown.eligibilityFit],
                        ["Traction", breakdown.tractionStrength],
                        ["Financials", breakdown.financialHealth],
                        ["Market Fit", breakdown.marketSectorFit],
                      ].map(([label, value]) => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{label}</span>
                            <span>{Math.round(value as number)}%</span>
                          </div>
                          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-primary-container text-on-primary-container rounded-xl p-8 shadow-lg border border-primary relative overflow-hidden">
              <span className="bg-on-primary-fixed-variant text-primary-fixed px-3 py-1 rounded-full text-xs font-medium">
                {routing?.decisionType?.replace(/_/g, " ") ?? "Routed"}
              </span>
              <h2 className="text-2xl font-semibold mt-3">{programmeName}</h2>
              <p className="text-base my-6 leading-relaxed">
                {routing?.explanation ??
                  "Programme routing will appear once the audit completes."}
              </p>
            </div>

            <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-primary" size={24} />
                <h3 className="text-xl font-semibold">Your Audit Summary</h3>
              </div>
              <p className="text-base text-on-surface-variant leading-relaxed">
                {audit?.founderReport || audit?.aiSummary || "No audit narrative available."}
              </p>
            </div>

            {audit && audit.benchmarkDeltas.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Benchmark Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {audit.benchmarkDeltas.slice(0, 3).map((b) => (
                    <div
                      key={b.metricName}
                      className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant"
                    >
                      <p className="text-xs font-semibold text-on-surface-variant uppercase">
                        {b.metricName}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold">{b.value}</span>
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
                      <p className="text-sm text-on-surface-variant mt-2">
                        Median: {b.median}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
              <h4 className="text-sm font-semibold text-primary mb-4 uppercase">Strengths</h4>
              <ul className="space-y-4">
                {(audit?.strengths ?? []).map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                    <p className="text-sm">{s}</p>
                  </li>
                ))}
                {!audit?.strengths?.length && (
                  <li className="text-sm text-on-surface-variant">No strengths listed yet.</li>
                )}
              </ul>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
              <h4 className="text-sm font-semibold text-error mb-4 uppercase">Risk Flags</h4>
              <ul className="space-y-4">
                {(audit?.riskFlags ?? []).map((r) => (
                  <li key={r.code} className="flex items-start gap-2">
                    <AlertTriangle className="text-error shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold">{r.code}</p>
                      <p className="text-sm text-on-surface-variant">{r.message}</p>
                    </div>
                  </li>
                ))}
                {!audit?.riskFlags?.length && (
                  <li className="text-sm text-on-surface-variant">No risk flags flagged.</li>
                )}
              </ul>
            </div>

            <div className="bg-surface-container rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{app.ecosystemProject.founderName}</p>
                  <p className="text-sm text-on-surface-variant">
                    {app.ecosystemProject.sector} · {app.ecosystemProject.founderEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-outline-variant pb-2">
        <button type="button" onClick={() => onNavigate("home")} className="flex flex-col items-center text-on-surface-variant">
          <LayoutDashboard size={20} />
        </button>
        <button type="button" className="flex flex-col items-center bg-secondary-container rounded-full px-5 py-1">
          <GitBranch size={20} />
        </button>
        <button type="button" className="flex flex-col items-center text-on-surface-variant">
          <Network size={20} />
        </button>
      </nav>
    </>
  );
}
