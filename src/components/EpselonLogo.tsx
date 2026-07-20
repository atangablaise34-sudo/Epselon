import React from "react";

interface EpselonLogoProps {
  className?: string;
  size?: number;
}

export default function EpselonLogo({ className = "", size = 48 }: EpselonLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradient 1: Deep Tech Blue to Vivid Indigo */}
        <linearGradient id="epselon-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#371BF2" />
          <stop offset="100%" stopColor="#705FD9" />
        </linearGradient>

        {/* Gradient 2: Bright Neon Magenta to Violet */}
        <linearGradient id="epselon-grad-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E01BF2" />
          <stop offset="100%" stopColor="#705FD9" />
        </linearGradient>

        {/* Gradient 3: Intense Pink to Blue transition */}
        <linearGradient id="epselon-grad-vibrant" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#FF2AF5" />
          <stop offset="50%" stopColor="#705FD9" />
          <stop offset="100%" stopColor="#371BF2" />
        </linearGradient>

        {/* Filter for subtle glow effect matching the visual theme */}
        <filter id="epselon-subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g filter="url(#epselon-subtle-glow)">
        {/* Top Arm of E */}
        <path
          d="M 44 26 H 76 L 62 38 H 30 Z"
          fill="url(#epselon-grad-magenta)"
        />

        {/* Top-to-Middle Diagonal Connection Segment */}
        <path
          d="M 30 38 L 48 50 H 34 L 16 38 Z"
          fill="url(#epselon-grad-blue)"
          opacity="0.9"
        />

        {/* Middle Arm of E */}
        <path
          d="M 34 50 H 66 L 52 62 H 20 Z"
          fill="url(#epselon-grad-vibrant)"
        />

        {/* Middle-to-Bottom Diagonal Connection Segment */}
        <path
          d="M 20 62 L 38 74 H 24 L 6 62 Z"
          fill="url(#epselon-grad-blue)"
          opacity="0.9"
        />

        {/* Bottom Arm of E */}
        <path
          d="M 24 74 H 56 L 42 86 H 10 Z"
          fill="url(#epselon-grad-magenta)"
        />
      </g>
    </svg>
  );
}
