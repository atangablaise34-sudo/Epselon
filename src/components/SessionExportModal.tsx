import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileDown, X, FileText, Check, Sparkles, BookOpen, Clock, Brain, ChevronDown, CheckCircle2 } from "lucide-react";
import { StudySession, UserProfile } from "../types";
import { exportStudySessionToPDF, exportStudySessionToMarkdown } from "../lib/pdfExporter";

interface SessionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StudySession[];
  initialSessionId?: string | null;
  user?: UserProfile | null;
}

export default function SessionExportModal({
  isOpen,
  onClose,
  sessions,
  initialSessionId,
  user
}: SessionExportModalProps) {
  // Select active session to export
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialSessionId || (sessions.length > 0 ? sessions[0].id : "")
  );

  const [exportFormat, setExportFormat] = useState<"pdf" | "markdown">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Sync initialSessionId when modal opens
  React.useEffect(() => {
    if (initialSessionId) {
      setSelectedSessionId(initialSessionId);
    } else if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [initialSessionId, sessions]);

  if (!isOpen) return null;

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleExport = () => {
    if (!selectedSession) return;
    setIsExporting(true);

    try {
      if (exportFormat === "pdf") {
        exportStudySessionToPDF(selectedSession, user);
      } else {
        exportStudySessionToMarkdown(selectedSession, user);
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Click outside to close */}
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
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif italic text-white font-medium">
                  Export Study Session Document
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Download structured study notes directly to your browser path
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

          {/* Modal Content Body */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto no-scrollbar">
            
            {/* 1. DOCUMENT SELECTION DROPDOWN */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                1. Choose Your Document
              </label>

              {sessions.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-sans cursor-pointer appearance-none pr-9"
                  >
                    {sessions.map((sess) => (
                      <option key={sess.id} value={sess.id} className="bg-slate-900 text-slate-200">
                        {sess.title.replace("Session: ", "")} ({sess.messages.length} msgs • {sess.focus || "General"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                  No study sessions recorded yet. Start a session in the workspace to generate exportable documents.
                </p>
              )}
            </div>

            {/* 2. SELECTED DOCUMENT PREVIEW SUMMARY */}
            {selectedSession && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400 block">
                      {selectedSession.difficulty} • {selectedSession.bloomLevel || "Analysis"}
                    </span>
                    <h4 className="text-sm font-medium text-slate-100 mt-0.5">
                      {selectedSession.title.replace("Session: ", "")}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold shrink-0">
                    {selectedSession.progress}% Mastered
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-2 border-t border-slate-850">
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase">Focus Topic</span>
                    <span className="text-slate-300 font-semibold truncate block">
                      {selectedSession.focus || "General Study"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase">Dialogue Exchanges</span>
                    <span className="text-slate-300 font-semibold block">
                      {selectedSession.messages.length} Messages
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px] uppercase">Landmark Outlines</span>
                    <span className="text-slate-300 font-semibold block">
                      {selectedSession.outline?.length || 0} Items
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. FORMAT SELECTION */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                2. Select Export Format
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("pdf")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    exportFormat === "pdf"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileDown className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-200">PDF Document</span>
                      <span className="block text-[9px] text-slate-500 font-mono">Formatted .pdf file</span>
                    </div>
                  </div>
                  {exportFormat === "pdf" && <Check className="w-4 h-4 text-indigo-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("markdown")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    exportFormat === "markdown"
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-200">Markdown File</span>
                      <span className="block text-[9px] text-slate-500 font-mono">Raw .md file</span>
                    </div>
                  </div>
                  {exportFormat === "markdown" && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              </div>
            </div>

            {/* SUCCESS BANNER */}
            {exportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Document successfully downloaded to your browser download path!</span>
              </motion.div>
            )}

          </div>

          {/* Modal Footer / Download Action */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={!selectedSession || isExporting}
              onClick={handleExport}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              {isExporting ? "Generating Document..." : `Download as ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
