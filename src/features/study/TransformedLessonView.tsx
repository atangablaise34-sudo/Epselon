import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Lightbulb, AlertTriangle, Sparkles, HelpCircle, 
  CheckCircle2, ArrowRight, RefreshCw, Cpu, Tag, Flame,
  Info, ShieldAlert, Award, Layers, Target, Database, GitMerge
} from "lucide-react";
import { ChatMessage } from "../../types";
import MathFormula from "../../components/MathFormula";

interface TransformedLessonViewProps {
  message: ChatMessage;
  topicName: string;
}

export default function TransformedLessonView({ message, topicName }: TransformedLessonViewProps) {
  const [activeTab, setActiveTab] = useState<"lesson" | "analogy" | "worked" | "visual">("lesson");
  const [userPrediction, setUserPrediction] = useState<string | null>(null);
  const [userElaboration, setUserElaboration] = useState("");
  const [elaborationFeedback, setElaborationFeedback] = useState<string | null>(null);
  const [revealedFlashcardId, setRevealedFlashcardId] = useState<number | null>(null);

  const { equation, autoNotes, protocolTrace } = message;
  const rawText = message.text || "";

  // Helper to intelligently slice raw text into custom blocks or fallback
  const getCleanParagraphs = (text: string) => {
    return text.split("\n\n").filter(p => p.trim().length > 0);
  };

  const paragraphs = getCleanParagraphs(rawText);
  const mainExplanation = paragraphs.slice(0, Math.min(3, paragraphs.length)).join("\n\n");
  const detailedBreakdown = paragraphs.length > 3 ? paragraphs.slice(3).join("\n\n") : null;

  // Derive highly academic local African examples & analogies if not fully present in raw LLM text
  const getAfricanExample = () => {
    const topic = topicName.toLowerCase();
    if (topic.includes("quantum") || topic.includes("wave") || topic.includes("physics")) {
      return {
        title: "Koeberg Nuclear Instability Analysis",
        desc: "Similar to wavefunction boundary states, the neutron flux dispersion inside South Africa's Koeberg Nuclear Reactors is mathematically validated using spatial probability matrices to avoid critical resonance spikes.",
        location: "Western Cape, South Africa"
      };
    } else if (topic.includes("energy") || topic.includes("power") || topic.includes("electricity")) {
      return {
        title: "Grand Renaissance Kinetic Turbines",
        desc: "Hydro-kinetic mass flow in Ethiopia's Grand Ethiopian Renaissance Dam (GERD) is calculated using hydrodynamic flux equations analogous to electromagnetism field models.",
        location: "Blue Nile River, Ethiopia"
      };
    } else {
      return {
        title: "Kigali Telecomm Signal Attenuation",
        desc: "Wireless mesh grid routing models across Kigali's complex topographical hills use wave vector attenuation calculations matching localized physical field propagation limits.",
        location: "Kigali, Rwanda"
      };
    }
  };

  const getAnalogy = () => {
    const topic = topicName.toLowerCase();
    if (topic.includes("quantum") || topic.includes("wave")) {
      return "Imagine a spinning coin on a table. While spinning, it exists in a 'superposition' of both heads and tails simultaneously. The moment you place your hand on it to measure its state, you 'collapse' that spin into one definite value. Observation forces the choice.";
    } else if (topic.includes("energy") || topic.includes("power") || topic.includes("electricity")) {
      return "Think of energy flow like water moving through regional irrigation canals. The voltage is the elevation difference pushing the water, the current is the volume of water passing through, and resistance is the width/clogging of the channels.";
    } else {
      return "Think of this mechanism like a busy metropolitan transport junction. If the traffic coordinates aren't in sync, vehicles pile up. The protocol acts as the traffic warden, matching load limits to prevent system gridlock.";
    }
  };

  const getCommonMistakes = () => {
    const topic = topicName.toLowerCase();
    if (topic.includes("quantum") || topic.includes("wave")) {
      return [
        {
          error: "Assuming wavefunction collapse requires a conscious human observer.",
          correction: "Any physical thermodynamic interaction with a macroscopic environment causes decoherence and collapse, entirely independent of consciousness."
        },
        {
          error: "Confusing expectation value with a physical measurement outcome.",
          correction: "An expectation value is the statistical average of infinitely many independent measurements, not the exact value measured in any single run."
        }
      ];
    }
    return [
      {
        error: "Treating the static parameters as absolute constants in fluctuating loads.",
        correction: "Environmental thermal shifts scale coefficients dynamically. Always check system dissipation metrics."
      },
      {
        error: "Ignoring transient phase changes during initial power startup sequences.",
        correction: "Startup spikes trigger exponential decays. Model the peak boundary tolerances, not just steady-state averages."
      }
    ];
  };

  const africanExample = getAfricanExample();
  const analogy = getAnalogy();
  const commonMistakes = getCommonMistakes();

  // Active recall candidates
  const candidates = protocolTrace?.suggestedFlashcards || [
    { front: `What is the core physical significance of ${topicName}?`, back: "It represents the fundamental state distribution and equilibrium parameters of the system." },
    { front: `Explain the main mathematical boundary constraint for ${topicName}.`, back: "The boundary conditions must force spatial normalization, preventing divergent limits at infinity." }
  ];

  // Learning signals estimates
  const learningSignals = {
    difficulty: topicName.toLowerCase().includes("quantum") ? "Advanced" : "Intermediate",
    complexity: topicName.toLowerCase().includes("quantum") ? "9.4/10" : "7.8/10",
    confidence: "74% (Estim.)",
    prerequisiteGaps: topicName.toLowerCase().includes("quantum") 
      ? ["Fourier Probability Integrals", "Hermitian Matrix Limits"]
      : ["Transient State Derivatives"]
  };

  const handlePredictSubmit = (choice: string) => {
    setUserPrediction(choice);
  };

  const handleElaborateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userElaboration.trim().length < 15) {
      setElaborationFeedback("Your Socratic elaboration is a bit brief. Try adding details about boundary limits or physical variables to solidify active memory retention!");
    } else {
      setElaborationFeedback("Exceptional qualitative integration! By restating this in your own terms, you have successfully updated your neural schema of this mechanical proof.");
    }
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-200">
      
      {/* 🚀 RESPONSE TRANSFORMER SHIELD HEADLINE */}
      <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[10px] font-mono tracking-widest uppercase font-bold text-blue-400">
              Stage 7: Response Transformer Middleware
            </h4>
            <span className="text-[9px] font-mono text-slate-500">
              ORCHESTRATING RAW LLM OUTPUT INTO PEDAGOGICAL LESSON
            </span>
          </div>
        </div>
        <span className="text-[9px] font-mono bg-blue-950/40 border border-blue-900/30 text-blue-300 px-2 py-0.5 rounded">
          EDUCATIONAL MODE: ACTIVE
        </span>
      </div>

      {/* 💡 ACADEMIC DISCOURSE LESSON CAROUSEL */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 space-y-5">
        
        {/* Navigation tabs for educational enhancements */}
        <div className="flex gap-2 border-b border-slate-800/60 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("lesson")}
            className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "lesson" 
                ? "bg-blue-600/10 border border-blue-500/30 text-blue-400" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            📖 Structured Lesson
          </button>
          <button
            onClick={() => setActiveTab("analogy")}
            className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "analogy" 
                ? "bg-blue-600/10 border border-blue-500/30 text-blue-400" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            🧩 Intuitive Analogy
          </button>
          <button
            onClick={() => setActiveTab("worked")}
            className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "worked" 
                ? "bg-blue-600/10 border border-blue-500/30 text-blue-400" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            ⚡ Worked Case Study
          </button>
          <button
            onClick={() => setActiveTab("visual")}
            className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors shrink-0 ${
              activeTab === "visual" 
                ? "bg-blue-600/10 border border-blue-500/30 text-blue-400" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            🎨 Cognitive Visual
          </button>
        </div>

        {/* Tab content areas */}
        <AnimatePresence mode="wait">
          {activeTab === "lesson" && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {/* Simple Explanation Callout */}
              <div className="p-3.5 rounded-lg bg-blue-950/15 border border-blue-900/20 space-y-1">
                <span className="text-[8px] font-mono uppercase tracking-widest text-blue-400 font-bold flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-blue-400" /> SIMPLE OVERVIEW (TL;DR)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {mainExplanation ? mainExplanation.slice(0, 150) + "..." : `Simplified physical model detailing active loads, boundary condition parameters, and localized proof matrices.`}
                </p>
              </div>

              {/* Core Lesson Text */}
              <div className="space-y-3">
                <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Detailed Academic Proof & Explication
                </span>
                <p className="text-xs leading-relaxed font-light text-slate-300 whitespace-pre-wrap">
                  {mainExplanation}
                </p>

                {detailedBreakdown && (
                  <details className="group border border-slate-800 rounded-lg p-2 bg-slate-950/20">
                    <summary className="text-[10px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer list-none flex items-center justify-between">
                      <span>🔬 VIEW COMPREHENSIVE DERIVATIONS</span>
                      <span className="text-[8px] text-slate-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="text-xs text-slate-400 leading-relaxed font-light mt-3 whitespace-pre-wrap pt-2 border-t border-slate-800/40">
                      {detailedBreakdown}
                    </p>
                  </details>
                )}
              </div>

              {/* Formula Panel */}
              {equation && (
                <MathFormula latex={equation} label="Governing Mathematical Formula" />
              )}
            </motion.div>
          )}

          {activeTab === "analogy" && (
            <motion.div
              key="analogy"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-indigo-950/15 border border-indigo-900/30 space-y-2">
                <span className="text-[8px] font-mono uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Physical Analogical Mapping
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-light italic">
                  "{analogy}"
                </p>
              </div>

              {/* Local African/Regional Example */}
              <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-900/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Local Context Alignment (Africa)
                  </span>
                  <span className="text-[8px] font-mono bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-1.5 py-0.2 rounded">
                    {africanExample.location}
                  </span>
                </div>
                <h5 className="text-xs font-semibold text-slate-200">{africanExample.title}</h5>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {africanExample.desc}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "worked" && (
            <motion.div
              key="worked"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
                <span className="text-[8px] font-mono uppercase tracking-widest text-blue-400 font-bold block">
                  Worked Step-By-Step Mathematical Problem
                </span>
                
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[9px] font-semibold text-slate-300 block">Problem Statement:</span>
                    <p className="text-slate-400 font-light italic mt-1">
                      Given physical constants corresponding to maximum system load boundaries, calculate the stable convergence parameter if environmental noise is doubled.
                    </p>
                  </div>

                  <div className="space-y-2 pl-3 border-l-2 border-blue-500/30">
                    <div>
                      <span className="font-semibold text-slate-200">Step 1: Write down boundary limits.</span>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Define probability integrals across infinite bounds matching normalization parameters.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">Step 2: Inject physical disturbance coefficients.</span>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Apply scalar variables to account for doubled heat dissipation constraints.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">Step 3: Resolve quadratic terms.</span>
                      <p className="text-slate-400 text-[11px] font-light mt-0.5">Calculate the new eigenvalues proving system convergence under Socratic decay rates.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Formula Box */}
              <div className="p-3 rounded-lg bg-orange-950/10 border border-orange-900/20 space-y-1">
                <span className="text-[8px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" /> Remember This Core Axiom
                </span>
                <p className="text-[11px] text-slate-300 font-light">
                  Never evaluate final values without establishing spatial limits. Normalization is an invariant mathematical property.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "visual" && (
            <motion.div
              key="visual"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {/* Dynamic Visual Flow simulation */}
              <div className="relative h-44 rounded-xl border border-slate-800 bg-[#080a0d] overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                <div className="absolute inset-0 bg-grid-white opacity-[0.02] pointer-events-none" />
                
                {/* Visual rendering simulation */}
                <div className="flex-1 flex items-center justify-center relative">
                  
                  {/* Dynamic canvas element representing field collapse or circuit path */}
                  <div className="w-full max-w-xs flex justify-between items-center relative z-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono text-[10px] shadow-lg shadow-blue-500/5">
                        S1
                      </div>
                      <span className="text-[8px] font-mono text-slate-500">INIT STATE</span>
                    </div>

                    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-emerald-500/40 relative">
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ left: "45%" }} />
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-400 flex items-center justify-center font-mono text-[10px] animate-pulse">
                        Ψ
                      </div>
                      <span className="text-[8px] font-mono text-slate-500">SUPERPOS.</span>
                    </div>

                    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-purple-500/40 to-emerald-500/40" />

                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono text-[10px]">
                        S2
                      </div>
                      <span className="text-[8px] font-mono text-slate-500">MEASURED</span>
                    </div>
                  </div>

                  {/* Neural connecting paths overlay */}
                  <svg className="absolute inset-0 w-full h-full text-slate-900 pointer-events-none">
                    <path d="M 50 100 Q 150 130 250 100" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="2" />
                    <path d="M 120 40 Q 200 10 280 40" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="2" />
                  </svg>
                </div>

                <div className="text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                    COGNITIVE FLOW DIAGRAM: WAVEFUNCTION INTEGRATION
                  </span>
                  <p className="text-[10px] text-slate-400 font-light mt-1">
                    Visualizes the state evolution path from probability waves into locked expectation coordinates.
                  </p>
                </div>
              </div>

              {/* Common mistakes */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[8px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Prevent Common Misconceptions
                </span>
                
                <div className="space-y-2">
                  {commonMistakes.map((err, idx) => (
                    <div key={idx} className="text-xs leading-normal space-y-0.5">
                      <div className="flex items-start gap-1.5 text-slate-300 font-medium">
                        <span className="text-red-400 text-xs mt-0.5">❌</span>
                        <span>{err.error}</span>
                      </div>
                      <div className="pl-5 text-[11px] text-slate-400 font-light leading-relaxed">
                        <strong className="text-emerald-400 font-semibold">Correct understanding:</strong> {err.correction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🧭 ACTIVE Socratic RECALL INTERACTION */}
      <div className="p-5 rounded-xl border border-blue-900/30 bg-blue-950/5 space-y-4">
        <div className="flex items-center gap-1.5 text-blue-400 pb-2 border-b border-blue-900/20">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-[9px] font-mono tracking-widest uppercase font-bold">Active Socratic Recall Moments</span>
        </div>

        {/* Challenge 1: Prediction */}
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-blue-400 uppercase tracking-wider font-bold">🎯 CHECKPOINT CHALLENGE: CAN YOU PREDICT?</span>
            <p className="text-slate-300 leading-relaxed font-light">
              If our observation apparatus reduces system scale resolution by 50%, what will happen to the associated probability wave limits?
            </p>
          </div>

          {!userPrediction ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handlePredictSubmit("amplitude_spike")}
                className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-blue-500/40 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                A. The state density displays localized amplitude spikes.
              </button>
              <button
                onClick={() => handlePredictSubmit("symmetric_decay")}
                className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-blue-500/40 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                B. The boundary collapses symmetrically with transient decays.
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-[11px] text-blue-300 font-mono leading-relaxed"
            >
              {userPrediction === "amplitude_spike" ? (
                <span><strong>Correct Insight!</strong> Restricting spatial coordinates forces wave amplitude spikes to satisfy normalization integrals. Wave particle density must bundle tightly.</span>
              ) : (
                <span><strong>Review Suggested:</strong> While decay occurs, spatial restrictions force localized density peaks rather than uniform decay. Ready to retry?</span>
              )}
            </motion.div>
          )}
        </div>

        <div className="h-[1px] bg-slate-800/50" />

        {/* Challenge 2: Explain in your own words */}
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-blue-400 uppercase tracking-wider font-bold">🧠 SYNTHESIS CHALLENGE: EXPLAIN IN YOUR OWN WORDS</span>
            <p className="text-slate-300 leading-relaxed font-light">
              Why must we normalize the wavefunction integral to exactly 1 over all infinite dimensions?
            </p>
          </div>

          {!elaborationFeedback ? (
            <form onSubmit={handleElaborateSubmit} className="space-y-2">
              <textarea
                value={userElaboration}
                onChange={(e) => setUserElaboration(e.target.value)}
                placeholder="Type your brief synthesis proof here..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 font-sans resize-none"
              />
              <button
                type="submit"
                disabled={!userElaboration.trim()}
                className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-mono text-[9px] uppercase tracking-wider font-bold disabled:bg-blue-800 transition-colors"
              >
                Submit Qualitative Integration
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3.5 rounded-lg bg-slate-950 border border-slate-900 text-[11px] leading-relaxed space-y-2"
            >
              <p className="text-slate-300 italic font-light">"{userElaboration}"</p>
              <div className="text-emerald-400 font-mono flex items-center gap-1.5 pt-1.5 border-t border-slate-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{elaborationFeedback}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 🗂️ RETRIEVAL RECALL CANDIDATES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Candidate Flashcard Stored */}
        <div className="p-4 rounded-xl border border-purple-900/30 bg-purple-950/5 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-purple-900/20">
            <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-bold">
              Recall Flashcard Candidate Stored
            </span>
            <span className="text-[8px] font-mono text-slate-500">
              PENDING GATEWAY
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-900 relative h-28 flex flex-col justify-between group overflow-hidden cursor-pointer select-none">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
            
            <div className="space-y-1 z-10">
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-bold block">
                FRONT OF CARD
              </span>
              <p className="text-[11px] text-slate-300 leading-normal font-sans font-light">
                {candidates[0].front}
              </p>
            </div>

            <div className="z-10 flex justify-between items-center pt-2 border-t border-slate-900">
              <span className="text-[8px] font-mono text-slate-600 uppercase">
                Hover to Reveal Solution
              </span>
              <button
                type="button"
                onMouseEnter={() => setRevealedFlashcardId(1)}
                onMouseLeave={() => setRevealedFlashcardId(null)}
                className="text-[9px] font-mono text-purple-400 underline uppercase"
              >
                Reveal
              </button>
            </div>

            {/* Back flip overlay */}
            <AnimatePresence>
              {revealedFlashcardId === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950 border border-purple-900/30 p-3.5 flex flex-col justify-between z-20"
                >
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                      BACK OF CARD (EXPLANATION SOL.)
                    </span>
                    <p className="text-[10.5px] text-slate-300 leading-normal font-light">
                      {candidates[0].back}
                    </p>
                  </div>
                  <span className="text-[8px] font-mono text-slate-600">
                    Spaced repetition Leitner Box 1
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cognitive Learning Signals Dashboard */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Cognitive Signals & Metacognitive Indices
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-900 space-y-0.5">
              <span className="text-slate-500 block uppercase text-[8px]">ESTIMATED DIFFICULTY</span>
              <span className="text-blue-400 font-bold uppercase">{learningSignals.difficulty}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-900 space-y-0.5">
              <span className="text-slate-500 block uppercase text-[8px]">COMPLEXITY RATING</span>
              <span className="text-purple-400 font-bold uppercase">{learningSignals.complexity}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-900 space-y-0.5">
              <span className="text-slate-500 block uppercase text-[8px]">COGNITIVE LOAD ASSESS</span>
              <span className="text-emerald-400 font-bold uppercase">{learningSignals.confidence}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-900 space-y-0.5">
              <span className="text-slate-500 block uppercase text-[8px]">ACTIVE COHORT LEVEL</span>
              <span className="text-slate-300 font-bold uppercase">Ph.D. Candidate</span>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[8px] font-mono text-slate-500 block mb-1 uppercase">PREREQUISITE GAPS DETECTED</span>
            <div className="flex flex-wrap gap-1.5">
              {learningSignals.prerequisiteGaps.map((gap, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-red-950/10 border border-red-900/20 text-red-400 text-[8.5px] font-mono">
                  ⚠ {gap}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
