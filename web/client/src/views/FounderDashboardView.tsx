import { useEffect, useState } from "react";
import {
  Loader2,
  ChevronRight,
  Users,
  AlertCircle,
  Send,
  CheckCircle2,
} from "lucide-react";
import { getFounderDashboard, submitRoadblock } from "../api/client";
import type { FounderDashboard, FounderProject } from "../api/types";
import { useAuth } from "../context/AuthContext";
import type { ViewType } from "../App";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Routed":
      return "bg-secondary-container text-on-secondary-container";
    case "Eligible":
      return "bg-primary-container text-on-primary-container";
    case "Submitted":
      return "bg-tertiary-container text-on-tertiary-container";
    case "Needs_Review":
      return "bg-error-container/30 text-error";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}

function readinessForProject(project: FounderProject): string {
  const score = project.latestApplication?.intakeAudits?.[0]?.readinessScore;
  return score != null ? `${Math.round(score)}%` : "—";
}

export default function FounderDashboardView({
  onNavigate,
  onViewApplication,
}: {
  onNavigate: (view: ViewType) => void;
  onViewApplication: (applicationId: string) => void;
}) {
  const { token, loginAsRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<FounderDashboard | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [roadblockText, setRoadblockText] = useState("");
  const [roadblockSubmitting, setRoadblockSubmitting] = useState(false);
  const [roadblockResult, setRoadblockResult] = useState<{
    mentorName: string;
    explanation: string;
    matchScore: number;
  } | null>(null);
  const [roadblockError, setRoadblockError] = useState<string | null>(null);

  useEffect(() => {
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
        const data = await getFounderDashboard(authToken);
        if (!cancelled) {
          setDashboard(data);
          if (data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, loginAsRole]);

  const handleRoadblockSubmit = async () => {
    if (!selectedProjectId || roadblockText.length < 20) {
      setRoadblockError("Describe your roadblock in at least 20 characters.");
      return;
    }
    setRoadblockSubmitting(true);
    setRoadblockError(null);
    setRoadblockResult(null);
    try {
      let authToken = token;
      if (!authToken) {
        await loginAsRole("Founder");
        authToken = localStorage.getItem("cradle_auth_token");
      }
      if (!authToken) throw new Error("Not signed in");
      const result = await submitRoadblock(authToken, {
        ecosystemProjectId: selectedProjectId,
        roadblock: roadblockText,
      });
      setRoadblockResult({
        mentorName: result.match.mentor.name,
        explanation: result.match.explanation,
        matchScore: result.match.matchScore,
      });
      setRoadblockText("");
    } catch (err) {
      setRoadblockError(err instanceof Error ? err.message : "Failed to submit roadblock");
    } finally {
      setRoadblockSubmitting(false);
    }
  };

  return (
    <main className="py-8 pb-12 px-gutter md:px-margin-desktop max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-on-background mb-2">Founder Dashboard</h1>
        {dashboard?.founder && (
          <p className="text-on-surface-variant mb-8">
            Welcome back, {dashboard.founder.name}
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        )}

        {error && (
          <p className="text-error text-center py-12 font-medium">{error}</p>
        )}

        {!loading && !error && dashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
                <p className="text-xs font-semibold uppercase text-on-surface-variant">
                  Applications
                </p>
                <h2 className="text-4xl font-bold mt-1">{dashboard.stats.applications}</h2>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl">
                <p className="text-xs font-semibold uppercase text-on-surface-variant">
                  Active Mentorships
                </p>
                <h2 className="text-4xl font-bold mt-1">{dashboard.stats.activeMentorships}</h2>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
              {dashboard.projects.length === 0 ? (
                <div className="bg-surface-container-low rounded-xl p-8 text-center">
                  <p className="text-on-surface-variant mb-4">No projects yet.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate("apply")}
                    className="bg-primary text-on-primary px-6 py-3 rounded-xl text-sm font-semibold"
                  >
                    Submit your first application
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-on-surface-variant mt-1">
                          {project.sector} · {project.stage} · {project.state.replace(/_/g, " ")}
                        </p>
                        {project.latestApplication && (
                          <>
                            <span
                              className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(project.latestApplication.status)}`}
                            >
                              {project.latestApplication.status.replace(/_/g, " ")}
                            </span>
                            {project.latestApplication.targetProgramme?.name && (
                              <p className="text-xs text-on-surface-variant mt-2">
                                → {project.latestApplication.targetProgramme.name}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-on-surface-variant">Readiness</p>
                          <p className="text-xl font-bold">{readinessForProject(project)}</p>
                        </div>
                        {project.latestApplication && (
                          <button
                            type="button"
                            onClick={() =>
                              onViewApplication(project.latestApplication!.id)
                            }
                            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-semibold"
                          >
                            View results
                            <ChevronRight size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {dashboard.projects.some((p) => p.mentorMatchingEligible) && (
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="text-primary" size={24} />
                  <h2 className="text-xl font-semibold">Request Mentor Help</h2>
                </div>
                <p className="text-sm text-on-surface-variant mb-4">
                  Describe a roadblock and we will match you with a mentor.
                </p>
                <select
                  className="w-full h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 mb-4"
                  value={selectedProjectId ?? ""}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {dashboard.projects
                    .filter((p) => p.mentorMatchingEligible)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 mb-4"
                  placeholder="Describe your roadblock (min 20 characters)..."
                  value={roadblockText}
                  onChange={(e) => setRoadblockText(e.target.value)}
                />
                {roadblockError && (
                  <p className="text-error text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {roadblockError}
                  </p>
                )}
                {roadblockResult && (
                  <div className="bg-primary-container text-on-primary-container rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={20} />
                      <span className="font-semibold">Matched: {roadblockResult.mentorName}</span>
                      <span className="text-xs opacity-80">
                        ({Math.round(roadblockResult.matchScore * 100)}% match)
                      </span>
                    </div>
                    <p className="text-sm">{roadblockResult.explanation}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRoadblockSubmit}
                  disabled={roadblockSubmitting}
                  className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-70"
                >
                  {roadblockSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                  Submit roadblock
                </button>
              </section>
            )}
          </>
        )}
    </main>
  );
}
