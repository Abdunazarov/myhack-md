import { useEffect, useState } from "react";
import {
  Rocket,
  Brain,
  Shield,
  Settings,
  FileText,
  GitBranch,
  TrendingUp,
  Activity,
  User,
  Network,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { getAdminDashboard } from "../api/client";
import type { AdminDashboard, ApplicationRecord, ApplicationStatus } from "../api/types";
import { useAuth } from "../context/AuthContext";
import type { ViewType } from "../App";

function statusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "Routed":
      return "bg-secondary-container text-on-secondary-container";
    case "Eligible":
      return "bg-primary-container text-on-primary-container";
    case "Submitted":
      return "bg-tertiary-container text-on-tertiary-container";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}

function readinessForApp(app: ApplicationRecord): string {
  const score = app.intakeAudits?.[0]?.readinessScore;
  return score != null ? `${Math.round(score)}%` : "—";
}

function recommendedForApp(app: ApplicationRecord): string {
  return (
    app.routingDecisions?.[0]?.recommendedProgramme?.name ??
    app.targetProgramme?.name ??
    "Pending"
  );
}

export default function AdminView({ onNavigate }: { onNavigate: (view: ViewType) => void }) {
  const { token, loginAsRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let authToken = token;
        if (!authToken) {
          await loginAsRole("Admin");
          authToken = localStorage.getItem("cradle_auth_token");
        }
        if (!authToken) throw new Error("Not signed in");
        const data = await getAdminDashboard(authToken);
        if (!cancelled) setDashboard(data);
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

  const totalApps = dashboard?.totals.applications ?? 0;
  const statusRows = dashboard?.applicationsByStatus ?? [];
  const maxStatusCount = Math.max(...statusRows.map((r) => r.count), 1);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-surface-bright border-b border-outline-variant flex justify-between items-center px-gutter md:px-margin-desktop w-full h-16 sticky top-0 z-50">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate("home")}
        >
          <Rocket className="text-primary" size={24} />
          <h1 className="text-xl font-bold text-primary tracking-tight">Cradle LinkRouter</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("apply")}
          className="bg-primary text-on-primary text-sm font-semibold px-6 py-2 rounded-full"
        >
          Apply
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col h-full py-2 bg-surface shadow-xl w-80 border-r border-outline-variant fixed left-0 top-16 bottom-0">
          <nav className="flex-1 space-y-1 mt-4">
            <button
              type="button"
              onClick={() => onNavigate("result")}
              className="w-full text-on-surface-variant hover:bg-surface-container-high rounded-full mx-2 px-4 h-12 flex items-center gap-4"
            >
              <Brain size={20} />
              <span>Founder Dashboard</span>
            </button>
            <button
              type="button"
              className="w-full bg-primary-container text-on-primary-container font-bold rounded-full mx-2 px-4 h-12 flex items-center gap-4"
            >
              <Shield size={20} />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              className="w-full text-on-surface-variant rounded-full mx-2 px-4 h-12 flex items-center gap-4 opacity-50"
            >
              <Settings size={20} />
              <span>Programme Settings</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 md:ml-80">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
                  <FileText className="text-primary bg-primary-container p-2 rounded-lg mb-4" size={40} />
                  <p className="text-on-surface-variant text-xs font-semibold uppercase">
                    Total Applications
                  </p>
                  <h2 className="text-4xl font-bold mt-1">{totalApps}</h2>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
                  <GitBranch className="text-tertiary bg-tertiary-container p-2 rounded-lg mb-4" size={40} />
                  <p className="text-on-surface-variant text-xs font-semibold uppercase">
                    Ecosystem Projects
                  </p>
                  <h2 className="text-4xl font-bold mt-1">
                    {dashboard.totals.ecosystemProjects}
                  </h2>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
                  <TrendingUp className="text-secondary bg-secondary-container p-2 rounded-lg mb-4" size={40} />
                  <p className="text-on-surface-variant text-xs font-semibold uppercase">
                    Avg Readiness Score
                  </p>
                  <h2 className="text-4xl font-bold mt-1">
                    {dashboard.totals.averageReadinessScore.toFixed(1)}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-semibold mb-6">Applications by Status</h3>
                  <div className="space-y-4">
                    {statusRows.map((row) => (
                      <div key={row.status} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>{row.status.replace(/_/g, " ")}</span>
                          <span className="text-on-surface-variant">{row.count}</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 aspect-square rounded-xl bg-surface-container-low flex items-center justify-center">
                    <Activity className="text-outline" size={48} />
                  </div>
                </section>

                <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-outline-variant">
                    <h3 className="text-xl font-semibold">Latest Applications</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                          <th className="px-6 py-4">Company</th>
                          <th className="px-6 py-4">Sector</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Readiness</th>
                          <th className="px-6 py-4">Recommended</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {dashboard.latestApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-surface-container">
                            <td className="px-6 py-4 text-sm font-medium">
                              {app.ecosystemProject.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant">
                              {app.ecosystemProject.sector}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(app.status)}`}
                              >
                                {app.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{readinessForApp(app)}</td>
                            <td className="px-6 py-4 text-sm">{recommendedForApp(app)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-surface-container-lowest border-t border-outline-variant pb-2">
        <button type="button" onClick={() => onNavigate("home")} className="flex flex-col items-center">
          <LayoutDashboard size={20} />
        </button>
        <button type="button" className="flex flex-col items-center bg-secondary-container rounded-full px-5 py-1">
          <Network size={20} />
        </button>
        <button type="button" className="flex flex-col items-center">
          <User size={20} />
        </button>
      </nav>
    </div>
  );
}
