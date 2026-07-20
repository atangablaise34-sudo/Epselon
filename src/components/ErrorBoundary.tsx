import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an uncaught rendering error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#0B1020] text-slate-100 flex items-center justify-center p-6 font-sans z-50 overflow-auto">
          {/* Background elegant blob */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-md w-full bg-[#141A2E]/80 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8 shadow-xl text-center z-10">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="font-serif italic text-2xl text-white font-medium mb-2">Workspace Recovery</h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Epselon's shell encountered an unexpected runtime boundary error. The safe execution layer was activated to protect your academic profiles.
            </p>

            <div className="bg-[#0B1020]/60 rounded-lg p-4 mb-6 border border-slate-800 text-left overflow-auto max-h-[140px]">
              <span className="font-mono text-[10px] text-red-400 block uppercase tracking-wider mb-1">Diagnostic Log:</span>
              <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap break-all">
                {this.state.error?.stack || this.state.error?.message || "Unknown Runtime Interruption"}
              </pre>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all duration-150"
              >
                Attempt Hot Reload
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-all duration-150"
              >
                Clear Cache & Hard Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
