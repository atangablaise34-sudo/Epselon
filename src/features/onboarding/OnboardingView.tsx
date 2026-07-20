import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Check, ChevronRight, Brain, Cpu, Database, Network, KeyRound, RefreshCw
} from "lucide-react";
import { UserProfile, ProviderConnection } from "../../types";
import { updateProviders, updatePreferences } from "../../lib/api";
import EpselonLogo from "../../components/EpselonLogo";

interface OnboardingViewProps {
  user: UserProfile;
  onRefreshUser: () => void;
  onComplete: () => void;
}

const PROVIDERS_LIST = [
  { id: "gemini", name: "Gemini", desc: "Google's deep multimodal reasoning.", color: "text-blue-400" },
  { id: "chatgpt", name: "ChatGPT", desc: "OpenAI's state-of-the-art agent.", color: "text-emerald-400" },
  { id: "claude", name: "Claude", desc: "Anthropic's safety-first engine.", color: "text-amber-400" },
  { id: "deepseek", name: "DeepSeek", desc: "Efficient mathematical reasoning.", color: "text-indigo-400" },
  { id: "grok", name: "Grok", desc: "Real-time knowledge synthesizer.", color: "text-pink-400" },
  { id: "perplexity", name: "Perplexity", desc: "Deep research and search.", color: "text-cyan-400" }
];

export default function OnboardingView({ user, onRefreshUser, onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<"connect" | "default">("connect");
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConnect = (id: string) => {
    if (!connectedIds.includes(id)) {
      setConnectingId(id);
      setTimeout(() => {
        setConnectedIds(prev => [...prev, id]);
        setConnectingId(null);
      }, 600);
    }
  };

  const handleDisconnect = (id: string) => {
    setConnectedIds(connectedIds.filter(c => c !== id));
  };

  const handleSaveAndContinue = async () => {
    if (step === "connect") {
      if (connectedIds.length > 0) {
        if (connectedIds.length === 1) {
          setSelectedDefault(connectedIds[0]);
        }
        setStep("default");
      }
      return;
    }

    if (step === "default" && selectedDefault) {
      setIsSaving(true);
      // Construct providers array
      const newProviders: ProviderConnection[] = PROVIDERS_LIST.map(p => ({
        id: p.id,
        name: p.name,
        connected: connectedIds.includes(p.id),
        currentModel: "default-model",
        latency: "100ms",
        features: ["Standard"]
      }));

      try {
        await updateProviders(newProviders);
        await updatePreferences({ selectedProvider: selectedDefault });
        onRefreshUser();
        onComplete();
      } catch (err) {
        console.error("Failed to save onboarding state", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900/40 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
        
        {step === "connect" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <EpselonLogo size={64} className="filter drop-shadow-[0_0_8px_rgba(224,27,242,0.2)]" />
              </div>
              <h1 className="text-2xl font-serif text-white tracking-tight">Connect Your AI</h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Epselon is your unified educational intelligence layer. Connect the AI accounts you already use to power your study sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROVIDERS_LIST.map(provider => {
                const isConnected = connectedIds.includes(provider.id);
                return (
                  <div 
                    key={provider.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                      isConnected 
                        ? "bg-emerald-950/20 border-emerald-500/30" 
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded bg-slate-900 ${provider.color}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{provider.name}</div>
                        <div className="text-[10px] text-slate-500">{provider.desc}</div>
                      </div>
                    </div>
                    {isConnected ? (
                      <button 
                        onClick={() => handleDisconnect(provider.id)}
                        className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded"
                      >
                        <Check className="w-3 h-3" /> Connected
                      </button>
                    ) : connectingId === provider.id ? (
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Connecting
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleConnect(provider.id)}
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSaveAndContinue}
                disabled={connectedIds.length === 0}
                className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === "default" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-2xl font-serif text-white tracking-tight">Choose Default AI</h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Select which AI should automatically power your study sessions. You can change this at any time during a session or in settings.
              </p>
            </div>

            <div className="space-y-3">
              {connectedIds.map(id => {
                const provider = PROVIDERS_LIST.find(p => p.id === id)!;
                const isSelected = selectedDefault === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedDefault(id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-purple-900/20 border-purple-500/50 ring-1 ring-purple-500/50"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded bg-slate-900 ${provider.color}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{provider.name}</div>
                        <div className="text-[10px] text-slate-500">{provider.desc}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "border-purple-500 bg-purple-500" : "border-slate-600"}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setStep("connect")}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <button
                onClick={handleSaveAndContinue}
                disabled={!selectedDefault || isSaving}
                className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? "Initializing..." : "Enter Workspace"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
