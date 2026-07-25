import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Terminal, Compass, Sparkles } from "lucide-react";
import RadialPulseLoader from "../../components/ui/loading-animation";
import EpselonLogo from "./EpselonLogo";

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Calibrating educational nodes...");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let timeoutId: any = null;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (!timeoutId) {
            timeoutId = setTimeout(() => {
              onCompleteRef.current();
            }, 600);
          }
          return 100;
        }
        
        // Dynamic status updates
        if (prev > 75) setStatusText("Activating customized cognitive profile...");
        else if (prev > 45) setStatusText("Loading local knowledge schema graph...");
        else if (prev > 20) setStatusText("Configuring Educational Intelligence parameters...");
        
        return prev + Math.floor(Math.random() * 12) + 4;
      });
    }, 150);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0c0e12] flex flex-col items-center justify-center text-white z-50 overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-brand-medium/5 rounded-full blur-[90px]" />
      </div>

      <div className="relative flex flex-col items-center max-w-md px-6 text-center z-10">
        {/* Core Quantum Logo Node */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative mb-6 flex items-center justify-center"
        >
          {/* Pulsing ring aura */}
          <div className="absolute -inset-6 bg-brand-primary/15 rounded-full blur-2xl animate-pulse" />
          
          <EpselonLogo size={140} className="relative z-10 filter drop-shadow-[0_0_20px_rgba(224,27,242,0.35)]" />
        </motion.div>

        {/* Brand Name & Identity */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-serif italic text-4xl font-medium tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent mb-2"
        >
          Epselon
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light/80 mb-12"
        >
          Learning Operating System
        </motion.p>

        {/* Customized Progress Bar & Micro-labels */}
        <div className="w-64">
          <div className="h-[2px] w-full bg-slate-800 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-dark via-brand-primary to-brand-light"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 tracking-wider">
            <AnimatePresence mode="wait">
              <motion.span
                key={statusText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-left w-48 truncate block text-slate-400"
              >
                {statusText}
              </motion.span>
            </AnimatePresence>
            <span className="font-semibold text-brand-light">{Math.min(progress, 100)}%</span>
          </div>
        </div>
      </div>

      {/* Decorative Technical Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 font-mono text-[9px] text-slate-600 tracking-widest uppercase">
        <Sparkles className="w-3 h-3 text-slate-700" />
        <span>Cognitive Intelligence Layer v1.0</span>
      </div>
    </div>
  );
}
