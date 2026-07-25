import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Clock, BarChart, Target, AlertTriangle, 
  Lightbulb, HelpCircle, ArrowRight, CornerDownRight, 
  Sparkles, CheckCircle, Flame, MessageSquare, Info,
  ChevronRight, Lock, Eye, Compass, ShieldAlert, Zap,
  Award, RefreshCw, Cpu, Stethoscope, TrendingUp, Sprout, Cog, Globe
} from "lucide-react";
import FormattedMarkdown from "../../components/FormattedMarkdown";
import MathFormula from "../../components/MathFormula";
import { ChatMessage, UserProfile, StudySession } from "../../types";

interface LearningCanvasViewProps {
  message: ChatMessage;
  session: StudySession;
  user: UserProfile;
  onCheckUnderstanding: () => void;
  onBackToPrompt: () => void;
  onNewChat?: () => void;
}

export default function LearningCanvasView({ 
  message, 
  session, 
  user, 
  onCheckUnderstanding, 
  onBackToPrompt,
  onNewChat
}: LearningCanvasViewProps) {
  const activeTheme = (user.preferences?.theme && user.preferences.theme !== "light") ? user.preferences.theme : "obsidian";
  const topicName = session.focus || "General Science";

  // --- 1. ADAPTIVE LEVEL DETECTION ---
  const rawLevel = user.academicLevel || "Undergraduate Student";
  let academicTier: "Undergraduate (Introductory)" | "Undergraduate (Advanced)" | "Graduate Research" = "Undergraduate (Introductory)";
  
  if (rawLevel.toLowerCase().includes("graduate") || rawLevel.toLowerCase().includes("phd") || rawLevel.toLowerCase().includes("master")) {
    academicTier = "Graduate Research";
  } else if (rawLevel.toLowerCase().includes("3") || rawLevel.toLowerCase().includes("4") || rawLevel.toLowerCase().includes("senior") || rawLevel.toLowerCase().includes("third") || rawLevel.toLowerCase().includes("final")) {
    academicTier = "Undergraduate (Advanced)";
  }

  // --- 2. EXAMPLE & ANALOGY ADAPTATION (DISCIPLINE-BASED) ---
  const rawFaculty = (user.faculty || user.department || "Engineering").toLowerCase();
  let discipline: "Computer Science" | "Medicine & Health" | "Business & Finance" | "Agriculture" | "Engineering" = "Engineering";
  
  if (rawFaculty.includes("computer") || rawFaculty.includes("software") || rawFaculty.includes("information") || rawFaculty.includes("cs")) {
    discipline = "Computer Science";
  } else if (rawFaculty.includes("medic") || rawFaculty.includes("health") || rawFaculty.includes("nurse") || rawFaculty.includes("bio")) {
    discipline = "Medicine & Health";
  } else if (rawFaculty.includes("business") || rawFaculty.includes("finance") || rawFaculty.includes("econom") || rawFaculty.includes("commerce")) {
    discipline = "Business & Finance";
  } else if (rawFaculty.includes("agri") || rawFaculty.includes("crop") || rawFaculty.includes("soil") || rawFaculty.includes("farm")) {
    discipline = "Agriculture";
  }

  // Define discipline icons
  const getDisciplineIcon = () => {
    switch (discipline) {
      case "Computer Science": return <Cpu className="w-4 h-4 text-emerald-400" />;
      case "Medicine & Health": return <Stethoscope className="w-4 h-4 text-rose-400" />;
      case "Business & Finance": return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case "Agriculture": return <Sprout className="w-4 h-4 text-amber-400" />;
      default: return <Cog className="w-4 h-4 text-purple-400" />;
    }
  };

  // --- 3. ADAPTIVE ANALOGY GENERATION ---
  const getAdaptiveAnalogy = () => {
    if (topicName.toLowerCase().includes("entropy") || topicName.toLowerCase().includes("thermodynamics")) {
      return {
        analogy: "Imagine a brand new, meticulously organized warehouse. Over time, as shipments come in and workers move items rapidly without putting them back, tools and boxes scatter across the floor. To organize it back, you must actively expend mechanical energy (doing work). Without constant external effort, systems naturally drift into disorganized chaos.",
        mapping: "Messy Warehouse = High Entropy State | Active Restocking = Work Expended"
      };
    }
    if (topicName.toLowerCase().includes("current") || topicName.toLowerCase().includes("voltage") || topicName.toLowerCase().includes("circuit") || topicName.toLowerCase().includes("ohm")) {
      return {
        analogy: "Think of electrical charge as water flowing through a dynamic pressurized pipe system. The voltage represents the water pressure pump pushing from the local reservoir, current is the volumetric flow rate of the water itself, and resistance is a localized narrowing in the pipe that constricts the flow.",
        mapping: "Pump Pressure = Voltage (V) | Water Flow Rate = Current (I) | Narrow Valve = Resistance (R)"
      };
    }
    if (topicName.toLowerCase().includes("force") || topicName.toLowerCase().includes("newton") || topicName.toLowerCase().includes("acceleration") || topicName.toLowerCase().includes("motion")) {
      return {
        analogy: "Think of pushing a heavy, stalled agricultural transport vehicle on a muddy farm path. The acceleration of the vehicle depends directly on how hard you and your teammates push (net vector force) and is inversely restricted by the massive load of harvest stored in the truck (mass).",
        mapping: "Combined Push = Net Force (F) | Vehicle Weight = Mass (m) | Sudden Speeding Up = Acceleration (a)"
      };
    }
    if (topicName.toLowerCase().includes("binary") || topicName.toLowerCase().includes("algorithm") || topicName.toLowerCase().includes("search")) {
      return {
        analogy: "Imagine searching for a single name in an alphabetized physical telephone directory of 1,000 pages. Instead of flipping page-by-page from the start, you split the entire book perfectly in half, inspect if the name is before or after, throw away the irrelevant half, and repeat. You find any name in under 10 splits.",
        mapping: "Telephone Directory = Sorted Array | Splitting Page = Pivot Check | Discarding Half = O(log N) Space reduction"
      };
    }
    // Generic fallback
    return {
      analogy: `Think of ${topicName} as a highly responsive balancing scale: when you add a weight (stimulus) on one side, the scale tips temporarily, causing the counter-weights (restoring forces) to adjust and oscillate until the system settles back into a stable state of balance (equilibrium).`,
      mapping: "Added Weight = Input Stimulus | Counter-Weights = Restoring Forces | Final Balance = Normalized Equilibrium"
    };
  };

  // --- 4. DISCIPLINE-SPECIFIC CASE STUDIES & LOCAL AFRICAN CONTEXTS ---
  const getDisciplineCaseStudy = () => {
    switch (discipline) {
      case "Computer Science":
        return {
          title: "African Mobile Money Grid (M-Pesa Architecture)",
          context: "In high-throughput micro-transaction architectures across East Africa, distributed nodes sync transaction logs. Designers calculate physical latency constraints and packet propagation queues to maintain eventual consistency without locking the relational database servers during morning market peaks.",
          metric: "Throughput Limit: 10,000 tx/sec | Edge Node Latency: < 45ms"
        };
      case "Medicine & Health":
        return {
          title: "Rural Telemedicine Bandwidth Optimization",
          context: "Surgical monitoring platforms in decentralized clinics across sub-Saharan Africa must prioritize vital metric alerts over unstable cellular networks. Systems map vital parameters to lightweight compression vectors, preserving diagnostic data fidelity even during 2G/3G network throttling.",
          metric: "Diagnostic Fidelity: 99.4% | Minimum Bandwidth Payload: 8kbps"
        };
      case "Business & Finance":
        return {
          title: "Decentralized Agricultural Commodity Pricing",
          context: "Smallholder farming co-operatives in West Africa utilize dynamic pricing models. By aggregating market demand curves and transport logistics fuel costs real-time, the platform adjusts minimum pricing boundaries to guard farmers against predatory middleman price exploitation.",
          metric: "Co-op Yield Stabilization: +24% | Pricing Update Interval: 12 Hours"
        };
      case "Agriculture":
        return {
          title: "Smart Drip Irrigation in Arid Soils",
          context: "Automated solar-powered micro-irrigation systems in northern Kenya measure soil volumetric water content. Crop models compute transient transpiration matrices based on humidity gradients to feed precise micro-liters of water directly to root nodes, eliminating evaporative waste.",
          metric: "Water Conservation Factor: 3.8x | Solar Battery Autonomy: 72 Hours"
        };
      default: // Engineering
        return {
          title: "East African Rift Geothermal Grid Stress Bounds",
          context: "Geothermal steam piping networks in Olkaria, Kenya undergo intense thermal expansion cycle stresses. Engineering models compute fluid flow velocity vectors and thermal shear tolerances along weld lines to guarantee steam turbine uptime without risking structural failure.",
          metric: "Maximum Heat Load: 340°C | Yield Shear Resistance: 450 MPa"
        };
    }
  };

  // --- 5. ADAPTIVE PARSING OF THE AI CHAT MESSAGE ---
  const rawText = message.text || "";
  const paragraphs = rawText.split("\n\n").filter(p => p.trim().length > 0);

  const hasProgressiveParts = message.progressiveParts && message.progressiveParts.length >= 5;

  // Parse paragraphs intelligently to structure educational progress
  const definitionText = hasProgressiveParts
    ? message.progressiveParts![0].content
    : (paragraphs[0] || `An introduction to the mechanics of ${topicName}.`);

  const explanationText = hasProgressiveParts
    ? message.progressiveParts![1].content
    : (paragraphs[1] || paragraphs[0] || "");

  const secondaryDetailText = hasProgressiveParts
    ? null
    : (paragraphs[2] || "This provides the theoretical groundwork to comprehend the system limits, setting the foundation for the mathematical proof and localized application cases.");

  const dynamicAnalogy = getAdaptiveAnalogy();
  const adaptiveCaseStudy = getDisciplineCaseStudy();

  // Common traps adapted for topic
  const commonTraps = [
    {
      concept: `Conflating Static vs Dynamic variables in ${topicName}`,
      trap: "Assuming steady-state rules apply during sudden load spikes or transient system start-ups.",
      correction: "Transient phases generate high boundary stresses. Always compute differential variables."
    },
    {
      concept: "Ignoring localized feedback loops",
      trap: "Treating external environment factors as perfectly insulated constants.",
      correction: "Apply regional correction factors (e.g. ambient heat, soil moisture, network jitter) to calculations."
    }
  ];

  // --- 6. PROGRESSIVE DISCLOSURE STATE MACHINE ---
  // We divide the lesson into 5 distinct, readable sections
  const sections = [
    { 
      id: "intro", 
      title: hasProgressiveParts ? message.progressiveParts![0].title : "Core Concept & Definition", 
      complexity: "Foundational" 
    },
    { 
      id: "explanation", 
      title: hasProgressiveParts ? message.progressiveParts![1].title : "Detailed Breakdown & Analysis", 
      complexity: academicTier === "Graduate Research" ? "Advanced Research" : "Technical Core" 
    },
    { 
      id: "analogy", 
      title: hasProgressiveParts ? message.progressiveParts![2].title : "Intuitive Analogy & Mental Model", 
      complexity: "Conceptual Intuition" 
    },
    { 
      id: "application", 
      title: hasProgressiveParts ? message.progressiveParts![3].title : `Localized Case Study (${discipline})`, 
      complexity: "Applied Practical" 
    },
    { 
      id: "traps", 
      title: hasProgressiveParts ? message.progressiveParts![4].title : "Common Misconceptions & Traps", 
      complexity: "Mistake Mitigation" 
    }
  ];

  const [unlockedSections, setUnlockedSections] = useState<string[]>(["intro"]);
  const [activeSectionId, setActiveSectionId] = useState<string>("intro");
  
  // Track reading timers
  const wordCount = rawText.split(/\s+/).length;
  const initialReadingTime = Math.max(2, Math.ceil(wordCount / 150));
  const [timeRemaining, setTimeRemaining] = useState(initialReadingTime * 60); // in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const handleUnlockNext = (currentId: string) => {
    const currentIndex = sections.findIndex(s => s.id === currentId);
    if (currentIndex !== -1 && currentIndex < sections.length - 1) {
      const nextId = sections[currentIndex + 1].id;
      if (!unlockedSections.includes(nextId)) {
        setUnlockedSections(prev => [...prev, nextId]);
      }
      setActiveSectionId(nextId);
      
      // Auto scroll to next section view smoothly
      setTimeout(() => {
        const el = document.getElementById(`section-anchor-${nextId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  // --- 7. READINESS DETECTION ENGINE ---
  const sectionsCompletedCount = unlockedSections.length;
  const progressPercentage = Math.round((sectionsCompletedCount / sections.length) * 100);
  const isReadinessPassed = sectionsCompletedCount === sections.length;

  // Confidence and feedback customization based on previous profile scores
  const studyStreak = user.preferences?.cognitiveLoad || "Standard";
  const encouragesMessage = isReadinessPassed 
    ? "Fantastic progress! Your active reading metrics indicate you are fully primed to synthesize these concepts in the upcoming reflection."
    : `Focus on mastering one node at a time. The Adaptive Engine has adjusted this session's pacing for ${user.preferences.teachingStyle || "Socratic"} learning.`;

  // Themes mapping
  const textPrimary = "text-white";
  const textSecondary = "text-slate-300";
  const textMuted = "text-slate-400";
  
  const cardBg = activeTheme === "cybernetic" 
    ? "bg-[#081318]/70 border border-[#143542]" 
    : "bg-[#121620]/90 border border-slate-800/80";

  const bannerBg = activeTheme === "cybernetic"
    ? "bg-gradient-to-r from-[#00ffcc]/10 to-[#705fd9]/10 border border-[#143542]"
    : "bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-900/20";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-8 font-sans">
      


      {/* 🏷️ ARTICLE TOP BAR */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800/10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-light" />
          <span className="text-xs font-mono tracking-wider text-slate-500 uppercase">
            Active Study Module
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="px-3 py-1.5 rounded-full text-[11px] font-mono tracking-tight flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold border border-blue-400/30 shadow-md shadow-blue-500/10 cursor-pointer"
              title="Start a completely empty study workspace"
            >
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              New Chat
            </button>
          )}
          <button
            onClick={onBackToPrompt}
            className="px-3 py-1.5 rounded-full text-[11px] font-mono tracking-tight flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand-light" />
            Ask Another Question
          </button>
        </div>
      </div>

      {/* 🎓 ADAPTIVE ENGINE INSIGHTS LABEL (Subtle, professional metadata) */}
      <div className={`p-4 rounded-xl ${cardBg} flex items-start gap-3 border-l-4 border-l-blue-500`}>
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-blue-400 uppercase block">
            Adaptive Personalization Log
          </span>
          <p className="text-[11px] leading-relaxed text-slate-400 font-light">
            This module has been optimized using your <strong className="text-slate-200 font-medium">{discipline}</strong> discipline map and <strong className="text-slate-200 font-medium">{rawLevel}</strong> academic level profile. Explanations are delivered in a progressive structured sequence to avoid cognitive fatigue.
          </p>
        </div>
      </div>

      {/* 🏷️ TOPIC TITLE */}
      <div className="space-y-4">
        <h1 className={`text-3xl md:text-4xl font-serif font-semibold tracking-tight italic leading-tight ${textPrimary}`}>
          {topicName}
        </h1>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {initialReadingTime} min pace
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            {getDisciplineIcon()}
            <span>Discipline: {discipline}</span>
          </span>
          <span>•</span>
          <span>Style: {user.preferences.teachingStyle || "Socratic Dialectic"}</span>
        </div>
      </div>

      {/* 🎯 OBJECTIVE CALLOUT */}
      <div className={`p-5 rounded-2xl ${bannerBg} space-y-2`}>
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-brand-light uppercase">
          <Target className="w-4 h-4 animate-pulse" />
          <span>Dynamic Lesson Goal</span>
        </div>
        <p className="text-xs md:text-[13px] leading-relaxed font-light text-slate-300">
          Understand the fundamental physical laws, intuitive physical mapping, localized African design constraints, and common misconception boundaries of <strong className="text-white font-medium">{topicName}</strong> well enough to explain the mechanics yourself.
        </p>
      </div>

      {/* 📝 PROGRESSIVE DISCLOSURE STEPS CONTAINER */}
      <div className="space-y-10 pt-4 relative">
        
        {/* --- SECTION 1: CORE DEFINITION --- */}
        <div id="section-anchor-intro" className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-mono flex items-center justify-center border border-blue-500/20 font-bold">
                01
              </span>
              <h3 className={`text-xs font-mono uppercase tracking-widest ${textPrimary} font-bold`}>
                Core Concept & Definition
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Foundational Definition</span>
          </div>

          <div className={`p-5 rounded-2xl ${cardBg} border-l-4 border-l-blue-600`}>
            <div className="markdown-body text-sm leading-relaxed text-slate-300 font-light space-y-3">
              <FormattedMarkdown>{definitionText}</FormattedMarkdown>
            </div>
          </div>

          {/* Progressive Unlock Action */}
          {unlockedSections.length === 1 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => handleUnlockNext("intro")}
                className="px-5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-mono flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>Deconstruct Explanation</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* --- SECTION 2: DETAILED BREAKDOWN --- */}
        {unlockedSections.includes("explanation") && (
          <motion.div 
            id="section-anchor-explanation" 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-slate-800/10 scroll-mt-24"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono flex items-center justify-center border border-emerald-500/20 font-bold">
                  02
                </span>
                <h3 className={`text-xs font-mono uppercase tracking-widest ${textPrimary} font-bold`}>
                  Detailed Breakdown & Analysis
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{academicTier === "Graduate Research" ? "Critical Review" : "Technical Core"}</span>
            </div>

            <div className="markdown-body text-sm md:text-[15px] leading-relaxed font-light text-slate-300 space-y-4">
              <FormattedMarkdown>{explanationText}</FormattedMarkdown>
              {secondaryDetailText && (
                <div className="text-xs text-slate-400 leading-relaxed border-l-2 border-slate-800 pl-4 py-1 italic font-light">
                  <FormattedMarkdown>{secondaryDetailText}</FormattedMarkdown>
                </div>
              )}
            </div>

            {unlockedSections.length === 2 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => handleUnlockNext("explanation")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 transition-all hover:scale-105"
                >
                  <span>Build Intuitive Model</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* --- SECTION 3: CONCEPTUAL INTUITION (ANALOGY) --- */}
        {unlockedSections.includes("analogy") && (
          <motion.div 
            id="section-anchor-analogy" 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-slate-800/10 scroll-mt-24"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono flex items-center justify-center border border-amber-500/20 font-bold">
                  03
                </span>
                <h3 className={`text-xs font-mono uppercase tracking-widest ${textPrimary} font-bold`}>
                  {hasProgressiveParts ? message.progressiveParts![2].title : "Intuitive Mental Model"}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Analogy Adaptation</span>
            </div>

            <div className={`p-6 rounded-2xl ${cardBg} relative overflow-hidden space-y-4`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Lightbulb className="w-24 h-24 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  {hasProgressiveParts ? "Conceptual Intuition & Analogy" : "Mental Model Mapping"}
                </h4>
              </div>

              <div className="space-y-3">
                <p className="text-xs md:text-[13px] leading-relaxed font-light italic text-slate-300">
                  {hasProgressiveParts ? message.progressiveParts![2].content : dynamicAnalogy.analogy}
                </p>
                
                {!hasProgressiveParts && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] font-mono text-amber-400 leading-snug">
                    <span className="font-bold uppercase tracking-wider block mb-1">Mapping Equivalency:</span>
                    {dynamicAnalogy.mapping}
                  </div>
                )}
              </div>
            </div>

            {unlockedSections.length === 3 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => handleUnlockNext("analogy")}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono flex items-center gap-2 transition-all hover:scale-105"
                >
                  <span>Link Real-World Context</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* --- SECTION 4: LOCALIZED CASE STUDY & EQUATION --- */}
        {unlockedSections.includes("application") && (
          <motion.div 
            id="section-anchor-application" 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-slate-800/10 scroll-mt-24"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-mono flex items-center justify-center border border-purple-500/20 font-bold">
                  04
                </span>
                <h3 className={`text-xs font-mono uppercase tracking-widest ${textPrimary} font-bold`}>
                  {hasProgressiveParts ? message.progressiveParts![3].title : "Practical Application Case Study"}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Discipline: {discipline}</span>
            </div>

            {/* Govering Equation Box (if applicable) */}
            {message.equation && (
              <MathFormula latex={message.equation} label="Governing Theoretical Equation" />
            )}

            {/* Local African Context Case Study */}
            <div className={`p-5 rounded-2xl ${cardBg} space-y-4`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-light uppercase">
                <Globe className="w-4 h-4 text-brand-light" />
                <span>{hasProgressiveParts ? message.progressiveParts![3].title : adaptiveCaseStudy.title}</span>
              </div>
              <p className="text-xs md:text-[13px] leading-relaxed font-light text-slate-300">
                {hasProgressiveParts ? message.progressiveParts![3].content : adaptiveCaseStudy.context}
              </p>
              
              {!hasProgressiveParts && (
                <div className="p-3 rounded-xl bg-[#070b13] border border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <span>Core Target Metric Bounds:</span>
                  <span className="font-bold">{adaptiveCaseStudy.metric}</span>
                </div>
              )}
            </div>

            {unlockedSections.length === 4 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => handleUnlockNext("application")}
                  className="px-5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-mono flex items-center gap-2 transition-all hover:scale-105"
                >
                  <span>Review Cognitive Traps</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* --- SECTION 5: COMMON MISTAKES & MISTAKE MITIGATION --- */}
        {unlockedSections.includes("traps") && (
          <motion.div 
            id="section-anchor-traps" 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-slate-800/10 scroll-mt-24"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-mono flex items-center justify-center border border-rose-500/20 font-bold">
                  05
                </span>
                <h3 className={`text-xs font-mono uppercase tracking-widest ${textPrimary} font-bold`}>
                  {hasProgressiveParts ? message.progressiveParts![4].title : "Cognitive Misconception Traps"}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Preventing Common Traps</span>
            </div>

            <div className={`p-5 rounded-2xl ${cardBg} space-y-5`}>
              <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{hasProgressiveParts ? "Identified Misconceptions & Structural Traps:" : "Before Proceeding, Correct These Instincts:"}</span>
              </div>

              {hasProgressiveParts ? (
                <div className="text-xs leading-relaxed font-light text-slate-300 space-y-2">
                  <FormattedMarkdown>{message.progressiveParts![4].content}</FormattedMarkdown>
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-slate-800/40">
                  {commonTraps.map((trap, idx) => (
                    <div key={idx} className={`text-xs leading-normal space-y-2 ${idx > 0 ? "pt-4" : ""}`}>
                      <div className="flex items-start gap-1.5 text-slate-200 font-medium">
                        <span className="text-blue-400 font-mono font-bold">Concept:</span>
                        <span>{trap.concept}</span>
                      </div>
                      
                      <div className="pl-4 space-y-1 text-[11px] leading-relaxed">
                        <div className="flex items-start gap-2 text-rose-400 font-light">
                          <span className="text-xs shrink-0">❌ Trap:</span>
                          <span>{trap.trap}</span>
                        </div>
                        <div className="flex items-start gap-2 text-emerald-400 font-light">
                          <span className="text-xs shrink-0">✅ Metric Correction:</span>
                          <span>{trap.correction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KEY TAKEAWAYS (DYNAMIC NOTE CARDS) */}
            {message.autoNotes && message.autoNotes.length > 0 && (
              <div className={`p-5 rounded-2xl ${cardBg} border border-purple-500/10 space-y-3`}>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase">
                  <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Permanent Study Takeaways</span>
                </div>
                <ul className="space-y-2 text-xs md:text-[13px] font-light text-slate-300">
                  {message.autoNotes.map((note, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-purple-400 font-mono mt-0.5">•</span>
                      <span>
                        <strong className="text-slate-200 font-medium">{note.key}:</strong> {note.val}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* 📊 DYNAMIC READINESS / PROFILE ENCOURAGEMENT PANEL */}
      <div className={`p-5 rounded-2xl ${cardBg} border-l-4 border-l-brand-medium space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-medium" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-brand-medium uppercase">
              Adaptive Readiness Engine
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Cognitive Load: {studyStreak}</span>
        </div>
        
        <p className="text-xs leading-relaxed text-slate-400 font-light">
          {encouragesMessage}
        </p>

        {/* Readiness Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className={sectionsCompletedCount >= 1 ? "text-emerald-400" : "text-slate-600"}>
              {sectionsCompletedCount >= 1 ? "✓" : "○"}
            </span>
            <span>Core Core Definition Read</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={sectionsCompletedCount >= 3 ? "text-emerald-400" : "text-slate-600"}>
              {sectionsCompletedCount >= 3 ? "✓" : "○"}
            </span>
            <span>Analogous Mental Model Formed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={sectionsCompletedCount >= 4 ? "text-emerald-400" : "text-slate-600"}>
              {sectionsCompletedCount >= 4 ? "✓" : "○"}
            </span>
            <span>Case Study & Equations Linked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={sectionsCompletedCount === sections.length ? "text-emerald-400" : "text-slate-600"}>
              {sectionsCompletedCount === sections.length ? "✓" : "○"}
            </span>
            <span>Misconceptions Audited & Corrected</span>
          </div>
        </div>
      </div>

      {/* 🏁 BOTTOM OF THE LESSON (PRIMARY ACTION BUTTON WITH READINESS COUPLING) */}
      <div className="pt-8 border-t border-slate-800/20 text-center space-y-4">
        <button
          onClick={() => {
            if (isReadinessPassed) {
              onCheckUnderstanding();
            }
          }}
          disabled={!isReadinessPassed}
          className={`w-full max-w-md mx-auto py-4 rounded-xl font-mono text-xs uppercase tracking-wider font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
            isReadinessPassed
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              : "bg-slate-800/40 text-slate-500 border border-slate-800/60 cursor-not-allowed"
          }`}
        >
          {isReadinessPassed ? (
            <>
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span>I'm Ready</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Unlock Lesson Progress ({progressPercentage}%)</span>
            </>
          )}
        </button>

        {!isReadinessPassed && (
          <p className="text-[10px] text-amber-500/80 font-mono">
            * Please progress through and read all 5 sections of the personalized lesson above to unlock the reflection gateway.
          </p>
        )}
      </div>

    </div>
  );
}
