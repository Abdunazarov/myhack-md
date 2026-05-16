import { useEffect, useState } from "react";
import {
  Loader2,
  Users,
  AlertCircle,
  Send,
  CheckCircle2,
  FileText,
  Handshake,
  FolderKanban,
} from "lucide-react";
import { getFounderDashboard, submitRoadblock } from "../api/client";
import type { FounderDashboard } from "../api/types";
import { useAuth } from "../context/AuthContext";
import type { ViewType } from "../App";
import { PageShell, PageHeader, FadeIn, StaggerGrid } from "../components/layout/PageShell";
import { cardHover } from "../components/layout/motion";
import StatCard from "../components/ui/StatCard";
import ProjectCard from "../components/ui/ProjectCard";
import Button from "../components/ui/Button";
import { AUTH_TOKEN_KEY } from "../lib/authStorage";

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-base focus:border-primary outline-none focus:ring-1 focus:ring-primary transition-colors";

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
          authToken = localStorage.getItem(AUTH_TOKEN_KEY);
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
      setRoadblockError("Add at least 20 characters.");
      return;
    }
    setRoadblockSubmitting(true);
    setRoadblockError(null);
    setRoadblockResult(null);
    try {
      let authToken = token;
      if (!authToken) {
        await loginAsRole("Founder");
        authToken = localStorage.getItem(AUTH_TOKEN_KEY);
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
      setRoadblockError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setRoadblockSubmitting(false);
    }
  };

  const founderName = dashboard?.founder?.name;

  return (
    <PageShell className="pb-12 space-y-8">
      <PageHeader
        title={founderName ? `Hi, ${founderName.split(" ")[0]}` : "Dashboard"}
        action={
          <Button onClick={() => onNavigate("apply")} className="hidden sm:inline-flex">
            Apply
          </Button>
        }
      />

      {loading && (
        <FadeIn className="flex justify-center py-24">
          <Loader2 className="animate-spin text-primary" size={40} />
        </FadeIn>
      )}

      {error && (
        <FadeIn>
          <p className="text-error text-center py-12 font-medium rounded-xl bg-error-container/20 border border-error/20">
            {error}
          </p>
        </FadeIn>
      )}

      {!loading && !error && dashboard && (
        <>
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <StatCard
              label="Applications"
              value={dashboard.stats.applications}
              icon={FileText}
              accent="primary"
            />
            <StatCard
              label="Mentors"
              value={dashboard.stats.activeMentorships}
              icon={Handshake}
              accent="secondary"
            />
          </StaggerGrid>

          <FadeIn delay={0.1}>
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FolderKanban className="text-primary" size={22} />
                  <h2 className="text-xl font-semibold text-on-background">Projects</h2>
                </div>
                <span className="text-sm text-on-surface-variant tabular-nums">
                  {dashboard.projects.length}
                </span>
              </div>

              {dashboard.projects.length === 0 ? (
                <div
                  className={`rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center ${cardHover}`}
                >
                  <p className="text-on-surface-variant mb-5">No projects yet.</p>
                  <Button onClick={() => onNavigate("apply")}>Apply</Button>
                </div>
              ) : (
                <StaggerGrid className="space-y-4">
                  {dashboard.projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onViewResults={onViewApplication}
                    />
                  ))}
                </StaggerGrid>
              )}
            </section>
          </FadeIn>

          {dashboard.projects.some((p) => p.mentorMatchingEligible) && (
            <FadeIn delay={0.15}>
              <section
                className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 ${cardHover}`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="text-primary" size={22} />
                  </div>
                  <h2 className="text-xl font-semibold text-on-background">Ask a mentor</h2>
                </div>

                <div className="space-y-3 max-w-2xl">
                  <select
                    className={`${inputClass} h-12`}
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
                    rows={2}
                    className={`${inputClass} py-3 resize-none`}
                    placeholder="What's blocking you?"
                    value={roadblockText}
                    onChange={(e) => setRoadblockText(e.target.value)}
                  />

                  {roadblockError && (
                    <p className="text-error text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {roadblockError}
                    </p>
                  )}

                  {roadblockResult && (
                    <FadeIn>
                      <div className="rounded-xl bg-primary-container text-on-primary-container p-4 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <CheckCircle2 size={20} />
                          <span className="font-semibold">{roadblockResult.mentorName}</span>
                          <span className="text-xs opacity-80">
                            {Math.round(roadblockResult.matchScore * 100)}% match
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{roadblockResult.explanation}</p>
                      </div>
                    </FadeIn>
                  )}

                  <Button
                    onClick={handleRoadblockSubmit}
                    disabled={roadblockSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {roadblockSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    Find mentor
                  </Button>
                </div>
              </section>
            </FadeIn>
          )}
        </>
      )}
    </PageShell>
  );
}
