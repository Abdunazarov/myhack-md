import { CheckCircle2 } from "lucide-react";
import type { MentorDashboard } from "../api/types";
import { StaggerItem } from "./layout/PageShell";
import { cardHover } from "./layout/motion";
import Button from "./ui/Button";

type Assignment = NonNullable<MentorDashboard["suggestedAssignments"]>[number];

/** "B2B Enterprise: 100% historical success" → "B2B Enterprise" */
function shortCriteria(label: string): string {
  const colon = label.indexOf(":");
  if (colon > 0) return label.slice(0, colon).trim();
  const stage = label.match(/^(.+?)\s+stage:/i);
  if (stage) return stage[1].trim();
  return label.trim();
}

export default function SuggestedAssignmentCard({
  assignment,
  acknowledged,
  onRequest,
}: {
  assignment: Assignment;
  acknowledged: boolean;
  onRequest: () => void;
}) {
  const criteria = assignment.matchedCriteria.slice(0, 2).map(shortCriteria);

  return (
    <StaggerItem className="h-full">
      <article
        className={`flex flex-col h-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm ${cardHover}`}
      >
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="min-w-0">
            <h4 className="text-lg font-semibold text-on-background leading-tight">
              {assignment.name}
            </h4>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {assignment.sector} · {assignment.stage}
            </p>
          </div>
          <span className="shrink-0 bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded-full tabular-nums">
            {Math.round(assignment.matchScore * 100)}% fit
          </span>
        </div>

        <p className="text-sm text-on-surface-variant flex-1 line-clamp-2">
          {assignment.roadblock}
        </p>

        {criteria.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            {criteria.map((label) => (
              <span key={label} className="text-xs inline-flex items-center gap-1.5 text-primary">
                <CheckCircle2 size={14} className="shrink-0" />
                {label}
              </span>
            ))}
          </div>
        )}

        {assignment.similarPastWin && (
          <div className="mt-4 p-3.5 rounded-lg bg-primary-container/25 border border-primary/15">
            <p className="font-semibold text-[10px] uppercase tracking-wide text-on-surface-variant mb-1">
              Like {assignment.similarPastWin.startupName}
            </p>
            <p className="text-sm text-on-surface-variant line-clamp-2">
              {assignment.similarPastWin.feedbackLog}
            </p>
          </div>
        )}

        <Button disabled={acknowledged} onClick={onRequest} className="mt-5 w-full">
          {acknowledged ? "Sent" : "Request"}
        </Button>
      </article>
    </StaggerItem>
  );
}
