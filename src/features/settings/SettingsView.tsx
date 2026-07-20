import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Settings2, Eye, Sliders, Type, Database, User, Globe, 
  Sparkles, ShieldAlert, Cpu, Check, HelpCircle, Save,
  Volume2, LogOut
} from "lucide-react";
import { UserProfile, UserPreferences, ProviderConnection } from "../../types";
import { updatePreferences, updateProviders, updateUserProfile } from "../../lib/api";
import { NIMO_VOICES, voiceService } from "../../lib/VoiceService";

const PROVIDERS_LIST = [
  { id: "gemini", name: "Gemini", desc: "Google's deep multimodal reasoning.", color: "text-blue-400" },
  { id: "chatgpt", name: "ChatGPT", desc: "OpenAI's state-of-the-art agent.", color: "text-emerald-400" },
  { id: "claude", name: "Claude", desc: "Anthropic's safety-first engine.", color: "text-amber-400" },
  { id: "deepseek", name: "DeepSeek", desc: "Efficient mathematical reasoning.", color: "text-indigo-400" },
  { id: "grok", name: "Grok", desc: "Real-time knowledge synthesizer.", color: "text-pink-400" },
  { id: "perplexity", name: "Perplexity", desc: "Deep research and search.", color: "text-cyan-400" }
];

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

  useEffect(() => {
    setProviders(user.providers || []);
    setSelectedProvider(user.preferences?.selectedProvider || "gemini");
    setSelectedVoiceId(user.preferences?.selectedVoiceId || "nimo-female-1");

    setFullName(user.fullName || "");
    setUniversity(user.university || "");
    setFaculty(user.faculty || "");
    setDepartment(user.department || "");
    setAcademicLevel(user.academicLevel || "");
    setLearningStyle(user.learningStyle || "Visual");
    setWeeklyCommitment(user.weeklyCommitment || "5-10");
    setLearningObjectives(user.learningObjectives || "");
  }, [user]);

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
        selectedVoiceId
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
      setSuccessMsg("System parameters & academic profile updated successfully.");
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
      return [...prev, { id, name: PROVIDERS_LIST.find(x => x.id === id)?.name || id, connected: true, currentModel: "default-model", latency: "100ms", features: ["Standard"] }];
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Settings Intro */}
      <div>
        <h2 className="font-serif italic text-2xl text-white font-medium flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-brand-primary stroke-[1.5]" />
          System Parameters & Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure the proprietary Socratic Educational Intelligence Layer models, typography scales, and visual interfaces.
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
          
          {/* Theme card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-500" />
              Visual Interface Theme
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "obsidian", name: "Obsidian Deep", desc: "#0c0e12 carbon" },
                { id: "cybernetic", name: "Cybernetic Neon", desc: "Phosphorous terminal" },
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
              Socratic Cognitive Adjustments
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teaching Style */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Discourse Dialectic Style</label>
                  <select
                    id="sel_pref_style"
                    value={teachingStyle}
                    onChange={(e) => setTeachingStyle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Socratic">Socratic Discourse (Asks Guiding Questions)</option>
                    <option value="Explanatory">Explanatory Narrative (Direct Answers)</option>
                    <option value="Practical">Practical Sandbox (Code / Formula derivation)</option>
                    <option value="Theoretical">Theoretical Axioms (Math Theorems & Proofs)</option>
                  </select>
                </div>

                {/* Cognitive Load */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Baseline Working Memory Bandwidth</label>
                  <select
                    id="sel_pref_load"
                    value={cognitiveLoad}
                    onChange={(e) => setCognitiveLoad(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Novice">Novice (Low complexity, gentle pacing)</option>
                    <option value="Proficient">Proficient (Graduate-level rigorous definitions)</option>
                    <option value="Master">Master (Complex proofs, high formula density)</option>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Cpu className="w-4 h-4 text-slate-500" />
              AI Providers Management
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROVIDERS_LIST.map((provider) => {
                const connectedInfo = providers.find((p) => p.id === provider.id);
                const isConnected = !!connectedInfo?.connected;
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
                        <span className="text-xs font-semibold text-slate-200">{provider.name}</span>
                      </div>
                      
                      <button
                        onClick={() => handleToggleProvider(provider.id)}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                          isConnected 
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400" 
                            : "bg-brand-primary/10 text-brand-light hover:bg-brand-primary/20"
                        }`}
                      >
                        {isConnected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 leading-relaxed min-h-[30px]">
                      {provider.desc}
                    </p>

                    {isConnected && (
                      <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-mono">
                          {connectedInfo.latency || "Ready"}
                        </span>
                        <button
                          onClick={() => setSelectedProvider(provider.id)}
                          className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded ${
                            isDefault 
                              ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50" 
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {isDefault && <Check className="w-2.5 h-2.5" />}
                          {isDefault ? "Default" : "Set Default"}
                        </button>
                      </div>
                    )}
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
            {loading ? "Re-calibrating models..." : "Apply Cognitive Settings"}
          </button>
        </div>

        {/* Right column: Academic & Prompt Profile */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <User className="w-4 h-4 text-slate-500" />
              Academic & Prompt Profile
            </h3>

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
    </div>
  );
}
