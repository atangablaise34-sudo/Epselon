export interface UserPreferences {
  theme: "obsidian" | "light" | "cybernetic";
  accentColor: "blue" | "purple" | "green" | "orange";
  fontSize: "100%" | "110%" | "120%" | "90%";
  teachingStyle: "Socratic" | "Explanatory" | "Practical" | "Theoretical";
  cognitiveLoad: "Novice" | "Proficient" | "Master";
  taxonomyFocus: "Analyze & Evaluate" | "Apply & Understand" | "Create & Synthesize";
  contextAwareness: boolean;
  selectedVoiceId?: string;
  language?: "en" | "fr";
  
  // AI Workspace preferences
  selectedProvider?: string;
  selectedModel?: string;
  routingType?: "automatic" | "manual";
  temperature?: number;
  reasoningLevel?: "low" | "medium" | "high";
  responseLength?: "short" | "medium" | "long";
}

export interface ProviderConnection {
  id: string;
  name: string;
  connected: boolean;
  apiKey?: string;
  email?: string;
  currentModel: string;
  latency: string;
  lastSynced?: string;
  features: string[];
  syncExistingChats?: boolean;
}

export interface UserProfile {
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

export interface ChatMessage {
  id: string;
  sender: "student" | "mentor";
  text: string;
  timestamp: string;
  equation?: string;
  autoNotes?: Array<{ key: string; val: string }>;
  progressiveParts?: Array<{ title: string; content: string }>;
  protocolTrace?: {
    intent?: { category: string; confidence: number; reason: string };
    learningIntent?: { intent: string; confidence: number; explanation: string };
    pipelineRouting?: any;
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

export type SessionStatus = 
  | "CREATED" 
  | "ACTIVE" 
  | "REFLECTING" 
  | "ASSESSMENT" 
  | "TEACHER_LENS" 
  | "COMPLETED" 
  | "ARCHIVED";

export interface StudySession {
  id: string;
  title: string;
  mode: string;
  subject: string;
  createdAt: string;
  lastUpdated: string;
  status: SessionStatus;
  metadata: Record<string, any>;
  originalPrompt: string;
  enhancedPrompt: string;
  messages: ChatMessage[];
  lessonCards: Array<{ id: string; title: string; content: string; type?: string }>;
  reflectionCards: Array<any>;
  reflectionAnswers: Array<{ cardIndex?: number; question: string; answer: any; isCorrect?: boolean; feedback?: string }>;
  assessmentQuestions: Array<any>;
  assessmentAnswers: Array<{ questionId?: string; question: string; selectedAnswer: any; isCorrect?: boolean; score?: number }>;
  teacherLens: {
    discussionNotes?: string;
    studentStrengths?: string[];
    gapAreas?: string[];
    gradeRecommendation?: string;
    completedAt?: string;
  } | null;
  knowledgeGraphUpdates: Array<{ concept: string; targetConcept?: string; relationship?: string; masteryDelta?: number }>;
  mastery: number;
  recommendations: string[];
  personalNotes: string[];
  attachments: Array<{ id: string; name: string; type: string; path?: string }>;
  exportStatus?: {
    markdownGenerated?: boolean;
    pdfGenerated?: boolean;
    markdownPath?: string;
    pdfPath?: string;
    generatedAt?: string;
  };

  // Legacy & UI compatibility fields
  focus?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | string;
  bloomLevel?: string;
  strategy?: string;
  progress?: number;
  prerequisites?: Array<{ name: string; completed: boolean }>;
  outline?: string[];
  currentIntent?: string;
  manualIntent?: string;
  isOfflineSocraticMode?: boolean;
}

export interface Flashcard {
  id: string;
  collectionId: string;
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
  lastReviewed?: string;
  nextReview?: string;
  box: number;
}

export interface FlashcardCollection {
  id: string;
  name: string;
  totalCards: number;
  dueTodayCount: number;
  masteryPercentage: number;
  icon: string;
}

export interface AppState {
  user: UserProfile | null;
  loading: boolean;
  currentRoute: "nexus" | "study" | "flashcards" | "settings" | "workspace";
  activeSessionId: string | null;
}
