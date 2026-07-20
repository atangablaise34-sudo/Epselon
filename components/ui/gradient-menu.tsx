import React from 'react';
import { 
  Network, 
  Brain, 
  Cpu, 
  Layers, 
  Settings,
  GraduationCap
} from 'lucide-react';

export interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
}

interface GradientMenuProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  theme?: string;
}

export default function GradientMenu({ 
  currentRoute = "nexus", 
  onNavigate = () => {}, 
  theme = "obsidian" 
}: GradientMenuProps) {
  const menuItems: MenuItem[] = [
    { 
      id: 'workspace', 
      title: 'AI Workspace', 
      icon: <Cpu className="w-5 h-5" />, 
      gradientFrom: '#1711BF', 
      gradientTo: '#371BF2' 
    },
    { 
      id: 'nexus', 
      title: 'Nexus', 
      icon: <Network className="w-5 h-5" />, 
      gradientFrom: '#371BF2', 
      gradientTo: '#705FD9' 
    },
    { 
      id: 'flashcards', 
      title: 'Recall', 
      icon: <Layers className="w-5 h-5" />, 
      gradientFrom: '#705FD9', 
      gradientTo: '#9C8BD9' 
    },
    { 
      id: 'teacher', 
      title: 'Teacher', 
      icon: <GraduationCap className="w-5 h-5" />, 
      gradientFrom: '#9C8BD9', 
      gradientTo: '#371BF2' 
    },
    { 
      id: 'settings', 
      title: 'System', 
      icon: <Settings className="w-5 h-5" />, 
      gradientFrom: '#371BF2', 
      gradientTo: '#1711BF' 
    }
  ];

  const isLightTheme = theme === "light";

  return (
    <div className="flex justify-center items-center py-2 w-full">
      <ul className="flex justify-center gap-1.5 min-[375px]:gap-2 sm:gap-4 md:gap-5 px-2 max-w-full">
        {menuItems.map(({ id, title, icon, gradientFrom, gradientTo }) => {
          const isSelected = currentRoute === id;
          const customStyle = {
            '--gradient-from': gradientFrom,
            '--gradient-to': gradientTo,
          } as React.CSSProperties;

          return (
            <li
              key={id}
              style={customStyle}
              onClick={() => onNavigate(id)}
              className={`relative h-[40px] min-[375px]:h-[44px] sm:h-[52px] md:h-[56px] rounded-full flex items-center justify-center transition-all duration-500 group cursor-pointer border select-none ${
                isSelected
                  ? "w-[95px] min-[375px]:w-[110px] sm:w-[140px] md:w-[150px]"
                  : "w-[40px] min-[375px]:w-[44px] sm:w-[52px] md:w-[56px] hover:w-[95px] min-[375px]:hover:w-[110px] sm:hover:w-[140px] md:hover:w-[150px]"
              } ${
                isLightTheme
                  ? isSelected
                    ? "bg-slate-100 border-slate-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  : isSelected
                    ? "bg-slate-900 border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "bg-[#11141b] border-slate-800 hover:border-slate-700 shadow-lg"
              }`}
            >
              {/* Gradient background overlay on hover / active */}
              <span 
                className={`absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] transition-all duration-500 ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              />
              
              {/* Blur glow effect */}
              <span 
                className={`absolute top-[6px] inset-x-2 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[10px] -z-10 transition-all duration-500 ${
                  isSelected ? "opacity-40" : "opacity-0 group-hover:opacity-40"
                }`}
              />

              {/* Icon Container */}
              <span 
                className={`relative z-10 transition-all duration-500 flex items-center justify-center ${
                  isSelected 
                    ? "opacity-0 scale-0 pointer-events-none" 
                    : "opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-0 delay-0"
                }`}
              >
                <span className={isLightTheme ? "text-slate-600" : "text-slate-400 group-hover:text-white"}>
                  {icon}
                </span>
              </span>

              {/* Title Text */}
              <span 
                className={`absolute text-white font-medium uppercase tracking-wider text-[8px] min-[375px]:text-[9px] sm:text-[11px] md:text-xs transition-all duration-500 ${
                  isSelected 
                    ? "scale-100 opacity-100" 
                    : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 delay-150"
                }`}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
