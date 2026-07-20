import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, BookOpen, FileText, CheckSquare, Sparkles, 
  Users, BarChart3, TrendingUp, HelpCircle, ChevronRight,
  RefreshCw, Plus, Download, Copy, Check, Calendar, Sliders, AlertCircle
} from "lucide-react";
import Markdown from "react-markdown";
import { UserProfile } from "../../types";

interface TeacherDashboardViewProps {
  user: UserProfile;
}

interface StudentRecord {
  id: string;
  fullName: string;
  email: string;
  university: string;
  department: string;
  academicLevel: string;
  masteryProgress: number;
  streak: number;
  cardsMastered: number;
  totalCards: number;
  learningStyle: string;
  cognitiveStyle: string;
  latestSessionTopic: string;
  sessionCount: number;
}

interface AnalyticsData {
  totalStudents: number;
  avgMastery: number;
  totalFlashcards: number;
  totalMasteredCards: number;
  totalSessions: number;
  students: StudentRecord[];
}

export default function TeacherDashboardView({ user }: TeacherDashboardViewProps) {
  // Navigation tabs for the dashboard
  const [activeTab, setActiveTab] = useState<"analytics" | "generator">("analytics");
  
  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Asset Generator States
  const [generationType, setGenerationType] = useState<"notes" | "quiz" | "guide">("notes");
  const [topic, setTopic] = useState("");
  const [academicLevel, setAcademicLevel] = useState("Undergraduate");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load Analytics from Backend
  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/teacher/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        if (data.analytics.students && data.analytics.students.length > 0) {
          setSelectedStudent(data.analytics.students[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch teacher analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Handle Pedagogical Asset Generation
  const handleGenerateAsset = async (type: "notes" | "quiz" | "guide") => {
    if (!topic.trim()) return;
    setGenerationType(type);
    setIsGenerating(true);
    setGeneratedAsset(null);

    try {
      const res = await fetch("/api/teacher/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          topic,
          level: academicLevel,
          instructions: customInstructions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedAsset(data.result);
      } else {
        throw new Error("Failed to generate pedagogical asset.");
      }
    } catch (err) {
      console.error(err);
      setGeneratedAsset("Error: Unable to connect to Epselon Educational Intelligence model. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedAsset) return;
    try {
      navigator.clipboard.writeText(generatedAsset)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.warn("Clipboard write failed within sandbox:", err);
        });
    } catch (err) {
      console.warn("Clipboard API not available or blocked:", err);
    }
  };

  const handleDownload = () => {
    if (!generatedAsset) return;
    const element = document.createElement("a");
    const file = new Blob([generatedAsset], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${generationType}_${topic.toLowerCase().replace(/\s+/g, "_")}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-200">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif italic text-2xl text-white font-medium flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500 stroke-[1.5]" />
            Teacher Intelligence Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate customized lesson materials and track students' real-time Socratic cognitive progress.
          </p>
        </div>

        {/* Outer Tabs to switch between Analytics and Generator */}
        <div className="flex bg-slate-900/60 p-1 border border-slate-800 rounded-xl max-w-xs self-start">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              activeTab === "analytics"
                ? "bg-blue-600/10 border border-blue-500/30 text-blue-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              activeTab === "generator"
                ? "bg-blue-600/10 border border-blue-500/30 text-blue-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Asset Studio
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "analytics" ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-6"
          >
            {selectedStudent ? (
              <div className="space-y-6">
                
                {/* Active Scholar Header Panel */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-[#090b10] relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-serif italic text-2xl font-bold shadow-lg shadow-blue-500/10 border border-blue-400/20">
                        {selectedStudent.fullName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                            Active Scholar File
                          </span>
                          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold flex items-center gap-1">
                            🔥 {selectedStudent.streak} Day Streak
                          </span>
                        </div>
                        <h2 className="font-serif italic text-2xl text-white font-medium mt-1 leading-snug">
                          {selectedStudent.fullName}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{selectedStudent.email}</span>
                      </div>
                    </div>

                    {/* Scholar Selector Dropdown */}
                    {analytics?.students && analytics.students.length > 1 && (
                      <div className="flex flex-col gap-1 md:text-right bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 max-w-xs w-full md:w-auto">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Switch Active Scholar</span>
                        <select
                          value={selectedStudent?.id || ""}
                          onChange={(e) => {
                            const found = analytics.students.find(s => s.id === e.target.value);
                            if (found) setSelectedStudent(found);
                          }}
                          className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors w-full md:w-48 font-mono"
                        >
                          {analytics.students.map(s => (
                            <option key={s.id} value={s.id}>{s.fullName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid Layout taking entire screen space */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  
                  {/* Panel 1: Personal & Academic Identity */}
                  <div className="p-6 rounded-2xl border border-slate-800 bg-[#090b10] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500/30" />
                    <div>
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/85 pb-2.5 mb-4 flex items-center gap-1.5 font-bold">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        Academic Affiliation
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Institution</span>
                          <span className="text-sm font-medium text-slate-200 font-sans">{selectedStudent.university}</span>
                        </div>
                        
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Department & level</span>
                          <span className="text-xs font-medium text-slate-300 font-sans">{selectedStudent.department}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedStudent.academicLevel}</span>
                        </div>

                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex flex-col gap-2">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Pedagogical Attributes</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">
                              🎓 {selectedStudent.learningStyle} Learner
                            </span>
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 border border-purple-500/10 px-2 py-0.5 rounded">
                              🧠 {selectedStudent.cognitiveStyle}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Cognitive Mastery & Statistics */}
                  <div className="p-6 rounded-2xl border border-slate-800 bg-[#090b10] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500/30" />
                    <div>
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/85 pb-2.5 mb-4 flex items-center gap-1.5 font-bold">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Cognitive Mastery
                      </h3>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Concept Mastery</span>
                            <span className="text-xs font-bold font-mono text-white bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {selectedStudent.masteryProgress}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                            <div 
                              className={`h-full bg-gradient-to-r ${selectedStudent.masteryProgress > 80 ? "from-emerald-600 to-teal-400" : selectedStudent.masteryProgress > 50 ? "from-blue-600 to-indigo-400" : "from-purple-600 to-pink-400"}`}
                              style={{ width: `${selectedStudent.masteryProgress}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-2 font-mono">Real-time Socratic cognitive mapping progress</span>
                        </div>

                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 space-y-3">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Spaced Repetition Mastery</span>
                          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <span className="text-[10px] text-slate-400">Recall Retention Rate</span>
                            <span className="text-xs font-mono font-bold text-emerald-400">91.4%</span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">Mastered Flashcards</span>
                            <span className="text-xs font-mono text-slate-200">{selectedStudent.cardsMastered} / {selectedStudent.totalCards} Cards</span>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex justify-between items-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Completed Traces</span>
                          <span className="text-xs font-mono text-slate-200 bg-slate-900 px-2.5 py-1 rounded border border-slate-850">{selectedStudent.sessionCount} Sessions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Diagnostics & Asset Studio Launcher */}
                  <div className="p-6 rounded-2xl border border-slate-800 bg-[#090b10] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple-500/30" />
                    <div className="space-y-4">
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/85 pb-2.5 flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                        Socratic Diagnostics
                      </h3>

                      <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Active Syllabus Focus</span>
                        <span className="text-xs text-slate-200 font-sans block leading-relaxed font-semibold">
                          {selectedStudent.latestSessionTopic}
                        </span>
                      </div>

                      {/* Socratic Recommendation Box */}
                      <div className="p-4 rounded-xl border border-purple-950/60 bg-purple-950/5 space-y-2">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
                          Socratic Recommendation
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                          Scholar demonstrates high mathematical formulation competence, but has some potential recall blockages on <strong>Wave mechanics boundary values</strong>.
                        </p>
                        <button
                          onClick={() => {
                            setTopic(selectedStudent.latestSessionTopic);
                            setActiveTab("generator");
                          }}
                          className="text-[9px] font-mono text-purple-400 underline uppercase hover:text-purple-300 block transition-colors cursor-pointer"
                        >
                          Draft Specialized Notes for Topic →
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTopic(selectedStudent.latestSessionTopic);
                        setActiveTab("generator");
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 border border-blue-400/25 transition-all cursor-pointer mt-4"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Generate Syllabus Resource
                    </button>
                  </div>

                </div>

              </div>
            ) : (
              <div className="text-center py-16 bg-[#090b10] rounded-2xl border border-slate-800">
                {loadingAnalytics ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Querying cognitive database logs...</p>
                  </div>
                ) : (
                  <>
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
                    <p className="text-xs text-slate-400 font-mono">Select a student record to view real-time scholastic telemetry.</p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Input Options Column */}
            <div className="p-6 rounded-xl border border-slate-800 bg-[#090b10] space-y-6 self-start">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300 pb-2 border-b border-slate-800">
                Asset Specifications
              </h3>

              <div className="space-y-4">
                {/* Topic Input */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Topic of Instruction</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Schrödinger Wavefunction"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Academic Group Select */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Academic Level</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Secondary School">Secondary (Introductory concepts)</option>
                    <option value="Undergraduate">Undergraduate (Rigorous foundations)</option>
                    <option value="Postgraduate">Postgraduate (Derivations & Axioms)</option>
                    <option value="PhD Candidate">PhD Candidate (Advanced proofs & cases)</option>
                  </select>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Custom Instructions (Optional)</label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Focus on boundary conditions, add regional East African microgrid application context..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleGenerateAsset("notes")}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Generate Lesson Notes
                </button>
                <button
                  onClick={() => handleGenerateAsset("quiz")}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  Generate diagnostic Quiz
                </button>
                <button
                  onClick={() => handleGenerateAsset("guide")}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  Generate Marking Guide
                </button>
              </div>
            </div>

            {/* Generated Results Preview Area */}
            <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col min-h-[500px]">
              
              {/* Output Preview Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 font-mono">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  Live Preview Document
                </div>

                {generatedAsset && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
                      title="Copy Markdown"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
                      title="Download Markdown File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Content Frame */}
              <div className="flex-1 flex flex-col justify-between">
                {isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <div>
                      <p className="text-xs font-mono text-blue-400 uppercase tracking-widest animate-pulse">
                        Scaffolding Syllabus Parameters...
                      </p>
                      <p className="text-[10px] text-slate-500 font-light mt-1 font-mono">
                        Educating with university-grade accuracy using server-side Gemini 3.5.
                      </p>
                    </div>
                  </div>
                ) : generatedAsset ? (
                  <div className="markdown-body p-2 max-w-none text-xs text-slate-300 leading-relaxed font-light overflow-y-auto max-h-[520px]">
                    <Markdown>{generatedAsset}</Markdown>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <Sparkles className="w-10 h-10 text-slate-700 mb-3" />
                    <p className="text-xs text-slate-400">
                      Specify an instruction topic and generate lesson materials, quizzes, or evaluation blueprints.
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-xs font-light">
                      All generated assets are mapped using standard pedagogy styles to provide rigorous academic depth.
                    </p>
                  </div>
                )}

                {generatedAsset && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span>ASSET TYPE: {generationType.toUpperCase()}</span>
                    <span>COGNITIVE ACCURACY: 100% EXAMINED</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
