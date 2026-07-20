export type IntentCategory = "solve_homework" | "understand_concept" | "revise" | "practice" | "summarize" | "research";

export interface IntentResult {
  category: IntentCategory;
  confidence: number;
  reason: string;
}

export type LearningIntentCategory = "Study" | "Casual Conversation" | "Productivity" | "Research" | "Assessment" | "Unknown";

export interface LearningIntentResult {
  intent: LearningIntentCategory;
  confidence: number;
  reasoning: string;
}

export type PipelineId = "study" | "casual" | "productivity" | "research" | "assessment" | "unknown";

export interface PipelineRoutingResult {
  pipelineId: PipelineId;
  reason: string;
}

export interface StudentContextData {
  academicLevel: string;
  learningStyle: string;
  cognitiveLoad: string;
  preferredLanguage: string;
  weakConcepts: string[];
  strongConcepts: string[];
  currentTopic: string;
  masteryProgress: number;
}

export interface PromptCoachStep {
  text: string;
  label: string;
  explanation: string;
}

export interface PromptCoachResult {
  original: string;
  enhanced: string;
  steps: PromptCoachStep[];
}

export interface PedagogicalInstruction {
  style: string;
  bloomLevel: string;
  scaffoldingRules: string[];
  injectedPrompt: string;
}

export interface CurriculumContextResult {
  contextSnippet: string;
  localExamples: string[];
  hasReferenceMaterial: boolean;
}

export interface RoutingChoice {
  providerId: string;
  model: string;
  justification: string;
}

export interface TransformedResponse {
  explanation: string;
  equation?: string;
  autoNotes: Array<{ key: string; val: string }>;
  practiceQuestion?: string;
  reflectionQuestions?: string[];
  suggestedFlashcards?: Array<{ front: string; back: string }>;
  graphConnections?: string[];
}

export interface ReflectionAnswerResult {
  score: number; // 0 to 100
  feedback: string;
  suggestedAction: string;
}

export interface CognitiveNode {
  id: string; // Unique ID
  label: string; // Canonical Name for visualization
  canonicalName: string; // Canonical Name
  aliases: string[]; // Aliases
  definition: string; // Definition
  contexts: string[]; // Academic disciplines/contexts
  difficulty: "easy" | "medium" | "hard" | string; // Difficulty
  examples: string[]; // Examples of the concept
  equations: string[]; // Equations/formulas in LaTeX/text
  prerequisites: string[]; // Prerequisites (concept IDs or Names)
  relatedConcepts: string[]; // Related Concepts (concept IDs or Names)
  mastery: number; // Mastery Score (0-100)
  sourceConversations: string[]; // Source Conversations list
  learningSessions: string[]; // Learning Sessions list
  
  // existing fields for compatibility or specific display/visuals:
  group: "mastered" | "developing" | "weak" | string; // display group/subject
  confidenceScore?: number; // confidence score
  timesStudied?: number;
  timesReviewed?: number;
  reflectionScores?: number[];
  practiceScores?: number[];
  lastStudiedDate?: string;
  state?: "Unknown" | "Introduced" | "Learning" | "Practicing" | "Confident" | "Mastered" | "Needs Revision";
  prerequisiteConcepts?: string[]; // for backward-compatibility
  recommendedNextConcepts?: string[]; // for backward-compatibility
  recentActivity?: boolean; // Node glow recent activity indicator
  ringProgress?: number; // learning progress ring value (0-100)
}

export interface CognitiveLink {
  source: string;
  target: string;
  type: "Prerequisite" | "Builds Upon" | "Example Of" | "Part Of" | "Uses" | "Depends On" | "Equivalent To" | "Frequently Studied Together" | "Appears In" | string;
  strength?: number; // edge strength for relationship strength visualization (0-100 or 0-1)
}

export interface KnowledgeGraphState {
  nodes: CognitiveNode[];
  links: CognitiveLink[];
}

export interface ReinforcementResult {
  newFlashcardsCount: number;
  scheduledReviewsCount: number;
  recommendations: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface LearningPassportState {
  streak: number;
  totalTime: number; // in minutes
  totalQuestions: number;
  achievements: Achievement[];
  recentMilestones: string[];
}

// Complete Orchestrated Pipeline State for a Single Conversation Turn
export interface ProtocolTurnState {
  intent?: IntentResult;
  learningIntent?: LearningIntentResult;
  pipelineRouting?: PipelineRoutingResult;
  studentContext?: StudentContextData;
  coach?: PromptCoachResult;
  pedagogy?: PedagogicalInstruction;
  curriculum?: CurriculumContextResult;
  routing?: RoutingChoice;
  transformedResponse?: TransformedResponse;
  reinforcement?: ReinforcementResult;
  passport?: LearningPassportState;
}
