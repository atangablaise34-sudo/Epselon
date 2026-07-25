import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Brain, CheckCircle2, Shield, Layers, BookOpen, Target, FileText, Cpu } from "lucide-react";
import { EducationalContextPacket } from "../lib/protocol/educationalContextEngine";

interface EducationalContextDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  packet: EducationalContextPacket | null;
}

export const EducationalContextDetailsModal: React.FC<EducationalContextDetailsModalProps> = ({
  isOpen,
  onClose,
  packet,
}) => {
  if (!isOpen || !packet) return null;

  const { originalPrompt, composedSystemPrompt, analysis, context, instructions, summary } = packet;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-serif italic text-white font-semibold">
                    Educational Context Packet
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Transparent Middleware
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Epselon Educational Intelligence Layer • Zero prompt distortion guarantee
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto no-scrollbar text-xs font-sans">
            
            {/* 1. VERBATIM STUDENT PROMPT HIGHLIGHT */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Student Original Prompt (100% Preserved)
                </span>
                <span className="text-[9px] font-mono text-slate-500">Unchanged & Intact</span>
              </div>
              <p className="text-sm font-sans text-slate-100 italic bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                "{originalPrompt}"
              </p>
            </div>

            {/* 2. CLASSIFICATION & DISCIPLINE METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[10px]">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[8px] uppercase">Detected Intent</span>
                <span className="text-indigo-300 font-semibold mt-0.5 block truncate">
                  {analysis.category}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[8px] uppercase">Subject Area</span>
                <span className="text-emerald-300 font-semibold mt-0.5 block truncate">
                  {analysis.subject}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[8px] uppercase">Target Complexity</span>
                <span className="text-amber-300 font-semibold mt-0.5 block truncate">
                  {analysis.complexity}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[8px] uppercase">AI Provider</span>
                <span className="text-blue-300 font-semibold mt-0.5 block truncate">
                  {context.provider}
                </span>
              </div>
            </div>

            {/* 3. TEACHING OBJECTIVES */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Teaching Objectives
              </h4>
              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                {instructions.teachingObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. PREFERRED RESPONSE STRUCTURE */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Preferred Response Structure
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {instructions.responseStructure.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-850 flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. FULL COMPOSED SYSTEM INSTRUCTION PACKET */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Full System Instruction Packet Sent to AI
              </h4>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-48 leading-relaxed font-light">
                {composedSystemPrompt}
              </pre>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-slate-500">
              Epselon Educational Context Engine v2.0
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Done / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EducationalContextDetailsModal;
