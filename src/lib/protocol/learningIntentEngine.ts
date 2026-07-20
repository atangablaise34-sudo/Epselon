import { GoogleGenAI, Type } from "@google/genai";
import { LearningIntentCategory, LearningIntentResult } from "./types";

export class LearningIntentEngine {
  private ai: GoogleGenAI | null = null;
  public static isQuotaExceeded = false;
  public static quotaExceededResetTime = 0;

  constructor(aiClient?: GoogleGenAI | null) {
    if (aiClient) {
      this.ai = aiClient;
    } else if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }

  /**
   * Determine whether a student's prompt should activate Epselon's Educational Intelligence Layer.
   * It ONLY classifies the prompt. It does not answer or enhance the prompt, nor does it communicate
   * with AI providers for other purposes.
   */
  async classify(prompt: string): Promise<LearningIntentResult> {
    if (!prompt || !prompt.trim()) {
      return {
        intent: "Unknown",
        confidence: 1.0,
        reasoning: "Prompt is empty.",
      };
    }

    if (LearningIntentEngine.isQuotaExceeded) {
      if (Date.now() > LearningIntentEngine.quotaExceededResetTime) {
        LearningIntentEngine.isQuotaExceeded = false;
      } else {
        console.warn("[INTENT COGNITION] Operating in high-speed Local Intent Inference mode due to cloud quota cooldown.");
        return this.classifyLocalFallback(prompt);
      }
    }

    if (!this.ai) {
      return this.classifyLocalFallback(prompt);
    }

    try {
      const systemInstruction = `You are the core "Learning Intent Engine" of Epselon (an AI-powered learning operating system).
Your sole responsibility is to classify the student's latest prompt into exactly one of these six supported intent categories:

1. "Study": Deep concept learning, asking questions about academic topics, asking for explanations, formulas, equations, derivations, or problem-solving help in a subject area.
2. "Casual Conversation": Greetings (e.g. "hi", "hello", "good morning"), general chit-chat, thanking ("thanks", "thank you"), off-topic remarks, small talk, or general warm-up banter.
3. "Productivity": Organization requests, planning a study schedule, formatting notes, creating todo lists, tracking tasks, organizing folders, or calendar management.
4. "Research": Queries seeking academic/scientific publications, peer-reviewed papers, advanced data analysis methodologies, research databases, bibliographies, or literature deep-dives.
5. "Assessment": Requesting practice quizzes, mock exams, grading/evaluating answers, self-assessment questions, checking if a solution is correct, or being tested on a concept.
6. "Unknown": Purely ambiguous, garbled, empty, or uninterpretable input that does not fit into any other category.

CRITICAL DIRECTIVES:
- You ONLY classify the prompt. You do NOT answer the prompt. You do NOT improve or enhance the prompt.
- Provide a confidence score from 0.0 to 1.0.
- Provide clear, objective reasoning for your classification.

Return your response strictly in JSON matching this schema:
{
  "intent": "Study" | "Casual Conversation" | "Productivity" | "Research" | "Assessment" | "Unknown",
  "confidence": number,
  "reasoning": "brief explanation for why this category was selected"
}`;

      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Classify this student prompt:\n"${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: "The classified intent category.",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence level of classification between 0.0 and 1.0.",
              },
              reasoning: {
                type: Type.STRING,
                description: "Brief reasoning for why this intent category was chosen.",
              },
            },
            required: ["intent", "confidence", "reasoning"],
          },
        },
      });

      const responseText = response.text?.trim() || "";
      const parsed = JSON.parse(responseText);

      // Validate the intent category is correct
      const validCategories: LearningIntentCategory[] = [
        "Study",
        "Casual Conversation",
        "Productivity",
        "Research",
        "Assessment",
        "Unknown",
      ];
      let intent = parsed.intent;
      if (!validCategories.includes(intent)) {
        intent = "Unknown";
      }

      return {
        intent: intent as LearningIntentCategory,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        reasoning: parsed.reasoning || "Classified via Gemini model.",
      };
    } catch (error: any) {
      console.error("LearningIntentEngine API classification failed, falling back:", error);
      const errorMsg = (error.message || "").toLowerCase();
      const isQuotaExceeded = 
        error.status === 429 ||
        error.statusCode === 429 ||
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("resource_exhausted") ||
        errorMsg.includes("billing details") ||
        errorMsg.includes("limit: 20") ||
        errorMsg.includes("rate limit");

      if (isQuotaExceeded) {
        console.warn("[INTENT COGNITION] Daily API Quota limits exceeded (429 RESOURCE_EXHAUSTED). Moving to Socratic local intent classification.");
        LearningIntentEngine.isQuotaExceeded = true;
        LearningIntentEngine.quotaExceededResetTime = Date.now() + 1000 * 60 * 30; // 30 minutes of local fallback
      }
      return this.classifyLocalFallback(prompt);
    }
  }

  private classifyLocalFallback(prompt: string): LearningIntentResult {
    const p = prompt.toLowerCase().trim();

    if (!p) {
      return { intent: "Unknown", confidence: 1.0, reasoning: "Empty prompt detected." };
    }

    // Casual Conversation fallback check
    const casualWords = [
      "hi", "hello", "hey", "thanks", "thank you", "how are you", "what's up", 
      "good morning", "good afternoon", "bye", "cool", "awesome", "great",
      "let's start", "ready", "ready to learn", "got it"
    ];
    const isCasual = casualWords.some(word => 
      p === word || p.startsWith(word + " ") || p.endsWith(" " + word) || p.includes(" " + word + " ")
    );
    if (isCasual) {
      return { 
        intent: "Casual Conversation", 
        confidence: 0.85, 
        reasoning: "Detected common conversational greeting or chit-chat terms." 
      };
    }

    // Assessment fallback check
    const assessmentWords = [
      "quiz", "test", "grade", "assess", "exam", "question", "evaluate", 
      "practice question", "test me", "practice test", "check my answer"
    ];
    const isAssessment = assessmentWords.some(word => p.includes(word));
    if (isAssessment) {
      return { 
        intent: "Assessment", 
        confidence: 0.85, 
        reasoning: "Contains keywords associated with assessment, testing, or quiz generation." 
      };
    }

    // Productivity fallback check
    const productivityWords = [
      "plan", "schedule", "organize", "todo", "to-do", "list", "format", 
      "calendar", "task", "notes layout", "manage folder"
    ];
    const isProductivity = productivityWords.some(word => p.includes(word));
    if (isProductivity) {
      return { 
        intent: "Productivity", 
        confidence: 0.8, 
        reasoning: "Prompt indicates request for organizing tasks, planning, or scheduling." 
      };
    }

    // Research fallback check
    const researchWords = [
      "paper", "article", "literature", "bibliography", "research", 
      "scientific data", "journal", "academic source", "publications"
    ];
    const isResearch = researchWords.some(word => p.includes(word));
    if (isResearch) {
      return { 
        intent: "Research", 
        confidence: 0.85, 
        reasoning: "Prompt requests publications, literature, or research citations." 
      };
    }

    // Study fallback check
    const studyWords = [
      "explain", "understand", "what is", "how does", "why is", "formula", 
      "equation", "solve", "quantum", "wave", "mechanics", "derivation", 
      "physics", "science", "concept"
    ];
    const isStudy = studyWords.some(word => p.includes(word));
    if (isStudy) {
      return { 
        intent: "Study", 
        confidence: 0.9, 
        reasoning: "Requests conceptual explanation or guidance on academic subjects/formulas." 
      };
    }

    // Default to Study as the default pipeline since Epselon is an educational system
    return {
      intent: "Study",
      confidence: 0.5,
      reasoning: "Categorized as Study by default for standard educational context in Epselon.",
    };
  }
}
