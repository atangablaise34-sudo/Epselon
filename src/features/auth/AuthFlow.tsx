import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, Lock, User, ArrowRight, ArrowLeft, BookOpen, 
  Brain, Settings, GraduationCap, Globe, CheckCircle, Lightbulb, Sparkles
} from "lucide-react";
import { UserProfile } from "../../types";
import { loginUser, registerUser, saveOnboarding, resendVerificationEmail } from "../../lib/api";
import RadialPulseLoader from "../../../components/ui/loading-animation";
import EpselonLogo from "../../components/EpselonLogo";

interface AuthFlowProps {
  onAuthComplete: (user: UserProfile) => void;
}

type Mode = "landing" | "login" | "register" | "onboarding" | "verification-pending";
type OnboardingStep = 1 | 2 | 3;

// Elegant page transition
const pageVariants = {
  initial: { opacity: 0, y: 20, filter: "blur(8px)", scale: 0.98 },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -20, filter: "blur(8px)", scale: 0.98, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }
};

export default function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [mode, setMode] = useState<Mode>("landing");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Auth form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("United States");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [university, setUniversity] = useState("Stanford University");
  const [faculty, setFaculty] = useState("Sciences");
  const [department, setDepartment] = useState("Physics");
  const [academicLevel, setAcademicLevel] = useState("PhD Candidate");

  // Onboarding Wizard states
  const [onboardStep, setOnboardStep] = useState<OnboardingStep>(1);
  const [learningStyle, setLearningStyle] = useState<"Visual" | "Auditory" | "Reading" | "Kinesthetic">("Visual");
  const [weeklyCommitment, setWeeklyCommitment] = useState<"1-5" | "5-10" | "10-20" | "20+">("5-10");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [teachingStyle, setTeachingStyle] = useState<"Socratic" | "Explanatory" | "Practical" | "Theoretical">("Socratic");
  const [cognitiveLoad, setCognitiveLoad] = useState<"Novice" | "Proficient" | "Master">("Proficient");
  const [taxonomyFocus, setTaxonomyFocus] = useState<"Analyze & Evaluate" | "Apply & Understand" | "Create & Synthesize">("Analyze & Evaluate");

  const [tempUser, setTempUser] = useState<UserProfile | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      if (res.user) {
        onAuthComplete(res.user);
      }
    } catch (err: any) {
      if (err.requiresVerification) {
        setUnverifiedEmail(err.email || email);
        setMode("verification-pending");
      } else {
        setError(err.message || "Failed to authenticate. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !password) {
      setError("Please complete all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({
        fullName,
        email,
        password,
        country,
        preferredLanguage,
        university,
        faculty,
        department,
        academicLevel,
      });

      if (res.requiresVerification) {
        setUnverifiedEmail(email);
        setMode("verification-pending");
      } else if (res.user) {
        setTempUser(res.user);
        setMode("onboarding");
        setOnboardStep(1);
      }
    } catch (err: any) {
      if (err.requiresVerification) {
        setUnverifiedEmail(email);
        setMode("verification-pending");
      } else {
        setError(err.message || "Email might already be registered");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;
    setResending(true);
    setError(null);
    setResendMessage(null);
    try {
      const res = await resendVerificationEmail(targetEmail);
      setResendMessage(res.message || `Verification email resent to ${targetEmail}`);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!tempUser) return;
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await saveOnboarding({
        university,
        faculty,
        learningStyle,
        weeklyCommitment,
        learningObjectives: learningObjectives || `Master complex theoretical principles in ${department}.`,
      });
      
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teachingStyle,
          cognitiveLoad,
          taxonomyFocus,
        }),
      });
      const data = await res.json();
      updatedUser.preferences = data.preferences;

      onAuthComplete(updatedUser);
    } catch (err: any) {
      setError("Failed to finalize cognitive profile. Proceeding to workspace.");
      onAuthComplete(tempUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-200 flex flex-col relative overflow-hidden font-sans selection:bg-brand-primary/30 selection:text-white">
      {/* Deep Dark Theme Ambient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-[#371BF2]/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#705FD9]/10 rounded-full blur-[140px]" />
      </div>

      {/* Modern Minimal Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <EpselonLogo size={24} className="text-white drop-shadow-[0_0_8px_rgba(55,27,242,0.5)]" />
          </div>
          <span className="font-serif italic text-xl tracking-tight text-white font-medium">Epselon</span>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2 bg-[#141A2E]/50 px-3 py-1.5 rounded-full border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] inline-block animate-pulse" />
          System Online
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex items-center justify-center z-10 py-12">
        <AnimatePresence mode="wait">
          {mode === "landing" && (
            <motion.div
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-3xl text-center flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141A2E] border border-white/5 text-[11px] text-[#9C8BD9] font-mono tracking-wide mb-8 shadow-2xl">
                <Sparkles className="w-3.5 h-3.5" />
                The Next Generation of Academic Intelligence
              </div>

              <h1 className="font-serif italic text-5xl md:text-7xl font-medium tracking-tight text-white mb-6 leading-[1.1] max-w-2xl drop-shadow-2xl">
                Elevate your <br/>
                <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">Cognitive Potential</span>
              </h1>

              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mb-12 font-sans font-light">
                Join the exclusive intelligence layer for higher education. Epselon integrates guided AI mentorship, spaced repetition, and deep conceptual mapping.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mb-8">
                <button
                  onClick={() => setMode("register")}
                  className="px-8 py-4 rounded-full bg-[#371BF2] hover:bg-[#1711BF] text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(55,27,242,0.3)] hover:shadow-[0_0_40px_rgba(55,27,242,0.4)] border border-white/10"
                >
                  Create Profile
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMode("login")}
                  className="px-8 py-4 rounded-full bg-[#141A2E] border border-white/10 hover:border-white/20 hover:bg-[#1A2238] text-white font-semibold text-sm transition-all duration-300"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}

          {mode === "login" && (
            <motion.div
              key="login"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="bg-[#141A2E]/80 p-8 md:p-10 rounded-3xl border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                {/* Inner ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#371BF2]/20 blur-[60px] pointer-events-none" />
                
                <button
                  onClick={() => setMode("landing")}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-8 font-mono relative z-10"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <h2 className="font-serif italic text-3xl text-white font-medium mb-2 relative z-10">Welcome back</h2>
                <p className="text-slate-400 text-sm mb-8 relative z-10 font-light">Access your academic workspace.</p>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-6 font-mono relative z-10">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-5 relative z-10">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9] transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="scholar@university.edu"
                        className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9] transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#371BF2] hover:bg-[#1711BF] disabled:opacity-50 disabled:hover:bg-[#371BF2] py-4 rounded-xl text-sm text-white font-semibold transition-all flex items-center justify-center gap-2 border border-white/10 mt-8 shadow-[0_0_20px_rgba(55,27,242,0.2)]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <RadialPulseLoader size={20} color="#ffffff" showText={false} />
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400 relative z-10">
                  New to Epselon?{" "}
                  <button onClick={() => setMode("register")} className="text-[#9C8BD9] hover:text-white transition-colors font-medium">
                    Create an account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "register" && (
            <motion.div
              key="register"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-xl"
            >
              <div className="bg-[#141A2E]/80 p-8 md:p-10 rounded-3xl border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#371BF2]/10 blur-[60px] pointer-events-none" />
                
                <button
                  onClick={() => setMode("landing")}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 font-mono relative z-10"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <h2 className="font-serif italic text-3xl text-white font-medium mb-2 relative z-10">Create Profile</h2>
                <p className="text-slate-400 text-sm mb-8 relative z-10 font-light">Join the vanguard of academic excellence.</p>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-6 font-mono relative z-10">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-5 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9]" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Chen"
                          className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="scholar@university.edu"
                          className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">University</label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9]" />
                        <input
                          type="text"
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder="Stanford University"
                          className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Department</label>
                      <div className="relative group">
                        <Brain className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9]" />
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="Physics"
                          className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#705FD9]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#0B1020]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#371BF2] hover:bg-[#1711BF] disabled:opacity-50 disabled:hover:bg-[#371BF2] py-4 rounded-xl text-sm text-white font-semibold transition-all flex items-center justify-center gap-2 border border-white/10 mt-8 shadow-[0_0_20px_rgba(55,27,242,0.2)]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <RadialPulseLoader size={20} color="#ffffff" showText={false} />
                        <span>Initializing...</span>
                      </div>
                    ) : (
                      <>
                        Continue to Onboarding
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400 relative z-10">
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-[#9C8BD9] hover:text-white transition-colors font-medium">
                    Sign in
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "verification-pending" && (
            <motion.div
              key="verification-pending"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-md"
            >
              <div className="bg-[#141A2E]/90 p-8 md:p-10 rounded-3xl border border-[#371BF2]/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#371BF2]/20 blur-[60px] pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-[#371BF2]/20 border border-[#371BF2]/40 flex items-center justify-center mx-auto mb-6 relative z-10">
                  <Mail className="w-8 h-8 text-[#9C8BD9] animate-pulse" />
                </div>

                <h2 className="font-serif italic text-3xl text-white font-medium mb-2 relative z-10">Verify Your Email</h2>
                <p className="text-slate-300 text-sm mb-4 relative z-10 leading-relaxed">
                  A verification link has been sent to <br />
                  <span className="font-mono text-emerald-400 font-medium">{unverifiedEmail || email}</span>
                </p>
                <p className="text-slate-400 text-xs mb-8 relative z-10">
                  Please check your email inbox (and spam folder) and click the confirmation link to activate your account before logging in.
                </p>

                {resendMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 mb-6 font-mono relative z-10">
                    {resendMessage}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-6 font-mono relative z-10">
                    {error}
                  </div>
                )}

                <div className="space-y-3 relative z-10">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full bg-[#371BF2] hover:bg-[#1711BF] disabled:opacity-50 py-3.5 rounded-xl text-xs text-white font-semibold transition-all flex items-center justify-center gap-2 border border-white/10 shadow-lg cursor-pointer"
                  >
                    {resending ? "Resending Email..." : "Resend Verification Email"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setResendMessage(null);
                      setMode("login");
                    }}
                    className="w-full bg-[#0B1020]/60 hover:bg-[#0B1020] text-slate-300 py-3 rounded-xl text-xs font-mono transition-colors border border-white/10 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "onboarding" && (
            <motion.div
              key="onboarding"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-2xl"
            >
              <div className="bg-[#141A2E]/80 p-8 md:p-10 rounded-3xl border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#705FD9]/10 blur-[80px] pointer-events-none" />
                
                {/* Stepper Header */}
                <div className="flex justify-between items-end mb-10 pb-6 border-b border-white/5 relative z-10">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#9C8BD9] block mb-2">Configuration</span>
                    <h2 className="font-serif italic text-2xl text-white font-medium">
                      {onboardStep === 1 && "Cognitive Profile"}
                      {onboardStep === 2 && "Pedagogy"}
                      {onboardStep === 3 && "Objectives"}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${onboardStep === step ? "w-8 bg-[#371BF2]" : onboardStep > step ? "w-4 bg-[#705FD9]" : "w-4 bg-white/10"}`}
                      />
                    ))}
                  </div>
                </div>

                {onboardStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 relative z-10">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Learning Modality</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: "Visual", title: "Visual", desc: "Diagrams & models", icon: Globe },
                          { id: "Auditory", title: "Auditory", desc: "Dialogue & lectures", icon: Brain },
                          { id: "Reading", title: "Reading", desc: "Text & derivations", icon: BookOpen },
                          { id: "Kinesthetic", title: "Kinesthetic", desc: "Interactive practice", icon: Settings },
                        ].map((style) => {
                          const Icon = style.icon;
                          const isSelected = learningStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              onClick={() => setLearningStyle(style.id as any)}
                              className={`p-5 rounded-2xl border text-left transition-all duration-200 group ${
                                isSelected 
                                  ? "bg-[#371BF2]/10 border-[#371BF2] shadow-[0_0_20px_rgba(55,27,242,0.15)]" 
                                  : "bg-[#0B1020]/50 border-white/5 hover:border-white/10 hover:bg-[#0B1020]/80"
                              }`}
                            >
                              <Icon className={`w-6 h-6 mb-3 transition-colors ${isSelected ? "text-[#9C8BD9]" : "text-slate-500 group-hover:text-slate-400"}`} />
                              <div className={`text-sm font-semibold mb-1 ${isSelected ? "text-white" : "text-slate-300"}`}>{style.title}</div>
                              <div className="text-[11px] text-slate-500">{style.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button onClick={() => setOnboardStep(2)} className="px-6 py-3 rounded-xl bg-white text-[#0B1020] hover:bg-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors">
                        Next Phase <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {onboardStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 relative z-10">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">Mentor Dialectic</label>
                      <div className="space-y-3">
                        {[
                          { id: "Socratic", name: "Guided AI Inquiry", desc: "Guided inquiry and probing questions" },
                          { id: "Explanatory", name: "Explanatory Narrative", desc: "Direct, comprehensive explanations" },
                          { id: "Practical", name: "Practical Sandbox", desc: "Application-first, hands-on focus" },
                          { id: "Theoretical", name: "Theoretical Axioms", desc: "First-principles mathematical focus" },
                        ].map((style) => {
                          const isSelected = teachingStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              onClick={() => setTeachingStyle(style.id as any)}
                              className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                                isSelected ? "bg-[#371BF2]/10 border-[#371BF2] shadow-[0_0_15px_rgba(55,27,242,0.1)]" : "bg-[#0B1020]/50 border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div>
                                <div className={`text-sm font-semibold mb-1 ${isSelected ? "text-white" : "text-slate-300"}`}>{style.name}</div>
                                <div className="text-[11px] text-slate-500">{style.desc}</div>
                              </div>
                              <CheckCircle className={`w-5 h-5 transition-all ${isSelected ? "text-[#9C8BD9] opacity-100 scale-100" : "opacity-0 scale-75"}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <button onClick={() => setOnboardStep(1)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-sm transition-colors">
                        Back
                      </button>
                      <button onClick={() => setOnboardStep(3)} className="px-6 py-3 rounded-xl bg-white text-[#0B1020] hover:bg-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors">
                        Next Phase <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {onboardStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 relative z-10">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Core Academic Objectives</label>
                      <p className="text-[12px] text-slate-500 mb-4 font-light">Describe what you are aiming to master. Our intelligence layer adapts accordingly.</p>
                      <textarea
                        rows={4}
                        value={learningObjectives}
                        onChange={(e) => setLearningObjectives(e.target.value)}
                        placeholder="I aim to master stochastic processes and their applications in quantitative finance..."
                        className="w-full bg-[#0B1020]/80 border border-white/10 rounded-xl p-5 text-sm text-white focus:outline-none focus:border-[#705FD9] focus:ring-1 focus:ring-[#705FD9]/50 transition-all placeholder:text-slate-600 resize-none"
                      />
                    </div>
                    
                    <div className="p-5 rounded-xl bg-[#371BF2]/10 border border-[#371BF2]/20 flex gap-4 text-sm text-[#9C8BD9] font-light">
                      <Lightbulb className="w-6 h-6 shrink-0 text-[#9C8BD9]" />
                      <p className="leading-relaxed">
                        Workspace will be initialized with a <strong className="text-white font-medium">{teachingStyle}</strong> approach, tailored for <strong className="text-white font-medium">{learningStyle}</strong> learners.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button onClick={() => setOnboardStep(2)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-sm transition-colors">
                        Back
                      </button>
                      <button 
                        onClick={handleOnboardingSubmit} 
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-[#371BF2] hover:bg-[#1711BF] disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(55,27,242,0.3)] border border-white/10"
                      >
                        {loading ? <RadialPulseLoader size={20} color="#ffffff" showText={false} /> : "Finalize & Enter"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
