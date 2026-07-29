import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, X, HardDrive, Database, Sparkles, FolderUp } from "lucide-react";
import vaultService from "../lib/vaultService";
import { StudySession } from "../types";

interface VaultImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted?: (count: number) => void;
}

export default function VaultImportModal({ isOpen, onClose, onImportCompleted }: VaultImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    invalid: number;
    sessions: StudySession[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setImportSummary(null);

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;
    const importedSessions: StudySession[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith(".md")) {
        invalidCount++;
        continue;
      }

      try {
        const text = await file.text();
        const res = await vaultService.importMarkdown(text, file.name);
        if (res.status === "imported") {
          importedCount++;
          importedSessions.push(res.session);
        } else if (res.status === "updated") {
          updatedCount++;
          importedSessions.push(res.session);
        } else if (res.status === "skipped_older") {
          skippedCount++;
        } else {
          invalidCount++;
        }
      } catch (err) {
        console.error("Failed to read Markdown file:", file.name, err);
        invalidCount++;
      }
    }

    const summary = {
      total: files.length,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      invalid: invalidCount,
      sessions: importedSessions,
    };

    setImportSummary(summary);
    setIsProcessing(false);

    if (onImportCompleted) {
      onImportCompleted(importedCount + updatedCount);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
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
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FolderUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Import Markdown Study Archives</h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Sync `.md` exports directly into your Local Knowledge Vault
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

          {/* Body */}
          <div className="p-5 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".md"
              multiple
              className="hidden"
            />

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-slate-200"
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    Validating & reconstructing study sessions...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      Drag & Drop your <span className="text-emerald-400 font-mono">.md</span> files here
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      or click to browse your local workspace directory
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-slate-800/80 text-[10px] font-mono text-slate-300 rounded-md border border-slate-700">
                    Supports multiple files & auto-duplicate detection
                  </span>
                </>
              )}
            </div>

            {/* Summary Results */}
            {importSummary && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Vault Import Result
                  </span>
                  <span className="text-emerald-400">
                    {importSummary.imported + importSummary.updated} Sessions Processed
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300">
                    <div className="font-bold text-sm">{importSummary.imported}</div>
                    <div className="text-[9px] text-emerald-400/80">New</div>
                  </div>
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300">
                    <div className="font-bold text-sm">{importSummary.updated}</div>
                    <div className="text-[9px] text-blue-400/80">Updated</div>
                  </div>
                  <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400">
                    <div className="font-bold text-sm">{importSummary.skipped}</div>
                    <div className="text-[9px]">Skipped</div>
                  </div>
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300">
                    <div className="font-bold text-sm">{importSummary.invalid}</div>
                    <div className="text-[9px] text-rose-400/80">Invalid</div>
                  </div>
                </div>

                {importSummary.sessions.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] text-slate-400 font-mono mb-1">Restored Sessions:</div>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {importSummary.sessions.map((s) => (
                        <div key={s.id} className="p-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="truncate font-medium">{s.title}</span>
                          <span className="text-[9px] font-mono text-emerald-400">{s.subject}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500">
              Offline Knowledge Reconstruction Active
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
