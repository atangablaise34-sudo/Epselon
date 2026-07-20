import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

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
        className="absolute w-[260px] h-[260px] rounded-full filter blur-[55px] opacity-75 animate-blob"
        style={{
          left: '5%',
          top: '10%',
          backgroundColor: colors[0],
          animationDuration: `${12 / speed}s`,
        }}
      />

      {/* Glowing Blob 2 */}
      <div 
        className="absolute w-[280px] h-[280px] rounded-full filter blur-[65px] opacity-70 animate-blob-reverse"
        style={{
          right: '5%',
          bottom: '10%',
          backgroundColor: colors[1],
          animationDuration: `${15 / speed}s`,
        }}
      />

      {/* Glowing Blob 3 */}
      <div 
        className="absolute w-[240px] h-[240px] rounded-full filter blur-[60px] opacity-65 animate-blob"
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
        className="absolute w-[230px] h-[230px] rounded-full filter blur-[55px] opacity-80 animate-blob-reverse"
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

export default function GraphWatermark() {
  const colors = [
    "#FF2AF5", // Neon Pink
    "#E01BF2", // Vivid Magenta
    "#705FD9", // Violet
    "#371BF2", // Deep Tech Blue
    "#0B1020", // Deep Blue
  ];

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const rect = document.querySelector("#watermark-svg")?.getBoundingClientRect();
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
  }, [mousePosition]);

  return (
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[-10] pointer-events-none opacity-10 w-[380px] h-[475px]"
      id="graph-watermark-container"
    >
      <motion.div
        className="relative w-full h-full"
        animate={{
          y: [0, -8, 0],
          scaleY: [1, 1.08, 1],
        }}
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "top center" }}
      >
        <svg 
          id="watermark-svg"
          xmlns="http://www.w3.org/2000/svg" 
          width="231" 
          height="289" 
          viewBox="0 0 231 289" 
          className="w-full h-auto"
        >
          <defs>
            <clipPath id="shapeClipWatermark">
              <path d="M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z" />
            </clipPath>
          </defs>

          <foreignObject width="231" height="289" clipPath="url(#shapeClipWatermark)">
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
