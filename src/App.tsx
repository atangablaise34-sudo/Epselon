import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Network, Brain, Layers, Settings2, LogOut, 
  Menu, X, Sparkles, Cpu, Compass, User, RefreshCw,
  Sun, Moon
} from "lucide-react";
import { UserProfile, StudySession, FlashcardCollection, Flashcard } from "./types";
import { fetchSession, fetchStudySessions, fetchFlashcards, logoutUser, updatePreferences } from "./lib/api";

import Splash from "./components/Splash";
import AuthFlow from "./features/auth/AuthFlow";
import Nexus from "./features/nexus/Nexus";
import StudySessionView from "./features/study/StudySessionView";
import FlashcardLibrary from "./features/flashcards/FlashcardLibrary";
import SettingsView from "./features/settings/SettingsView";
import OnboardingView from "./features/onboarding/OnboardingView";
import GradientMenu from "../components/ui/gradient-menu";
import RadialPulseLoader from "../components/ui/loading-animation";
import WorkspaceMascot from "./components/WorkspaceMascot";
import GraphWatermark from "./components/GraphWatermark";
import { useFocusMode } from "./context/FocusModeContext";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFocusMode } = useFocusMode();

  
  // Navigation
  const [currentRoute, setCurrentRoute] = useState<"workspace" | "nexus" | "flashcards" | "settings">("settings");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Cached academic resources
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [collections, setCollections] = useState<FlashcardCollection[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passedTopicFromNexus, setPassedTopicFromNexus] = useState<string | undefined>(undefined);

  // 1. Initial Authentication Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const sessionUser = await fetchSession();
        if (sessionUser) {
          setUser(sessionUser); localStorage.setItem('activeSessionUserId', sessionUser.id);
          await loadAcademicData();
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  // Load all user's academic items
  const loadAcademicData = async () => {
    try {
      const activeSessions = await fetchStudySessions();
      setSessions(activeSessions);

      const flashcardData = await fetchFlashcards();
      setCollections(flashcardData.collections);
      setFlashcards(flashcardData.flashcards);
    } catch (err) {
      console.error("Failed to fetch academic context files", err);
    }
  };

  const handleRefreshUser = async () => {
    try {
      const updatedUser = await fetchSession();
      if (updatedUser) {
        setUser(updatedUser);
      }
      await loadAcademicData();
    } catch (err) {
      console.error("Failed to refresh user profile data", err);
    }
  };

  const handleAuthSuccess = async (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser); localStorage.setItem('activeSessionUserId', authenticatedUser.id);
    setCurrentRoute("settings");
    try {
      await loadAcademicData();
    } catch (err) {
      console.error("Failed to load academic data on auth success", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null); localStorage.removeItem('activeSessionUserId');
      setCurrentRoute("nexus");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Nexus topic launch callback
  const handleLaunchTopicFromNexus = (topic: string) => {
    setPassedTopicFromNexus(topic);
    setCurrentRoute("workspace");
  };

  const handleStudyNavigation = (id: string) => {
    setActiveSessionId(id);
    setPassedTopicFromNexus(undefined);
    setCurrentRoute("workspace");
  };

  const handleToggleTheme = async () => {
    if (!user) return;
    const currentTheme = user.preferences?.theme || "light";
    const newTheme: "obsidian" | "light" | "cybernetic" = currentTheme === "light" ? "obsidian" : "light";

    // Optimistically update local state so the UI transitions instantly
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        theme: newTheme,
      },
    };
    setUser(updatedUser);

    try {
      await updatePreferences({
        theme: newTheme,
      });
    } catch (err) {
      console.error("Failed to persist theme preference:", err);
    }
  };

  // Determine active theme styles
  const activeTheme = (user?.preferences?.theme && user.preferences.theme !== "light") ? user.preferences.theme : "obsidian";
  
  // Outer Shell BG Styles (we separate text and actual solid color to allow z-index layers)
  const bgStyle = "text-slate-100";
  const pureBgColor = 
    activeTheme === "cybernetic" 
      ? "bg-[#050b0e]" 
      : "bg-[#0c0e12]";

  // Sidebar container styles
  const sidebarStyle = 
    activeTheme === "cybernetic"
      ? "bg-[#081217]/95 border-r border-[#143542]"
      : "bg-[#12151c]/95 border-r border-[#1e2530]";

  const sideMenuHoverClass = 
    activeTheme === "cybernetic"
      ? "hover:bg-[#00ffcc]/10 text-slate-300 hover:text-[#00ffcc]"
      : "hover:bg-slate-800/60 text-slate-400 hover:text-white";

  const sideMenuActiveRealClass = 
    activeTheme === "cybernetic"
      ? "bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]"
      : "bg-blue-600/10 border-blue-500 text-blue-400";

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0c0e12] flex flex-col items-center justify-center text-white">
        <RadialPulseLoader text="LOADING SECURE SHELL..." color="#3b82f6" size={140} />
      </div>
    );
  }

  if (!user) {
    return <AuthFlow onAuthComplete={handleAuthSuccess} />;
  }

  const hasConnectedProviders = user.providers && user.providers.some(p => p.connected);

  if (!hasConnectedProviders) {
    return (
      <OnboardingView 
        user={user} 
        onRefreshUser={handleRefreshUser} 
        onComplete={() => setCurrentRoute("settings")} 
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${bgStyle} font-sans relative`}>
      {/* Absolute solid background layer placed behind z-[-10] elements */}
      <div className={`fixed inset-0 ${pureBgColor} z-[-20] pointer-events-none transition-colors duration-1000 ${isFocusMode ? "bg-[#040608]" : ""}`} />
      
      {/* Focus Mode Ambient Glow */}
      <div 
        className={`fixed inset-0 z-[-15] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0c0e12]/0 to-[#0c0e12]/0 transition-opacity duration-1000 ease-in-out ${isFocusMode ? "opacity-100" : "opacity-0"}`}
      />

      <div className="flex-1 flex flex-row">
        
        {/* 3. CORE VIEWPORT CONTAINER */}
        <main 
          className={`flex-1 flex flex-col w-full h-full p-2 min-[375px]:p-3 sm:p-6 md:p-8 lg:p-10 pb-24 min-[375px]:pb-28 sm:pb-36 overflow-y-auto max-w-7xl mx-auto transition-all duration-1000 ease-in-out ${currentRoute === "workspace" ? "no-scrollbar" : ""} ${isFocusMode ? "blur-md opacity-30 pointer-events-none scale-95" : ""}`}
        >
          <AnimatePresence mode="wait">
            {currentRoute === "nexus" && (
              <motion.div
                key="nexus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Nexus user={user} onLaunchTopic={handleLaunchTopicFromNexus} />
              </motion.div>
            )}

            {currentRoute === "workspace" && (
              <motion.div
                key="workspace"
                className="h-full flex-1 flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StudySessionView 
                  user={user} 
                  sessions={sessions} 
                  activeSessionId={activeSessionId}
                  onRefreshSessions={loadAcademicData}
                  onSelectSession={setActiveSessionId}
                  initialTopic={passedTopicFromNexus}
                  onRefreshUser={loadAcademicData}
                />
              </motion.div>
            )}

            {currentRoute === "flashcards" && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FlashcardLibrary 
                  user={user} 
                  collections={collections} 
                  flashcards={flashcards}
                  onRefreshData={loadAcademicData}
                  sessions={sessions}
                  onReopenSession={handleStudyNavigation}
                />
              </motion.div>
            )}

            {currentRoute === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsView user={user} onRefreshUser={loadAcademicData} onLogout={handleLogout} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating OS-Style Gradient Quick Navigation Bar Dock */}
        <div className={`fixed bottom-6 left-0 right-0 z-40 pointer-events-none flex justify-center px-4 transition-all duration-1000 ease-in-out ${isFocusMode ? "opacity-0 translate-y-10" : "opacity-100"}`}>
          <div className="pointer-events-auto flex items-center justify-center">
            <GradientMenu 
              currentRoute={currentRoute} 
              onNavigate={(route) => {
                setCurrentRoute(route as any);
                setPassedTopicFromNexus(undefined);
              }} 
              theme={activeTheme}
              language={user.preferences?.language || user.preferredLanguage || "en"}
            />
          </div>
        </div>

      </div>

      {(currentRoute === "workspace" || currentRoute === "flashcards") && (
        <WorkspaceMascot />
      )}

      {currentRoute === "nexus" && (
        <GraphWatermark />
      )}
    </div>
  );
}
