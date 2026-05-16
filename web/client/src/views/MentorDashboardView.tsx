import { useEffect, useState } from "react";
import { Loader2, Users, AlertTriangle, Calendar, Target } from "lucide-react";
import { getMentorDashboard } from "../api/client";
import type { MentorDashboard } from "../api/types";
import { useAuth } from "../context/AuthContext";
import MentorReusabilityPanel from "../components/MentorReusabilityPanel";

function HealthSparkline({ values }: { values: number[] }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const trend = values[values.length - 1] - values[0];
  return (
    <div className="mt-3">
      <p className="text-[10px] text-on-surface-variant uppercase mb-1">Health trend</p>
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
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return <p className="text-error text-center py-12 font-medium">{error}</p>;
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
    <main className="px-gutter md:px-margin-desktop max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-background">Mentor cohort</h1>
        <p className="text-on-surface-variant mt-2">
          {mentor?.name ? `Signed in as ${mentor.name}` : "Your assigned startups"}
          {mentor?.title ? ` · ${mentor.title}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-sm font-semibold">
            <Users size={18} className="text-primary" />
            {activeCount} active
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-error/40 bg-error-container/20 text-sm font-semibold text-error">
            <AlertTriangle size={18} />
            {interventionCount} intervention
          </span>
          {capacityPct != null && (
            <span className="text-sm text-on-surface-variant">
              {stats?.capacityUsed}/{stats?.capacity} slots ({capacityPct}% utilised)
            </span>
          )}
        </div>
      </div>

      {dashboard && <MentorReusabilityPanel dashboard={dashboard} />}

      {interventions.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-error" size={22} />
            Intervention queue ({interventions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interventions.map((item) => (
              <div
                key={item.linkageId}
                className="bg-error-container/15 border border-error/40 rounded-xl p-5"
              >
                <h3 className="font-semibold text-lg">{item.startup}</h3>
                <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{item.goal}</p>
                <p className="text-sm font-semibold text-error mt-3">
                  Health {item.healthScore != null ? `${Math.round(item.healthScore)}%` : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target size={22} className="text-primary" />
          Active startups ({assigned.length})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assigned.map((s) => (
            <div
              key={s.linkageId}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6"
            >
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
                    className={`text-2xl font-bold ${
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
          ))}
        </div>
      </section>
    </main>
  );
}
