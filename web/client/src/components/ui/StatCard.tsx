import type { LucideIcon } from "lucide-react";
import { StaggerItem } from "../layout/PageShell";
import { cardHover } from "../layout/motion";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "secondary" | "alert" | "default";
};

const accentStyles = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  alert: "bg-error-container/25 text-error",
  default: "bg-surface-container-high text-on-surface-variant",
};

export default function StatCard({ label, value, icon: Icon, hint, accent = "default" }: StatCardProps) {
  return (
    <StaggerItem className="h-full">
      <div
        className={`h-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 ${cardHover}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {label}
            </p>
            <p className="text-4xl font-bold text-on-background mt-2 tabular-nums">{value}</p>
            {hint && (
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{hint}</p>
            )}
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentStyles[accent]}`}
          >
            <Icon size={22} />
          </div>
        </div>
      </div>
    </StaggerItem>
  );
}
