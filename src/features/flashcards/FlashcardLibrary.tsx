import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, Award, RotateCcw, CheckCircle2, ChevronRight, 
  Layers, Check, Eye, HelpCircle, ArrowRight, ArrowLeft, Brain,
  Clock, Cpu, Database, Calendar, ExternalLink, RefreshCw, Flame,
  TrendingUp, FileText, ListOrdered, Share2, BookMarked, Code
} from "lucide-react";
import { UserProfile, FlashcardCollection, Flashcard, StudySession } from "../../types";
import { submitCardReview, updateSessionIntent } from "../../lib/api";
import { CardStack } from "../../../components/ui/card-stack";

interface FlashcardLibraryProps {
  user: UserProfile;
  collections: FlashcardCollection[];
  flashcards: Flashcard[];
  onRefreshData: () => void;
  sessions?: StudySession[];
  onReopenSession?: (sessionId: string) => void;
}

interface LearningDomain {
  id: string;
  topic: string;
  subject: string;
  overview: string;
  concepts: Array<{ name: string; description: string; mastery: number }>;
  equations: Array<{ latex: string; explanation: string; label?: string }>;
  examples: Array<{ title: string; scenario: string; proofSteps: string[]; solution?: string }>;
  reflections: Array<{ timestamp: string; prompt: string; studentAnswer: string; feedback?: string }>;
  flashcards: Flashcard[];
  masteryScore: number;
  studyTime: number;
  aiProviders: string[];
  lastUpdated: string;
  sessions: StudySession[];
}

export default function FlashcardLibrary({ 
  user, 
  collections, 
  flashcards, 
  onRefreshData,
  sessions = [],
  onReopenSession 
}: FlashcardLibraryProps) {
  // Navigation & filter states
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLibraryTab, setActiveLibraryTab] = useState<"cards" | "library">("cards");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [activeVaultIndex, setActiveVaultIndex] = useState(0);
  
  // Quiz/Flashcard study state inside the selected domain
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewsCompleted, setReviewsCompleted] = useState<Flashcard[]>([]);

  // Interactive Knowledge Graph states
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);

  // --------------------------------------------------
  // KNOWLEDGE EXTRACTION ENGINE (DYNAMIC COMPILATION)
  // --------------------------------------------------
  const extractDomains = (): LearningDomain[] => {
    // High-fidelity academic seed templates matching Stanford/Physics PhD level or subjects
    const templates: Record<string, Partial<LearningDomain>> = {
      "Quantum Mechanics": {
        id: "domain_quantum",
        topic: "Quantum Mechanics",
        subject: "Physics",
        overview: "An advanced exploration of wave-particle duality, probabilistic quantum distributions, and wavefunctions under physical constraints.",
        concepts: [
          { name: "Wavefunction (|Ψ|²)", description: "The mathematical description of the quantum state of an isolated system, where the square represents probability density of a particle.", mastery: 88 },
          { name: "Heisenberg Uncertainty Principle", description: "The fundamental limit to the precision with which certain pairs of physical properties, such as position and momentum, can be known simultaneously.", mastery: 75 },
          { name: "Schrödinger Equation", description: "A linear partial differential equation that governs the wave function of a quantum-mechanical system.", mastery: 65 },
          { name: "Quantum Tunneling", description: "A quantum mechanical phenomenon where a subatomic particle passes through a potential barrier that it classically could not surmount.", mastery: 90 },
          { name: "Observer Effect", description: "The theory that the act of measurement inevitably alters the state of the quantum system being measured.", mastery: 82 }
        ],
        equations: [
          { latex: "i\\hbar \\frac{\\partial\\Psi}{\\partial t} = \\hat{H}\\Psi", explanation: "Time-dependent Schrödinger Equation governing wave state propagation.", label: "Schrödinger Equation" },
          { latex: "\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}", explanation: "Heisenberg Position-Momentum Uncertainty relation.", label: "Heisenberg Relation" },
          { latex: "\\int_{-\\infty}^{\\infty} |\\Psi(x,t)|^2 dx = 1", explanation: "Wavefunction normalization asserting absolute certainty of particle existence in physical space.", label: "Normalization" }
        ],
        examples: [
          { 
            title: "Double-Slit Interference Pattern", 
            scenario: "Single electrons fired through a double slit one-by-one produce a wave interference pattern on a detector screen over time.",
            proofSteps: [
              "A single electron's wavefunction propagates through both slits simultaneously as a coherent superposition.",
              "The probability amplitudes Ψ₁ and Ψ₂ interfere constructively and destructively.",
              "|Ψ₁ + Ψ₂|² = |Ψ₁|² + |Ψ₂|² + 2 Re(Ψ₁Ψ₂*), where the third term represents quantum interference.",
              "Collapsing the wave via measurement at a slit destroys the interference term, forcing classical particle behavior."
            ]
          },
          {
            title: "Finite Square Potential Barrier",
            scenario: "An electron with energy E lower than barrier height V₀ encounters a potential barrier of width L.",
            proofSteps: [
              "Write the Schrödinger equation in three regions: x < 0 (I), 0 < x < L (II), and x > L (III).",
              "Solve Region II wavefunction: Ψ_II(x) = C e^{-kx} + D e^{kx}, where k = \\sqrt{2m(V_0 - E)}/\\hbar.",
              "Apply matching boundary conditions for Ψ and dΨ/dx at x = 0 and x = L.",
              "Calculate transmission coefficient T ≈ e^{-2kL}, proving non-zero quantum tunneling probability."
            ]
          }
        ],
        reflections: [
          {
            timestamp: "Jul 18, 11:15 AM",
            prompt: "Explain why observation collapses the double-slit wave interference pattern.",
            studentAnswer: "Observation forces the system to choose a specific state. When we place a detector at a slit, the electron interacts with the macro-environment, causing quantum decoherence and collapsing the superposition of passing through both slits into a single classical path.",
            feedback: "Perfect. You've correctly identified quantum decoherence as the mechanical basis for wave collapse."
          }
        ]
      },
      "Thermodynamics": {
        id: "domain_thermo",
        topic: "Thermodynamics",
        subject: "Mechanical Engineering",
        overview: "The study of heat, work, entropy, and the microscopic statistical dynamics of systems near thermal equilibrium.",
        concepts: [
          { name: "Entropy (S)", description: "A logarithmic measure of the number of microscopic configurations corresponding to a macroscopic thermodynamic state.", mastery: 85 },
          { name: "Carnot Efficiency Limit", description: "The maximum theoretical efficiency of a heat engine operating between two temperature reservoirs.", mastery: 72 },
          { name: "First Law of Thermodynamics", description: "Conservation of energy stating that change in internal energy equals heat added minus work done.", mastery: 95 },
          { name: "Ideal Gas Law", description: "The equation of state of a hypothetical ideal gas, relating pressure, volume, temperature, and quantity.", mastery: 90 }
        ],
        equations: [
          { latex: "dS \\ge \\frac{dQ}{T}", explanation: "Second Law definition of entropy change for a reversible process.", label: "Entropy Change" },
          { latex: "S = k_B \\ln \\Omega", explanation: "Boltzmann's statistical formula relating entropy S to microstates Ω.", label: "Boltzmann Entropy" },
          { latex: "\\eta_C = 1 - \\frac{T_C}{T_H}", explanation: "Carnot engine efficiency limit operating between hot (TH) and cold (TC) reservoirs.", label: "Carnot Limit" }
        ],
        examples: [
          {
            title: "Isothermal Expansion of an Ideal Gas",
            scenario: "An ideal gas expands reversibly from volume V₁ to V₂ at a constant temperature T.",
            proofSteps: [
              "For an isothermal process, internal energy change dU = 0.",
              "By First Law: dQ = dW = P dV.",
              "Substitute Ideal Gas Law P = nRT/V: dW = (nRT/V) dV.",
              "Integrate from V₁ to V₂: W = nRT \\ln(V₂/V₁). Heat added Q equals work done W.",
              "Change in entropy dS = dQ/T, so ΔS = nR \\ln(V₂/V₁)."
            ]
          }
        ],
        reflections: [
          {
            timestamp: "Jul 19, 02:30 PM",
            prompt: "Why can't a heat engine be 100% efficient?",
            studentAnswer: "To convert heat to work continuously, an engine must dump some heat into a colder reservoir to complete the cycle. Releasing all heat as work would violate the Second Law because entropy of an isolated system must increase or remain constant.",
            feedback: "Flawless first-principles analysis. You correctly linked cyclic continuation to the reservoir constraint."
          }
        ]
      },
      "Organic Chemistry": {
        id: "domain_organic",
        topic: "Organic Chemistry",
        subject: "Chemistry",
        overview: "The scientific study of the structure, properties, composition, reactions, and synthesis of carbon-based compounds.",
        concepts: [
          { name: "Nucleophilic Substitution (Sn1/Sn2)", description: "Mechanisms of nucleophilic attack replacing a leaving group on an aliphatic carbon substrate.", mastery: 68 },
          { name: "Aromatic Electrophilic Substitution", description: "Organic reaction in which an atom appended to an aromatic ring, usually hydrogen, is replaced by an electrophile.", mastery: 55 },
          { name: "Chirality & Stereochemistry", description: "The spatial arrangement of atoms in molecules and its effect on optical activity and chemical properties.", mastery: 74 }
        ],
        equations: [
          { latex: "\\text{Rate} = k[\\text{Substrate}][\\text{Nu}]", explanation: "Sn2 bimolecular rate law showing dependence on both substrate and nucleophile.", label: "Sn2 Rate Law" },
          { latex: "\\text{Rate} = k[\\text{Substrate}]", explanation: "Sn1 unimolecular rate law dependent solely on carbocation intermediate formation.", label: "Sn1 Rate Law" }
        ],
        examples: [
          {
            title: "Synthesis of Cyclohexene from Cyclohexanol",
            scenario: "Acid-catalyzed dehydration of cyclohexanol to form cyclohexene via E1 mechanism.",
            proofSteps: [
              "Protonation of the hydroxyl group on cyclohexanol by phosphoric acid to form a good leaving group (-OH₂⁺).",
              "Loss of water molecule (leaving group) to generate the secondary carbocation intermediate (slow rate-determining step).",
              "Deprotonation of adjacent carbon by conjugate base/water, forming the double bond of cyclohexene.",
              "Distill cyclohexene to shift equilibrium forward (Le Chatelier's Principle)."
            ]
          }
        ],
        reflections: []
      },
      "Linear Algebra": {
        id: "domain_linear_algebra",
        topic: "Linear Algebra",
        subject: "Mathematics",
        overview: "The study of linear equations, vector spaces, matrix transformations, and spectral properties of linear operators.",
        concepts: [
          { name: "Eigenvalues & Eigenvectors", description: "Scalars and vectors such that matrix multiplication scales the vector without changing its direction.", mastery: 92 },
          { name: "Singular Value Decomposition (SVD)", description: "Factorization of a real or complex matrix, generalizing the eigendecomposition of a square normal matrix.", mastery: 80 },
          { name: "Vector Space & Subspaces", description: "A set of vectors closed under linear combinations (vector addition and scalar multiplication).", mastery: 96 }
        ],
        equations: [
          { latex: "A \\vec{v} = \\lambda \\vec{v}", explanation: "Characteristic eigenvalue-eigenvector identity.", label: "Spectral Identity" },
          { latex: "A = U \\Sigma V^T", explanation: "Singular Value Decomposition factorization.", label: "SVD Theorem" },
          { latex: "\\det(A - \\lambda I) = 0", explanation: "Characteristic equation used to solve for eigenvalues λ.", label: "Characteristic Eq." }
        ],
        examples: [
          {
            title: "PCA Dimension Reduction",
            scenario: "Using eigendecomposition of a covariance matrix to find principal components.",
            proofSteps: [
              "Subtract mean from data matrix X to center it.",
              "Compute covariance matrix C = (X^T X) / (n-1).",
              "Solve eigenvalues and eigenvectors of C: C v_i = λ_i v_i.",
              "Sort eigenvectors by descending eigenvalue size; the largest eigenvalues represent direction of highest variance."
            ]
          }
        ],
        reflections: []
      }
    };

    // Group real database sessions by focus
    const grouped: Record<string, StudySession[]> = {};
    sessions.forEach(sess => {
      const focus = sess.focus || "General Study";
      let matchedKey = Object.keys(templates).find(k => k.toLowerCase() === focus.toLowerCase());
      if (!matchedKey) {
        matchedKey = focus;
      }
      if (!grouped[matchedKey]) {
        grouped[matchedKey] = [];
      }
      grouped[matchedKey].push(sess);
    });

    const finalDomains: LearningDomain[] = [];
    const allTopicKeys = Array.from(new Set([...Object.keys(templates), ...Object.keys(grouped)]));

    allTopicKeys.forEach(topic => {
      const topicSessions = grouped[topic] || [];
      const template = templates[topic];

      // Infer subject
      let subject = template?.subject || "General Study";
      const topicLower = topic.toLowerCase();
      if (topicLower.includes("mechanic") || topicLower.includes("quantum") || topicLower.includes("physic")) {
        subject = "Physics";
      } else if (topicLower.includes("chemistry") || topicLower.includes("organic")) {
        subject = "Chemistry";
      } else if (topicLower.includes("thermo") || topicLower.includes("heat") || topicLower.includes("fluid")) {
        subject = "Mechanical Engineering";
      } else if (topicLower.includes("algebra") || topicLower.includes("calculus") || topicLower.includes("math")) {
        subject = "Mathematics";
      } else if (topicLower.includes("code") || topicLower.includes("computer") || topicLower.includes("algorithm") || topicLower.includes("search")) {
        subject = "Computer Science";
      } else if (topicLower.includes("macro") || topicLower.includes("micro") || topicLower.includes("econom")) {
        subject = "Economics";
      }

      // Compile items
      const concepts = [...(template?.concepts || [])];
      const equations = [...(template?.equations || [])];
      const examples = [...(template?.examples || [])];
      const reflections = [...(template?.reflections || [])];

      topicSessions.forEach(sess => {
        // Core concept from session focus
        if (sess.focus && !concepts.some(c => c.name.toLowerCase() === sess.focus.toLowerCase())) {
          concepts.push({
            name: sess.focus,
            description: `Core study focus regarding ${sess.focus} compiled during socratic study.`,
            mastery: sess.progress || 50
          });
        }
        // Syllabus items
        sess.outline?.forEach(item => {
          if (!concepts.some(c => c.name.toLowerCase() === item.toLowerCase())) {
            concepts.push({
              name: item,
              description: `Academic syllabus landmark: ${item}.`,
              mastery: sess.progress ? Math.min(100, Math.max(20, sess.progress - Math.floor(Math.random() * 20))) : 40
            });
          }
        });

        // Messages data
        sess.messages.forEach((msg, idx) => {
          if (msg.equation && !equations.some(eq => eq.latex === msg.equation)) {
            equations.push({
              latex: msg.equation,
              explanation: "Core structural proof derived in chat: " + msg.text.substring(0, 70) + "...",
              label: "Dynamic Formulation"
            });
          }
          if (msg.autoNotes) {
            msg.autoNotes.forEach(note => {
              if (note.key.toLowerCase().includes("eq") || note.key.toLowerCase().includes("formula")) {
                if (!equations.some(eq => eq.latex.includes(note.val) || eq.explanation.includes(note.val))) {
                  equations.push({
                    latex: note.val.includes("=") ? note.val : `y = ${note.val}`,
                    explanation: note.val,
                    label: note.key
                  });
                }
              } else if (!concepts.some(c => c.name.toLowerCase() === note.key.toLowerCase())) {
                concepts.push({
                  name: note.key,
                  description: note.val,
                  mastery: sess.progress || 60
                });
              }
            });
          }

          // Student response reflections
          if (msg.sender === "student" && msg.text.length > 50) {
            const preceding = idx > 0 ? sess.messages[idx - 1] : null;
            if (preceding && preceding.sender === "mentor") {
              reflections.push({
                timestamp: msg.timestamp || "Active Study session",
                prompt: preceding.text.substring(0, 100) + (preceding.text.length > 100 ? "..." : ""),
                studentAnswer: msg.text,
                feedback: "Socratic dialog synthesis captured by Knowledge Engine."
              });
            }
          }
        });
      });

      // Link flashcards from matched collections
      const matchedColls = collections.filter(c => 
        c.name.toLowerCase().includes(topic.toLowerCase()) || 
        topic.toLowerCase().includes(c.name.toLowerCase())
      );
      const matchedCollIds = matchedColls.map(c => c.id);
      const domainFlashcards = flashcards.filter(fc => matchedCollIds.includes(fc.collectionId));

      // Calculate dynamic mastery
      let totalProgress = 0;
      let progressCount = 0;
      topicSessions.forEach(s => {
        totalProgress += s.progress || 50;
        progressCount++;
      });

      const templateMastery = template?.masteryScore || 65;
      let masteryScore = progressCount > 0 ? Math.round(totalProgress / progressCount) : templateMastery;

      if (domainFlashcards.length > 0) {
        const easyCount = domainFlashcards.filter(fc => fc.difficulty === "easy" || fc.box >= 3).length;
        const flashcardMastery = Math.round((easyCount / domainFlashcards.length) * 100);
        masteryScore = Math.round((masteryScore * 0.6) + (flashcardMastery * 0.4));
      }

      // Safeguard mastery limits
      masteryScore = Math.min(100, Math.max(15, masteryScore));

      // Study time calculation
      const baseTime = template?.studyTime || 40;
      const studyTime = baseTime + (topicSessions.length * 30);

      // AI used
      const aiProvidersSet = new Set<string>();
      topicSessions.forEach(s => {
        s.messages.forEach(m => {
          if (m.protocolTrace?.routing?.providerId) {
            aiProvidersSet.add(m.protocolTrace.routing.providerId);
          }
        });
      });
      if (aiProvidersSet.size === 0) {
        aiProvidersSet.add("Gemini 1.5 Pro");
        if (topic.includes("Quantum")) aiProvidersSet.add("Claude 3.5 Sonnet");
      }
      const aiProviders = Array.from(aiProvidersSet);

      // Last updated date
      let lastUpdated = template?.lastUpdated || "Day 1";
      if (topicSessions.length > 0) {
        const lastSession = topicSessions[topicSessions.length - 1];
        if (lastSession.messages.length > 0) {
          lastUpdated = lastSession.messages[lastSession.messages.length - 1].timestamp || "Just now";
        }
      }

      finalDomains.push({
        id: template?.id || `domain_${topic.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        topic,
        subject,
        overview: template?.overview || `Self-evolving study vault mapping prerequisites, equations, and active recall logs for ${topic}.`,
        concepts,
        equations,
        examples,
        reflections,
        flashcards: domainFlashcards,
        masteryScore,
        studyTime,
        aiProviders,
        lastUpdated,
        sessions: topicSessions
      });
    });

    return finalDomains;
  };

  const domains = extractDomains();

  // Search filter
  const filteredDomains = domains.filter(d => 
    d.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.overview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDomain = domains.find(d => d.id === activeDomainId);

  // --------------------------------------------------
  // INTEGRATED LEITNER FLASHCARD QUIZ METHODS
  // --------------------------------------------------
  const startQuiz = () => {
    if (!activeDomain || activeDomain.flashcards.length === 0) return;
    setStudyMode(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setReviewsCompleted([]);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReviewFeedback = async (difficulty: "easy" | "medium" | "hard") => {
    if (!activeDomain || activeDomain.flashcards.length === 0) return;
    const card = activeDomain.flashcards[currentCardIndex];
    
    setReviewsCompleted((prev) => [...prev, card]);

    try {
      await submitCardReview(card.id, difficulty);
      onRefreshData(); // Sync up application
    } catch (err) {
      console.error("Failed to sync card review back to server", err);
    }

    if (currentCardIndex < activeDomain.flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => prev + 1);
      }, 150);
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const exitQuiz = () => {
    setStudyMode(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setReviewsCompleted([]);
  };

  // Pre-calculate aggregate metrics for personal digital library header
  const totalConcepts = domains.reduce((acc, d) => acc + d.concepts.length, 0);
  const totalFlashcards = domains.reduce((acc, d) => acc + d.flashcards.length, 0);
  const totalTimeSpent = domains.reduce((acc, d) => acc + d.studyTime, 0);
  const avgMastery = domains.length > 0 
    ? Math.round(domains.reduce((acc, d) => acc + d.masteryScore, 0) / domains.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      
      {/* 1. LIBRARY OVERVIEW CONTAINER */}
      {!activeDomainId && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase block mb-1">
                LIFELONG KNOWLEDGE RECALL
              </span>
              <h2 className="font-serif italic text-3xl text-white font-medium flex items-center gap-2.5">
                <Brain className="w-8 h-8 text-indigo-400 stroke-[1.2]" />
                Personal Digital Library
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                Conversations are events; knowledge is permanent. As you study, Epselon digests your
                Socratic dialogues, mapping concepts, proofs, and equations into these evolving domains.
              </p>
            </div>

            {/* Notion style filter */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search Knowledge Domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-full px-4 py-2 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all"
              />
            </div>
          </div>

          {/* 4-Bento Stats Row (Notion-level cleanliness) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Database className="w-4.5 h-4.5 text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Domains Cataloged</span>
                <strong className="text-lg text-white font-mono">{domains.length}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BookMarked className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Mastered Landmarks</span>
                <strong className="text-lg text-white font-mono">{totalConcepts}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Avg Mastery Rate</span>
                <strong className="text-lg text-emerald-400 font-mono">{avgMastery}%</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-pink-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Study Time</span>
                <strong className="text-lg text-white font-mono">{totalTimeSpent} mins</strong>
              </div>
            </div>
          </div>

          {/* 1.5. LIBRARY TAB SELECTOR (Epselon Redesigned Lifelong Learning Concept) */}
          <div className="flex border-b border-slate-800/80 mb-6 gap-6">
            <button
              type="button"
              onClick={() => {
                setActiveLibraryTab("cards");
                setExpandedCardId(null);
              }}
              className={`pb-3 text-xs font-mono uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeLibraryTab === "cards"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Learning Cards Library ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLibraryTab("library");
                setExpandedCardId(null);
              }}
              className={`pb-3 text-xs font-mono uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeLibraryTab === "library"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Lifelong Subject Vaults ({domains.length})
            </button>
          </div>

          {activeLibraryTab === "cards" ? (
            /* 🗃️ LIFELONG LEARNING CARDS SYSTEM (Redesigned Recall Page with 3D Constellation Card Stack) */
            <div className="space-y-8 flex flex-col items-center w-full">
              {sessions.length > 0 ? (
                (() => {
                  const cardStackItems = sessions.map((sess) => {
                    const extractedEquations: string[] = [];
                    const extractedConcepts: string[] = [];
                    let autoNotesCount = 0;
                    
                    sess.messages.forEach(m => {
                      if (m.equation) extractedEquations.push(m.equation);
                      if (m.autoNotes) {
                        m.autoNotes.forEach(an => {
                          autoNotesCount++;
                          if (!extractedConcepts.includes(an.key)) {
                            extractedConcepts.push(an.key);
                          }
                        });
                      }
                    });

                    sess.outline?.forEach(o => {
                      if (!extractedConcepts.includes(o)) extractedConcepts.push(o);
                    });

                    return {
                      id: sess.id,
                      title: sess.title.replace("Session: ", ""),
                      session: sess,
                      extractedConcepts,
                      extractedEquations,
                      totalExtracted: extractedConcepts.length,
                      totalEquations: extractedEquations.length
                    };
                  });

                  // Double check index is within bounds
                  const safeIndex = Math.min(activeCardIndex, cardStackItems.length - 1);
                  const activeItem = cardStackItems[safeIndex] || cardStackItems[0];

                  return (
                    <>
                      {/* Premium 3D Card Stack selector */}
                      <div className="w-full max-w-2xl px-4 flex justify-center mt-2">
                        <CardStack
                          items={cardStackItems}
                          initialIndex={safeIndex}
                          onChangeIndex={(idx) => setActiveCardIndex(idx)}
                          cardWidth={460}
                          cardHeight={240}
                          maxVisible={5}
                          overlap={0.52}
                          spreadDeg={35}
                          showDots={true}
                          renderCard={(item, { active }) => {
                            const s = item.session;
                            return (
                              <div className={`relative h-full w-full rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden select-none ${
                                active 
                                  ? "border-indigo-500/80 bg-slate-950 shadow-2xl shadow-indigo-500/15" 
                                  : "border-slate-800 bg-[#07090e]/95 opacity-50"
                              }`}>
                                {active && (
                                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                                )}

                                <div className="space-y-1.5 relative z-10">
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                                      {s.difficulty || "Socratic"} • {s.bloomLevel || "Recall"}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-indigo-400">{s.progress}% Progress</span>
                                  </div>
                                  <h3 className="text-base font-serif italic text-slate-100 font-medium line-clamp-1 mt-1">
                                    {item.title}
                                  </h3>
                                </div>

                                <div className="grid grid-cols-3 gap-2 relative z-10 py-1">
                                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850 text-center">
                                    <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Focus</span>
                                    <strong className="text-[9.5px] text-slate-300 truncate block mt-0.5">{s.focus || "Dialogue"}</strong>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850 text-center">
                                    <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Landmarks</span>
                                    <strong className="text-[9.5px] text-slate-300 block mt-0.5">{item.totalExtracted} Concepts</strong>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850 text-center">
                                    <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Formulations</span>
                                    <strong className="text-[9.5px] text-slate-300 block mt-0.5">{item.totalEquations} Eqs</strong>
                                  </div>
                                </div>

                                <div className="space-y-1.5 relative z-10">
                                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${s.progress}%` }}
                                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase tracking-widest pt-1">
                                    <span>{active ? "Active Lesson" : "Focusing Mode"}</span>
                                    <span>Swipe Left/Right or use arrows</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </div>

                      {/* Active Selected Card Details (Smooth Expanded State below stack) */}
                      {activeItem && (() => {
                        const s = activeItem.session;
                        return (
                          <motion.div 
                            key={s.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#090b11]/90 backdrop-blur-md overflow-hidden p-6 space-y-6 shadow-2xl mt-4"
                          >
                            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400">Intelligent Index Snapshot</span>
                                <h4 className="text-lg font-serif italic text-slate-100 mt-0.5">{activeItem.title}</h4>
                              </div>
                              
                              {onReopenSession && (
                                <button
                                  type="button"
                                  onClick={() => onReopenSession(s.id)}
                                  className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-400/50 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  Open Conversation
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                  🧠 Derived Concepts
                                </span>
                                {activeItem.extractedConcepts.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                    {activeItem.extractedConcepts.map((item, index) => (
                                      <span key={index} className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-850 text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic">No custom concepts indexed yet. Keep chatting to auto-derive.</p>
                                )}
                              </div>

                              <div className="space-y-3">
                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                  🧬 Extracted Formulations
                                </span>
                                {activeItem.extractedEquations.length > 0 ? (
                                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                    {activeItem.extractedEquations.map((eq, index) => (
                                      <div key={index} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-center font-mono text-[10px] text-indigo-300">
                                        <code>{eq}</code>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic">No mathematical formulations derived during this dialogue yet.</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                💬 Socratic Dialogue Log
                              </span>
                              <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-xl space-y-4 text-xs text-slate-300 font-sans leading-relaxed max-h-44 overflow-y-auto no-scrollbar">
                                {s.messages.length > 0 ? (
                                  <div className="space-y-4">
                                    {s.messages.slice(-3).map((m, idx) => (
                                      <div key={idx} className="space-y-1 pl-3 border-l border-indigo-500/40">
                                        <div className="flex justify-between items-center">
                                          <span className={`text-[8.5px] font-mono uppercase font-bold tracking-wider ${m.sender === "mentor" ? "text-indigo-400" : "text-emerald-400"}`}>
                                            {m.sender === "mentor" ? "Mentor (Nimo)" : "Student"}
                                          </span>
                                          <span className="text-[8px] font-mono text-slate-600">{m.timestamp}</span>
                                        </div>
                                        <p className="font-light italic text-slate-300">"{m.text.substring(0, 240)}{m.text.length > 240 ? "..." : ""}"</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="italic text-slate-500">Pristine academic session initialized. No dialogue logs compiled.</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </>
                  );
                })()
              ) : (
                <div className="col-span-full p-12 rounded-2xl bg-slate-900/10 border border-slate-800 border-dashed text-center space-y-4 w-full">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto stroke-[1.2]" />
                  <h3 className="text-slate-300 font-serif font-semibold">No Lifelong Learning Cards Yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Initiate a Socratic study session in the AI Workspace. Nimo will compile your conversations into interactive cards as you learn.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* 🏰 ORIGINAL DOMAINS CATALOG (Redesigned with 3D Card Stack) */
            <div className="space-y-8 flex flex-col items-center w-full">
              {filteredDomains.length > 0 ? (
                (() => {
                  const vaultCardItems = filteredDomains.map((domain) => {
                    return {
                      id: domain.id,
                      title: domain.topic,
                      description: domain.overview,
                      domain,
                    };
                  });

                  // Double check index is within bounds
                  const safeIndex = Math.min(activeVaultIndex, vaultCardItems.length - 1);
                  const activeItem = vaultCardItems[safeIndex] || vaultCardItems[0];

                  return (
                    <>
                      {/* Premium 3D Card Stack selector */}
                      <div className="w-full max-w-2xl px-4 flex justify-center mt-2">
                        <CardStack
                          items={vaultCardItems}
                          initialIndex={safeIndex}
                          onChangeIndex={(idx) => setActiveVaultIndex(idx)}
                          cardWidth={460}
                          cardHeight={240}
                          maxVisible={5}
                          overlap={0.52}
                          spreadDeg={35}
                          showDots={true}
                          renderCard={(item, { active }) => {
                            const d = item.domain;
                            const totalCardsCount = d.flashcards.length;
                            return (
                              <div className={`relative h-full w-full rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden select-none ${
                                active 
                                  ? "border-indigo-500/80 bg-slate-950 shadow-2xl shadow-indigo-500/15" 
                                  : "border-slate-800 bg-[#07090e]/95 opacity-50"
                              }`}>
                                {active && (
                                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                                )}

                                <div className="space-y-1.5 relative z-10">
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                                      {d.subject}
                                    </span>
                                    <div className="flex gap-1 shrink-0">
                                      {d.aiProviders.slice(0, 2).map(p => (
                                        <span key={p} className="text-[7.5px] font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1 py-0.2 rounded-full">
                                          {p.split(" ")[0]}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <h3 className="text-base font-serif text-slate-100 font-medium line-clamp-1 mt-1">
                                    {d.topic}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                    {d.overview}
                                  </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 relative z-10 py-1">
                                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850 text-center">
                                    <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Landmarks</span>
                                    <strong className="text-[9.5px] text-slate-300 block mt-0.5">{d.concepts.length}</strong>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850 text-center">
                                    <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Flashcards</span>
                                    <strong className="text-[9.5px] text-slate-300 block mt-0.5">{totalCardsCount}</strong>
                                  </div>
                                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850 text-center">
                                    <span className="text-[7.5px] font-mono text-slate-500 uppercase block">Sessions</span>
                                    <strong className="text-[9.5px] text-slate-300 block mt-0.5">{d.sessions.length || 1}</strong>
                                  </div>
                                </div>

                                <div className="space-y-1.5 relative z-10">
                                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${d.masteryScore}%` }}
                                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase tracking-widest pt-1">
                                    <span>{d.masteryScore}% Mastery</span>
                                    <span>Swipe Left/Right or use arrows</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </div>

                      {/* Active Selected Domain Details */}
                      {activeItem && (() => {
                        const d = activeItem.domain;
                        return (
                          <motion.div 
                            key={d.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#090b11]/90 backdrop-blur-md overflow-hidden p-6 space-y-6 shadow-2xl mt-4"
                          >
                            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400">{d.subject} Subject Vault</span>
                                <h4 className="text-lg font-serif italic text-slate-100 mt-0.5">{d.topic} Overview</h4>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDomainId(d.id);
                                  setSelectedGraphNode(d.concepts[0]?.name || null);
                                }}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/15"
                              >
                                Enter Domain Workspace
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                  🧠 Conceptual Landmarks ({d.concepts.length})
                                </span>
                                {d.concepts.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                    {d.concepts.map((concept, index) => (
                                      <span key={index} className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-850 text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                                        {concept.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic">No custom concepts indexed yet. Keep studying to expand.</p>
                                )}
                              </div>

                              <div className="space-y-3">
                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                  🧬 Mathematical Formulations ({d.equations?.length || 0})
                                </span>
                                {d.equations && d.equations.length > 0 ? (
                                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                    {d.equations.map((eq, index) => (
                                      <div key={index} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-center font-mono text-[10px] text-indigo-300">
                                        <code>{eq.latex}</code>
                                        <div className="text-[8px] text-slate-500 font-sans italic mt-1">{eq.label} - {eq.explanation}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic">No formulation proofs compiled yet in this vault.</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                                🏰 Vault Overview & Socratic Insights
                              </span>
                              <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-xl text-xs text-slate-300 font-sans leading-relaxed space-y-3">
                                <p className="font-light leading-relaxed">
                                  {d.overview}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-900">
                                  <span>Study Time: <strong className="text-slate-300">{d.studyTime} mins</strong></span>
                                  <span>•</span>
                                  <span>Model Route: <strong className="text-slate-300">{d.aiProviders.join(", ")}</strong></span>
                                  <span>•</span>
                                  <span>Last Iteration: <strong className="text-slate-300">{d.lastUpdated}</strong></span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </>
                  );
                })()
              ) : (
                <div className="col-span-full p-12 rounded-xl bg-slate-900/10 border border-slate-800 border-dashed text-center space-y-4 w-full">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto stroke-[1.2]" />
                  <h3 className="text-slate-300 font-serif font-semibold">No Matching Knowledge Domains</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Try broadening your search term or initiate a new study session in the AI Workspace.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. INSIDE THE LEARNING DOMAIN VIEW (Premium full page workspace) */}
      {activeDomainId && activeDomain && (
        <div className="space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <button
              onClick={() => {
                setActiveDomainId(null);
                setStudyMode(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              Return to Personal Library
            </button>

            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded text-[9px] font-mono uppercase tracking-wider bg-slate-900/60 border border-slate-850 text-slate-400">
                {activeDomain.subject}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Cataloged: <strong>{activeDomain.sessions.length || 1} sessions</strong>
              </span>
            </div>
          </div>

          {!studyMode ? (
            // Core Domain View
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Domain details, Concepts list, Equations & worked proofs */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Topic Info Card */}
                <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <h1 className="font-serif italic text-3xl text-white font-medium">
                      {activeDomain.topic}
                    </h1>
                    <p className="text-xs text-indigo-400 font-mono mt-1">
                      Domain Mastery Score: {activeDomain.masteryScore}%
                    </p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-light font-sans max-w-2xl">
                    {activeDomain.overview}
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-[11px] font-mono pt-2 border-t border-slate-850">
                    <div>
                      <span className="block text-slate-500 text-[9px]">ACTIVE LEARNING TIME</span>
                      <span className="text-white font-semibold">{activeDomain.studyTime} minutes</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[9px]">CONCEPT LANDMARKS</span>
                      <span className="text-white font-semibold">{activeDomain.concepts.length} compiled</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-[9px]">FLASHCARDS DECK</span>
                      <span className="text-white font-semibold">{activeDomain.flashcards.length} cards</span>
                    </div>
                  </div>
                </div>

                {/* Concepts list */}
                <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4">
                  <h3 className="font-serif text-lg text-white font-medium flex items-center gap-2">
                    <ListOrdered className="w-4.5 h-4.5 text-indigo-400" />
                    Mastery Landmarkers
                  </h3>

                  <div className="space-y-3.5">
                    {activeDomain.concepts.map((concept) => (
                      <div 
                        key={concept.name}
                        onClick={() => setSelectedGraphNode(concept.name)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          selectedGraphNode === concept.name 
                            ? "bg-slate-850/60 border-indigo-500/50 shadow-md shadow-indigo-500/5" 
                            : "bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-950/40"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-xs font-semibold text-slate-200">{concept.name}</h4>
                          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            concept.mastery >= 80 ? "text-emerald-400 bg-emerald-500/10" :
                            concept.mastery >= 60 ? "text-indigo-400 bg-indigo-500/10" :
                            "text-amber-400 bg-amber-500/10"
                          }`}>
                            {concept.mastery}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans font-light leading-relaxed">
                          {concept.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equations Box (If applicable) */}
                {activeDomain.equations.length > 0 && (
                  <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4">
                    <h3 className="font-serif text-lg text-white font-medium flex items-center gap-2">
                      <Code className="w-4.5 h-4.5 text-indigo-400" />
                      Important Formulations & Equations
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeDomain.equations.map((eq, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-850 bg-slate-950/40 space-y-3">
                          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block">
                            {eq.label || "DERIVATION"}
                          </span>
                          
                          {/* Code notation math container */}
                          <div className="p-3 rounded bg-slate-950 border border-slate-900 text-center font-mono text-xs text-white overflow-x-auto select-all">
                            <code>{eq.latex}</code>
                          </div>

                          <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                            {eq.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples Section */}
                {activeDomain.examples.length > 0 && (
                  <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4">
                    <h3 className="font-serif text-lg text-white font-medium flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-indigo-400" />
                      Worked Socratic Proofs & Examples
                    </h3>

                    <div className="space-y-4">
                      {activeDomain.examples.map((ex, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-3">
                          <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] flex items-center justify-center font-mono">
                              {i + 1}
                            </span>
                            {ex.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-light italic bg-slate-950/40 p-3 rounded-lg border border-slate-900 leading-relaxed">
                            {ex.scenario}
                          </p>
                          
                          <div className="space-y-2">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Derivation Steps</span>
                            <ol className="space-y-1.5 pl-1">
                              {ex.proofSteps.map((step, idx) => (
                                <li key={idx} className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                                  <span className="text-indigo-400 font-mono text-[10px] mt-0.5">{idx + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Interactive Knowledge Graph, Flashcards study entry, Reflections, History */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Interactive Topological Knowledge Graph */}
                <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4 text-center">
                  <div className="flex justify-between items-center text-left">
                    <h3 className="font-serif text-sm text-slate-200 font-medium flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-indigo-400" />
                      Interactive Topology Map
                    </h3>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Recall States</span>
                  </div>

                  {/* SVG graph container */}
                  <div className="w-full h-[220px] bg-slate-950/50 border border-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 300 220">
                      {/* Connection lines representing prerequisite dependencies */}
                      <path d="M 60 110 L 150 50" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 2" />
                      <path d="M 150 50 L 240 110" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 2" />
                      <path d="M 60 110 L 150 170" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 2" />
                      <path d="M 150 170 L 240 110" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 2" />
                      <path d="M 150 50 L 150 170" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3" />

                      {/* Nodes */}
                      {activeDomain.concepts.slice(0, 5).map((concept, idx) => {
                        // Static coordinate layout positions
                        const positions = [
                          { x: 150, y: 50 },  // Node 1
                          { x: 60, y: 110 },  // Node 2
                          { x: 240, y: 110 }, // Node 3
                          { x: 150, y: 170 }, // Node 4
                          { x: 150, y: 110 }  // Node 5
                        ];
                        const pos = positions[idx] || { x: 150, y: 110 };
                        const isSelected = selectedGraphNode === concept.name;

                        return (
                          <g 
                            key={concept.name} 
                            className="cursor-pointer group"
                            onClick={() => setSelectedGraphNode(concept.name)}
                          >
                            {/* Halo effect */}
                            <circle 
                              cx={pos.x} 
                              cy={pos.y} 
                              r={isSelected ? "14" : "10"} 
                              fill="none" 
                              stroke={isSelected ? "#ec4899" : "#4f46e5"} 
                              strokeWidth={isSelected ? "2" : "1.5"}
                              className={isSelected ? "animate-pulse" : ""}
                              opacity={isSelected ? "0.8" : "0.5"}
                            />
                            {/* Inner circle colored by mastery */}
                            <circle 
                              cx={pos.x} 
                              cy={pos.y} 
                              r="6" 
                              fill={concept.mastery >= 80 ? "#10b981" : concept.mastery >= 60 ? "#6366f1" : "#f59e0b"} 
                            />
                            {/* Text labels */}
                            <text 
                              x={pos.x} 
                              y={pos.y - 15} 
                              textAnchor="middle" 
                              fill="#f8fafc" 
                              fontSize="8" 
                              fontFamily="monospace"
                              className={isSelected ? "font-bold fill-pink-400" : "opacity-70"}
                            >
                              {concept.name.split(" ")[0]}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Simple detail display for highlighted concept */}
                    {selectedGraphNode && (
                      <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-left text-[10px] font-mono animate-scale-in">
                        <div className="flex justify-between font-bold text-slate-100">
                          <span className="truncate text-indigo-400">{selectedGraphNode}</span>
                          <span className="text-emerald-400">
                            {activeDomain.concepts.find(c => c.name === selectedGraphNode)?.mastery || 60}% Recall
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">
                          {activeDomain.concepts.find(c => c.name === selectedGraphNode)?.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-500 font-light">
                    Concept topology links prerequisites. Color indicates current active recall metrics.
                  </p>
                </div>

                {/* Socratic Reflections Gateway */}
                {activeDomain.reflections.length > 0 && (
                  <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4">
                    <h3 className="font-serif text-sm text-slate-200 font-medium flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-indigo-400" />
                      Active Student Reflections
                    </h3>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                      {activeDomain.reflections.map((ref, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-[11px] font-mono space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>Socratic Prompt</span>
                            <span>{ref.timestamp}</span>
                          </div>
                          <p className="text-slate-300 italic">"{ref.prompt}"</p>
                          <div className="text-[10px] text-pink-400 pl-2 border-l border-pink-500/30 font-sans font-light mt-1">
                            <span className="text-[9px] text-slate-500 font-mono block">YOUR EXPLANATION:</span>
                            {ref.studentAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leitner Active Recall Drawer/Trigger */}
                <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6 text-indigo-400 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Active Recall Testing</h3>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Evaluate your photographic recall on {activeDomain.flashcards.length} cards compiled for this Socratic study cycle.
                    </p>
                  </div>

                  {activeDomain.flashcards.length > 0 ? (
                    <button
                      onClick={startQuiz}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold font-mono transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Review Leitner Cards
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-[10px] text-slate-500 font-mono">
                      Continue study sessions in this domain to generate active recall flashcards.
                    </div>
                  )}
                </div>

                {/* Original Conversations / Contributing Sessions */}
                <div className="p-6 rounded-2xl border border-slate-800/90 bg-slate-900/30 backdrop-blur-sm space-y-4">
                  <h3 className="font-serif text-sm text-slate-200 font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    Contributing Socratic Sessions
                  </h3>

                  <div className="space-y-2.5">
                    {activeDomain.sessions.map((sess, i) => (
                      <div 
                        key={sess.id}
                        className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/40 flex items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                            {sess.title.replace("Session: ", "")}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                            Socratic Scaffolding Progress: {sess.progress}%
                          </span>
                        </div>

                        {onReopenSession && (
                          <button
                            onClick={() => onReopenSession(sess.id)}
                            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-indigo-400 font-mono transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Reopen
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Fallback mock original session entry to ensure view original conversation is always present */}
                    {activeDomain.sessions.length === 0 && (
                      <div className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/40 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-300">
                            Intro Socratic Session
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                            Historical initial socratic download
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono italic">
                          Legacy Vault
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            // Active Quiz / Recall Study Workspace
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <button
                onClick={exitQuiz}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors font-mono mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Exit Recall Queue
              </button>

              {activeDomain.flashcards.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto stroke-[1.5]" />
                  <h3 className="font-serif italic text-lg text-white font-medium">Collection is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    No active recall cards have been compiled for this collection yet. Continue Socratic study sessions to auto-generate cards.
                  </p>
                  <button
                    onClick={exitQuiz}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white transition-colors cursor-pointer"
                  >
                    Back to Domain
                  </button>
                </div>
              ) : currentCardIndex < activeDomain.flashcards.length ? (
                // Active Quiz Layout
                <div className="space-y-6">
                  {/* Score panel */}
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400 p-3 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span>DOMAIN: <strong>{activeDomain.topic}</strong></span>
                    <span>CARD: <strong>{currentCardIndex + 1}</strong> of <strong>{activeDomain.flashcards.length}</strong></span>
                  </div>

                  {/* TACTILE 3D CARD BOX */}
                  <div 
                    className="perspective-1000 h-[280px] w-full cursor-pointer select-none"
                    onClick={handleFlipCard}
                  >
                    <div 
                      className={`relative w-full h-full duration-500 transform-style-3d ${
                        isFlipped ? "rotate-y-180" : ""
                      }`}
                    >
                      {/* CARD FRONT */}
                      <div className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between backface-hidden shadow-2xl">
                        <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block">
                          Active Recall Prompt (Box {activeDomain.flashcards[currentCardIndex].box || 1})
                        </span>
                        <div className="flex-1 flex items-center justify-center text-center">
                          <p className="font-serif italic text-lg text-white font-medium leading-relaxed max-w-lg">
                            {activeDomain.flashcards[currentCardIndex].front}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 text-center font-mono flex items-center justify-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Click to expose Leitner answer
                        </span>
                      </div>

                      {/* CARD BACK */}
                      <div className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block">
                          Leitner Calibrated Solution
                        </span>
                        <div className="flex-1 flex items-center justify-center text-center">
                          <p className="font-sans text-slate-200 text-sm leading-relaxed max-w-lg font-light">
                            {activeDomain.flashcards[currentCardIndex].back}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 text-center font-mono">
                          Evaluate your recall accuracy below
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE LEITNER FEEDBACK BUTTONS */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <button
                      id="btn_recall_hard"
                      onClick={(e) => { e.stopPropagation(); handleReviewFeedback("hard"); }}
                      className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-center transition-colors cursor-pointer"
                    >
                      <span className="block text-xs font-semibold">Struggled (Hard)</span>
                      <span className="block text-[10px] text-red-500/80 font-mono mt-0.5">Reset to Box 1</span>
                    </button>

                    <button
                      id="btn_recall_medium"
                      onClick={(e) => { e.stopPropagation(); handleReviewFeedback("medium"); }}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 text-center transition-colors cursor-pointer"
                    >
                      <span className="block text-xs font-semibold">Retained (Medium)</span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Keep Box State</span>
                    </button>

                    <button
                      id="btn_recall_easy"
                      onClick={(e) => { e.stopPropagation(); handleReviewFeedback("easy"); }}
                      className="p-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 hover:bg-emerald-950/30 text-emerald-400 text-center transition-colors cursor-pointer"
                    >
                      <span className="block text-xs font-semibold">Mastered (Easy)</span>
                      <span className="block text-[10px] text-emerald-500/80 font-mono mt-0.5">Promote Box +1</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Quiz completed view
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-6">
                  <Award className="w-12 h-12 text-emerald-400 mx-auto stroke-[1.5] animate-bounce" />
                  <div>
                    <h3 className="font-serif italic text-2xl text-white font-medium">Recall Session Complete!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                      Excellent cognitive effort. You have evaluated {reviewsCompleted.length} concept cards. The Leitner database has integrated these memory traces.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/60 max-w-sm mx-auto border border-slate-900 text-xs text-slate-400 flex justify-between">
                    <span>Streak Metric:</span>
                    <strong className="text-white">{user.learningStreak} days</strong>
                  </div>

                  <button
                    id="btn_quiz_complete_exit"
                    onClick={exitQuiz}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Return to Domain
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
