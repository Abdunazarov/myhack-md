import { useState } from "react";
import { Menu, X, Waypoints } from "lucide-react";
import { motion } from "motion/react";
import RoleSwitcher from "./RoleSwitcher";
import type { AppEntity } from "../context/AuthContext";
import type { ViewType } from "../App";

type AppHeaderProps = {
  currentView: ViewType;
  entity: AppEntity;
  onNavigate: (view: ViewType) => void;
};

function NavLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="relative px-4 py-2 text-sm font-medium transition-colors text-on-surface-variant hover:text-on-background data-[active=true]:text-primary"
    >
      {children}
      {active && (
        <motion.span
          layoutId="main-nav-underline"
          className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  );
}

export default function AppHeader({ currentView, entity, onNavigate }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const go = (view: ViewType) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant fixed top-0 w-full z-[60] h-16">
        <div className="h-full max-w-6xl mx-auto px-gutter md:px-margin-desktop flex justify-between items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 shrink-0 group"
            onClick={() => go("home")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Waypoints className="text-primary" size={20} />
            </div>
            <span className="text-lg font-bold text-on-background tracking-tight hidden sm:inline">
              LinkRouter
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {nav.map(({ view, label }) => (
              <NavLink key={view} active={currentView === view} onClick={() => go(view)}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <RoleSwitcher />
            {entity === "startup" && (
              <button
                type="button"
                onClick={() => go("apply")}
                className="hidden sm:inline-flex items-center rounded-xl bg-primary text-on-primary px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                Apply
              </button>
            )}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 left-0 right-0 z-[55] md:hidden bg-surface-container-lowest border-b border-outline-variant shadow-lg px-gutter py-4"
        >
          <nav className="flex flex-col gap-1">
            {nav.map(({ view, label }) => (
              <button
                key={view}
                type="button"
                onClick={() => go(view)}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === view
                    ? "text-primary bg-primary/8"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </motion.div>
      )}
    </>
  );
}
