import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import HomeView from "./views/HomeView";
import ApplyView from "./views/ApplyView";
import ResultView from "./views/ResultView";
import AdminView from "./views/AdminView";

export type ViewType = "home" | "apply" | "result" | "admin";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const navigate = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const onApplicationCreated = useCallback((id: string) => {
    setApplicationId(id);
    setCurrentView("result");
  }, []);

  return (
    <AuthProvider>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen font-sans text-on-surface bg-surface w-full"
        >
          {currentView === "home" && <HomeView onNavigate={navigate} />}
          {currentView === "apply" && (
            <ApplyView onNavigate={navigate} onApplicationCreated={onApplicationCreated} />
          )}
          {currentView === "result" && (
            <ResultView
              onNavigate={navigate}
              applicationId={applicationId}
            />
          )}
          {currentView === "admin" && <AdminView onNavigate={navigate} />}
        </motion.div>
      </AnimatePresence>
    </AuthProvider>
  );
}
