import { ChevronRight } from "lucide-react";
import { StaggerItem } from "../layout/PageShell";
import { cardHover } from "../layout/motion";
import Button from "./Button";
import type { FounderProject } from "../../api/types";

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

function readinessScore(project: FounderProject): number | null {
  const score = project.latestApplication?.intakeAudits?.[0]?.readinessScore;
  return score != null ? Math.round(score) : null;
}

function ReadinessRing({ score }: { score: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-container-high" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums text-on-background">{score}%</span>
    </div>
  );
}

type ProjectCardProps = {
  project: FounderProject;
  onViewResults: (applicationId: string) => void;
};

export default function ProjectCard({ project, onViewResults }: ProjectCardProps) {
  const score = readinessScore(project);
  const app = project.latestApplication;

  return (
    <StaggerItem>
      <article
        className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 md:p-6 ${cardHover}`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-on-background">{project.name}</h3>
              {app && (
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusBadgeClass(app.status)}`}
                >
                  {app.status.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              {project.sector} · {project.stage} · {project.state.replace(/_/g, " ")}
            </p>
            {app?.targetProgramme?.name && (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <ChevronRight size={14} className="opacity-70" />
                {app.targetProgramme.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-5 shrink-0">
            {score != null && (
              <div className="text-center md:text-right">
                <p className="text-[10px] uppercase tracking-wide text-on-surface-variant mb-1 md:hidden">
                  Readiness
                </p>
                <ReadinessRing score={score} />
              </div>
            )}
            {app && (
              <Button onClick={() => onViewResults(app.id)} className="whitespace-nowrap">
                Results
                <ChevronRight size={18} />
              </Button>
            )}
          </div>
        </div>
      </article>
    </StaggerItem>
  );
}
