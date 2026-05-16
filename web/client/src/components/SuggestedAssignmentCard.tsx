import { CheckCircle2 } from "lucide-react";
import type { MentorDashboard } from "../api/types";
import { StaggerItem } from "./layout/PageShell";
import { cardHover } from "./layout/motion";
import Button from "./ui/Button";

type Assignment = NonNullable<MentorDashboard["suggestedAssignments"]>[number];

export default function SuggestedAssignmentCard({
  assignment,
  acknowledged,
  onRequest,
}: {
  assignment: Assignment;
  acknowledged: boolean;
  onRequest: () => void;
}) {
  return (
    <StaggerItem className="h-full">
    <article className={`flex flex-col h-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm ${cardHover}`}>
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

      <p className="text-sm leading-relaxed text-on-surface-variant flex-1">
        {assignment.roadblock}
      </p>

      <ul className="mt-4 space-y-2">
        {assignment.matchedCriteria.slice(0, 3).map((c) => (
          <li key={c} className="text-xs flex items-start gap-2 text-primary">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <span>{c}</span>
          </li>
        ))}
      </ul>

      {assignment.similarPastWin && (
        <div className="mt-4 p-3.5 rounded-lg bg-primary-container/25 border border-primary/15">
          <p className="font-semibold text-[10px] uppercase tracking-wide text-on-surface-variant mb-1">
            Because you succeeded with {assignment.similarPastWin.startupName}
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">
            {assignment.similarPastWin.feedbackLog}
          </p>
        </div>
      )}

      <Button
        disabled={acknowledged}
        onClick={onRequest}
        className="mt-5 w-full"
      >
        {acknowledged ? "Interest recorded — team notified" : "Request assignment"}
      </Button>
    </article>
    </StaggerItem>
  );
}
