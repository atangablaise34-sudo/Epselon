import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Check, ChevronRight, Brain, Cpu, Database, Network, KeyRound, RefreshCw, Zap, ShieldCheck
} from "lucide-react";
import { UserProfile, ProviderConnection } from "../../types";
import { updateProviders, updatePreferences } from "../../lib/api";
import EpselonLogo from "../../components/EpselonLogo";
import AIKeyConnectModal, { PROVIDERS_CONFIG, ProviderConfig } from "../../components/AIKeyConnectModal";

interface OnboardingViewProps {
  user: UserProfile;
  onRefreshUser: () => void;
  onComplete: () => void;
}

export default function OnboardingView({ user, onRefreshUser, onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<"connect" | "default">("connect");
  const [connections, setConnections] = useState<Record<string, ProviderConnection>>({});
  const [selectedModalProvider, setSelectedModalProvider] = useState<ProviderConfig | null>(null);
  const [selectedDefault, setSelectedDefault] = useState<string | null>("system");
  const [isSaving, setIsSaving] = useState(false);

  const connectedIds = Object.keys(connections).filter((id) => connections[id]?.connected);

  const handleOpenConnectModal = (provider: ProviderConfig) => {
    setSelectedModalProvider(provider);
  };

  const handleSaveModalConnection = (data: {
    apiKey: string;
    email?: string;
    model: string;
    syncExistingChats: boolean;
  }) => {
    if (!selectedModalProvider) return;

    const providerId = selectedModalProvider.id;
    setConnections((prev) => ({
      ...prev,
      [providerId]: {
        id: providerId,
        name: selectedModalProvider.name,
        connected: true,
        apiKey: data.apiKey,
        email: data.email,
        currentModel: data.model,
        latency: "45ms",
        lastSynced: new Date().toISOString(),
        features: selectedModalProvider.features,
        syncExistingChats: data.syncExistingChats,
      },
    }));

    if (connectedIds.length === 0 || !selectedDefault) {
      setSelectedDefault(providerId);
    }

    setSelectedModalProvider(null);
  };

  const handleDisconnect = (id: string) => {
    setConnections((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    if (selectedDefault === id) {
      const remaining = Object.keys(connections).filter((k) => k !== id);
      setSelectedDefault(remaining[0] || null);
    }
  };

  const handleUseAppDefault = () => {
    const systemConfig = PROVIDERS_CONFIG.find((p) => p.id === "system")!;
    setConnections((prev) => ({
      ...prev,
      system: {
        id: "system",
        name: systemConfig.name,
        connected: true,
        currentModel: "system-gemini-flash",
        latency: "25ms",
        lastSynced: new Date().toISOString(),
        features: systemConfig.features,
        syncExistingChats: true,
      },
    }));
    setSelectedDefault("system");
    setStep("default");
  };

  const handleSaveAndContinue = async () => {
    if (step === "connect") {
      if (connectedIds.length > 0) {
        if (!selectedDefault || !connectedIds.includes(selectedDefault)) {
          setSelectedDefault(connectedIds[0]);
        }
        setStep("default");
      }
      return;
    }

    if (step === "default" && selectedDefault) {
      setIsSaving(true);

      // Build full array of providers to update backend
      const newProviders: ProviderConnection[] = PROVIDERS_CONFIG.map((p) => {
        const existing = connections[p.id];
        if (existing && existing.connected) {
          return existing;
        }
        return {
          id: p.id,
          name: p.name,
          connected: false,
          currentModel: p.models[0]?.id || "default",
          latency: "Offline",
          features: p.features,
        };
      });

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
        className="w-full max-w-3xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
        
        {step === "connect" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 flex items-center justify-center mb-2">
                <EpselonLogo size={56} className="filter drop-shadow-[0_0_8px_rgba(224,27,242,0.2)]" />
              </div>
              <h1 className="text-2xl font-serif text-white tracking-tight">Connect Your Preferred AI</h1>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Link your AI accounts to maintain your existing model preferences and continuous chat flows, or use the app's built-in default engine.
              </p>
            </div>

            {/* Quick 1-Click App Default Option Banner */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white font-serif">Epselon Built-In AI</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      App Default (No Key Required)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pre-configured Gemini engine ready for immediate use. Zero configuration needed.
                  </p>
                </div>
              </div>

              {connections["system"]?.connected ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" /> Built-In Connected
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUseAppDefault}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" /> Use App Default
                </button>
              )}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                <span className="bg-[#0c0e12] px-3 text-slate-500">Or Connect Custom AI Accounts</span>
              </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PROVIDERS_CONFIG.filter((p) => !p.isSystemDefault).map((provider) => {
                const conn = connections[provider.id];
                const isConnected = !!conn?.connected;

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
                      <div className={`p-2 rounded-lg bg-slate-900 ${provider.color}`}>
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{provider.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{provider.desc}</div>
                        {isConnected && conn.currentModel && (
                          <div className="text-[9px] font-mono text-emerald-400/90 mt-0.5">
                            Model: {conn.currentModel}
                          </div>
                        )}
                      </div>
                    </div>

                    {isConnected ? (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenConnectModal(provider)}
                          className="text-[10px] font-mono text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDisconnect(provider.id)}
                          className="text-[10px] font-mono text-emerald-400 hover:text-red-400 flex items-center gap-1 bg-emerald-500/10 hover:bg-red-500/10 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Linked
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleOpenConnectModal(provider)}
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                {connectedIds.length} AI model{connectedIds.length === 1 ? "" : "s"} linked
              </span>
              <button
                onClick={handleSaveAndContinue}
                disabled={connectedIds.length === 0}
                className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
              >
                Continue to Active AI Selection <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === "default" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-2">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-2xl font-serif text-white tracking-tight">Choose Default Active AI</h1>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select which connected AI model should automatically handle your primary study queries. You can change models at any time during study sessions.
              </p>
            </div>

            <div className="space-y-2.5">
              {connectedIds.map((id) => {
                const provider = PROVIDERS_CONFIG.find((p) => p.id === id)!;
                const conn = connections[id];
                const isSelected = selectedDefault === id;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedDefault(id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-purple-900/20 border-purple-500/50 ring-1 ring-purple-500/50"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-slate-900 ${provider.color}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{provider.name}</span>
                          {provider.isSystemDefault && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              App Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{provider.desc}</p>
                        {conn?.currentModel && (
                          <span className="text-[9px] font-mono text-slate-400">
                            Active Model: {conn.currentModel}
                          </span>
                        )}
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
                className="text-xs text-slate-400 hover:text-slate-200 font-mono cursor-pointer"
              >
                ← Back to AI Connections
              </button>
              <button
                onClick={handleSaveAndContinue}
                disabled={!selectedDefault || isSaving}
                className="px-6 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSaving ? "Initializing Workspace..." : "Enter Study Workspace"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* AI Key Connect Modal */}
      <AIKeyConnectModal
        provider={selectedModalProvider}
        existingConnection={selectedModalProvider ? connections[selectedModalProvider.id] : undefined}
        isOpen={!!selectedModalProvider}
        onClose={() => setSelectedModalProvider(null)}
        onSave={handleSaveModalConnection}
      />
    </div>
  );
}

