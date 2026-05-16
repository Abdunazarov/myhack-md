import { useEffect, useState } from "react";
import { Loader2, Users, AlertTriangle, Calendar, Target, Gauge } from "lucide-react";
import { getMentorDashboard } from "../api/client";
import type { MentorDashboard } from "../api/types";
import { useAuth } from "../context/AuthContext";
import MentorReusabilityPanel from "../components/MentorReusabilityPanel";
import { PageShell, PageHeader, FadeIn, StaggerGrid, StaggerItem } from "../components/layout/PageShell";
import { cardHover } from "../components/layout/motion";
import StatCard from "../components/ui/StatCard";

function HealthSparkline({ values }: { values: number[] }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const trend = values[values.length - 1] - values[0];
  return (
    <div className="mt-3">
      <p className="text-[10px] text-on-surface-variant uppercase mb-1 tracking-wide">
        Health trend
      </p>
      <div className="flex items-end gap-0.5 h-8">
        {values.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${trend >= 0 ? "bg-primary/70" : "bg-error/60"}`}
            style={{ height: `${Math.max(4, ((v - min) / (max - min || 1)) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MentorDashboardView() {
  const { token, loginAsRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<MentorDashboard | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let authToken = token;
        if (!authToken) {
          await loginAsRole("Mentor");
          authToken = localStorage.getItem("cradle_auth_token");
        }
        if (!authToken) throw new Error("Not signed in");
        const data = await getMentorDashboard(authToken);
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load cohort");
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

  if (loading) {
    return (
      <PageShell>
        <FadeIn className="flex justify-center py-32">
          <Loader2 className="animate-spin text-primary" size={40} />
        </FadeIn>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <FadeIn>
          <p className="text-error text-center py-12 font-medium rounded-xl bg-error-container/20 border border-error/20 p-6">
            {error}
          </p>
        </FadeIn>
      </PageShell>
    );
  }

  const mentor = dashboard?.mentor;
  const stats = dashboard?.stats;
  const assigned = dashboard?.assignedStartups ?? [];
  const interventions = dashboard?.interventionQueue ?? [];
  const activeCount = stats?.assignedStartups ?? assigned.length;
  const interventionCount = stats?.requiresIntervention ?? interventions.length;
  const capacityPct =
    stats?.capacity && stats.capacityUsed != null
      ? Math.round((stats.capacityUsed / stats.capacity) * 100)
      : null;

  return (
    <PageShell className="space-y-10">
      <PageHeader
        title="Mentor cohort"
        description={
          mentor?.name
            ? `Signed in as ${mentor.name}${mentor?.title ? ` · ${mentor.title}` : ""}`
            : "Your assigned startups and intervention queue"
        }
      />

      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        <StatCard
          label="Active startups"
          value={activeCount}
          icon={Users}
          accent="primary"
          hint="Currently in your cohort"
        />
        <StatCard
          label="Intervention queue"
          value={interventionCount}
          icon={AlertTriangle}
          accent="alert"
          hint="Startups needing support"
        />
        {capacityPct != null && stats && (
          <StatCard
            label="Capacity"
            value={`${stats.capacityUsed}/${stats.capacity}`}
            icon={Gauge}
            accent="secondary"
            hint={`${capacityPct}% utilised`}
          />
        )}
      </StaggerGrid>

      {dashboard && (
        <FadeIn delay={0.05}>
          <MentorReusabilityPanel dashboard={dashboard} />
        </FadeIn>
      )}

      {interventions.length > 0 && (
        <FadeIn delay={0.08}>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-outline-variant">
              <AlertTriangle className="text-error shrink-0" size={20} />
              Intervention queue
              <span className="text-sm font-normal text-on-surface-variant">
                ({interventions.length})
              </span>
            </h2>
            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interventions.map((item) => (
                <StaggerItem key={item.linkageId}>
                  <div className={`rounded-2xl border border-error/35 bg-error-container/10 p-5 h-full ${cardHover}`}>
                    <h3 className="font-semibold text-lg">{item.startup}</h3>
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{item.goal}</p>
                    <p className="text-sm font-semibold text-error mt-3">
                      Health {item.healthScore != null ? `${Math.round(item.healthScore)}%` : "—"}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </section>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-outline-variant">
            <Target size={20} className="text-primary shrink-0" />
            Active startups
            <span className="text-sm font-normal text-on-surface-variant">({assigned.length})</span>
          </h2>
          <StaggerGrid className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assigned.map((s) => (
              <StaggerItem key={s.linkageId}>
                <div className={`rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm h-full ${cardHover}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{s.name}</h3>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {s.sector} · {s.stage}
                      </p>
                      {s.matchScore != null && (
                        <p className="text-xs text-primary font-medium mt-1">
                          {Math.round(s.matchScore * 100)}% match confidence
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-on-surface-variant">Health</p>
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          (s.healthScore ?? 0) >= 75
                            ? "text-primary"
                            : (s.healthScore ?? 0) >= 50
                              ? "text-on-surface"
                              : "text-error"
                        }`}
                      >
                        {s.healthScore != null ? `${Math.round(s.healthScore)}%` : "—"}
                      </p>
                    </div>
                  </div>
                  {s.goal && (
                    <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{s.goal}</p>
                  )}
                  {s.healthHistory && s.healthHistory.length > 0 && (
                    <HealthSparkline values={s.healthHistory} />
                  )}
                  {s.lastActivityAt && (
                    <p className="text-[10px] text-on-surface-variant mt-3 flex items-center gap-1">
                      <Calendar size={12} />
                      Last activity {new Date(s.lastActivityAt).toLocaleDateString("en-MY")}
                    </p>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      </FadeIn>
    </PageShell>
  );
}
