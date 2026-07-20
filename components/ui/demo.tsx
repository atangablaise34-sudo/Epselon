import React, { useState } from "react";
import GradientMenu from "@/components/ui/gradient-menu";

const DemoOne = () => {
  const [activeRoute, setActiveRoute] = useState("dashboard");

  return (
    <div className="flex flex-col w-full min-h-screen justify-center items-center bg-slate-950 p-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-serif italic text-white mb-2">Epselon Custom Navigation</h3>
        <p className="text-slate-400 text-xs">Hover or click to switch educational sub-layers.</p>
        <div className="mt-4 px-3 py-1 bg-slate-900 border border-slate-800 rounded text-blue-400 font-mono text-[10px] uppercase">
          Active route: {activeRoute}
        </div>
      </div>
      
      <GradientMenu 
        currentRoute={activeRoute} 
        onNavigate={(route) => setActiveRoute(route)} 
      />
    </div>
  );
};

export { DemoOne };
