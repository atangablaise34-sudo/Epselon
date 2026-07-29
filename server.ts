import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { orchestrateProtocolTurn } from "./src/lib/protocol/orchestrator";
import { LearningIntentEngine } from "./src/lib/protocol/learningIntentEngine";
import { PipelineRouter } from "./src/lib/protocol/pipelineRouter";
import { EducationalContextEngine } from "./src/lib/protocol/educationalContextEngine";
import { buildStudentContext, detectIntent, coachPrompt } from "./src/lib/protocol/engines";
import {
  triggerLessonCompletion,
  triggerReflectionCompletion,
  triggerQuizCompletion,
  triggerFlashcardReview,
  triggerPracticeSession,
  triggerRepeatedTopicVisits,
  triggerSuccessfulExplanation,
  triggerRepeatedMistakes,
  applyKnowledgeDecay,
  detectFlashcardTriggers,
  generateRecommendations,
  getPersonalizationDirective,
  calculateNodeState,
  extractAndEnrichKnowledge
} from "./src/lib/protocol/knowledgeGraphEngine";

dotenv.config();

const app = express();
const PORT = 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const IS_NETLIFY = Boolean(process.env.NETLIFY);
const DATA_FILE = IS_VERCEL || IS_NETLIFY
  ? path.join("/tmp", "data.json")
  : path.join(process.cwd(), "data.json");

// Parse request bodies
app.use(express.json({ limit: "10mb" }));

app.use(async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (userId) {
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    activeSessionUserId = userIdStr;
    
    // If the local in-memory DB is empty (due to cold start)
    if (!Object.values(db.users).find((u) => u.id === userIdStr)) {
      let loadedFromSupabase = false;
      if (supabase) {
        try {
          const { data, error } = await supabase.from("users").select("*").eq("id", userIdStr).single();
          if (data) {
            const loadedUser = {
              id: data.id,
              email: data.email,
              fullName: data.full_name,
              country: data.country || "United States",
              university: data.university || "Stanford University",
              faculty: data.faculty || "Sciences",
              department: data.department || "Physics",
              academicLevel: data.academic_level || "PhD Candidate",
              preferredLanguage: data.preferred_language || "English",
              learningStyle: data.learning_style || "Visual",
              weeklyCommitment: data.weekly_commitment || "5-10",
              learningObjectives: data.learning_objectives || "",
              masteryProgress: data.mastery_progress || 0,
              learningStreak: data.learning_streak || 1,
              cardsMastered: data.cards_mastered || 0,
              totalCards: data.total_cards || 0,
              preferences: data.preferences || {},
              providers: data.providers || []
            };
            db.users[data.email] = loadedUser;
            
            if (data.preferences && data.preferences._appState) {
              db.sessions[userIdStr] = data.preferences._appState.sessions || [];
              db.flashcards[userIdStr] = data.preferences._appState.flashcards || [];
              db.collections[userIdStr] = data.preferences._appState.collections || [];
            }
            loadedFromSupabase = true;
          }
        } catch (err) {
          console.error("Failed to restore state from Supabase:", err);
        }
      }

      if (!loadedFromSupabase) {
        console.warn("User not found in local db or Supabase, fallback building user for session", userIdStr);
        db.users["unknown_" + userIdStr] = {
          id: userIdStr,
          email: "unknown@example.com",
          fullName: "Guest Student",
          country: "United States",
          university: "Unknown",
          faculty: "Sciences",
          department: "Physics",
          academicLevel: "Undergraduate",
          preferredLanguage: "English",
          learningStyle: "Visual",
          weeklyCommitment: "5-10",
          learningObjectives: "",
          masteryProgress: 0,
          learningStreak: 1,
          cardsMastered: 0,
          totalCards: 0,
          preferences: {
            theme: "obsidian",
            accentColor: "indigo",
            fontSize: "medium",
            teachingStyle: "Socratic",
            cognitiveLoad: "Master",
            selectedProvider: "gemini-3.5-flash",
            selectedModel: "gemini-3.1-flash-lite",
          },
          providers: []
        } as any;
      }
    }
  }
  next();
});


// Normalize URL for Vercel/Netlify serverless function routing if routed via serverless handler
app.use((req, res, next) => {
  if (req.url.startsWith("/.netlify/functions/api")) {
    req.url = req.url.replace("/.netlify/functions/api", "");
    if (!req.url.startsWith("/api")) {
      req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
    }
  }
  next();
});

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Initialize Supabase Client
import { createClient, SupabaseClient } from "@supabase/supabase-js";
let supabase: SupabaseClient | null = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const cleanSupabaseUrl = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  supabase = createClient(
    cleanSupabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  console.log(`Supabase client initialized for ${cleanSupabaseUrl} with Service Role Key.`);
}


let isGeminiQuotaExceeded = false;
let quotaExceededResetTime = 0;

function checkQuotaStatus() {
  if (isGeminiQuotaExceeded && Date.now() > quotaExceededResetTime) {
    console.log("[QUOTA ENGINE] Cooldown expired. Resetting isGeminiQuotaExceeded to false to retry cloud APIs.");
    isGeminiQuotaExceeded = false;
  }
}


// Helper function to invoke Gemini with retries and a fallback model in case of high demand (503)
async function generateContentWithFallback(
  aiClient: GoogleGenAI,
  params: { model: string; contents: any; config?: any },
  retries = 3
): Promise<any> {
  checkQuotaStatus();
  if (isGeminiQuotaExceeded) {
    throw new Error("Gemini daily quota exceeded (RESOURCE_EXHAUSTED). Falling back to Offline Socratic Mode instantly.");
  }

  const modelsToTry = [params.model, "gemini-3.1-flash-lite"].filter(Boolean);
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    let delay = 1000;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Attempting Gemini call with model: ${model} (attempt ${attempt + 1}/${retries + 1})`);
        const response = await aiClient.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini call failed with model ${model} (attempt ${attempt + 1}/${retries + 1}):`, err.message || err);

        const errorMsg = (err.message || "").toLowerCase();
        const isQuotaExceeded = 
          err.status === 429 ||
          err.statusCode === 429 ||
          errorMsg.includes("429") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("resource_exhausted") ||
          errorMsg.includes("billing details") ||
          errorMsg.includes("limit: 20") ||
          errorMsg.includes("rate limit");

        if (isQuotaExceeded) {
          console.warn("[QUOTA ENGINE] Daily API Quota limits exceeded (429 RESOURCE_EXHAUSTED). Shifting to Offline Socratic Mode.");
          isGeminiQuotaExceeded = true;
          quotaExceededResetTime = Date.now() + 1000 * 60 * 30; // 30 minutes of silent local fallback
          throw err; // Fail-fast immediately to allow instant fallback rendering!
        }

        const is503OrRateLimit =
          err.status === 503 ||
          err.statusCode === 503 ||
          errorMsg.includes("503") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("unavailable");

        if (attempt < retries && is503OrRateLimit) {
          // Add randomized jitter to avoid thundering herd problem during spikes
          const jitter = Math.floor(Math.random() * 800) + 200;
          const totalDelay = delay + jitter;
          console.log(`Temporary network demand on ${model}. Waiting ${totalDelay}ms (delay ${delay}ms + jitter ${jitter}ms) before retry...`);
          await new Promise((resolve) => setTimeout(resolve, totalDelay));
          delay *= 1.5; // Exponential backoff scaling
        } else {
          break; // Stop retrying this model, proceed to the next fallback model
        }
      }
    }
  }
  throw lastError || new Error("Failed to generate content with all available models");
}

// Global In-Memory Store / Local File Database
interface UserPreferences {
  theme: "obsidian" | "light" | "cybernetic";
  accentColor: "blue" | "purple" | "green" | "orange";
  fontSize: "100%" | "110%" | "120%" | "90%";
  teachingStyle: "Socratic" | "Explanatory" | "Practical" | "Theoretical";
  cognitiveLoad: "Novice" | "Proficient" | "Master";
  taxonomyFocus: "Analyze & Evaluate" | "Apply & Understand" | "Create & Synthesize";
  contextAwareness: boolean;
  selectedProvider?: string;
  selectedModel?: string;
  routingType?: "automatic" | "manual";
  temperature?: number;
  reasoningLevel?: "low" | "medium" | "high";
  responseLength?: "short" | "medium" | "long";
}

interface ProviderConnection {
  id: string;
  name: string;
  connected: boolean;
  apiKey?: string;
  email?: string;
  currentModel: string;
  latency: string;
  lastSynced?: string;
  features: string[];
}

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  country: string;
  university: string;
  faculty: string;
  department: string;
  academicLevel: string;
  preferredLanguage: string;
  learningStyle: "Visual" | "Auditory" | "Reading" | "Kinesthetic";
  weeklyCommitment: "1-5" | "5-10" | "10-20" | "20+";
  learningObjectives: string;
  masteryProgress: number;
  learningStreak: number;
  cardsMastered: number;
  totalCards: number;
  preferences: UserPreferences;
  providers?: ProviderConnection[];
  knowledgeGraph?: any;
}

interface ChatMessage {
  id: string;
  sender: "student" | "mentor";
  text: string;
  timestamp: string;
  equation?: string;
  autoNotes?: Array<{ key: string; val: string }>;
  progressiveParts?: Array<{ title: string; content: string }>;
  protocolTrace?: {
    intent?: { category: string; confidence: number; reason: string };
    learningIntent?: { intent: string; confidence: number; reasoning: string };
    pipelineRouting?: { pipelineId: string; reason: string };
    routing?: { providerId: string; model: string; justification: string };
    pedagogy?: { style: string; bloomLevel: string; scaffoldingRules: string[]; injectedPrompt: string };
    coach?: { original: string; enhanced: string; steps: Array<{ text: string; label: string; explanation: string }> };
    curriculum?: { contextSnippet: string; localExamples: string[] };
    practiceQuestion?: string;
    reflectionQuestions?: string[];
    suggestedFlashcards?: Array<{ front: string; back: string }>;
    pictureMemoryTest?: {
      question: string;
      options: string[];
      correctOptionIdx: number;
      explanationOfCorrectAnswer: string;
    };
  };
}

interface StudySession {
  id: string;
  title: string;
  focus: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  bloomLevel: string;
  strategy: string;
  progress: number;
  prerequisites: Array<{ name: string; completed: boolean }>;
  outline: string[];
  messages: ChatMessage[];
  currentIntent?: string;
  manualIntent?: string;
}

interface Flashcard {
  id: string;
  collectionId: string;
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
  lastReviewed?: string;
  nextReview?: string;
  box: number; // For Leitner System
}

interface FlashcardCollection {
  id: string;
  name: string;
  totalCards: number;
  dueTodayCount: number;
  masteryPercentage: number;
  icon: string;
}

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  sessions: Record<string, StudySession[]>;
  collections: Record<string, FlashcardCollection[]>;
  flashcards: Record<string, Flashcard[]>;
}

// Initial Mock Data to seed the application beautifully
const defaultDb: DatabaseSchema = {
  users: {
    "researcher@institute.edu": {
      id: "usr_alex_chen",
      fullName: "Alex Chen",
      email: "researcher@institute.edu",
      country: "United States",
      university: "Stanford University",
      faculty: "Sciences",
      department: "Physics",
      academicLevel: "PhD Candidate",
      preferredLanguage: "English",
      learningStyle: "Visual",
      weeklyCommitment: "5-10",
      learningObjectives: "I want to master advanced wave mechanics and quantum distributions before my midterms.",
      masteryProgress: 77,
      learningStreak: 14,
      cardsMastered: 452,
      totalCards: 600,
      preferences: {
        theme: "obsidian",
        accentColor: "blue",
        fontSize: "100%",
        teachingStyle: "Socratic",
        cognitiveLoad: "Proficient",
        taxonomyFocus: "Analyze & Evaluate",
        contextAwareness: true,
      },
    },
  },
  sessions: {
    "usr_alex_chen": [
      {
        id: "sess_quantum_1",
        title: "Session: Wave-Particle Duality",
        focus: "Quantum Mechanics",
        difficulty: "Advanced",
        bloomLevel: "Analyze",
        strategy: "Socratic",
        progress: 72,
        prerequisites: [
          { name: "Classical Mechanics Basics", completed: true },
          { name: "Complex Numbers", completed: true },
          { name: "Probability Theory", completed: false },
        ],
        outline: ["Introduction", "Double-Slit Exp.", "De Broglie Wavelength"],
        messages: [
          {
            id: "msg_1",
            sender: "mentor",
            text: "To truly grasp the wave-particle duality, we must examine how quantum entities exhibit properties of both classic waves and particles depending on the experimental setup.",
            timestamp: "10:42 AM",
            equation: "i\\hbar \\frac{\\partial\\Psi}{\\partial t} = \\hat{H}\\Psi",
            autoNotes: [
              { key: "Key Term", val: "Observer Effect - The act of observing alters the system." },
              { key: "Eq", val: "iℏ ∂Ψ/∂t = ĤΨ" },
            ],
          },
        ],
      },
    ],
  },
  collections: {
    "usr_alex_chen": [
      {
        id: "coll_quantum",
        name: "Quantum Mechanics",
        totalCards: 120,
        dueTodayCount: 12,
        masteryPercentage: 85,
        icon: "FlaskCon",
      },
      {
        id: "coll_organic",
        name: "Organic Chemistry",
        totalCards: 245,
        dueTodayCount: 8,
        masteryPercentage: 62,
        icon: "MicroscopeCon",
      },
      {
        id: "coll_algebra",
        name: "Linear Algebra",
        totalCards: 85,
        dueTodayCount: 4,
        masteryPercentage: 92,
        icon: "SigmaCon",
      },
      {
        id: "coll_classical",
        name: "Classical Mechanics",
        totalCards: 150,
        dueTodayCount: 0,
        masteryPercentage: 45,
        icon: "CompassCon",
      },
    ],
  },
  flashcards: {
    "usr_alex_chen": [
      {
        id: "fc_1",
        collectionId: "coll_quantum",
        front: "What is the physical interpretation of the square of the wavefunction, |Ψ|²?",
        back: "It represents the probability density of finding the particle at a specific position and time.",
        difficulty: "easy",
        box: 3,
      },
      {
        id: "fc_2",
        collectionId: "coll_quantum",
        front: "State the Heisenberg Uncertainty Principle for position and momentum.",
        back: "Δx · Δp ≥ ℏ/2. It is physically impossible to know both position and momentum with absolute precision simultaneously.",
        difficulty: "medium",
        box: 2,
      },
    ],
  },
};

// Database persistence logic
let db: DatabaseSchema = { ...defaultDb };

function ensureDb() {
  if (!db) db = { ...defaultDb };
  if (!db.users) db.users = {};
  if (!db.sessions) db.sessions = {};
  if (!db.collections) db.collections = {};
  if (!db.flashcards) db.flashcards = {};
}

function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      db = JSON.parse(data);
    } else if (fs.existsSync(path.join(process.cwd(), "data.json"))) {
      const data = fs.readFileSync(path.join(process.cwd(), "data.json"), "utf-8");
      db = JSON.parse(data);
    } else {
      db = JSON.parse(JSON.stringify(defaultDb));
    }
  } catch (err) {
    console.error("Error loading database file, resetting to default.", err);
    db = JSON.parse(JSON.stringify(defaultDb));
  }
  ensureDb();
}

function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist database file (non-fatal, e.g. read-only filesystem); keeping in memory.", err);
  }
  
  if (supabase && activeSessionUserId) {
    const user = Object.values(db.users).find(u => u.id === activeSessionUserId);
    if (user) {
      Promise.resolve(
        supabase.from("users").update({
          preferences: {
            ...user.preferences,
            _appState: {
              sessions: db.sessions[activeSessionUserId] || [],
              flashcards: db.flashcards[activeSessionUserId] || [],
              collections: db.collections[activeSessionUserId] || []
            }
          }
        }).eq("id", activeSessionUserId)
      ).catch(() => {});
    }
  }
}

// Initial load
loadDb();

function ensureKnowledgeGraph(user: any) {
  if (!user.knowledgeGraph) {
    user.knowledgeGraph = {
      nodes: [
        {
          id: "wave_fn",
          label: "Schrödinger Wavefunction",
          group: "quantum",
          val: 12,
          mastery: 85,
          x: 150,
          y: 120,
          vx: 0,
          vy: 0,
          radius: 28,
          category: "Wave Mechanics",
          desc: "A mathematical description of the quantum state of an isolated physical system.",
          prereqs: ["Complex Numbers", "Classical Wave Physics"],
          confidenceScore: 85,
          state: "Confident",
          timesStudied: 1,
          timesReviewed: 1,
          lastStudiedDate: new Date().toISOString()
        },
        {
          id: "heis_unc",
          label: "Heisenberg Uncertainty Principle",
          group: "quantum",
          val: 8,
          mastery: 72,
          x: 350,
          y: 180,
          vx: 0,
          vy: 0,
          radius: 24,
          category: "Quantum Principles",
          desc: "Asserts a fundamental limit to the precision with which certain pairs of physical properties can be known.",
          prereqs: ["Schrödinger Wavefunction"],
          confidenceScore: 72,
          state: "Confident",
          timesStudied: 1,
          timesReviewed: 1,
          lastStudiedDate: new Date().toISOString()
        },
        {
          id: "eigen",
          label: "Eigenstates & Operators",
          group: "math",
          val: 10,
          mastery: 50,
          x: 220,
          y: 320,
          vx: 0,
          vy: 0,
          radius: 26,
          category: "Mathematical Setup",
          desc: "Represent physical observables as linear operators acting on Hilbert space vectors.",
          prereqs: ["Schrödinger Wavefunction"],
          confidenceScore: 50,
          state: "Practicing",
          timesStudied: 1,
          timesReviewed: 1,
          lastStudiedDate: new Date().toISOString()
        },
        {
          id: "diffract",
          label: "Double-Slit Diffraction",
          group: "experimental",
          val: 6,
          mastery: 95,
          x: 480,
          y: 100,
          vx: 0,
          vy: 0,
          radius: 20,
          category: "Physical Experiments",
          desc: "The classic demonstration of quantum wave-particle superposition and interference patterns.",
          prereqs: ["Classical Wave Physics"],
          confidenceScore: 95,
          state: "Mastered",
          timesStudied: 1,
          timesReviewed: 1,
          lastStudiedDate: new Date().toISOString()
        },
        {
          id: "debroglie",
          label: "De Broglie Duality",
          group: "quantum",
          val: 7,
          mastery: 90,
          x: 520,
          y: 280,
          vx: 0,
          vy: 0,
          radius: 22,
          category: "Wave Mechanics",
          desc: "Formulates that any moving particle has an associated wave character with λ = h/p.",
          prereqs: ["Classical Wave Physics"],
          confidenceScore: 90,
          state: "Mastered",
          timesStudied: 1,
          timesReviewed: 1,
          lastStudiedDate: new Date().toISOString()
        },
        {
          id: "hilbert",
          label: "Hilbert Space Formulations",
          group: "math",
          val: 5,
          mastery: 35,
          x: 100,
          y: 250,
          vx: 0,
          vy: 0,
          radius: 18,
          category: "Mathematical Setup",
          desc: "An abstract vector space possessing the structure of an inner product that allows length and angle measurement.",
          prereqs: ["Eigenstates & Operators"],
          confidenceScore: 35,
          state: "Learning",
          timesStudied: 1,
          timesReviewed: 1,
          lastStudiedDate: new Date().toISOString()
        }
      ],
      links: [
        { source: "wave_fn", target: "heis_unc" },
        { source: "wave_fn", target: "eigen" },
        { source: "diffract", target: "debroglie" },
        { source: "debroglie", target: "heis_unc" },
        { source: "eigen", target: "hilbert" }
      ]
    };
  }
}

// Simple in-memory session manager
let activeSessionUserId: string | null = "usr_alex_chen"; // Start logged in as Alex Chen for standard preview

// SUPABASE HEALTH CHECK
app.get("/api/supabase/health", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ 
      status: "error", 
      message: "Supabase client not initialized. Check server environment variables." 
    });
  }
  try {
    // Attempt to query the current time to verify connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is relation does not exist, which means connected but tables missing
      if (error.code === '42P01') {
        return res.status(200).json({ status: "connected_but_tables_missing", error });
      }
      return res.status(500).json({ status: "error", error });
    }
    return res.status(200).json({ status: "ok", message: "Supabase is connected and active" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// AUTH API ENDPOINTS
app.get("/api/auth/session", async (req, res) => {
  try {
    if (!activeSessionUserId) {
      return res.status(401).json({ error: "No active session" });
    }

    let user;

    if (supabase) {
      // Fetch from Supabase
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", activeSessionUserId)
        .single();

      if (error || !profile) {
        // If table doesn't exist (42P01) or user not found, fallback to local DB for smooth setup
        user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
        if (!user) {
          return res.status(404).json({ error: "User profile not found in Supabase or local DB" });
        }
      } else {
        // Map snake_case database columns to camelCase UserProfile
        user = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          country: profile.country,
          university: profile.university,
          faculty: profile.faculty,
          department: profile.department,
          academicLevel: profile.academic_level,
          preferredLanguage: profile.preferred_language,
          learningStyle: profile.learning_style,
          weeklyCommitment: profile.weekly_commitment,
          learningObjectives: profile.learning_objectives,
          masteryProgress: profile.mastery_progress,
          learningStreak: profile.learning_streak,
          cardsMastered: profile.cards_mastered,
          totalCards: profile.total_cards,
          preferences: profile.preferences,
          providers: profile.providers || [],
        };
      }
    } else {
      // Fallback to local DB
      user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
      if (!user) {
        return res.status(404).json({ error: "User profile not found" });
      }
    }

    ensureKnowledgeGraph(user);
    user.knowledgeGraph = applyKnowledgeDecay(user.knowledgeGraph, 0.1);
    const recommendations = generateRecommendations(user.knowledgeGraph);
    res.json({ user, recommendations });
  } catch (err: any) {
    console.error("Unhandled error in /api/auth/session:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    ensureDb();
    const { fullName, email, password, country, university, faculty, department, academicLevel, preferredLanguage } = req.body || {};
    if (!email || !fullName || !password) {
      return res.status(400).json({ error: "Missing primary registration fields" });
    }

    let userId = "usr_" + Math.random().toString(36).substr(2, 9);
    let requiresVerification = false;
      
    if (supabase) {
      try {
        // 1. Create user in Supabase Auth using standard signUp so verification is strictly required!
        // This naturally triggers the confirmation email if Email Confirmations are enabled in Supabase.
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (authError) {
          return res.status(400).json({ error: authError.message });
        }

        if (authData?.user) {
          userId = authData.user.id;
          requiresVerification = true; // Supabase sends the email automatically
        }

        // 2. Insert into public.users
        try {
          await supabase.from("users").insert([{
            id: userId,
            email,
            full_name: fullName,
            country: country || "United States",
            university: university || "Stanford University",
            faculty: faculty || "Sciences",
            department: department || "Physics",
            academic_level: academicLevel || "PhD Candidate",
            preferred_language: preferredLanguage || "English",
            learning_style: "Visual",
            weekly_commitment: "5-10",
            learning_objectives: "",
            mastery_progress: 0,
            learning_streak: 1,
            cards_mastered: 0,
            total_cards: 0,
            preferences: {
              theme: "obsidian",
              accentColor: "blue",
              fontSize: "100%",
              teachingStyle: "Socratic",
              cognitiveLoad: "Proficient",
              taxonomyFocus: "Analyze & Evaluate",
              contextAwareness: true,
            }
          }]);
        } catch (profileErr) {
          console.warn("Public.users table insert warning:", profileErr);
        }
      } catch (sbErr: any) {
        console.warn("Supabase auth integration warning:", sbErr?.message || sbErr);
      }
    }

    // Create a clean user record (for fallback and local initialization)
    const newUser: UserProfile = {
      id: userId,
      fullName,
      email,
      country: country || "United States",
      university: university || "Stanford University",
      faculty: faculty || "Sciences",
      department: department || "Physics",
      academicLevel: academicLevel || "PhD Candidate",
      preferredLanguage: preferredLanguage || "English",
      learningStyle: "Visual",
      weeklyCommitment: "5-10",
      learningObjectives: "",
      masteryProgress: 0,
      learningStreak: 1,
      cardsMastered: 0,
      totalCards: 0,
      preferences: {
        theme: "obsidian",
        accentColor: "blue",
        fontSize: "100%",
        teachingStyle: "Socratic",
        cognitiveLoad: "Proficient",
        taxonomyFocus: "Analyze & Evaluate",
        contextAwareness: true,
      },
    };

    db.users[email] = newUser;

    // Seed basic initial data for the new user
    db.sessions[userId] = [
      {
        id: "sess_intro_1",
        title: "Session: Modern Quantum Principles",
        focus: "Quantum Mechanics",
        difficulty: "Advanced",
        bloomLevel: "Analyze",
        strategy: "Socratic",
        progress: 10,
        prerequisites: [
          { name: "Introductory Wave Equations", completed: true },
          { name: "Multivariable Calculus", completed: false },
        ],
        outline: ["Wave packets", "Superposition", "Eigenstates"],
        messages: [
          {
            id: "msg_new_1",
            sender: "mentor",
            text: `Welcome to Epselon, ${fullName}. Let's initialize your neural pathways. Ask me any conceptual question to begin.`,
            timestamp: "Now",
          },
        ],
      },
    ];
    db.collections[userId] = [
      {
        id: "coll_" + userId + "_1",
        name: "Core Science Fundamentals",
        totalCards: 12,
        dueTodayCount: 5,
        masteryPercentage: 0,
        icon: "FlaskCon",
      },
    ];
    db.flashcards[userId] = [
      {
        id: "fc_new_1",
        collectionId: "coll_" + userId + "_1",
        front: "What is the Schrödinger Equation?",
        back: "A linear partial differential equation that governs the wave function of a quantum-mechanical system.",
        difficulty: "medium",
        box: 1,
      },
    ];

    saveDb();

    if (!requiresVerification) {
      activeSessionUserId = userId;
    }

    res.json({
      user: newUser,
      requiresVerification,
      email,
      message: requiresVerification
        ? `Account created! We sent a verification email to ${email}. Please confirm your email before signing in.`
        : "Registration successful!"
    });
  } catch (err: any) {
    console.error("Unhandled error in /api/auth/register:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    let user;

    if (supabase) {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        const errMsg = authError?.message || "";
        const isUnconfirmed = errMsg.toLowerCase().includes("confirm") || errMsg.toLowerCase().includes("verify");
        if (isUnconfirmed) {
          return res.status(401).json({
            error: "Email address not verified. Please check your inbox and click the verification link before signing in.",
            requiresVerification: true,
            email
          });
        }
        return res.status(401).json({ error: errMsg || "Invalid credentials" });
      }

      // Explicit check for email verification status
      if (!authData.user.email_confirmed_at && !authData.user.confirmed_at) {
        return res.status(401).json({
          error: "Email address not verified. Please check your inbox and click the verification link before signing in.",
          requiresVerification: true,
          email
        });
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        console.warn("Profile not found in Supabase database, falling back to local database profile", profileError);
        user = Object.values(db.users).find((u) => u.email === email);
        if (!user) {
          user = {
            id: authData.user.id,
            email: authData.user.email || email,
            fullName: authData.user.user_metadata?.full_name || "Academic User",
            country: "United States",
            university: "Stanford University",
            faculty: "Sciences",
            department: "Physics",
            academicLevel: "PhD Candidate",
            preferredLanguage: "English",
            learningStyle: "Visual",
            weeklyCommitment: "5-10",
            learningObjectives: "",
            masteryProgress: 0,
            learningStreak: 1,
            cardsMastered: 0,
            totalCards: 0,
            preferences: {
              theme: "obsidian",
              accentColor: "blue",
              fontSize: "100%",
              teachingStyle: "Socratic",
              cognitiveLoad: "Proficient",
              taxonomyFocus: "Analyze & Evaluate",
              contextAwareness: true,
            },
            providers: [],
          };
        }
      } else {
        // Map snake_case database columns to camelCase UserProfile
        user = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          country: profile.country,
          university: profile.university,
          faculty: profile.faculty,
          department: profile.department,
          academicLevel: profile.academic_level,
          preferredLanguage: profile.preferred_language,
          learningStyle: profile.learning_style,
          weeklyCommitment: profile.weekly_commitment,
          learningObjectives: profile.learning_objectives,
          masteryProgress: profile.mastery_progress,
          learningStreak: profile.learning_streak,
          cardsMastered: profile.cards_mastered,
          totalCards: profile.total_cards,
          preferences: profile.preferences,
          providers: profile.providers || [],
        };
      }
      activeSessionUserId = user.id;
      db.users[user.email] = user;
    } else {
      // Fallback to local DB
      user = Object.values(db.users).find((u) => u.email === email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      activeSessionUserId = user.id;
    }

    res.json({ user });
  } catch (err: any) {
    console.error("Unhandled error in /api/auth/login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (supabase) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email
      });
      if (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    res.json({ success: true, message: `Verification link has been resent to ${email}. Please check your inbox.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to resend verification link." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  activeSessionUserId = null;
  res.json({ success: true });
});

app.post("/api/auth/onboard", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const { university, faculty, learningStyle, weeklyCommitment, learningObjectives } = req.body;
  
const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.university = university || user.university;
  user.faculty = faculty || user.faculty;
  user.learningStyle = learningStyle || user.learningStyle;
  user.weeklyCommitment = weeklyCommitment || user.weeklyCommitment;
  user.learningObjectives = learningObjectives || user.learningObjectives;

  saveDb();
  res.json({ user });
});

// PREFERENCES API
app.post("/api/user/preferences", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const preferences = req.body;
  const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.preferences = {
    ...user.preferences,
    ...preferences,
  };

  saveDb();
  res.json({ preferences: user.preferences });
});

// PROVIDERS API
app.post("/api/user/providers", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const { providers } = req.body;
  const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.providers = providers;

  saveDb();
  res.json({ providers: user.providers, user });
});

app.post("/api/user/profile", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const { fullName, university, faculty, department, academicLevel, learningStyle, weeklyCommitment, learningObjectives } = req.body;
  const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.fullName = fullName || user.fullName;
  user.university = university || user.university;
  user.faculty = faculty || user.faculty;
  user.department = department || user.department;
  user.academicLevel = academicLevel || user.academicLevel;
  user.learningStyle = learningStyle || user.learningStyle;
  user.weeklyCommitment = weeklyCommitment || user.weeklyCommitment;
  user.learningObjectives = learningObjectives !== undefined ? learningObjectives : user.learningObjectives;

  saveDb();
  res.json({ success: true, user });
});


// SESSIONS API
app.get("/api/study/sessions", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  checkQuotaStatus();
  const list = db.sessions[activeSessionUserId] || [];
  const listWithQuotaFlag = list.map(s => ({
    ...s,
    isOfflineSocraticMode: isGeminiQuotaExceeded
  }));
  res.json({ sessions: listWithQuotaFlag });
});

// HIGHLIGHT TO DEFINE API
app.post("/api/study/define", async (req, res) => {
  try {
    if (!activeSessionUserId) {
      return res.status(401).json({ error: "No active session" });
    }
    const { word, sessionId } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: "Missing word to define" });
    }

    // Find current session context
    const userSessions = db.sessions[activeSessionUserId] || [];
    const session = sessionId ? userSessions.find((s) => s.id === sessionId) : null;
    const focus = session ? session.focus : "General Science & Technology";
    const difficulty = session ? session.difficulty : "Intermediate";

    // Build context snippet from last 3 chat messages if available
    let lastMessagesText = "";
    if (session && session.messages) {
      const recentMsgs = session.messages.slice(-3);
      lastMessagesText = recentMsgs.map(m => `${m.sender}: ${m.text}`).join("\n");
    }

    const cleanedWord = word.trim().substring(0, 80); // safety cap

    if (ai && !isGeminiQuotaExceeded) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Define the term "${cleanedWord}" specifically inside the academic context of the study focus: "${focus}".
The current difficulty level is "${difficulty}".
Here are recent messages from the study session to guide your contextual understanding:
${lastMessagesText}

Please explain the meaning of "${cleanedWord}" as it is used in this specific setting. Keep the definition clear, concise (around 2-3 sentences), highly academic, and contextually precise.
Respond in a raw JSON format containing:
{
  "word": "${cleanedWord}",
  "definition": "The definition goes here...",
  "contextApplied": "Brief description of how the definition was adapted to the study session of ${focus}..."
}`,
          config: {
            responseMimeType: "application/json",
          }
        });

        const textOutput = response.text || "";
        const parsed = JSON.parse(textOutput.trim());
        return res.json({
          word: parsed.word || cleanedWord,
          definition: parsed.definition || "Could not define.",
          contextApplied: parsed.contextApplied || `Applied ${focus} context.`
        });
      } catch (geminiErr: any) {
        console.warn("Gemini define failed, falling back to local definition generator:", geminiErr);
      }
    }

    // Offline / Quota Fallback definition
    const localDef = getLocalFallbackDefinition(cleanedWord, focus, difficulty);
    return res.json(localDef);

  } catch (err: any) {
    console.error("Error in /api/study/define:", err);
    res.status(500).json({ error: "Failed to generate definition" });
  }
});

function getLocalFallbackDefinition(word: string, focus: string, difficulty: string) {
  const w = word.toLowerCase();
  let definition = "";
  let contextApplied = `Derived from study topic "${focus}" at ${difficulty} level (Offline Socratic Mode)`;

  if (w.includes("wavefunction") || w.includes("wave function") || w === "ψ") {
    definition = "A mathematical function that describes the quantum state of a particle or system of particles. The square of its absolute value represents the probability density of finding the particle in a given region of space.";
  } else if (w.includes("superposition")) {
    definition = "The principle that a physical system—such as an electron—exists in multiple theoretical states or configurations simultaneously until it is measured or interacts with the external environment.";
  } else if (w.includes("entanglement")) {
    definition = "A quantum mechanical phenomenon where pairs or groups of particles generate or share spatial states such that the quantum state of each particle cannot be described independently of the others, even at infinite distance.";
  } else if (w.includes("operator")) {
    definition = "A mathematical entity (typically a differential or matrix operator) that acts on a physical state or wavefunction to calculate observable physical properties like momentum, energy, or position.";
  } else if (w.includes("eigenstate") || w.includes("eigenvalue")) {
    definition = "A measured quantum state corresponding to a definite, discrete value of a physical observable. When an operator acts on its eigenstate, the result is the state scaled by its corresponding eigenvalue.";
  } else if (w.includes("entropy")) {
    definition = "A thermodynamic or information-theoretic measure of the system's microstate disorder, dispersion, or uncertainty. It defines irreversible energy losses in thermal systems, or information content limits in communication pathways.";
  } else if (w.includes("decay")) {
    definition = "The physical progression of a system where unstable energy states transition to stable, lower-energy configurations over time, often characterized by exponential probability rates.";
  } else if (w.includes("uncertainty") || w.includes("heisenberg")) {
    definition = "The fundamental limit in quantum mechanics asserting that certain pairs of physical properties, such as position and momentum, cannot be simultaneously measured or known with absolute precision.";
  } else if (w.includes("normalization") || w.includes("normalize")) {
    definition = "The process of scaling a wave probability function so that the total integrated probability of finding the particle across all physical coordinates is exactly equal to 1 (100%).";
  } else {
    definition = `A core concept within the domain of ${focus}. It represents a critical theoretical framework used to model system states, calculate transition constraints, and establish boundary parameters at the ${difficulty} level of academic study.`;
  }

  return { word, definition, contextApplied };
}

app.post("/api/study/sessions/create", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const { title, focus, difficulty } = req.body;
  const newSession: StudySession = {
    id: "sess_" + Math.random().toString(36).substr(2, 9),
    title: title || "New Learning Path",
    focus: focus || "General Exploration",
    difficulty: difficulty || "Intermediate",
    bloomLevel: "Understand",
    strategy: "Socratic",
    progress: 5,
    prerequisites: [
      { name: "Foundational Definitions", completed: true },
      { name: "Advanced Analysis", completed: false },
    ],
    outline: ["Core Definition", "Visual Applications", "Mathematical Setup"],
    messages: [
      {
        id: "msg_init",
        sender: "mentor",
        text: `Welcome to your new deep-focus path on "${focus}". I have configured our pedagogical strategy to ${difficulty} level. What specific aspect would you like to explore first?`,
        timestamp: "Now",
      },
    ],
  };

  if (!db.sessions[activeSessionUserId]) {
    db.sessions[activeSessionUserId] = [];
  }
  db.sessions[activeSessionUserId].push(newSession);
  saveDb();
  res.json({ session: { ...newSession, isOfflineSocraticMode: isGeminiQuotaExceeded } });
});

// Clear conversation and reset currentIntent
app.post("/api/study/sessions/clear", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session user" });
  }
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }
  const userSessions = db.sessions[activeSessionUserId] || [];
  const session = userSessions.find((s) => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Reset messages to the initial welcome message, clear cached intent
  session.messages = [
    {
      id: "msg_init",
      sender: "mentor",
      text: `Welcome back to your deep-focus path on "${session.focus}". I have reset our conversation and intent cache. What would you like to explore first?`,
      timestamp: "Now",
    }
  ];
  session.currentIntent = undefined;
  session.progress = 5;

  saveDb();
  res.json({ session: { ...session, isOfflineSocraticMode: isGeminiQuotaExceeded } });
});

// Update current session learning intent manually
app.post("/api/study/sessions/update-intent", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session user" });
  }
  const { sessionId, intent } = req.body;
  if (!sessionId || !intent) {
    return res.status(400).json({ error: "Missing sessionId or intent" });
  }
  const userSessions = db.sessions[activeSessionUserId] || [];
  const session = userSessions.find((s) => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  session.currentIntent = intent === "Not Set" || intent === "Unknown" ? undefined : intent;
  session.manualIntent = intent === "Not Set" || intent === "Unknown" ? undefined : intent;
  saveDb();
  res.json({ session: { ...session, isOfflineSocraticMode: isGeminiQuotaExceeded } });
});

// Finalize Study Session endpoint
app.post("/api/study/sessions/finalize", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session user" });
  }
  const { session } = req.body;
  if (!session || !session.id) {
    return res.status(400).json({ error: "Missing valid session object" });
  }

  if (!db.sessions[activeSessionUserId]) {
    db.sessions[activeSessionUserId] = [];
  }

  const userSessions = db.sessions[activeSessionUserId];
  const existingIdx = userSessions.findIndex((s) => s.id === session.id);

  const finalized = {
    ...session,
    status: "COMPLETED",
    progress: 100,
    lastUpdated: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    userSessions[existingIdx] = finalized;
  } else {
    userSessions.push(finalized);
  }

  saveDb();
  console.log(`[LIFECYCLE] Server finalized and stored session: ${finalized.id} ("${finalized.title}")`);
  res.json({ session: finalized });
});

// Robust JSON Parsing helper to handle unescaped LaTeX backslashes or formatting issues from LLM responses
export function robustParseJson(raw: string): any {
  let clean = raw.trim();
  
  // Strip markdown code fence if present
  if (clean.startsWith("```json")) {
    clean = clean.substring(7);
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3);
  }
  clean = clean.trim();

  // Fix unescaped backslashes (frequent in LaTeX equations, e.g. \hbar, \psi, \frac)
  // We parse character-by-character to correctly escape unescaped backslashes without corrupting existing escapes
  let sanitized = "";
  let i = 0;
  while (i < clean.length) {
    if (clean[i] === "\\") {
      if (i + 1 < clean.length) {
        const next = clean[i + 1];
        if (next === "\\") {
          sanitized += "\\\\";
          i += 2;
          continue;
        }
        if (next === "n" || next === "t" || next === "r" || next === '"' || next === "/") {
          sanitized += "\\" + next;
          i += 2;
          continue;
        }
        if (next === "u" && i + 5 < clean.length) {
          const isUnicode = /^[0-9a-fA-F]{4}$/.test(clean.substring(i + 2, i + 6));
          if (isUnicode) {
            sanitized += "\\u" + clean.substring(i + 2, i + 6);
            i += 6;
            continue;
          }
        }
        sanitized += "\\\\";
        i += 1;
      } else {
        sanitized += "\\\\";
        i += 1;
      }
    } else {
      sanitized += clean[i];
      i += 1;
    }
  }

  try {
    return JSON.parse(sanitized);
  } catch (err) {
    console.warn("Standard and sanitized JSON parsing failed, attempting fuzzy/regex extraction...", err);
    
    // Fuzzy Regex parser to extract key components if JSON remains deformed
    const explanationMatch = sanitized.match(/"explanation"\s*:\s*"([\s\S]*?)"(?=\s*,|\s*})/);
    const equationMatch = sanitized.match(/"equation"\s*:\s*"([\s\S]*?)"(?=\s*,|\s*})/);
    
    let explanation = "";
    if (explanationMatch) {
      explanation = explanationMatch[1];
    } else {
      explanation = raw;
    }
    
    // Unescape the explanation string basic escapes
    explanation = explanation
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    let equation: string | undefined = undefined;
    if (equationMatch) {
      equation = equationMatch[1].replace(/\\\\/g, "\\");
    }

    // Extract autoNotes
    const autoNotes: Array<{ key: string; val: string }> = [];
    const notesRegex = /\{\s*"key"\s*:\s*"([\s\S]*?)"\s*,\s*"val"\s*:\s*"([\s\S]*?)"\s*\}/g;
    let match;
    while ((match = notesRegex.exec(sanitized)) !== null) {
      autoNotes.push({
        key: match[1].replace(/\\\\/g, "\\"),
        val: match[2].replace(/\\\\/g, "\\")
      });
    }

    // Extract practiceQuestion
    const pqMatch = sanitized.match(/"practiceQuestion"\s*:\s*"([\s\S]*?)"(?=\s*,|\s*})/);
    const practiceQuestion = pqMatch ? pqMatch[1].replace(/\\\\/g, "\\") : undefined;

    // Extract reflectionQuestions
    const reflectionQuestions: string[] = [];
    const refMatch = sanitized.match(/"reflectionQuestions"\s*:\s*\[([\s\S]*?)\]/);
    if (refMatch) {
      const itemsRegex = /"([\s\S]*?)"/g;
      let itemMatch;
      while ((itemMatch = itemsRegex.exec(refMatch[1])) !== null) {
        reflectionQuestions.push(itemMatch[1].replace(/\\\\/g, "\\"));
      }
    }

    // Extract suggestedFlashcards
    const suggestedFlashcards: Array<{ front: string; back: string }> = [];
    const fcRegex = /\{\s*"front"\s*:\s*"([\s\S]*?)"\s*,\s*"back"\s*:\s*"([\s\S]*?)"\s*\}/g;
    while ((match = fcRegex.exec(sanitized)) !== null) {
      suggestedFlashcards.push({
        front: match[1].replace(/\\\\/g, "\\"),
        back: match[2].replace(/\\\\/g, "\\")
      });
    }

    // Extract pictureMemoryTest
    let pictureMemoryTest: any = undefined;
    const pmtMatch = sanitized.match(/"pictureMemoryTest"\s*:\s*(\{[\s\S]*?\})/);
    if (pmtMatch) {
      try {
        pictureMemoryTest = JSON.parse(pmtMatch[1]);
      } catch (e) {
        const qMatch = pmtMatch[1].match(/"question"\s*:\s*"([\s\S]*?)"/);
        if (qMatch) {
          pictureMemoryTest = {
            question: qMatch[1].replace(/\\\\/g, "\\"),
            options: ["A", "B", "C", "D"],
            correctOptionIdx: 0,
            explanationOfCorrectAnswer: "Recall the detail from the text."
          };
        }
      }
    }

    return {
      explanation: explanation || "No explanation parsed.",
      equation,
      autoNotes,
      practiceQuestion,
      reflectionQuestions,
      suggestedFlashcards,
      pictureMemoryTest
    };
  }
}

// ENDPOINT FOR EDUCATIONAL CONTEXT ENGINE (ECE) CONTEXT ASSEMBLY
app.post("/api/study/enhance-prompt", async (req, res) => {
  try {
    if (!activeSessionUserId) {
      return res.status(401).json({ error: "No active session user" });
    }
    const { originalPrompt, topic, sessionId } = req.body;
    if (!originalPrompt) {
      return res.status(400).json({ error: "Missing originalPrompt" });
    }

    const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userSessions = db.sessions[activeSessionUserId] || [];
    const session = sessionId ? userSessions.find((s) => s.id === sessionId) : null;

    // Execute Educational Context Engine (ECE) Middleware
    ensureKnowledgeGraph(user);
    const provider = user.preferences?.selectedProvider || "Gemini 3.5 Flash";
    const mode = session?.manualIntent ? `${session.manualIntent} Mode` : "Study Mode";

    const ecePacket = EducationalContextEngine.process({
      originalPrompt: originalPrompt.trim(),
      user,
      sessionFocus: topic || session?.focus || "General Discipline",
      provider,
      mode,
      knowledgeGraph: user.knowledgeGraph,
    });

    const isConversational = ecePacket.analysis.isCasual;

    const studentContext = buildStudentContext(user, topic || session?.focus || "General Discipline");
    const intentData = detectIntent(originalPrompt);
    const learningIntentData = { intent: "Study" as const, confidence: 0.95, reasoning: "Study mode active" };
    const coachResult = coachPrompt(originalPrompt, studentContext, intentData, learningIntentData);

    const enhancedPrompt = isConversational ? originalPrompt : (coachResult.enhanced || originalPrompt);

    return res.json({
      originalPrompt: ecePacket.originalPrompt,
      enhancedPrompt: enhancedPrompt,
      contextPacket: ecePacket.composedSystemPrompt,
      summary: ecePacket.summary,
      ecePacket: ecePacket,
      isConversational,
      learningIntent: {
        intent: ecePacket.analysis.category,
        confidence: ecePacket.analysis.confidence,
        reasoning: `Categorized as ${ecePacket.analysis.category} in discipline ${ecePacket.analysis.subject}`
      },
      pipelineRouting: {
        pipelineId: isConversational ? "casual" : "study",
        reason: `Processed by Educational Context Engine for ${ecePacket.analysis.subject}`
      }
    });
  } catch (err: any) {
    console.error("Unhandled error in /api/study/enhance-prompt:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PROPRIETARY EDUCATIONAL INTELLIGENCE LAYER (AI STUDYSESSION CHAT WITH GEMINI)
app.post("/api/study/chat", async (req, res) => {
  try {
    if (!activeSessionUserId) {
      return res.status(401).json({ error: "No active session" });
    }
  const { sessionId, messageText, isConversational } = req.body;
  if (!sessionId || !messageText) {
    return res.status(400).json({ error: "Missing sessionId or messageText" });
  }

  let user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  
  if (!user && activeSessionUserId) {
    console.warn("User not found in local db, attempting to fallback build a user for session", activeSessionUserId);
    user = {
      id: activeSessionUserId,
      email: "unknown@example.com",
      fullName: "Guest Student",
      country: "United States",
      university: "Unknown",
      faculty: "Sciences",
      department: "Physics",
      academicLevel: "Undergraduate",
      preferredLanguage: "English",
      learningStyle: "Visual",
      weeklyCommitment: "5-10",
      learningObjectives: "",
      masteryProgress: 0,
      learningStreak: 1,
      cardsMastered: 0,
      totalCards: 0,
      preferences: {
        theme: "obsidian",
        accentColor: "indigo",
        fontSize: "medium",
        teachingStyle: "Socratic",
        cognitiveLoad: "Master",
        selectedProvider: "gemini-3.5-flash",
        selectedModel: "gemini-3.1-flash-lite",
      },
      providers: []
    } as any;
    db.users["unknown_" + activeSessionUserId] = user;
  }

  const userSessions = db.sessions[activeSessionUserId] || [];
  let session = userSessions.find((s) => s.id === sessionId);

  if (!session && user) {
    session = {
      id: sessionId,
      title: "Recovered Session",
      focus: "General",
      difficulty: "Intermediate",
      bloomLevel: "Understand",
      strategy: "Socratic",
      progress: 0,
      prerequisites: [],
      outline: [],
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "ACTIVE",
    } as any;
    if (!db.sessions[activeSessionUserId]) db.sessions[activeSessionUserId] = [];
    db.sessions[activeSessionUserId].push(session);
  }

  if (!session || !user) {
    return res.status(404).json({ error: "Session or user not found" });
  }

  // --- ARCHITECTURAL REFACTOR: LEARNING INTENT ENGINE & PIPELINE ROUTING ---
  // The Learning Intent Engine is the FIRST engine to execute after a prompt is received.
  let learningIntent;
  let routedPipeline;

  if (session.manualIntent && session.manualIntent !== "Unknown") {
    learningIntent = {
      intent: session.manualIntent,
      confidence: 1.0,
      explanation: "Bypassed classifier. Student's manual choice always wins."
    };
    routedPipeline = PipelineRouter.route(learningIntent);
    console.log(`[SESSION MEMORY ENGINE] Bypassed classifier. Using manual override: "${session.manualIntent}" in chat`);
  } else if (session.currentIntent && session.currentIntent !== "Unknown") {
    learningIntent = {
      intent: session.currentIntent,
      confidence: 1.0,
      explanation: "Reusing active session context memory intent."
    };
    routedPipeline = PipelineRouter.route(learningIntent);
    console.log(`[SESSION MEMORY ENGINE] Reusing existing session intent: "${session.currentIntent}" in chat`);
  } else {
    const intentEngine = new LearningIntentEngine(ai);
    learningIntent = await intentEngine.classify(messageText);
    routedPipeline = PipelineRouter.route(learningIntent);
    session.currentIntent = learningIntent.intent;
    saveDb();
    console.log(`[LEARNING INTENT ENGINE] Prompt classified and stored in session memory: "${messageText}" -> Intent: ${learningIntent.intent} (Confidence: ${learningIntent.confidence})`);
  }

  console.log(`[PIPELINE ROUTER] Selected Pipeline in chat: ${routedPipeline.pipelineId}. Reason: ${routedPipeline.reason}`);

  // Ensure user's Knowledge Graph is initialized & updated
  ensureKnowledgeGraph(user);
  let personalizationDirective = "";
  if (learningIntent.intent === "Study") {
    user.knowledgeGraph = applyKnowledgeDecay(user.knowledgeGraph, 0.1);
    user.knowledgeGraph = triggerRepeatedTopicVisits(user.knowledgeGraph, session.focus);
    personalizationDirective = getPersonalizationDirective(user.knowledgeGraph, session.focus);
  }

  // Log user message
  const studentMsg: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substr(2, 9),
    sender: "student",
    text: messageText,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  session.messages.push(studentMsg);

  // EXECUTE MENTORLAYER LEARNING PROTOCOL (STAGES 1 - 6)
  const protocolState = orchestrateProtocolTurn(messageText, user, session.focus, undefined, undefined, learningIntent, routedPipeline);

  // Default fallback text if Gemini is not set up
  let finalMentorText = "I have recorded your prompt. To enable the live Educational Intelligence Layer, configure your Gemini API Key in the Settings secrets.";
  let equation: string | undefined = undefined;
  let autoNotes: Array<{ key: string; val: string }> = [];
  let progressiveParts: Array<{ title: string; content: string }> | undefined = undefined;
  let practiceQuestion: string | undefined = undefined;
  let reflectionQuestions: string[] = [];
  let suggestedFlashcards: Array<{ front: string; back: string }> = [];
  let pictureMemoryTest: any = undefined;

  // If the API key is completely missing, explicitly throw a configuration error.
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ 
      error: "Configuration Error: GEMINI_API_KEY environment variable is missing. Please configure it in the platform settings to enable AI features." 
    });
  }

  // Call Gemini API using our dynamically composed, optimized enhanced prompt (Prompt Coach Stage)
  if (ai) {
    try {
      const forceConvo = !!isConversational || learningIntent.intent !== "Study";
      const convoPromptAddon = forceConvo ? "\n\nCRITICAL DIRECTIVE: The user's input has been flagged as a conversational greeting or remark. You MUST respond conversationally, naturally, and warmly. Do not generate flashcards, practice questions, or equations." : "";

      const systemInstructions = `
You are the proprietary "Educational Intelligence Layer" of Epselon (AI-Powered Learning Operating System).
You are currently powered by the student's selected engine: "${protocolState.routing?.providerId} - ${protocolState.routing?.model}".
The student is studying: "${session.focus}" (${session.title}).
The current difficulty is set to: "${session.difficulty}".

CORE PEDAGOGICAL INSTRUCTIONS:
- Teaching style preference: "${protocolState.pedagogy?.style}".
- Cognitive load level: "${protocolState.studentContext?.cognitiveLoad}".
- Bloom's Taxonomy Focus: "${protocolState.pedagogy?.bloomLevel}".
- Context Alignment: "${protocolState.curriculum?.contextSnippet}".

PERSONALIZATION / COGNITIVE MASTERY CONTEXT (KNOWLEDGE GRAPH ENGINE):
${personalizationDirective}

INJECTED CONSTRAINTS:
${protocolState.pedagogy?.scaffoldingRules.map((rule, idx) => `${idx + 1}. ${rule}`).join("\n")}

Your objective is to provide an incredibly academic, professional, and structured learning experience, UNLESS the user is just greeting you or making small talk.${convoPromptAddon}

CRITICAL PERFORMANCE OPTIMIZATION: Keep ALL text fields (explanation, progressive parts, questions, analogies, case studies, etc.) EXTREMELY short and concise (1-2 sentences maximum per field). This is absolutely necessary to ensure rapid API response times during live interactions.
- If the user's latest input is conversational (e.g., "hi", "hello", "how are you", "thanks", "I'm ready"), respond naturally, conversationally, and warmly. Do not generate flashcards, practice questions, or equations.
- If the user's input is educational/topical:
  - If Socratic teaching style is requested: respond with disciplines, Socratic questions, guiding them to answers instead of handing them out instantly.
  - Always separate out complex equations into an elegant single mathematical string (e.g., Schrödinger or Matrix formulas) in LaTeX format (use LaTeX format without wrapping in double dollar signs, e.g. "i\\hbar \\frac{\\partial\\Psi}{\\partial t} = \\hat{H}\\Psi" or "A v = \\lambda v").
  - Provide exactly 5 structured progressive parts in the "progressiveParts" array representing a step-by-step learning journey for this educational topic. The 5 parts must be:
    1. "Core Concept & Definition" (foundational definition and clear introduction)
    2. "Detailed Breakdown & Analysis" (detailed academic derivations, equations, or scientific breakdown)
    3. "Intuitive Analogy & Mental Model" (relatable everyday analogy or intuitive comparison)
    4. "Practical Application Case Study" (practical real-world case study or system application relevant to Africa, local context, or regional infrastructure based on the student's background/interests)
    5. "Common Misconceptions & Traps" (1-2 common mistakes or conceptual traps students make on this topic and how to correct them)
  - Extract 1-3 concise "Auto-Notes" or "Key Terms" as metadata.
  - Provide exactly 1 targeted practice quiz question and 2 deep reflection questions to prompt conceptual thinking.
  - Suggest 2 high-quality flashcards (front/back format) for their recall library.
  - Provide exactly 1 highly detailed "pictureMemoryTest" which tests the student's instant recall of specific visual, factual, or quantitative details in the explanation you are providing in this response. It acts as a small test to help the student develop picture memory and instantly recall what they just read on screen.
${forceConvo ? "" : `
Return your response strictly in the following JSON schema format:
{
  "explanation": "your complete pedagogical or conversational response text here (can contain markdown)",
  "progressiveParts": [
    { "title": "Core Concept & Definition", "content": "foundational definition and introduction text..." },
    { "title": "Detailed Breakdown & Analysis", "content": "detailed explanation, derivations, or technical breakdown..." },
    { "title": "Intuitive Analogy & Mental Model", "content": "relatable analogy or everyday comparison..." },
    { "title": "Practical Application Case Study", "content": "practical real-world case study or system application..." },
    { "title": "Common Misconceptions & Traps", "content": "what students get wrong and how to think about it correctly..." }
  ],
  "equation": "an elegant formula string in LaTeX format (optional)",
  "autoNotes": [
    { "key": "Key Term or Equation", "val": "brief definition or explanation" }
  ],
  "practiceQuestion": "a single testing question or practical challenge checking their comprehension",
  "reflectionQuestions": [
    "deep conceptual checkpoint question 1?",
    "deep conceptual checkpoint question 2?"
  ],
  "suggestedFlashcards": [
    { "front": "question or term to recall", "back": "precise definition or concise answer" }
  ],
  "pictureMemoryTest": {
    "question": "A visual details or key term recall question from the explanation above to test picture memory",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIdx": 0,
    "explanationOfCorrectAnswer": "Brief explanation of why this is correct based on the text."
  }
}
`}
`;

      // Build conversation history in Gemini contents format
      const contents = [];
      const len = session.messages.length;
      for (let i = 0; i < len; i++) {
        const msg = session.messages[i];
        if (msg.sender === "student") {
          const text = (i === len - 1) ? (protocolState.coach?.enhanced || msg.text) : msg.text;
          contents.push({
            role: "user",
            parts: [{ text }]
          });
        } else {
          contents.push({
            role: "model",
            parts: [{ text: msg.text }]
          });
        }
      }

      // Add system instructions prefixed to the first user turn
      if (contents.length > 0) {
        contents[0].parts[0].text = `${systemInstructions}\n\n${contents[0].parts[0].text}`;
      }

      const response = await generateContentWithFallback(ai, {
        model: protocolState.routing?.model || "gemini-3.1-flash-lite",
        contents: contents,
        config: forceConvo ? undefined : {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text;
      if (responseText) {
        if (forceConvo) {
           finalMentorText = responseText;
        } else {
           const result = robustParseJson(responseText);
           finalMentorText = result.explanation;
           equation = result.equation;
           autoNotes = result.autoNotes || [];
           progressiveParts = result.progressiveParts || [];
           practiceQuestion = result.practiceQuestion;
           reflectionQuestions = result.reflectionQuestions || [];
           suggestedFlashcards = result.suggestedFlashcards || [];
           pictureMemoryTest = result.pictureMemoryTest;
        }
      }
    } catch (apiErr) {
      console.error("Gemini API call failed, reverting to local intelligent proxy:", apiErr);
      
      // Premium Local Socratic Proxy supporting full protocol
      if (learningIntent.intent !== "Study") {
        finalMentorText = `I hear you on that! Let me know how I can help with your learning of "${session.focus}" or if you want to explore something else.`;
        equation = undefined;
        autoNotes = [];
        progressiveParts = undefined;
        practiceQuestion = undefined;
        reflectionQuestions = [];
        suggestedFlashcards = [];
        pictureMemoryTest = undefined;
      } else if (messageText.toLowerCase().includes("wave") || messageText.toLowerCase().includes("quantum")) {
        finalMentorText = "To understand wavefunctions, let's explore: if |Ψ|² describes the probability of finding a particle, why does the superposition collapse upon observation? What does this imply about the role of the measurement apparatus?";
        equation = "\\int_{-\\infty}^{\\infty} |\\Psi(x)|^2 dx = 1";
        autoNotes = [
          { key: "Wavefunction Normalization", val: "The total probability of finding the particle in all space is exactly 1." },
          { key: "Quantum Superposition", val: "A system remains in a linear combination of states until observed." }
        ];
        progressiveParts = [
          { title: "Core Concept & Definition", content: "A wavefunction (represented by the Greek letter Psi, Ψ) is a mathematical description of the quantum state of an isolated physical system. According to the Born rule, |Ψ|² describes the probability density of finding a particle in a given region." },
          { title: "Detailed Breakdown & Analysis", content: "The wavefunction evolves according to the Schrödinger equation. For a particle in an infinite potential well, the acceptable wavefunction states must be single-valued, continuous, and normalizable, which enforces quantized energy states." },
          { title: "Intuitive Analogy & Mental Model", content: "Think of a wavefunction like a vibrating guitar string. The string is vibrating across the entire length simultaneously, but when you press your finger on it (observation/collapse), it is held at one specific, discrete point." },
          { title: "Practical Application Case Study", content: "In Southern Africa, research at the National Laser Centre and local university physics departments is exploring quantum cryptography and quantum-dot solar cell technologies to establish highly secure communication grids and next-generation power infrastructure." },
          { title: "Common Misconceptions & Traps", content: "A common mistake is thinking the wavefunction represents a physical 'smear' or physical cloud of a broken-up particle. It is actually a probability amplitude — the particle itself is always a point-like entity when detected, not a physical wave." }
        ];
        practiceQuestion = "Can you describe the physical difference between an eigenvalue and an expectation value?";
        reflectionQuestions = [
          "What criteria must a wave function satisfy to be physically acceptable?",
          "How does the concept of boundary conditions apply to a particle in a one-dimensional infinite potential well?"
        ];
        suggestedFlashcards = [
          { front: "What is Born's statistical interpretation of the wavefunction?", back: "The probability density of finding a particle is proportional to the square of its wavefunction's amplitude." },
          { front: "What is a normalized wavefunction?", back: "A wavefunction whose integral of square magnitude over all space equals 1, representing certain existence." }
        ];
        pictureMemoryTest = {
          question: "Which Greek letter is used to represent the wavefunction in Born's interpretation?",
          options: ["Alpha (α)", "Beta (β)", "Psi (Ψ)", "Omega (Ω)"],
          correctOptionIdx: 2,
          explanationOfCorrectAnswer: "Psi (Ψ) is the standard Greek letter representing the quantum mechanical wavefunction."
        };
      } else {
        finalMentorText = `Excellent query in mechanics. Let's analyze the core axioms of ${session.focus}. How do you hypothesize this relationship scales under high thermal dissipation?`;
        equation = "E = mc^2";
        autoNotes = [
          { key: "Energy-Mass Equivalence", val: "Relating relativistic rest mass with scalar energy density." }
        ];
        progressiveParts = [
          { title: "Core Concept & Definition", content: "This topic deals with the foundational axioms and structural frameworks governing physical energy, vector states, or computational systems. The starting point is identifying the boundaries and conservations of the system." },
          { title: "Detailed Breakdown & Analysis", content: "The mathematical relationships can be derived from first principles. Here we analyze scalar fields, potential gradients, and thermal dissipations to establish the system equations." },
          { title: "Intuitive Analogy & Mental Model", content: "Imagine a flow of water down a riverbed. Silt and pebbles create obstacles (resistance), while the elevation change represents the potential energy driving the flow (potential gradient)." },
          { title: "Practical Application Case Study", content: "In Africa, these mechanics are applied in civil engineering works such as gravity-fed clean water pipelines, rural micro-grids, and heat-exchanger setups for sustainable community agriculture." },
          { title: "Common Misconceptions & Traps", content: "A major misconception is that potential and kinetic energies are independent. In reality, they are strictly coupled through conservative forces, and non-conservative forces like friction constantly bleed energy into thermal states." }
        ];
        practiceQuestion = "Does a system's inertia increase or decrease when it releases energy as heat?";
        reflectionQuestions = [
          "Why is conservation of energy considered an absolute physical invariance?",
          "How does this equivalence support the nuclear fusion processes observeding observed in stars?"
        ];
        suggestedFlashcards = [
          { front: "State Einstein's energy-mass equivalence equation.", back: "E = mc^2, where c is the speed of light in a vacuum." }
        ];
        pictureMemoryTest = {
          question: "What physical constant represents 'c' in Einstein's energy-mass equivalence equation?",
          options: ["Planck's constant", "Speed of light in vacuum", "Gravitational constant", "Boltzmann constant"],
          correctOptionIdx: 1,
          explanationOfCorrectAnswer: "The constant 'c' represents the speed of light in vacuum."
        };
      }
    }
  } else {
    // Local fallback response supporting full protocol
    if (learningIntent.intent !== "Study") {
      finalMentorText = `I hear you on that! Let me know how I can help with your learning of "${session.focus}" or if you want to explore something else.`;
      equation = undefined;
      autoNotes = [];
      progressiveParts = undefined;
      practiceQuestion = undefined;
      reflectionQuestions = [];
      suggestedFlashcards = [];
      pictureMemoryTest = undefined;
    } else if (messageText.toLowerCase().includes("wave") || messageText.toLowerCase().includes("quantum")) {
      finalMentorText = "Wavefunction collapse is one of the most intriguing aspects of quantum mechanics. Let's look at the Schrödinger Equation. If the wave function propagates deterministically, why is the measurement probabilistic? Think about the role of physical constraints.";
      equation = "i\\hbar \\frac{\\partial\\Psi}{\\partial t} = \\hat{H}\\Psi";
      autoNotes = [
        { key: "Schrödinger Equation", val: "Describes the dynamic evolution of a non-relativistic wave function." },
        { key: "Born Rule", val: "Identifies state amplitude squares directly with probability distribution density." }
      ];
      progressiveParts = [
        { title: "Core Concept & Definition", content: "A wavefunction (represented by the Greek letter Psi, Ψ) is a mathematical description of the quantum state of an isolated physical system. According to the Born rule, |Ψ|² describes the probability density of finding a particle in a given region." },
        { title: "Detailed Breakdown & Analysis", content: "The wavefunction evolves according to the Schrödinger equation. For a particle in an infinite potential well, the acceptable wavefunction states must be single-valued, continuous, and normalizable, which enforces quantized energy states." },
        { title: "Intuitive Analogy & Mental Model", content: "Think of a wavefunction like a vibrating guitar string. The string is vibrating across the entire length simultaneously, but when you press your finger on it (observation/collapse), it is held at one specific, discrete point." },
        { title: "Practical Application Case Study", content: "In Southern Africa, research at the National Laser Centre and local university physics departments is exploring quantum cryptography and quantum-dot solar cell technologies to establish highly secure communication grids and next-generation power infrastructure." },
        { title: "Common Misconceptions & Traps", content: "A common mistake is thinking the wavefunction represents a physical 'smear' or physical cloud of a broken-up particle. It is actually a probability amplitude — the particle itself is always a point-like entity when detected, not a physical wave." }
      ];
      practiceQuestion = "What physical property ensures that probability is conserved over time in Schrödinger's equation?";
      reflectionQuestions = [
        "How does the Copenhagen interpretation handle the role of the conscious observer?",
        "What is the mathematical definition of a Hermitian operator, and why is it essential for physical observables?"
      ];
      suggestedFlashcards = [
        { front: "What does the Hamiltonian operator represent?", back: "The operator corresponding to the total energy of the physical system." }
      ];
      pictureMemoryTest = {
        question: "Which dynamic equation describes the time-evolution of a non-relativistic wave function?",
        options: ["Maxwell Equation", "Schrödinger Equation", "Newton Second Law", "Dirac Equation"],
        correctOptionIdx: 1,
        explanationOfCorrectAnswer: "Schrödinger Equation is the fundamental equation for wavefunction time-evolution in quantum mechanics."
      };
    } else {
      finalMentorText = `Let us study the concepts of "${session.focus}" deeply. What are the classical prerequisites that govern this state? Let's analyze its core mathematical constraints.`;
      equation = "\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}";
      autoNotes = [
        { key: "Maxwell-Ampere Law", val: "Relating time-varying electric flux with induced vector magnetic fields." }
      ];
      progressiveParts = [
        { title: "Core Concept & Definition", content: "This topic deals with the foundational axioms and structural frameworks governing physical energy, vector states, or computational systems. The starting point is identifying the boundaries and conservations of the system." },
        { title: "Detailed Breakdown & Analysis", content: "The mathematical relationships can be derived from first principles. Here we analyze scalar fields, potential gradients, and thermal dissipations to establish the system equations." },
        { title: "Intuitive Analogy & Mental Model", content: "Imagine a flow of water down a riverbed. Silt and pebbles create obstacles (resistance), while the elevation change represents the potential energy driving the flow (potential gradient)." },
        { title: "Practical Application Case Study", content: "In Africa, these mechanics are applied in civil engineering works such as gravity-fed clean water pipelines, rural micro-grids, and heat-exchanger setups for sustainable community agriculture." },
        { title: "Common Misconceptions & Traps", content: "A major misconception is that potential and kinetic energies are independent. In reality, they are strictly coupled through conservative forces, and non-conservative forces like friction constantly bleed energy into thermal states." }
      ];
      practiceQuestion = "Why did Maxwell introduce the displacement current term, and what symmetry did it complete?";
      reflectionQuestions = [
        "How do electromagnetic waves propagate in a vacuum without any medium?",
        "How does Faraday's law of induction complement the Maxwell-Ampere relationship?"
      ];
      suggestedFlashcards = [
        { front: "What is displacement current?", back: "A quantity appearing in Maxwell's equations defined in terms of the rate of change of electric displacement field." }
      ];
      pictureMemoryTest = {
        question: "Which physicist completed Ampere's Law by introducing the displacement current term?",
        options: ["Michael Faraday", "James Clerk Maxwell", "Heinrich Hertz", "Albert Einstein"],
        correctOptionIdx: 1,
        explanationOfCorrectAnswer: "James Clerk Maxwell introduced the displacement current term to complete Maxwell's equations."
      };
    }
  }

  // Create mentor message storing the entire Learning Protocol Engine Trace!
  const mentorMsg: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substr(2, 9),
    sender: "mentor",
    text: finalMentorText,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    equation,
    autoNotes,
    progressiveParts,
    protocolTrace: {
      intent: protocolState.intent,
      learningIntent: protocolState.learningIntent,
      pipelineRouting: protocolState.pipelineRouting,
      routing: protocolState.routing,
      pedagogy: protocolState.pedagogy,
      coach: protocolState.coach,
      curriculum: {
        contextSnippet: protocolState.curriculum?.contextSnippet || "",
        localExamples: protocolState.curriculum?.localExamples || []
      },
      practiceQuestion,
      reflectionQuestions,
      suggestedFlashcards,
      pictureMemoryTest
    }
  };
  session.messages.push(mentorMsg);

  // Update session progress slightly on interaction
  const oldProgress = session.progress;
  if (learningIntent.intent === "Study") {
    session.progress = Math.min(session.progress + 4, 100);
    if (session.progress >= 95) {
      user.masteryProgress = Math.min(user.masteryProgress + 2, 100);
    }

    // --- KNOWLEDGE GRAPH AUTO-UPDATE ENGINE ACTIONS ---
    const lowercaseMsg = messageText.toLowerCase();

    // Prerequisite struggle or mistake detection (Trigger #8)
    const indicatesStruggle = lowercaseMsg.includes("stuck") || 
                               lowercaseMsg.includes("confused") || 
                               lowercaseMsg.includes("don't understand") || 
                               lowercaseMsg.includes("dont understand") || 
                               lowercaseMsg.includes("hard") || 
                               lowercaseMsg.includes("fail") || 
                               lowercaseMsg.includes("mistake") || 
                               lowercaseMsg.includes("struggle") || 
                               lowercaseMsg.includes("incorrect");
                               
    if (indicatesStruggle) {
      user.knowledgeGraph = triggerRepeatedMistakes(user.knowledgeGraph, session.focus);
    } else {
      // If it is a practice session / explanation and is positive, trigger successful explanation or practice session (Trigger #5 / #7)
      const isDetailedAnswer = messageText.length > 30 && (lowercaseMsg.includes("because") || lowercaseMsg.includes("therefore") || lowercaseMsg.includes("proves") || lowercaseMsg.includes("equals"));
      if (isDetailedAnswer) {
        user.knowledgeGraph = triggerSuccessfulExplanation(user.knowledgeGraph, session.focus);
      } else {
        user.knowledgeGraph = triggerPracticeSession(user.knowledgeGraph, session.focus, 80);
      }
    }

    // Quiz completion detection (Trigger #3)
    const isQuizAnswer = lowercaseMsg.startsWith("answer:") || lowercaseMsg.startsWith("a:") || lowercaseMsg.startsWith("b:") || lowercaseMsg.startsWith("c:") || lowercaseMsg.startsWith("d:") || lowercaseMsg.match(/^[a-d]$/);
    if (isQuizAnswer) {
      const isCorrectSimulation = Math.random() > 0.3; // simulate checking correctness
      user.knowledgeGraph = triggerQuizCompletion(user.knowledgeGraph, session.focus, isCorrectSimulation);
    }

    // Trigger Lesson Completion if transitioned to 100% (Trigger #1)
    if (oldProgress < 100 && session.progress === 100) {
      user.knowledgeGraph = triggerLessonCompletion(user.knowledgeGraph, session.focus);
    }

    // Trigger Knowledge Object Extraction and Enrichment
    user.knowledgeGraph = extractAndEnrichKnowledge(
      user.knowledgeGraph,
      session.focus,
      finalMentorText,
      session.id,
      user.department || "General Science"
    );

    // Auto-sync Flashcards to Leitner collections if concept changed or triggers detected
    const flashcardTriggers = detectFlashcardTriggers(user.knowledgeGraph);
    if (flashcardTriggers && flashcardTriggers.length > 0) {
      flashcardTriggers.forEach(trig => {
        const collectionId = "coll_" + trig.conceptLabel.toLowerCase().replace(/\s+/g, "_");
        if (!db.collections[activeSessionUserId!]) {
          db.collections[activeSessionUserId!] = [];
        }
        let coll = db.collections[activeSessionUserId!].find(c => c.id === collectionId);
        if (!coll) {
          coll = {
            id: collectionId,
            name: `Recall Deck: ${trig.conceptLabel}`,
            totalCards: 0,
            dueTodayCount: 0,
            masteryPercentage: 0,
            icon: "BookOpen"
          };
          db.collections[activeSessionUserId!].push(coll);
        }

        if (!db.flashcards[activeSessionUserId!]) {
          db.flashcards[activeSessionUserId!] = [];
        }
        const cards = db.flashcards[activeSessionUserId!];
        const exists = cards.some(c => c.front === trig.front);
        if (!exists) {
          const newCard = {
            id: "fc_auto_" + Math.random().toString(36).substr(2, 9),
            collectionId,
            front: trig.front,
            back: trig.back,
            difficulty: "easy" as const,
            box: 1
          };
          cards.push(newCard);
          coll.totalCards += 1;
          coll.dueTodayCount += 1;
          user.totalCards = (user.totalCards || 0) + 1;
        }
      });
    }
  }

  saveDb();
  res.json({ session: { ...session, isOfflineSocraticMode: isGeminiQuotaExceeded } });
  } catch (err: any) {
    console.error("Unhandled error in /api/study/chat:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/study/reflection", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const { sessionId, topic, answers } = req.body;
  const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  const userSessions = db.sessions[activeSessionUserId] || [];
  const session = userSessions.find((s) => s.id === sessionId);

  if (!user || !session) {
    return res.status(404).json({ error: "Session or user not found" });
  }

  // 1. Mastery Engine
  const prevMastery = user.masteryProgress;
  user.masteryProgress = Math.min(user.masteryProgress + 5, 100);

  // 2. Knowledge Graph Engine & Reinforcement Engine
  const collectionId = "coll_" + topic.toLowerCase().replace(/\s+/g, "_");
  
  if (!db.collections[activeSessionUserId]) {
    db.collections[activeSessionUserId] = [];
  }
  let coll = db.collections[activeSessionUserId].find(c => c.id === collectionId);
  if (!coll) {
    coll = {
      id: collectionId,
      name: `Recall Deck: ${topic}`,
      totalCards: 0,
      dueTodayCount: 0,
      masteryPercentage: 0,
      icon: "BookOpen"
    };
    db.collections[activeSessionUserId].push(coll);
  }

  const newCards: Flashcard[] = [
    {
      id: "fc_ref_" + Math.random().toString(36).substr(2, 9),
      collectionId,
      front: `How does the core mechanical principle of ${topic} operate?`,
      back: `Based on your reflection, it represents the primary structural constraint and dynamic equilibrium of the system.`,
      difficulty: "easy",
      box: 1
    },
    {
      id: "fc_ref_" + Math.random().toString(36).substr(2, 9),
      collectionId,
      front: `What is a critical boundary condition for ${topic}?`,
      back: `The dynamic equilibrium boundary, where system feedback loops maintain stable state trajectories.`,
      difficulty: "easy",
      box: 1
    },
    {
      id: "fc_ref_" + Math.random().toString(36).substr(2, 9),
      collectionId,
      front: `Provide a real-world regional example illustrating ${topic}.`,
      back: `Typically seen in optimized physical, economic, or natural systems such as microgrids or supply chains.`,
      difficulty: "easy",
      box: 1
    },
    {
      id: "fc_ref_" + Math.random().toString(36).substr(2, 9),
      collectionId,
      front: `Why is active recall and reflection essential for mastering ${topic}?`,
      back: `It prevents simple passive reading, transforming raw data into lasting neural cognitive pathways.`,
      difficulty: "easy",
      box: 1
    }
  ];

  if (!db.flashcards[activeSessionUserId]) {
    db.flashcards[activeSessionUserId] = [];
  }

  const existingFronts = new Set(db.flashcards[activeSessionUserId].map(c => c.front.trim().toLowerCase()));
  const uniqueNewCards = newCards.filter(c => !existingFronts.has(c.front.trim().toLowerCase()));

  if (uniqueNewCards.length > 0) {
    db.flashcards[activeSessionUserId].push(...uniqueNewCards);
    coll.totalCards += uniqueNewCards.length;
    coll.dueTodayCount += uniqueNewCards.length;
    user.totalCards += uniqueNewCards.length;
  }

  // 2.5 Knowledge Graph Engine Auto-Update (Stage 9)
  ensureKnowledgeGraph(user);
  user.knowledgeGraph = triggerReflectionCompletion(user.knowledgeGraph, topic, 85);

  // 3. Learning Passport Engine
  user.learningStreak = Math.min(user.learningStreak + 1, 365);
  
  // 4. Update session progress to 100%
  session.progress = 100;

  // 5. Append system confirmation message
  const systemMsg: ChatMessage = {
    id: "msg_system_ref_" + Math.random().toString(36).substr(2, 9),
    sender: "mentor",
    text: `### 🛂 Learning Passport Milestone Completed: Reflection Gateway\n\nExcellent work completing the active conceptual reflection for **${topic}**. \n\nI have automatically routed your diagnostic responses to the **Mastery Engine** (+5% Mastery), **Knowledge Graph Engine**, and initialized 4 new customized flashcards in your **Recall Library** with an automated spaced repetition schedule. You are fully certified to proceed to the next academic cohort!`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    autoNotes: [
      { key: "Protocol Milestone", val: "Stage 8 Reflection completed for " + topic }
    ]
  };
  session.messages.push(systemMsg);

  saveDb();
  res.json({
    success: true,
    user,
    session,
    masteryIncrease: 5,
    cardsGenerated: 4
  });
});

// FLASHCARDS API
app.get("/api/flashcards", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const colls = db.collections[activeSessionUserId] || [];
  const cards = db.flashcards[activeSessionUserId] || [];
  res.json({ collections: colls, flashcards: cards });
});

app.post("/api/flashcards/review", (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: "No active session" });
  }
  const { cardId, result } = req.body; // result: 'easy' | 'medium' | 'hard'
  const cards = db.flashcards[activeSessionUserId] || [];
  const card = cards.find((c) => c.id === cardId);

  if (!card) {
    return res.status(404).json({ error: "Flashcard not found" });
  }

  // Spaced Repetition (Leitner System logic)
  if (result === "easy") {
    card.box = Math.min(card.box + 1, 5);
  } else if (result === "hard") {
    card.box = 1;
  }
  card.difficulty = result;
  card.lastReviewed = new Date().toISOString();

  // Increment user metrics & update knowledge graph
  const user = Object.values(db.users).find((u) => u.id === activeSessionUserId);
  if (user) {
    user.cardsMastered = Math.min(user.cardsMastered + 1, user.totalCards);
    if (user.cardsMastered % 10 === 0) {
      user.masteryProgress = Math.min(user.masteryProgress + 1, 100);
    }

    // Sync Knowledge Graph Flashcard Review Trigger
    ensureKnowledgeGraph(user);
    const colls = db.collections[activeSessionUserId] || [];
    const coll = colls.find(c => c.id === card.collectionId);
    const conceptName = coll ? coll.name.replace("Recall Deck: ", "") : "General Concept";
    user.knowledgeGraph = triggerFlashcardReview(user.knowledgeGraph, conceptName, result !== "hard");
  }

  saveDb();
  res.json({ success: true, card });
});

// TEACHER LENS PERSONA Q&A ENDPOINT
app.post("/api/study/teacher-lens-chat", async (req, res) => {
  try {
    const { question, topicName, academicLevel, discipline, lessonText } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    const topic = topicName || "Academic Concept";
    const field = discipline || "Academic Science";
    const level = academicLevel || "Undergraduate";

    if (ai && !isGeminiQuotaExceeded) {
      try {
        const response = await generateContentWithFallback(ai, {
          model: "gemini-3.1-flash-lite",
          contents: [
            {
              role: "user",
              parts: [{
                text: `System Instruction: You are an experienced Senior University Lecturer and Lead Examiner in ${field}. You are conducting a post-lesson Teacher Lens discussion with a ${level} student who just finished a study session on "${topic}".
Your tone should be warm, wise, encouraging, and focused on examiner perspective. Explain misconceptions, why marks are lost or gained, and how to think about this concept deeply. Never just give lazy direct answers.

Student Question: "${question}"`
              }]
            }
          ]
        });

        const text = response.text;
        if (text) {
          return res.json({ reply: text });
        }
      } catch (err: any) {
        console.error("Teacher Lens Gemini call failed, using Socratic lecturer fallback:", err);
      }
    }

    // High-fidelity Socratic lecturer fallback
    const fallbackReply = `### Examiner's Perspective on "${question}":

When grading university scripts on **${topic}**, examiners look closely at your **logical continuity** rather than just a final number or definition.

1. **Avoid the common trap:** Students often conflate core variables when rephrasing definitions under exam stress.
2. **Marking criteria:** Always write down the base governing principle first, substitute standard units, and state what the answer physically means.
3. **Lecturer Advice:** Imagine the system in motion before writing your equations—intuition prevents unforced errors!`;

    res.json({ reply: fallbackReply });
  } catch (err: any) {
    console.error("Error in /api/study/teacher-lens-chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Global Express Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express API error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: err?.message || "An internal server error occurred" });
});

// Vite middleware / Production routing setup
async function startServer() {
  if (IS_VERCEL || IS_NETLIFY) {
    // Serverless functions handle request routing automatically
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Epselon Educational Intelligence backend running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to boot full-stack server", err);
});

export default app;
