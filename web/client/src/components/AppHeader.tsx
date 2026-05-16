import { Rocket } from "lucide-react";
import RoleSwitcher from "./RoleSwitcher";
import type { AppEntity } from "../context/AuthContext";
import type { ViewType } from "../App";

type AppHeaderProps = {
  currentView: ViewType;
  entity: AppEntity;
  onNavigate: (view: ViewType) => void;
};

export default function AppHeader({ currentView, entity, onNavigate }: AppHeaderProps) {
  const startupNav: { view: ViewType; label: string }[] = [
    { view: "home", label: "Home" },
    { view: "apply", label: "Apply" },
    { view: "founder-dashboard", label: "Dashboard" },
  ];

  const mentorNav: { view: ViewType; label: string }[] = [
    { view: "home", label: "Home" },
    { view: "mentor-dashboard", label: "My cohort" },
  ];

  const nav = entity === "startup" ? startupNav : mentorNav;

  return (
    <header className="bg-surface-bright border-b border-outline-variant fixed top-0 w-full z-[60] h-16 flex justify-between items-center px-gutter md:px-margin-desktop gap-4">
      <button
        type="button"
        className="flex items-center gap-2 shrink-0"
        onClick={() => onNavigate("home")}
      >
        <Rocket className="text-primary" size={24} />
        <span className="text-xl font-bold text-primary tracking-tight hidden sm:inline">
          Cradle LinkRouter
        </span>
      </button>

      <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
        {nav.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentView === view
                ? "text-primary bg-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <RoleSwitcher />
        {entity === "startup" && (
          <button
            type="button"
            onClick={() => onNavigate("apply")}
            className="hidden sm:block bg-primary text-on-primary px-5 py-2 rounded-xl text-sm font-semibold"
          >
            Apply
          </button>
        )}
      </div>
    </header>
  );
}
