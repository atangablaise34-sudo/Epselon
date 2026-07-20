import { 
  IntentResult, IntentCategory, StudentContextData, PromptCoachResult, PromptCoachStep,
  PedagogicalInstruction, CurriculumContextResult, RoutingChoice, TransformedResponse,
  ReflectionAnswerResult, CognitiveNode, CognitiveLink, KnowledgeGraphState,
  ReinforcementResult, LearningPassportState, Achievement, LearningIntentResult
} from "./types";
import { 
  getOrCreateNode, 
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
  calculateNodeState
} from "./knowledgeGraphEngine";

export { 
  getOrCreateNode, 
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
  calculateNodeState
};

// STAGE 1: Intent Detection Engine
export function detectIntent(prompt: string): IntentResult {
  const p = prompt.toLowerCase();
  let category: IntentCategory = "understand_concept";
  let confidence = 0.85;
  let reason = "Prompt requests general conceptual elaboration.";

  if (p.includes("solve") || p.includes("homework") || p.includes("solution") || p.includes("answer to") || p.includes("calculate")) {
    category = "solve_homework";
    confidence = 0.95;
    reason = "Prompt displays high reliance on direct answer retrieval or homework assistance.";
  } else if (p.includes("revise") || p.includes("exam") || p.includes("review") || p.includes("recap") || p.includes("test me")) {
    category = "revise";
    confidence = 0.90;
    reason = "Prompt indicates structured exam preparation or review focus.";
  } else if (p.includes("practice") || p.includes("quiz") || p.includes("question") || p.includes("exercise") || p.includes("problems")) {
    category = "practice";
    confidence = 0.92;
    reason = "Prompt requests active recall exercises or self-assessment questions.";
  } else if (p.includes("summarize") || p.includes("summary") || p.includes("shorten") || p.includes("outline") || p.includes("tl;dr")) {
    category = "summarize";
    confidence = 0.88;
    reason = "Prompt requests syntactic reduction of a concept into critical points.";
  } else if (p.includes("research") || p.includes("deep dive") || p.includes("papers") || p.includes("bibliography") || p.includes("literature")) {
    category = "research";
    confidence = 0.87;
    reason = "Prompt exhibits specialized inquiry seeking peer-reviewed material or references.";
  }

  return { category, confidence, reason };
}

// STAGE 2: Student Context Engine
export function buildStudentContext(userProfile: any, currentTopic: string): StudentContextData {
  return {
    academicLevel: userProfile.academicLevel || "Undergraduate Student",
    learningStyle: userProfile.learningStyle || "Visual",
    cognitiveLoad: userProfile.preferences?.cognitiveLoad || "Proficient",
    preferredLanguage: userProfile.preferredLanguage || "English",
    weakConcepts: ["Quantum wave collapse", "Fourier thermal fields", "Relativistic contraction"],
    strongConcepts: ["Euler identity", "Partial derivatives", "Schrödinger baseline"],
    currentTopic: currentTopic || "General Science Exploration",
    masteryProgress: userProfile.masteryProgress || 0
  };
}

// STAGE 3: Prompt Coach Engine
export function coachPrompt(
  original: string, 
  context: StudentContextData, 
  intent: IntentResult,
  learningIntent?: LearningIntentResult
): PromptCoachResult {
  if (!learningIntent || learningIntent.intent !== "Study") {
    return {
      original,
      enhanced: original,
      steps: []
    };
  }

  const steps: PromptCoachStep[] = [];
  let currentPrompt = original;

  // Step 1: Inject Academic Identity
  const step1Text = `${currentPrompt}\n\nExplicate for a ${context.academicLevel} student studying ${context.currentTopic}.`;
  steps.push({
    text: step1Text,
    label: "Academic Identity",
    explanation: "Calibrates model's complexity, technical lexicon, and pedagogical tone to your exact academic cohort."
  });
  currentPrompt = step1Text;

  // Step 2: Inject Local and Regional Examples
  const step2Text = `${currentPrompt} Provide relevant real-world illustrations, prioritizing regional examples (such as infrastructure, climate, or research projects in Africa if applicable).`;
  steps.push({
    text: step2Text,
    label: "Local Context Integration",
    explanation: "Grounds theoretical equations in highly contextual, familiar physical systems to enhance intuitive understanding."
  });
  currentPrompt = step2Text;

  // Step 3: Inject Active Socratic Pedagogy
  let pedagogyClause = "";
  if (intent.category === "solve_homework") {
    pedagogyClause = "Do NOT provide the final numerical solution instantly. Instead, break down the derivation into Socratic scaffolding steps, pose a targeted checking question, and provide a micro-hint.";
  } else {
    pedagogyClause = "Structure the conceptual response under Bloom's Taxonomy, beginning with clear, first-principles definitions, followed by step-by-step logical proofs, and concluding with active-recall challenges.";
  }
  const step3Text = `${currentPrompt} ${pedagogyClause}`;
  steps.push({
    text: step3Text,
    label: "Socratic Scaffolding",
    explanation: "Forces the LLM to guide you step-by-step, preventing instant answers and encouraging active cognitive synthesis."
  });
  currentPrompt = step3Text;

  // Step 4: Inject Assessment and Reflection
  const step4Text = `${currentPrompt} Finally, generate 1 practice quiz exercise and 2 reflection questions testing my understanding, along with 2 recommended flashcard items in the exact JSON structure.`;
  steps.push({
    text: step4Text,
    label: "Assessment & Reflection Decks",
    explanation: "Embeds diagnostic testing blocks immediately into the response to feed the Reinforcement and Mastery engines."
  });
  currentPrompt = step4Text;

  return {
    original,
    enhanced: currentPrompt,
    steps
  };
}

// STAGE 4: Pedagogical Engine
export function getPedagogicalInstruction(preferences: any, intent: IntentResult): PedagogicalInstruction {
  const style = preferences.teachingStyle || "Socratic";
  const bloomLevel = preferences.taxonomyFocus || "Analyze & Evaluate";
  const scaffoldingRules = [
    "Break explanations down into digestible, modular steps.",
    "Introduce a core mathematical formula only after defining its physical terms.",
    "End response with a Socratic question requesting validation or reflection."
  ];

  let injectedPrompt = `Apply ${style} pedagogy matching Bloom's level "${bloomLevel}". `;
  if (style === "Socratic") {
    injectedPrompt += "Ask deep, guiding questions. Prompt the student to deduce derivations rather than presenting answers instantly. Use analogical reasoning.";
  } else if (style === "Practical") {
    injectedPrompt += "Lead with concrete laboratory or system examples. Show raw physical measurements and trace them to theoretical laws.";
  }

  return { style, bloomLevel, scaffoldingRules, injectedPrompt };
}

// STAGE 5: Curriculum Context Engine
export function retrieveCurriculumContext(university: string, faculty: string, topic: string): CurriculumContextResult {
  // Simulating retrieval of localized syllabus/lecture RAG content
  const hasReferenceMaterial = true;
  let contextSnippet = `Syllabus alignment for ${university} (Faculty of ${faculty}). `;
  const localExamples: string[] = [];

  if (topic.toLowerCase().includes("energy") || topic.toLowerCase().includes("power")) {
    contextSnippet += "Focusing on regional grid architectures, hydro-electric systems (such as Grand Renaissance or Inga Dams), and rural microgrids.";
    localExamples.push("Grand Renaissance Dam (hydro-kinetic kinetics)", "Kigali solar cooperative distribution grids");
  } else {
    contextSnippet += `Focusing on core experimental foundations matching the ${faculty} syllabus curriculum.`;
    localExamples.push("West African regional science consortium research guidelines");
  }

  return { contextSnippet, localExamples, hasReferenceMaterial };
}

// STAGE 6: AI Routing Engine
export function routeAI(providerId: string, modelId?: string): RoutingChoice {
  const defaultModels: Record<string, string> = {
    gemini: "gemini-3.5-flash",
    chatgpt: "gpt-4o",
    claude: "claude-3-5-sonnet",
    deepseek: "deepseek-v3"
  };

  const selectedProvider = providerId || "gemini";
  const selectedModel = modelId || defaultModels[selectedProvider] || "gemini-3.5-flash";

  let justification = `Routing payload to ${selectedProvider.toUpperCase()} (${selectedModel}). `;
  if (selectedProvider === "gemini") {
    justification += "Optimized for multimodal spatial contexts, fast latency, and academic structure schema.";
  } else {
    justification += "Optimized for static forced routing based on student workspace overrides.";
  }

  return {
    providerId: selectedProvider,
    model: selectedModel,
    justification
  };
}

// STAGE 7: Response Transformation Engine
export function transformRawResponse(rawText: string): TransformedResponse {
  // If the raw response is already JSON, we parse it, otherwise we package it beautifully
  try {
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.substring(7);
    } else if (clean.startsWith("```")) {
      clean = clean.substring(3);
    }
    if (clean.endsWith("```")) {
      clean = clean.substring(0, clean.length - 3);
    }
    clean = clean.trim();
    
    // Fix unescaped backslashes in raw JSON (common with LaTeX)
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
    
    const parsed = JSON.parse(sanitized);
    return {
      explanation: parsed.explanation || rawText,
      equation: parsed.equation,
      autoNotes: parsed.autoNotes || [],
      practiceQuestion: parsed.practiceQuestion,
      reflectionQuestions: parsed.reflectionQuestions || [],
      suggestedFlashcards: parsed.suggestedFlashcards || [],
      graphConnections: parsed.graphConnections || []
    };
  } catch {
    // Highly sophisticated regex extraction for formulas and terms if the AI output is plain markdown
    const equationMatch = rawText.match(/\$\$([\s\S]*?)\$\$/) || rawText.match(/\\\[([\s\S]*?)\\\]/);
    const equation = equationMatch ? equationMatch[1].trim() : undefined;

    return {
      explanation: rawText,
      equation,
      autoNotes: [
        { key: "Session Insight", val: "Critical synthesis of concept formulated." }
      ],
      practiceQuestion: "Based on the above, can you explain how this concept changes if we double the load?",
      reflectionQuestions: [
        "What was the most challenging part of this proof?",
        "How would you explain this in simple terms to a classmate?"
      ],
      suggestedFlashcards: [
        { front: "Define the core mechanism discussed.", back: "Refer to the active-recall guide." }
      ],
      graphConnections: []
    };
  }
}

// STAGE 9: Mastery Engine
export function updateMastery(currentScore: number, answersCorrect: boolean): number {
  const delta = answersCorrect ? 3 : -1;
  return Math.max(0, Math.min(100, currentScore + delta));
}

// STAGE 10: Knowledge Graph Engine
export function updateKnowledgeGraph(currentState: KnowledgeGraphState, newConnections: string[]): KnowledgeGraphState {
  const stateCopy = {
    nodes: [...currentState.nodes],
    links: [...currentState.links]
  };

  newConnections.forEach(concept => {
    getOrCreateNode(stateCopy, concept);
  });

  return stateCopy;
}

// STAGE 11: Reinforcement Engine
export function runReinforcement(suggestedFlashcards: Array<{ front: string; back: string }>): ReinforcementResult {
  return {
    newFlashcardsCount: suggestedFlashcards.length,
    scheduledReviewsCount: Math.ceil(suggestedFlashcards.length * 1.5),
    recommendations: [
      "Review the new flashcards generated in the recall library.",
      "Engage in an active recall session tomorrow morning to consolidate memory traces."
    ]
  };
}

// STAGE 12: Learning Passport Engine
export function updateLearningPassport(currentState: LearningPassportState, sessionSuccess: boolean): LearningPassportState {
  const currentStreak = sessionSuccess ? currentState.streak + 1 : currentState.streak;
  const achievements = [...currentState.achievements];
  const recentMilestones = [...currentState.recentMilestones];

  if (currentStreak === 5 && !achievements.some(a => a.id === "streak_5")) {
    achievements.push({
      id: "streak_5",
      title: "Pedagogical Alchemist",
      description: "Maintained a 5-day active learning Socratic streak.",
      icon: "Sparkles",
      unlockedAt: new Date().toLocaleDateString()
    });
    recentMilestones.push("Unlocked 'Pedagogical Alchemist' achievement!");
  }

  return {
    streak: currentStreak,
    totalTime: currentState.totalTime + 15,
    totalQuestions: currentState.totalQuestions + 1,
    achievements,
    recentMilestones
  };
}
