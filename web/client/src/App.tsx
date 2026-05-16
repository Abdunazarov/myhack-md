import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth, type AppEntity } from "./context/AuthContext";
import AppHeader from "./components/AppHeader";
import HomeView from "./views/HomeView";
import ApplyView from "./views/ApplyView";
import ResultView from "./views/ResultView";
import FounderDashboardView from "./views/FounderDashboardView";
import MentorDashboardView from "./views/MentorDashboardView";

export type ViewType =
  | "home"
  | "apply"
  | "result"
  | "founder-dashboard"
  | "mentor-dashboard";

const STARTUP_VIEWS: ViewType[] = ["home", "apply", "result", "founder-dashboard"];
const MENTOR_VIEWS: ViewType[] = ["home", "mentor-dashboard"];

function defaultViewForEntity(entity: AppEntity): ViewType {
  return entity === "startup" ? "founder-dashboard" : "mentor-dashboard";
}

function AppRoutes() {
  const { entity } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const prevEntity = useRef(entity);

  const navigate = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  useEffect(() => {
    if (prevEntity.current !== entity) {
      prevEntity.current = entity;
      setCurrentView(defaultViewForEntity(entity));
      return;
    }
    const allowed = entity === "startup" ? STARTUP_VIEWS : MENTOR_VIEWS;
    if (!allowed.includes(currentView)) {
      setCurrentView(defaultViewForEntity(entity));
    }
  }, [entity, currentView]);

  const onApplicationCreated = useCallback((id: string) => {
    setApplicationId(id);
    setCurrentView("result");
  }, []);

  const onViewApplicationResult = useCallback((id: string) => {
    setApplicationId(id);
    setCurrentView("result");
  }, []);

  return (
    <>
      <AppHeader currentView={currentView} entity={entity} onNavigate={navigate} />
      <div className="pt-16">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${entity}-${currentView}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-[calc(100vh-4rem)] font-sans text-on-surface bg-surface w-full"
          >
            {currentView === "home" && <HomeView onNavigate={navigate} entity={entity} />}
            {currentView === "apply" && entity === "startup" && (
              <ApplyView onNavigate={navigate} onApplicationCreated={onApplicationCreated} />
            )}
            {currentView === "result" && entity === "startup" && (
              <ResultView onNavigate={navigate} applicationId={applicationId} />
            )}
            {currentView === "founder-dashboard" && entity === "startup" && (
              <FounderDashboardView
                onNavigate={navigate}
                onViewApplication={onViewApplicationResult}
              />
            )}
            {currentView === "mentor-dashboard" && entity === "mentor" && (
              <MentorDashboardView />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
