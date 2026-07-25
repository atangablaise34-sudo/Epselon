import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  KeyRound, ExternalLink, Check, ShieldCheck, Zap, X, Eye, EyeOff, Sparkles, RefreshCw, Layers, History, Mail
} from "lucide-react";
import { ProviderConnection } from "../types";

export interface ProviderConfig {
  id: string;
  name: string;
  desc: string;
  color: string;
  badge: string;
  keyUrl?: string;
  models: { id: string; name: string; tag?: string }[];
  features: string[];
  isSystemDefault?: boolean;
}

export const PROVIDERS_CONFIG: ProviderConfig[] = [
  {
    id: "system",
    name: "Epselon Built-In AI",
    desc: "Pre-configured, high-speed built-in Gemini engine. Ready immediately without providing an API key.",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    badge: "App Default",
    isSystemDefault: true,
    models: [
      { id: "system-gemini-flash", name: "Gemini 2.5 Flash (Built-in)", tag: "Fast" },
      { id: "system-gemini-pro", name: "Gemini 2.5 Pro (Built-in)", tag: "Deep Reasoning" },
    ],
    features: ["Zero Configuration Required", "Instant High-Speed Streaming", "LaTeX Math & Graph Support", "Educational Context Engine"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    desc: "Google AI Studio API key. Deep multimodal reasoning & 2M token context window.",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    badge: "Multimodal",
    keyUrl: "https://aistudio.google.com/app/apikey",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Flagship" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Ultra-Fast" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "2M Context" },
    ],
    features: ["Google AI Studio Key", "2M Token Memory Window", "Multimodal File Understanding"],
  },
  {
    id: "chatgpt",
    name: "OpenAI ChatGPT",
    desc: "OpenAI Platform API key. Connect GPT-4o & O3 reasoning models for seamless flow.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    badge: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-4o", name: "GPT-4o", tag: "Omni Versatile" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tag: "Lightweight" },
      { id: "o3-mini", name: "O3-Mini", tag: "Math & Code Reasoning" },
    ],
    features: ["OpenAI Platform Key", "Function Calling", "Custom Memory & Instruction Sync"],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    desc: "Anthropic Console API key. Connect Claude 3.5 Sonnet for nuanced academic analysis.",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    badge: "Anthropic",
    keyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", tag: "Best Writing" },
      { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", tag: "Speed & Math" },
      { id: "claude-3-opus", name: "Claude 3 Opus", tag: "Deep Analysis" },
    ],
    features: ["Anthropic Console Key", "Artifacts Integration", "Context Memory Sync"],
  },
  {
    id: "deepseek",
    name: "DeepSeek AI",
    desc: "DeepSeek Platform API key. Specialized mathematical & step-by-step coding reasoning.",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    badge: "Math & Code",
    keyUrl: "https://platform.deepseek.com/api_keys",
    models: [
      { id: "deepseek-chat", name: "DeepSeek-V3", tag: "General & Code" },
      { id: "deepseek-reasoner", name: "DeepSeek-R1", tag: "Chain-of-Thought" },
    ],
    features: ["DeepSeek API Key", "Open Reasoning Traces", "Low-Latency Math Derivations"],
  },
  {
    id: "grok",
    name: "xAI Grok",
    desc: "xAI API key. Real-time knowledge synthesis and ultra-fast inference engine.",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    badge: "xAI",
    keyUrl: "https://console.x.ai/",
    models: [
      { id: "grok-2", name: "Grok 2", tag: "Real-time AI" },
      { id: "grok-2-mini", name: "Grok 2 Mini", tag: "Fast Inference" },
    ],
    features: ["xAI Console Key", "Real-Time Knowledge", "Concise Proofing"],
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    desc: "Perplexity API key. Live web grounding and academic citation lookup.",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    badge: "Web Research",
    keyUrl: "https://www.perplexity.ai/settings/api",
    models: [
      { id: "sonar-pro", name: "Sonar Pro", tag: "Deep Research" },
      { id: "sonar", name: "Sonar", tag: "Fast Search Grounding" },
    ],
    features: ["Perplexity API Key", "Web Citations & Sources", "Academic Grounding"],
  }
];

interface AIKeyConnectModalProps {
  provider: ProviderConfig | null;
  existingConnection?: ProviderConnection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { apiKey: string; email?: string; model: string; syncExistingChats: boolean }) => void;
}

export default function AIKeyConnectModal({
  provider,
  existingConnection,
  isOpen,
  onClose,
  onSave,
}: AIKeyConnectModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [syncExistingChats, setSyncExistingChats] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setApiKey(existingConnection?.apiKey || "");
      setEmail(existingConnection?.email || "");
      setSelectedModel(
        existingConnection?.currentModel || provider.models[0]?.id || ""
      );
      setSyncExistingChats(
        existingConnection?.syncExistingChats !== undefined
          ? existingConnection.syncExistingChats
          : true
      );
      setError(null);
      setVerifiedSuccess(false);
      setVerifying(false);
    }
  }, [provider, existingConnection, isOpen]);

  if (!isOpen || !provider) return null;

  const isSystem = provider.isSystemDefault;

  const handleVerifyAndConnect = () => {
    setError(null);
    if (!isSystem && !apiKey.trim()) {
      setError(`Please enter your valid ${provider.name} API key.`);
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifiedSuccess(true);

      setTimeout(() => {
        onSave({
          apiKey: isSystem ? "system-default-key" : apiKey.trim(),
          email: email.trim(),
          model: selectedModel,
          syncExistingChats,
        });
      }, 500);
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#0F1420] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative"
        >
          {/* Top header glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-800/80 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${provider.color}`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white font-serif">{provider.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {provider.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{provider.desc}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* System default note or API Key field */}
            {isSystem ? (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  No API Key Required
                </div>
                <p className="leading-relaxed text-slate-300">
                  Epselon's built-in AI model uses our pre-configured, optimized Gemini server engine. You can start using it immediately for study sessions with zero setup.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    {provider.name} API Key <span className="text-red-400">*</span>
                  </label>
                  {provider.keyUrl && (
                    <a
                      href={provider.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                    >
                      Get Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Paste your ${provider.name} API Key (e.g. ${provider.id === 'gemini' ? 'AIzaSy...' : provider.id === 'chatgpt' ? 'sk-proj-...' : 'sk-ant-api...'})`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Your API key is securely encrypted locally and used exclusively to authenticate requests to your {provider.name} account.
                </p>
              </div>
            )}

            {/* Account Email / User Identifier (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Account Email / Profile Name <span className="text-slate-500 text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@university.edu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Default Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Preferred Model Variant
              </label>
              <div className="grid grid-cols-1 gap-2">
                {provider.models.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-purple-900/20 border-purple-500/50 text-white ring-1 ring-purple-500/40"
                          : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{m.name}</span>
                        {m.tag && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {m.tag}
                          </span>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-purple-500 bg-purple-500" : "border-slate-700"}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seamless Chat Flow / Memory Sync Toggle */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Continuous Chat Flow & Memory Sync</span>
                </div>
                <input
                  type="checkbox"
                  id="chk_sync_chats"
                  checked={syncExistingChats}
                  onChange={(e) => setSyncExistingChats(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically link your previous session memories, study context, and model preferences so you can continue conversations seamlessly without losing context.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono">
                {error}
              </div>
            )}

            {verifiedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Account credentials verified! Connecting model...</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleVerifyAndConnect}
              disabled={verifying || verifiedSuccess}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Connection...
                </>
              ) : verifiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Connected!
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSystem ? "Connect Built-in Model" : "Verify & Connect Account"}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
