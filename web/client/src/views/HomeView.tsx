import {
  FileText,
  Brain,
  Waypoints,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Users,
  BadgeCheck,
} from "lucide-react";
import type { ViewType } from "../App";
import type { AppEntity } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { cardHover } from "../components/layout/motion";
import { FadeIn, StaggerGrid, StaggerItem } from "../components/layout/PageShell";
import HeroDashboardVisual from "../components/HeroDashboardVisual";

function WorkflowCard({
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <StaggerItem>
      <div className="h-full bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}
        >
          <Icon size={22} />
        </div>
        <h4 className="text-lg font-semibold mb-2 text-on-background">{title}</h4>
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </StaggerItem>
  );
}

export default function HomeView({
  onNavigate,
  entity,
}: {
  onNavigate: (view: ViewType) => void;
  entity: AppEntity;
}) {
  const isStartup = entity === "startup";

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-gutter md:px-margin-desktop py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <FadeIn className="min-w-0 w-full flex items-center justify-center lg:justify-start">
              <div className="max-w-prose space-y-5 w-full">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Malaysia
                </p>
                <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold text-on-background tracking-tight leading-[1.15]">
                  {isStartup
                    ? "Apply. Get scored. Get routed."
                    : "Your cohort, one view"}
                </h2>
                <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">
                  {isStartup
                    ? "Pitch audit, benchmarks, and programme routing."
                    : "Startups, priorities, and outcomes."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {isStartup ? (
                    <>
                      <Button onClick={() => onNavigate("apply")}>Apply</Button>
                      <Button variant="secondary" onClick={() => onNavigate("founder-dashboard")}>
                        My dashboard
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => onNavigate("mentor-dashboard")}>Open cohort</Button>
                  )}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.1} className="min-w-0 w-full">
              <HeroDashboardVisual entity={entity} />
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low border-y border-outline-variant/60">
        <div className="mx-auto max-w-6xl px-gutter md:px-margin-desktop py-16 md:py-20">
          <FadeIn className="text-center mb-12 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-on-background">
              {isStartup ? "How it works" : "Your mentor workflow"}
            </h3>

          </FadeIn>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {isStartup ? (
              <>
                <WorkflowCard
                  icon={FileText}
                  title="Submit profile"
                  description="Deck + team details."
                  iconClass="bg-primary-container text-primary"
                />
                <WorkflowCard
                  icon={Brain}
                  title="AI audit vs benchmarks"
                  description="Vs cohort benchmarks."
                  iconClass="bg-secondary-container text-secondary"
                />
                <WorkflowCard
                  icon={Waypoints}
                  title="Scored & routed"
                  description="Score + programme match."
                  iconClass="bg-tertiary-container text-tertiary"
                />
              </>
            ) : (
              <>
                <WorkflowCard
                  icon={Users}
                  title="Assigned startups"
                  description="Your assigned startups."
                  iconClass="bg-primary-container text-primary"
                />
                <WorkflowCard
                  icon={Brain}
                  title="Intervention queue"
                  description="By health score."
                  iconClass="bg-secondary-container text-secondary"
                />
                <WorkflowCard
                  icon={BadgeCheck}
                  title="Outcomes"
                  description="Past wins inform matches."
                  iconClass="bg-tertiary-container text-tertiary"
                />
              </>
            )}
          </StaggerGrid>
        </div>
      </section>

      {isStartup && (
        <section className="mx-auto max-w-6xl px-gutter md:px-margin-desktop py-16 md:py-20">
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className={`lg:col-span-7 bg-surface-container-lowest p-8 md:p-10 rounded-2xl border border-outline-variant flex flex-col justify-between ${cardHover}`}>
                <div>
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-5 inline-block">
                    Module 1
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-5">AI pitch audit</h3>
                  <ul className="space-y-3 text-sm text-on-surface-variant">
                    {["Risk scan", "Strengths", "Benchmarks"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="text-primary shrink-0" size={18} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate("apply")}
                  className="mt-8 !px-0 text-primary"
                >
                  Apply <ArrowRight size={18} />
                </Button>
              </div>

              <div className={`lg:col-span-5 bg-inverse-surface text-inverse-on-surface p-8 md:p-10 rounded-2xl flex flex-col justify-between ${cardHover}`}>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Ecosystem routing</h3>
                  <p className="text-sm opacity-80 mb-6 leading-relaxed">
                    Score-based programme match.
                  </p>
                  <div className="space-y-3">
                    {["Pre-Accelerator", "Mentor Readiness", "Direct Grant Track"].map((track) => (
                      <div
                        key={track}
                        className="p-3.5 bg-white/10 rounded-xl border border-white/10 flex justify-between items-center text-sm font-medium transition-colors hover:bg-white/15"
                      >
                        {track}
                        <ChevronRight size={18} className="opacity-70" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      <footer className="border-t border-outline-variant bg-surface-container-high">
        <div className="max-w-6xl mx-auto px-gutter md:px-margin-desktop py-6 text-center md:text-left">
          <span className="text-on-surface-variant text-sm">
            © 2026 LinkRouter
          </span>
        </div>
      </footer>
    </div>
  );
}
