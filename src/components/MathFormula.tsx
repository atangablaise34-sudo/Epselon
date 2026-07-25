import React, { useMemo } from "react";
import katex from "katex";
import { Copy, Check, Eye, Code } from "lucide-react";

interface MathFormulaProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
  showCopyButton?: boolean;
  label?: string;
}

/**
 * MathFormula renders LaTeX equations as beautiful textbook-grade math formulas using KaTeX.
 * If KaTeX fails to parse, it falls back to a clean readable representation.
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  latex,
  displayMode = true,
  className = "",
  showCopyButton = true,
  label,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [showRaw, setShowRaw] = React.useState(false);

  // Clean raw LaTeX string
  const cleanLatex = useMemo(() => {
    if (!latex) return "";
    let trimmed = latex.trim();
    // Strip leading/trailing math delimiters if present
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
      trimmed = trimmed.slice(2, -2).trim();
    } else if (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) {
      trimmed = trimmed.slice(2, -2).trim();
    } else if (trimmed.startsWith("$") && trimmed.endsWith("$")) {
      trimmed = trimmed.slice(1, -1).trim();
    } else if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) {
      trimmed = trimmed.slice(2, -2).trim();
    }
    return trimmed;
  }, [latex]);

  const html = useMemo(() => {
    if (!cleanLatex) return "";
    try {
      return katex.renderToString(cleanLatex, {
        displayMode,
        throwOnError: false,
        output: "htmlAndMathml",
      });
    } catch (err) {
      console.warn("KaTeX render error:", err);
      return `<span class="katex-fallback">${cleanLatex}</span>`;
    }
  }, [cleanLatex, displayMode]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanLatex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!cleanLatex) return null;

  return (
    <div className={`group relative my-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 sm:p-4 transition-all hover:border-slate-700/80 ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-semibold">
            {label}
          </span>
          <span className="text-[9px] font-mono text-slate-500">Textbook Standard</span>
        </div>
      )}

      {/* Main Formula Display */}
      {!showRaw ? (
        <div
          className="katex-container overflow-x-auto no-scrollbar py-1 text-slate-100 flex items-center justify-center min-h-[36px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="text-xs font-mono text-indigo-300 bg-slate-900/90 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
          {cleanLatex}
        </pre>
      )}

      {/* Action Bar (Copy & Toggle Raw LaTeX) */}
      {showCopyButton && (
        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowRaw(!showRaw);
            }}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
            title={showRaw ? "Show rendered formula" : "Show raw LaTeX string"}
          >
            {showRaw ? <Eye className="w-3 h-3 text-indigo-400" /> : <Code className="w-3 h-3 text-slate-400" />}
            <span>{showRaw ? "Render Formula" : "Raw LaTeX"}</span>
          </button>

          <span className="text-slate-700">•</span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Copy formula LaTeX to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MathFormula;
