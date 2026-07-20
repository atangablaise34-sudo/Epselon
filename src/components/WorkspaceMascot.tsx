import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useFocusMode } from "../context/FocusModeContext";
import { EventBus } from "../lib/EventBus";

// Self-contained high-performance MeshGradient component matching Epselon brand colors
function MeshGradient({ colors, className = "", speed = 1 }: { colors: string[]; className?: string; speed?: number }) {
  return (
    <div className={`relative overflow-hidden w-full h-full bg-slate-950 ${className}`}>
      {/* Background base */}
      <div 
        className="absolute inset-0 transition-colors duration-1000" 
        style={{ backgroundColor: colors[4] || "#0B1020" }} 
      />
      
      {/* Glowing Blob 1 */}
      <div 
        className="absolute w-[160px] h-[160px] rounded-full filter blur-[35px] opacity-75 animate-blob transition-colors duration-1000"
        style={{
          left: '5%',
          top: '10%',
          backgroundColor: colors[0],
          animationDuration: `${12 / speed}s`,
        }}
      />

      {/* Glowing Blob 2 */}
      <div 
        className="absolute w-[180px] h-[180px] rounded-full filter blur-[45px] opacity-70 animate-blob-reverse transition-colors duration-1000"
        style={{
          right: '5%',
          bottom: '10%',
          backgroundColor: colors[1],
          animationDuration: `${15 / speed}s`,
        }}
      />

      {/* Glowing Blob 3 */}
      <div 
        className="absolute w-[140px] h-[140px] rounded-full filter blur-[40px] opacity-65 animate-blob transition-colors duration-1000"
        style={{
          right: '10%',
          top: '20%',
          backgroundColor: colors[2],
          animationDuration: `${10 / speed}s`,
          animationDelay: '1.5s'
        }}
      />

      {/* Glowing Blob 4 */}
      <div 
        className="absolute w-[130px] h-[130px] rounded-full filter blur-[35px] opacity-80 animate-blob-reverse transition-colors duration-1000"
        style={{
          left: '10%',
          bottom: '15%',
          backgroundColor: colors[3],
          animationDuration: `${11 / speed}s`,
          animationDelay: '3s'
        }}
      />
    </div>
  );
}

export default function WorkspaceMascot() {
  const { isFocusMode } = useFocusMode();
  
  // State Machine
  const [mascotState, setMascotState] = useState<"Idle" | "Listening" | "Thinking" | "Speaking" | "Encouraging" | "Reflecting">("Idle");

  const baseColors = [
    "#FF2AF5", // Neon Pink
    "#E01BF2", // Vivid Magenta
    "#705FD9", // Violet
    "#371BF2", // Deep Tech Blue
    "#0B1020", // Deep Blue
  ];

  const thinkingColors = [
    "#4F46E5", // Indigo 600
    "#6366F1", // Indigo 500
    "#818CF8", // Indigo 400
    "#3730A3", // Indigo 800
    "#1E1B4B", // Indigo 950
  ];
  
  const encouragingColors = [
    "#F59E0B", // Amber 500
    "#FCD34D", // Amber 300
    "#10B981", // Emerald 500
    "#059669", // Emerald 600
    "#064E3B", // Emerald 900
  ];

  const reflectingColors = [
    "#3B82F6", // Blue 500
    "#60A5FA", // Blue 400
    "#2563EB", // Blue 600
    "#1D4ED8", // Blue 700
    "#1E3A8A", // Blue 900
  ];

  const getColors = () => {
    switch (mascotState) {
      case "Thinking": return thinkingColors;
      case "Encouraging": return encouragingColors;
      case "Reflecting": return reflectingColors;
      default: return baseColors;
    }
  };

  const colors = getColors();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Event Bus Subscriptions
  useEffect(() => {
    const unsubFocusStarted = EventBus.subscribe("focus_started", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubListeningStarted = EventBus.subscribe("listening_started", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubSpeechDetected = EventBus.subscribe("speech_detected", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubSpeechFinished = EventBus.subscribe("speech_finished", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubThinkingStarted = EventBus.subscribe("thinking_started", () => {
      setMascotState("Thinking");
      setEyeOffset({ x: 0, y: -12 });
    });
    const unsubThinkingFinished = EventBus.subscribe("thinking_finished", () => {
      // Transition out of thinking
    });
    const unsubSpeechPlaybackStarted = EventBus.subscribe("speech_playback_started", () => {
      setMascotState("Speaking");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubSpeechPlaybackFinished = EventBus.subscribe("speech_playback_finished", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubFocusEnded = EventBus.subscribe("focus_ended", () => {
      setMascotState("Idle");
      setEyeOffset({ x: 0, y: 0 });
    });

    const unsubSpeechStarted = EventBus.subscribe("speech_started", () => {
      setMascotState("Speaking");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubSpeechCancelled = EventBus.subscribe("speech_cancelled", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubVoiceStarted = EventBus.subscribe("voice_started", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubVoicePartial = EventBus.subscribe("voice_partial", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubVoiceCompleted = EventBus.subscribe("voice_completed", () => {
      // Finished listening to the student, transitioning or waiting
    });

    const unsubAI_GEN = EventBus.subscribe("AI_GENERATING", () => {
      setMascotState("Thinking");
      setEyeOffset({ x: 0, y: -12 });
    });
    const unsubAI_RES = EventBus.subscribe("AI_RESPONSE_READY", () => {
      setMascotState("Speaking");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubRES_COMP = EventBus.subscribe("RESPONSE_COMPLETED", () => {
      setMascotState("Idle");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubREF_START = EventBus.subscribe("REFLECTION_STARTED", () => setMascotState("Reflecting"));
    const unsubVOICE_LISTEN = EventBus.subscribe("VOICE_LISTENING", () => {
      setMascotState("Listening");
      setEyeOffset({ x: 0, y: 0 });
    });
    const unsubFLASH_CORR = EventBus.subscribe("FLASHCARD_CORRECT", () => {
      setMascotState("Encouraging");
      setTimeout(() => setMascotState("Idle"), 2000);
    });

    return () => {
      unsubFocusStarted();
      unsubListeningStarted();
      unsubSpeechDetected();
      unsubSpeechFinished();
      unsubThinkingStarted();
      unsubThinkingFinished();
      unsubSpeechPlaybackStarted();
      unsubSpeechPlaybackFinished();
      unsubFocusEnded();

      unsubSpeechStarted();
      unsubSpeechCancelled();
      unsubVoiceStarted();
      unsubVoicePartial();
      unsubVoiceCompleted();

      unsubAI_GEN();
      unsubAI_RES();
      unsubRES_COMP();
      unsubREF_START();
      unsubVOICE_LISTEN();
      unsubFLASH_CORR();
    };
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      if (mascotState === "Thinking") {
        setEyeOffset({ x: 0, y: -12 });
      } else {
        setEyeOffset({ x: 0, y: 0 });
      }
      return; // Disable mouse tracking in focus mode
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isFocusMode, mascotState]);

  useEffect(() => {
    if (isFocusMode) return;
    const rect = document.querySelector("#mascot-svg")?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (mousePosition.x - centerX) * 0.08;
      const deltaY = (mousePosition.y - centerY) * 0.08;

      const maxOffset = 8;
      setEyeOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
      });
    }
  }, [mousePosition, isFocusMode]);

  const containerClasses = isFocusMode
    ? "fixed bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 z-50 pointer-events-auto opacity-100 scale-[2.5]"
    : "fixed bottom-[20px] right-[20px] z-[-10] pointer-events-none opacity-25 w-[180px] h-[225px]";

  const animationSpeed = mascotState === "Thinking" || mascotState === "Listening" ? 2 : mascotState === "Speaking" ? 1.5 : mascotState === "Reflecting" ? 0.5 : 1;

  return (
    <div 
      className={`${containerClasses} transition-all duration-1000 ease-in-out`}
      style={isFocusMode ? { width: "180px", height: "225px" } : {}}
      id="workspace-mascot-container"
    >
      <motion.div
        className="relative w-full h-full"
        animate={{
          y: mascotState === "Encouraging" ? [0, -15, 0] : mascotState === "Speaking" ? [0, -4, 0] : isFocusMode ? [0, -10, 0] : [0, -8, 0],
          scaleY: mascotState === "Listening" ? [1, 1.05, 1] : [1, 1.08, 1],
        }}
        transition={{
          duration: isFocusMode ? (mascotState === "Thinking" ? 6 : mascotState === "Speaking" ? 1.8 : 3.2) : 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "top center" }}
      >
        {/* Glow */}
        {isFocusMode && (
          <motion.div 
            className={`absolute inset-0 blur-[50px] rounded-full z-[-1] transition-colors duration-1000 ${
              mascotState === "Thinking" ? "bg-indigo-500/45" : mascotState === "Listening" ? "bg-teal-500/35" : "bg-blue-500/25"
            }`}
            animate={{ opacity: mascotState === "Thinking" ? [0.35, 0.9, 0.35] : mascotState === "Listening" ? [0.4, 0.65, 0.4] : 0.25 }}
            transition={{ duration: mascotState === "Thinking" ? 1.6 : 2.4, repeat: Infinity }}
          />
        )}

        <svg 
          id="mascot-svg"
          xmlns="http://www.w3.org/2000/svg" 
          width="231" 
          height="289" 
          viewBox="0 0 231 289" 
          className="w-full h-auto"
        >
          <defs>
            <clipPath id="shapeClip">
              <path d="M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z" />
            </clipPath>
          </defs>

          <foreignObject width="231" height="289" clipPath="url(#shapeClip)">
            <div className="w-full h-full text-slate-100">
              <MeshGradient colors={colors} className="w-full h-full" speed={1} />
            </div>
          </foreignObject>

          <motion.ellipse
            rx="20"
            ry="30"
            fill="currentColor"
            className="text-slate-100 animate-blink"
            animate={{
              cx: 80 + eyeOffset.x,
              cy: 120 + eyeOffset.y,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />
          <motion.ellipse
            rx="20"
            ry="30"
            fill="currentColor"
            className="text-slate-100 animate-blink"
            animate={{
              cx: 150 + eyeOffset.x,
              cy: 120 + eyeOffset.y,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          />

          {/* Socratic Mouth Path */}
          <motion.path
            d={mascotState === "Speaking" 
              ? "M 103 175 Q 115 195 127 175" 
              : "M 105 178 Q 115 184 125 178"
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            className="text-slate-100"
            animate={mascotState === "Speaking" ? {
              d: [
                "M 103 175 Q 115 198 127 175",
                "M 105 175 Q 115 180 125 175",
                "M 102 175 Q 115 204 128 175",
                "M 104 175 Q 115 185 126 175"
              ]
            } : {
              d: "M 105 178 Q 115 184 125 178"
            }}
            transition={mascotState === "Speaking" ? {
              duration: 0.35,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut"
            } : {
              duration: 0.4
            }}
          />
        </svg>

        <style>{`
          .animate-blink {
            animation: blink-anim 3s infinite ease-in-out;
          }

          @keyframes blink-anim {
            0%,
            90%,
            100% {
              ry: 30;
            }
            5% {
              ry: 30;
            }
            95% {
              ry: 3;
            }
          }

          @keyframes blob-bounce {
            0%, 100% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }

          @keyframes blob-bounce-reverse {
            0%, 100% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(-30px, 40px) scale(0.95);
            }
            66% {
              transform: translate(25px, -25px) scale(1.05);
            }
          }

          .animate-blob {
            animation: blob-bounce 12s infinite ease-in-out;
          }

          .animate-blob-reverse {
            animation: blob-bounce-reverse 15s infinite ease-in-out;
          }
        `}</style>
      </motion.div>
    </div>
  );
}
