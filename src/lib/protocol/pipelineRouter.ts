import { LearningIntentResult, PipelineId, PipelineRoutingResult } from "./types";

export class PipelineRouter {
  /**
   * Routes the prompt to its corresponding specific pipeline based on the classified intent category.
   */
  static route(intentResult: LearningIntentResult): PipelineRoutingResult {
    const { intent, confidence, reasoning } = intentResult;

    switch (intent) {
      case "Casual Conversation":
        return {
          pipelineId: "casual",
          reason: `Routed to Casual Pipeline (Confidence: ${confidence}) because the user's intent is identified as Casual Conversation. Reasoning: ${reasoning}`,
        };

      case "Study":
        return {
          pipelineId: "study",
          reason: `Routed to Study Pipeline (Confidence: ${confidence}) because the user's intent is identified as Study. Reasoning: ${reasoning}`,
        };

      case "Research":
        return {
          pipelineId: "research",
          reason: `Routed to Research Pipeline (Confidence: ${confidence}) because the user's intent is identified as Research. Reasoning: ${reasoning}`,
        };

      case "Assessment":
        return {
          pipelineId: "assessment",
          reason: `Routed to Assessment Pipeline (Confidence: ${confidence}) because the user's intent is identified as Assessment. Reasoning: ${reasoning}`,
        };

      case "Productivity":
        return {
          pipelineId: "productivity",
          reason: `Routed to Productivity Pipeline (Confidence: ${confidence}) because the user's intent is identified as Productivity. Reasoning: ${reasoning}`,
        };

      case "Unknown":
      default:
        return {
          pipelineId: "unknown",
          reason: `Routed to Unknown Pipeline (Confidence: ${confidence}). Reasoning: ${reasoning}`,
        };
    }
  }
}
