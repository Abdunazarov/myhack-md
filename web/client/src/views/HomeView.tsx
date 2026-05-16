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

export default function HomeView({
  onNavigate,
  entity,
}: {
  onNavigate: (view: ViewType) => void;
  entity: AppEntity;
}) {
  const isStartup = entity === "startup";

  return (
    <>
      <main className="pb-24 md:pb-0">
        <section className="px-gutter md:px-margin-desktop py-xxl md:py-32 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-xl">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-bold text-on-background mb-md tracking-tight leading-tight">
                {isStartup
                  ? "Intelligent intake for Malaysia’s innovation ecosystem"
                  : "Guide your cohort with data-driven mentorship"}
              </h2>
              <p className="text-base md:text-lg text-on-surface-variant mb-xl max-w-2xl leading-relaxed">
                {isStartup
                  ? "AI pitch audit + benchmark comparison + automatic programme routing. Streamline your journey from idea to impact."
                  : "See assigned startups, intervention priorities, and historical outcomes — all in one mentor workspace."}
              </p>
              <div className="flex flex-col sm:flex-row gap-md justify-center md:justify-start">
                {isStartup ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate("apply")}
                      className="bg-primary text-on-primary px-8 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                      Submit Application
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate("founder-dashboard")}
                      className="border border-outline-variant text-on-surface-variant px-8 py-3 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition-all active:scale-95"
                    >
                      My Dashboard
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate("mentor-dashboard")}
                    className="bg-primary text-on-primary px-8 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    Open mentor cohort
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-surface-container">
                <img
                  className="w-full h-full object-cover"
                  alt="Dashboard Preview"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMfdKWChZTipdL4hRUqvDbE0ZXYR_kIlaN-FhAxHJSw7CLVEaUIom6IJQOxa47g8nsVSjOcOc5zFrfjz1oDcnn_zxoPyYWGyvGJ0TiXRMflD1CXxvr2assap3PMPsseqh--NRg5lcbwxpHmBNLgBO-Q1Ea8_GZl7Ko-orleBVRCuWNbmyW7KqloYTD4ma48x-Ff3IkqKm8NeRiz7eEr1SiGtviXBMvXNvc7BYq_s18SvQgpvhLEFZliu2kMepIYJviJ0Rk1o9wdA0M"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-gutter md:px-margin-desktop py-xxl bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-xl">
              <h3 className="text-2xl font-semibold text-on-surface">
                {isStartup ? "How it Works" : "Your mentor workflow"}
              </h3>
              <p className="text-base text-on-surface-variant mt-1">
                {isStartup
                  ? "Our three-step intelligent routing process"
                  : "Support startups from assignment through outcomes"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg relative">
              {isStartup ? (
                <>
                  <div className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-md">
                      <FileText size={24} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Submit Profile</h4>
                    <p className="text-sm text-on-surface-variant">
                      Upload your deck and team details through our simplified intake portal.
                    </p>
                  </div>
                  <div className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-md">
                      <Brain size={24} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">AI Audit vs Benchmarks</h4>
                    <p className="text-sm text-on-surface-variant">
                      Automated analysis compares your metrics against global and local startup
                      benchmarks.
                    </p>
                  </div>
                  <div className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center justify-center mb-md">
                      <Waypoints size={24} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Scored & Routed</h4>
                    <p className="text-sm text-on-surface-variant">
                      Receive a detailed score and automatic matching to the ideal ecosystem track.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-md">
                      <Users size={24} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Assigned startups</h4>
                    <p className="text-sm text-on-surface-variant">
                      View active cohort members matched to your expertise and capacity.
                    </p>
                  </div>
                  <div className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-md">
                      <Brain size={24} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Intervention queue</h4>
                    <p className="text-sm text-on-surface-variant">
                      Prioritize startups that need help based on health scores and roadblocks.
                    </p>
                  </div>
                  <div className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center justify-center mb-md">
                      <BadgeCheck size={24} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Track outcomes</h4>
                    <p className="text-sm text-on-surface-variant">
                      Review historical wins and session history to improve future matches.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {isStartup && (
          <section className="px-gutter md:px-margin-desktop py-xxl">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
                <div className="md:col-span-7 bg-white p-12 rounded-3xl border border-outline-variant flex flex-col justify-between overflow-hidden relative">
                  <div className="relative z-10">
                    <span className="bg-primary-container text-on-primary-container text-xs font-semibold px-3 py-1 rounded-full mb-6 inline-block">
                      Module 1 Active
                    </span>
                    <h3 className="text-3xl font-bold mb-6">AI Pitch Audit</h3>
                    <ul className="space-y-3 text-base text-on-surface-variant">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="text-primary" size={20} /> Automated risk
                        identification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="text-primary" size={20} /> Core strength analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="text-primary" size={20} /> Vertical-specific
                        benchmarking
                      </li>
                    </ul>
                  </div>
                  <div className="mt-12 relative z-10">
                    <button
                      type="button"
                      onClick={() => onNavigate("apply")}
                      className="text-primary font-bold text-sm flex items-center gap-2 hover:underline"
                    >
                      Start application <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 bg-inverse-surface text-inverse-on-surface p-12 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">Ecosystem Routing</h3>
                    <p className="text-sm opacity-80 mb-8 leading-relaxed">
                      Instantly match with the right support based on your AI score and business
                      stage.
                    </p>
                    <div className="space-y-4">
                      {["Pre-Accelerator", "Mentor Readiness", "Direct Grant Track"].map(
                        (track) => (
                          <div
                            key={track}
                            className="p-4 bg-white/10 rounded-xl border border-white/10 flex justify-between items-center"
                          >
                            <span className="text-sm font-semibold">{track}</span>
                            <ChevronRight size={20} />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-surface-container-high border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center px-gutter py-6 w-full max-w-7xl mx-auto">
          <span className="text-on-surface-variant font-bold text-sm">
            © 2024 Cradle Fund. Powered by Gemini.
          </span>
        </div>
      </footer>
    </>
  );
}
