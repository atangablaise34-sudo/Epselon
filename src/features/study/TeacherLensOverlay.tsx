import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, Sparkles, AlertTriangle, HelpCircle, ArrowRight, 
  BookOpen, Award, Layers, Target, ChevronRight, MessageSquare, 
  Send, RefreshCw, Cpu, User, GraduationCap, Compass, ShieldAlert,
  Flame, Zap, Check, X, FileText, BarChart3, CornerDownRight, LogOut
} from "lucide-react";
import { UserProfile, StudySession } from "../../types";
import { TeacherLensEngine, TeacherLensData } from "../../lib/protocol/teacherLensEngine";
import FormattedMarkdown from "../../components/FormattedMarkdown";
import MathFormula from "../../components/MathFormula";

interface TeacherLensOverlayProps {
  topicName: string;
  user: UserProfile;
  session: StudySession;
  performanceScore?: {
    correctCount: number;
    totalCount: number;
  };
  lessonText?: string;
  onCloseSession: () => void;
  onHighlightNexusTopic?: (topic: string) => void;
}

export default function TeacherLensOverlay({
  topicName,
  user,
  session,
  performanceScore,
  lessonText,
  onCloseSession,
  onHighlightNexusTopic
}: TeacherLensOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ask Your Teacher Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "teacher"; text: string; id: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeHighlightedTopic, setActiveHighlightedTopic] = useState<string | null>(null);

  // Generate Teacher Lens insights
  const data: TeacherLensData = TeacherLensEngine.generate({
    topicName,
    lessonText,
    academicLevel: user.academicLevel,
    discipline: user.faculty || user.department,
    performanceScore
  });

  const handleContinue = () => {
    setIsExpanded(true);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 300, behavior: "smooth" });
      }
    }, 150);
  };

  const handleSendTeacherQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userQ = chatInput.trim();
    const userMsg = { sender: "user" as const, text: userQ, id: Math.random().toString(36).substring(7) };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/study/teacher-lens-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQ,
          topicName: data.topicName,
          academicLevel: user.academicLevel,
          discipline: user.faculty || user.department,
          lessonText: lessonText || ""
        })
      });

      if (res.ok) {
        const resData = await res.json();
        const replyText = resData.reply || resData.text || "As an examiner, my advice is to trace the boundary constraints first.";
        setChatMessages(prev => [
          ...prev, 
          { sender: "teacher", text: replyText, id: Math.random().toString(36).substring(7) }
        ]);
      } else {
        throw new Error("API response error");
      }
    } catch (err) {
      // Fallback Socratic Lecturer persona answer
      const fallbackReply = `**Lecturer Insight on "${userQ}":**\n\nWhen examiners evaluate this, we look for two things:\n1. **Conceptual Clarity:** Did you state the base principle without conflating variables?\n2. **Reasoning Trace:** Showing how the equation applies directly to the problem constraints.\n\n*Tip:* Never skip intermediate steps—that's where 40% of student marks are lost!`;
      setChatMessages(prev => [
        ...prev, 
        { sender: "teacher", text: fallbackReply, id: Math.random().toString(36).substring(7) }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTopicNodeClick = (nodeTitle: string) => {
    setActiveHighlightedTopic(nodeTitle);
    if (onHighlightNexusTopic) {
      onHighlightNexusTopic(nodeTitle);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 min-[375px]:p-4 sm:p-6 overflow-hidden">
      {/* Blurred Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl z-0"
      />

      {/* Main Slide-in Glassmorphic Container (85-90% viewport width) */}
      <motion.div
        initial={{ x: "100%", opacity: 0, scale: 0.98 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: "100%", opacity: 0, scale: 0.98 }}
        transition={{ 
          type: "spring", 
          damping: 28, 
          stiffness: 110, 
          mass: 0.85 
        }}
        className="relative z-10 w-[95%] sm:w-[90%] max-w-5xl h-[92vh] bg-[#080b18]/90 border border-[#371BF2]/35 rounded-3xl shadow-[0_25px_70px_rgba(55,27,242,0.22)] flex flex-col overflow-hidden backdrop-blur-2xl"
      >
        {/* Top Decorative Ambient Glow Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#371BF2] via-[#705FD9] to-[#9C8BD9]" />

        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-900/80 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#371BF2]/30 to-[#1711BF]/40 border border-[#705FD9]/40 flex items-center justify-center shadow-inner">
              <GraduationCap className="w-5 h-5 text-[#9C8BD9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#9C8BD9] font-bold">Epselon Proprietary</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#371BF2]/20 text-indigo-300 border border-[#371BF2]/40">Teacher Lens™</span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 font-sans tracking-tight">
                Pedagogical & Examiner Perspective
              </h2>
            </div>
          </div>

          <button
            onClick={onCloseSession}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            title="Complete Lesson and Exit Teacher Lens"
          >
            <span>Close Session</span>
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 no-scrollbar scroll-smooth">
          
          {/* ================= PART 3: WELCOME STATE ================= */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#371BF2]/15 via-slate-900/60 to-slate-950/80 border border-[#705FD9]/30 relative overflow-hidden space-y-6 shadow-xl">
            {/* Background Radial Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#371BF2]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Lesson Completed</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                Excellent work today.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                Today you completed <strong className="text-[#9C8BD9] font-medium">{data.topicName}</strong>. Now let's look at this topic through the eyes of an experienced teacher and university examiner.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#371BF2] to-[#705FD9] hover:from-[#371BF2]/90 hover:to-[#705FD9]/90 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-lg shadow-[#371BF2]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue to Teacher Insights</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onCloseSession}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Close Session</span>
              </button>
            </div>
          </div>

          {/* Render Sections (Always accessible, expanded automatically on click or scroll) */}
          <div className="space-y-8">

            {/* ================= SECTION 1: LEARNING OBJECTIVES ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#9C8BD9]" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    What Every Teacher Expects You To Know
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Core Objectives</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.learningObjectives.map((obj, oIdx) => (
                  <div key={oIdx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex items-start gap-3">
                    <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-300 leading-relaxed">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SECTION 2: COMMON STUDENT MISTAKES ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    Mistakes Teachers See Every Year
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400/80 uppercase">Pitfalls to Avoid</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {data.commonMistakes.map((m, mIdx) => (
                  <div key={mIdx} className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase shrink-0">
                        Mistake {mIdx + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-100 leading-snug">{m.mistake}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/60 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">Why students fail here:</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{m.explanation}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">Teacher's Correction:</span>
                        <p className="text-emerald-200 text-[11px] leading-relaxed font-medium">{m.correction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SECTION 3: HOW THIS TOPIC IS EXAMINED ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    How Teachers Usually Test This Topic
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Assessment Patterns</span>
              </div>

              <p className="text-xs text-slate-400 italic">
                "This topic is commonly assessed through these 5 core examination formats..."
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.examStyles.map((style, sIdx) => (
                  <div key={sIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{style.title}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        style.frequency === "Very High" 
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                          : style.frequency === "High"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        {style.frequency} Frequency
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{style.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SECTION 4: WHAT EARNS MARKS ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    What Earns Marks in Written Answers
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase">Marking Breakdown</span>
              </div>

              <div className="space-y-2.5">
                {data.markingBreakdown.map((item, iIdx) => (
                  <div key={iIdx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded ${item.earnedMark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{item.element}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 sm:max-w-md text-left sm:text-right leading-relaxed font-light">
                      <strong className="text-slate-300 font-normal">Why:</strong> {item.whyItEarnsMarks}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SECTION 5: TEACHER'S ADVICE ================= */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#371BF2]/20 via-slate-900/80 to-slate-950 border border-[#705FD9]/40 space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-2 text-[#9C8BD9]">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase font-mono tracking-wider">
                  Teacher's Personal Advice
                </h3>
              </div>

              <h4 className="text-base font-semibold text-white">{data.teacherAdvice.headline}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{data.teacherAdvice.body}</p>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-[#371BF2]/30 space-y-2">
                <span className="text-[10px] font-mono text-[#9C8BD9] uppercase tracking-wider block font-bold">
                  Intuitive Mental Model & Analogy
                </span>
                <p className="text-xs text-indigo-200 italic font-serif leading-relaxed">
                  "{data.teacherAdvice.intuitiveAnalogy}"
                </p>
              </div>
            </div>

            {/* ================= SECTION 6: CONNECTIONS TO FUTURE TOPICS ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#705FD9]" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    What This Prepares You For
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Knowledge Map Sequence</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.futureTopics.map((node, nIdx) => {
                  const isHighlighted = activeHighlightedTopic === node.title;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => handleTopicNodeClick(node.title)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isHighlighted 
                          ? "bg-[#371BF2]/25 border-[#705FD9] text-white shadow-lg shadow-[#371BF2]/20 scale-[1.02]" 
                          : "bg-slate-950/60 border-slate-900 text-slate-300 hover:border-slate-800 hover:bg-slate-950"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-[#9C8BD9] uppercase block font-bold">
                          Step {nIdx + 1}
                        </span>
                        <h5 className="text-xs font-semibold text-slate-100">{node.title}</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{node.description}</p>
                    </button>
                  );
                })}
              </div>
              {activeHighlightedTopic && (
                <p className="text-[10px] font-mono text-indigo-300 text-center animate-fade-in">
                  ✓ Topic node <strong className="text-white">"{activeHighlightedTopic}"</strong> highlighted for Knowledge Map exploration.
                </p>
              )}
            </div>

            {/* ================= SECTION 7: PERSONAL PERFORMANCE SUMMARY ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    Personal Performance & Readiness Summary
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase">Mastery State: {data.performanceSummary.masteryStatus}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Understanding</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{data.performanceSummary.understandingText}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Reflection & Assessment</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{data.performanceSummary.assessmentText}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Readiness Recommendation</span>
                  <p className="text-xs text-emerald-300 font-medium leading-relaxed">{data.performanceSummary.readinessText}</p>
                </div>
              </div>
            </div>

            {/* ================= SECTION 8: ASK YOUR TEACHER ================= */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-[#371BF2]/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#9C8BD9]" />
                  <h3 className="text-sm font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    Ask Your Teacher
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Interactive Lecturer Q&A</span>
              </div>

              <p className="text-xs text-slate-400">
                Have a lingering doubt or want advice on how an examiner would grade a specific response? Ask below:
              </p>

              {/* Chat Stream Area */}
              {chatMessages.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-950/80 border border-slate-900 no-scrollbar">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                        msg.sender === "user" 
                          ? "ml-auto bg-[#371BF2]/30 text-white border border-[#371BF2]/40" 
                          : "bg-slate-900 text-slate-200 border border-slate-800 space-y-1"
                      }`}
                    >
                      {msg.sender === "teacher" && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9C8BD9] uppercase font-bold pb-1">
                          <GraduationCap className="w-3.5 h-3.5 text-[#9C8BD9]" />
                          <span>Teacher Persona</span>
                        </div>
                      )}
                      <FormattedMarkdown>{msg.text}</FormattedMarkdown>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendTeacherQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your teacher anything about today's lesson..."
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#705FD9]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#371BF2] to-[#705FD9] hover:from-[#371BF2]/90 hover:to-[#705FD9]/90 disabled:opacity-50 text-white rounded-xl font-mono text-xs uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {chatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>

            {/* Bottom Final Exit Session Banner */}
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={onCloseSession}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#371BF2] via-[#705FD9] to-[#9C8BD9] hover:opacity-95 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-2xl shadow-xl shadow-[#371BF2]/20 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Archive Lesson & Update Knowledge Graph</span>
              </button>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
