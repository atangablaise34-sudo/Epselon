import { 
  detectIntent, buildStudentContext, coachPrompt, getPedagogicalInstruction,
  retrieveCurriculumContext, routeAI, transformRawResponse, runReinforcement,
  updateLearningPassport
} from "./engines";
import { ProtocolTurnState, LearningIntentResult, PipelineRoutingResult } from "./types";

/**
 * Epselon Learning Protocol Core Orchestrator
 * This orchestrates the sequence of stages 1 through 12.
 */
export function orchestrateProtocolTurn(
  originalPrompt: string,
  userProfile: any,
  currentTopic: string,
  rawModelResponse?: string,
  passportState?: any,
  learningIntent?: LearningIntentResult,
  pipelineRouting?: PipelineRoutingResult
): ProtocolTurnState {
  // STAGE 1: Intent Detection
  const intent = detectIntent(originalPrompt);

  // STAGE 2: Student Context
  const studentContext = buildStudentContext(userProfile, currentTopic);

  // STAGE 3: Prompt Coach
  const coach = coachPrompt(originalPrompt, studentContext, intent, learningIntent);

  // STAGE 4: Pedagogical Engine
  const pedagogy = getPedagogicalInstruction(userProfile.preferences, intent);

  // STAGE 5: Curriculum Context
  const curriculum = retrieveCurriculumContext(userProfile.university, userProfile.faculty, currentTopic);

  // STAGE 6: Routing Choice
  const routing = routeAI(userProfile.preferences.selectedProvider || "gemini", userProfile.preferences.selectedModel);

  // Parse response if model response is provided (e.g. from server)
  let transformedResponse = undefined;
  let reinforcement = undefined;
  if (rawModelResponse) {
    // STAGE 7: Response Transformation
    transformedResponse = transformRawResponse(rawModelResponse);

    // STAGE 11: Reinforcement Engine
    if (transformedResponse.suggestedFlashcards) {
      reinforcement = runReinforcement(transformedResponse.suggestedFlashcards);
    }
  }

  // STAGE 12: Learning Passport
  let passport = undefined;
  if (passportState) {
    passport = updateLearningPassport(passportState, true);
  }

  return {
    intent,
    learningIntent,
    pipelineRouting,
    studentContext,
    coach,
    pedagogy,
    curriculum,
    routing,
    transformedResponse,
    reinforcement,
    passport
  };
}
