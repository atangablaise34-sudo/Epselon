import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Settings2, Eye, Sliders, Type, User, Globe, 
  Sparkles, ShieldAlert, Cpu, Check, HelpCircle, Save,
  Volume2, LogOut, KeyRound, ShieldCheck
} from "lucide-react";
import { UserProfile, UserPreferences, ProviderConnection } from "../../types";
import { updatePreferences, updateProviders, updateUserProfile } from "../../lib/api";
import { NIMO_VOICES, voiceService } from "../../lib/VoiceService";
import AIKeyConnectModal, { PROVIDERS_CONFIG, ProviderConfig } from "../../components/AIKeyConnectModal";

interface SettingsViewProps {
  user: UserProfile;
  onRefreshUser: () => void;
  onLogout?: () => void;
}

export default function SettingsView({ user, onRefreshUser, onLogout }: SettingsViewProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load active preferences from user
  const initialTheme = (user.preferences?.theme && user.preferences.theme !== "light") ? user.preferences.theme : "obsidian";
  const [theme, setTheme] = useState<UserPreferences["theme"]>(initialTheme);
  const [accentColor, setAccentColor] = useState<UserPreferences["accentColor"]>(user.preferences?.accentColor || "blue");
  const [fontSize, setFontSize] = useState<UserPreferences["fontSize"]>(user.preferences?.fontSize || "100%");
  const [teachingStyle, setTeachingStyle] = useState<UserPreferences["teachingStyle"]>(user.preferences?.teachingStyle || "Socratic");
  const [cognitiveLoad, setCognitiveLoad] = useState<UserPreferences["cognitiveLoad"]>(user.preferences?.cognitiveLoad || "Proficient");
  const [taxonomyFocus, setTaxonomyFocus] = useState<UserPreferences["taxonomyFocus"]>(user.preferences?.taxonomyFocus || "Analyze & Evaluate");
  const [contextAwareness, setContextAwareness] = useState<UserPreferences["contextAwareness"]>(user.preferences?.contextAwareness ?? true);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(user.preferences?.selectedVoiceId || "nimo-female-1");
  const [appLanguage, setAppLanguage] = useState<"en" | "fr">((user.preferences?.language || user.preferredLanguage || "en") as "en" | "fr");

  // Editable Profile States
  const [fullName, setFullName] = useState<string>(user.fullName || "");
  const [university, setUniversity] = useState<string>(user.university || "");
  const [faculty, setFaculty] = useState<string>(user.faculty || "");
  const [department, setDepartment] = useState<string>(user.department || "");
  const [academicLevel, setAcademicLevel] = useState<string>(user.academicLevel || "");
  const [learningStyle, setLearningStyle] = useState<UserProfile["learningStyle"]>(user.learningStyle || "Visual");
  const [weeklyCommitment, setWeeklyCommitment] = useState<UserProfile["weeklyCommitment"]>(user.weeklyCommitment || "5-10");
  const [learningObjectives, setLearningObjectives] = useState<string>(user.learningObjectives || "");

  // Provider states
  const [providers, setProviders] = useState<ProviderConnection[]>(user.providers || []);
  const [selectedProvider, setSelectedProvider] = useState<string>(user.preferences?.selectedProvider || "gemini");
  const [selectedModalProvider, setSelectedModalProvider] = useState<ProviderConfig | null>(null);

  useEffect(() => {
    setProviders(user.providers || []);
    setSelectedProvider(user.preferences?.selectedProvider || "gemini");
    setSelectedVoiceId(user.preferences?.selectedVoiceId || "nimo-female-1");
    setAppLanguage((user.preferences?.language || user.preferredLanguage || "en") as "en" | "fr");

    setFullName(user.fullName || "");
    setUniversity(user.university || "");
    setFaculty(user.faculty || "");
    setDepartment(user.department || "");
    setAcademicLevel(user.academicLevel || "");
    setLearningStyle(user.learningStyle || "Visual");
    setWeeklyCommitment(user.weeklyCommitment || "5-10");
    setLearningObjectives(user.learningObjectives || "");
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById("academic-prompt-profile");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenProviderModal = (config: ProviderConfig) => {
    setSelectedModalProvider(config);
  };

  const handleSaveProviderConnection = (data: {
    apiKey: string;
    email?: string;
    model: string;
    syncExistingChats: boolean;
  }) => {
    if (!selectedModalProvider) return;

    const id = selectedModalProvider.id;
    setProviders((prev) => {
      const exists = prev.find((p) => p.id === id);
      const updatedItem: ProviderConnection = {
        id,
        name: selectedModalProvider.name,
        connected: true,
        apiKey: data.apiKey,
        email: data.email,
        currentModel: data.model,
        latency: "35ms",
        lastSynced: new Date().toISOString(),
        features: selectedModalProvider.features,
        syncExistingChats: data.syncExistingChats,
      };

      if (exists) {
        return prev.map((p) => (p.id === id ? updatedItem : p));
      }
      return [...prev, updatedItem];
    });

    if (!selectedProvider) {
      setSelectedProvider(id);
    }

    setSelectedModalProvider(null);
  };

  const handleDisconnectProvider = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false } : p))
    );
    if (selectedProvider === id) {
      setSelectedProvider("system");
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await updatePreferences({
        theme,
        accentColor,
        fontSize,
        teachingStyle,
        cognitiveLoad,
        taxonomyFocus,
        contextAwareness,
        selectedProvider,
        selectedVoiceId,
        language: appLanguage
      });
      await updateProviders(providers);
      await updateUserProfile({
        fullName,
        university,
        faculty,
        department,
        academicLevel,
        learningStyle,
        weeklyCommitment,
        learningObjectives
      });
      onRefreshUser(); // Refresh root context
      setSuccessMsg(appLanguage === "fr" ? "Paramètres et profil mis à jour avec succès." : "App preferences & academic profile updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setSuccessMsg("Error updating preferences. Local state retained.");
    } finally {
      setLoading(false);
    }
  };


  const handleToggleProvider = (id: string) => {
    setProviders(prev => {
      const exists = prev.find(p => p.id === id);
      if (exists) {
        return prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p);
      }
      return [...prev, { id, name: PROVIDERS_CONFIG.find(x => x.id === id)?.name || id, connected: true, currentModel: "default-model", latency: "100ms", features: ["Standard"] }];
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Settings Intro */}
      <div>
        <h2 className="font-serif italic text-2xl text-white font-medium flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-brand-primary stroke-[1.5]" />
          {appLanguage === "fr" ? "Paramètres & Préférences" : "App Settings & Preferences"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {appLanguage === "fr" 
            ? "Configurez l'assistance d'apprentissage IA, la langue de l'application, les thèmes visuels et votre profil d'étude." 
            : "Configure AI learning guidance, app language, visual themes, and your study profile."}
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-mono">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Visual System & Themes */}
        <div className="lg:col-span-2 space-y-6">

          {/* Language Selector Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              {appLanguage === "fr" ? "Langue de l'application" : "App Language"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "en", name: "English", desc: "Standard English interface" },
                { id: "fr", name: "Français", desc: "Interface en français" },
              ].map((langItem) => (
                <button
                  id={`lang_opt_${langItem.id}`}
                  key={langItem.id}
                  onClick={() => setAppLanguage(langItem.id as any)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    appLanguage === langItem.id
                      ? "bg-indigo-500/15 border-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/30"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{langItem.name}</span>
                    {appLanguage === langItem.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{langItem.desc}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Theme card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-500" />
              {appLanguage === "fr" ? "Thème visuel" : "Visual Theme"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "obsidian", name: "Obsidian Dark", desc: "#0c0e12 dark theme" },
                { id: "cybernetic", name: "Cybernetic Terminal", desc: "High contrast dark" },
              ].map((item) => (
                <button
                  id={`theme_opt_${item.id}`}
                  key={item.id}
                  onClick={() => setTheme(item.id as any)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    theme === item.id
                      ? "bg-brand-primary/10 border-brand-primary text-white shadow-md shadow-brand-dark/20"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="text-xs font-semibold">{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Model tweaks card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-500" />
              {appLanguage === "fr" ? "Paramètres du Tuteur IA" : "AI Learning & Tutoring Settings"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teaching Style */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">
                    {appLanguage === "fr" ? "Style d'enseignement" : "Teaching & Dialogue Style"}
                  </label>
                  <select
                    id="sel_pref_style"
                    value={teachingStyle}
                    onChange={(e) => setTeachingStyle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Socratic">{appLanguage === "fr" ? "Tuteur Guidé (Pose des questions d'orientation)" : "Guided AI Tutor (Asks Guiding Questions)"}</option>
                    <option value="Explanatory">{appLanguage === "fr" ? "Narratif Explicatif (Réponses directes)" : "Explanatory Narrative (Direct Explanations)"}</option>
                    <option value="Practical">{appLanguage === "fr" ? "Pratique / Code (Exercices & Formules)" : "Practical Sandbox (Code & Problem Solving)"}</option>
                    <option value="Theoretical">{appLanguage === "fr" ? "Théorique (Théorèmes & Preuves)" : "Theoretical Axioms (Theorems & Proofs)"}</option>
                  </select>
                </div>

                {/* Cognitive Load */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">
                    {appLanguage === "fr" ? "Niveau de complexité d'étude" : "Study Complexity Level"}
                  </label>
                  <select
                    id="sel_pref_load"
                    value={cognitiveLoad}
                    onChange={(e) => setCognitiveLoad(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Novice">{appLanguage === "fr" ? "Débutant (Rythme doux & explications claires)" : "Novice (Gentle pacing & clear concepts)"}</option>
                    <option value="Proficient">{appLanguage === "fr" ? "Intermédiaire (Niveau universitaire standard)" : "Proficient (University level standard)"}</option>
                    <option value="Master">{appLanguage === "fr" ? "Avancé (Preuves complexes & équations)" : "Master (Advanced proofs & equations)"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Taxonomy focus */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Bloom's Taxonomy priority</label>
                  <select
                    id="sel_pref_tax"
                    value={taxonomyFocus}
                    onChange={(e) => setTaxonomyFocus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Analyze & Evaluate">Analyze & Evaluate</option>
                    <option value="Apply & Understand">Apply & Understand</option>
                    <option value="Create & Synthesize">Create & Synthesize</option>
                  </select>
                </div>

                {/* Font Scaling */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Visual Font Scale</label>
                  <select
                    id="sel_pref_font"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="100%">100% (Standard Slate)</option>
                    <option value="90%">90% (High density)</option>
                    <option value="110%">110% (Readable Editorial)</option>
                    <option value="120%">120% (Magnified)</option>
                  </select>
                </div>
              </div>

              {/* Context Awareness toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="chk_context"
                  checked={contextAwareness}
                  onChange={() => setContextAwareness(!contextAwareness)}
                  className="rounded bg-slate-950 border-slate-800 text-brand-primary focus:ring-0"
                />
                <label htmlFor="chk_context" className="text-xs text-slate-300 cursor-pointer">
                  Enable Session Context Awareness (Remembers consecutive chat interactions)
                </label>
              </div>
            </div>
          </div>

          {/* Nimo Mascot Voice Preferences */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-slate-500" />
              Nimo Mascot Voice Preferences
            </h3>
            <p className="text-xs text-slate-400">
              Select the voice profile for Nimo, your AI Study Companion in Focus Mode. Features high-quality voice profiles simulated with browser synthesis parameters.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NIMO_VOICES.map((voice) => (
                <button
                  id={`voice_opt_${voice.id}`}
                  key={voice.id}
                  type="button"
                  onClick={() => setSelectedVoiceId(voice.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between relative group ${
                    selectedVoiceId === voice.id
                      ? "bg-brand-primary/10 border-brand-primary text-white shadow-md shadow-brand-dark/20"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      {voice.name.replace("Nimo - ", "")}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono capitalize">
                      {voice.gender === "child" ? "👦 Kid" : voice.gender === "female" ? "👩 Female" : "👨 Male"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation(); // prevent setting voice as default immediately
                        voiceService.speak("Hi, I'm Nimo! Let's learn together.", () => {}, () => {}, voice.id);
                      }}
                      className="text-[10px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-1 rounded hover:bg-slate-800 cursor-pointer pointer-events-auto"
                      title="Test Voice"
                    >
                      ▶ Listen
                    </span>
                    {selectedVoiceId === voice.id && (
                      <span className="p-1 rounded-full bg-brand-primary/20 text-brand-primary">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Providers Management */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4 mt-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                AI Providers & Key Management
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Active Provider: <span className="text-purple-300 font-semibold">{selectedProvider}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROVIDERS_CONFIG.map((provider) => {
                const connectedInfo = providers.find((p) => p.id === provider.id);
                // System default is connected if explicitly chosen or default
                const isConnected = provider.isSystemDefault
                  ? connectedInfo?.connected !== false
                  : !!connectedInfo?.connected;
                const isDefault = selectedProvider === provider.id;

                return (
                  <div 
                    key={provider.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isConnected 
                        ? "bg-slate-950/60 border-emerald-500/30" 
                        : "bg-slate-950/30 border-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded bg-slate-900 ${provider.color}`}>
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-200">{provider.name}</span>
                            {provider.isSystemDefault && (
                              <span className="text-[8px] font-mono px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded">
                                Built-In
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {provider.isSystemDefault ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProviders((prev) => {
                              const exists = prev.find((p) => p.id === "system");
                              if (exists) return prev.map((p) => (p.id === "system" ? { ...p, connected: true } : p));
                              return [...prev, { id: "system", name: provider.name, connected: true, currentModel: "system-gemini-flash", latency: "25ms", features: provider.features }];
                            });
                            setSelectedProvider("system");
                          }}
                          className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                            isDefault 
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                              : "bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 cursor-pointer"
                          }`}
                        >
                          {isDefault ? "Active Default" : "Set Active"}
                        </button>
                      ) : isConnected ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenProviderModal(provider)}
                            className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer"
                          >
                            Edit Key
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDisconnectProvider(provider.id)}
                            className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenProviderModal(provider)}
                          className="text-[9px] font-mono px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3 h-3" /> Connect Key
                        </button>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 leading-relaxed min-h-[28px]">
                      {provider.desc}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-mono">
                        {connectedInfo?.currentModel || provider.models[0]?.id || "Ready"}
                      </span>

                      {isConnected && !provider.isSystemDefault && (
                        <button
                          type="button"
                          onClick={() => setSelectedProvider(provider.id)}
                          className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                            isDefault 
                              ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50" 
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {isDefault && <Check className="w-2.5 h-2.5" />}
                          {isDefault ? "Default" : "Set Default"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger parameters update */}
          <button
            id="btn_save_preferences"
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-medium text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-brand-dark/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {loading 
              ? (appLanguage === "fr" ? "Enregistrement..." : "Saving settings...") 
              : (appLanguage === "fr" ? "Appliquer les paramètres" : "Apply Settings")}
          </button>
        </div>

        {/* Right column: Academic & Prompt Profile */}
        <div className="space-y-6">
          <div id="academic-prompt-profile" className="p-5 rounded-xl border border-brand-primary/40 bg-slate-900/50 space-y-4 ring-1 ring-brand-primary/30 shadow-lg shadow-brand-dark/10 transition-all">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-light" />
                Academic & Prompt Profile
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-light border border-brand-primary/30">
                Primary Profile
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="settings_full_name" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  id="settings_full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Institutional Email (Read-Only)</span>
                <span className="text-xs text-slate-400 block font-mono bg-slate-950/20 px-3 py-1.5 rounded border border-slate-900">{user.email}</span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_university" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">University / College</label>
                <input
                  id="settings_university"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_faculty" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Faculty / School</label>
                <input
                  id="settings_faculty"
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_department" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Department / Field</label>
                <input
                  id="settings_department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_academic_level" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Academic Level</label>
                <select
                  id="settings_academic_level"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary h-[32px]"
                >
                  <option value="Undergraduate">Undergraduate Student</option>
                  <option value="Master's Candidate">Master's Candidate</option>
                  <option value="PhD Candidate">PhD Candidate</option>
                  <option value="Postdoctoral Researcher">Postdoctoral Researcher</option>
                  <option value="Faculty Member">Faculty / Professor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_learning_style" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Learning Style</label>
                <select
                  id="settings_learning_style"
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value as any)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary h-[32px]"
                >
                  <option value="Visual">Visual (Graphs, Charts, Models)</option>
                  <option value="Auditory">Auditory (Socratic explanations)</option>
                  <option value="Reading">Reading & Writing (Dense derivations)</option>
                  <option value="Kinesthetic">Kinesthetic (Interactive spaced cards)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_weekly_commitment" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Weekly Commitment</label>
                <select
                  id="settings_weekly_commitment"
                  value={weeklyCommitment}
                  onChange={(e) => setWeeklyCommitment(e.target.value as any)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary h-[32px]"
                >
                  <option value="1-5">Casual (1-5h)</option>
                  <option value="5-10">Proficient (5-10h)</option>
                  <option value="10-20">Intensive (10-20h)</option>
                  <option value="20+">Research Scholar (20h+)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings_objectives" className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Learning Goals & Objectives</label>
                <textarea
                  id="settings_objectives"
                  rows={4}
                  value={learningObjectives}
                  onChange={(e) => setLearningObjectives(e.target.value)}
                  placeholder="e.g., Master quantum field theory, strengthen linear algebra..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-brand-dark/10 text-xs text-brand-light space-y-3">
            <Cpu className="w-5 h-5 text-brand-light" />
            <h4 className="font-semibold text-slate-200">Gemini Educational Integration</h4>
            <p className="text-[11px] leading-relaxed font-light">
              Epselon connects to active models via standard server-side environmental variables. No client-side keys are ever exposed or stored in your browser cookies.
            </p>
          </div>
          
          {onLogout && (
            <div className="pt-6 border-t border-slate-800/60 mt-6">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>


      </div>

      {/* AI Key Connect Modal */}
      <AIKeyConnectModal
        provider={selectedModalProvider}
        existingConnection={selectedModalProvider ? providers.find((p) => p.id === selectedModalProvider.id) : undefined}
        isOpen={!!selectedModalProvider}
        onClose={() => setSelectedModalProvider(null)}
        onSave={handleSaveProviderConnection}
      />
    </div>
  );
}
