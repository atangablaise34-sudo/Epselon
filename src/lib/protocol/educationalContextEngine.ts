import { UserProfile, ChatMessage } from "../../types";

export interface IntentAnalysis {
  category: 
    | "Learn a concept"
    | "Solve a problem"
    | "Explain a solution"
    | "Homework help"
    | "Coding"
    | "Writing"
    | "Brainstorming"
    | "General conversation"
    | "Productivity"
    | "Research"
    | "Assessment"
    | "Casual conversation";
  subject: string;
  complexity: "Introductory" | "Intermediate" | "Advanced" | "Research-Grade";
  isCasual: boolean;
  confidence: number;
}

export interface CollectedContext {
  mode: string;
  provider: string;
  academicLevel?: string;
  facultyDepartment?: string;
  learningPreference?: string;
  masteredConcepts: string[];
  weakConcepts: string[];
  sessionFocus: string;
  conversationContextSummary?: string;
}

export interface PedagogicalInstructions {
  teachingObjectives: string[];
  pedagogicalRules: string[];
  responseStructure: string[];
}

export interface EducationalContextPacket {
  originalPrompt: string;
  composedSystemPrompt: string;
  analysis: IntentAnalysis;
  context: CollectedContext;
  instructions: PedagogicalInstructions;
  summary: EducationalSummary;
}

export interface EducationalSummary {
  title: string;
  subtitle: string;
  checklist: Array<{ label: string; detail: string }>;
  detailsBreakdown: {
    intent: string;
    subject: string;
    complexity: string;
    academicLevel: string;
    teachingMode: string;
    objectives: string[];
    rules: string[];
    responseStructure: string[];
  };
}

/**
 * 1. PROMPT ANALYZER
 * Analyzes the original student prompt to detect intent category, subject, complexity, and casual status.
 */
export class PromptAnalyzer {
  static analyze(prompt: string, sessionFocus?: string): IntentAnalysis {
    const text = prompt.trim();
    const lower = text.toLowerCase();

    // Check for casual greeting / small talk
    const casualGreetings = [
      "hi", "hello", "hey", "thanks", "thank you", "how are you", "what's up",
      "good morning", "good afternoon", "bye", "cool", "awesome", "great",
      "let's start", "ready", "ready to learn", "got it", "understood", "ok", "okay"
    ];
    const isCasual = casualGreetings.some(word => 
      lower === word || lower.startsWith(word + " ") || lower.endsWith(" " + word)
    );

    if (isCasual) {
      return {
        category: "Casual conversation",
        subject: sessionFocus || "General Conversation",
        complexity: "Introductory",
        isCasual: true,
        confidence: 0.95,
      };
    }

    // Determine category based on prompt patterns
    let category: IntentAnalysis["category"] = "Learn a concept";
    if (/\b(solve|calculate|evaluate|integrate|derive|find the value|equation)\b/i.test(lower)) {
      category = "Solve a problem";
    } else if (/\b(code|function|bug|script|algorithm|python|java|react|typescript|sql)\b/i.test(lower)) {
      category = "Coding";
    } else if (/\b(essay|write|draft|paragraph|summary|review|abstract|paraphrase)\b/i.test(lower)) {
      category = "Writing";
    } else if (/\b(quiz|test|exam|grade|practice questions|assess|evaluate me)\b/i.test(lower)) {
      category = "Assessment";
    } else if (/\b(paper|journal|literature|research|study|citation|publication)\b/i.test(lower)) {
      category = "Research";
    } else if (/\b(plan|schedule|todo|organize|structure|outline|timeline)\b/i.test(lower)) {
      category = "Productivity";
    } else if (/\b(explain|why|how|what is|meaning of|definition|concept)\b/i.test(lower)) {
      category = "Learn a concept";
    } else if (/\b(idea|brainstorm|possibilities|suggest|explore)\b/i.test(lower)) {
      category = "Brainstorming";
    } else if (/\b(homework|assignment|task|exercise|problem set)\b/i.test(lower)) {
      category = "Homework help";
    }

    // Detect subject
    let subject = sessionFocus || "General Discipline";
    if (/\b(quantum|wave|schrödinger|thermodynamics|gravity|force|velocity|acceleration|physics)\b/i.test(lower)) {
      subject = "Physics";
    } else if (/\b(molecule|reaction|acid|base|organic|chemistry|element|compound)\b/i.test(lower)) {
      subject = "Chemistry";
    } else if (/\b(matrix|eigenvalue|vector|calculus|integral|derivative|algebra|math)\b/i.test(lower)) {
      subject = "Mathematics";
    } else if (/\b(cell|dna|gene|protein|organism|biology|neuron|evolution)\b/i.test(lower)) {
      subject = "Biology";
    } else if (/\b(gdp|inflation|market|microeconomics|macroeconomics|finance|supply)\b/i.test(lower)) {
      subject = "Economics";
    } else if (/\b(history|war|century|revolution|empire|civilization)\b/i.test(lower)) {
      subject = "History";
    }

    // Detect complexity
    let complexity: IntentAnalysis["complexity"] = "Intermediate";
    if (/\b(quantum electrodynamics|tensor|manifold|stochastic|topology|schrödinger-pauli)\b/i.test(lower)) {
      complexity = "Advanced";
    } else if (/\b(what is|basic|introduction|simple|beginner|easy)\b/i.test(lower)) {
      complexity = "Introductory";
    }

    return {
      category,
      subject,
      complexity,
      isCasual: false,
      confidence: 0.9,
    };
  }
}

/**
 * 2. CONTEXT COLLECTOR
 * Collects ONLY existing, deterministic facts from user profile, knowledge graph, and active session.
 * Never invents personas or user attributes.
 */
export class ContextCollector {
  static collect(params: {
    user?: UserProfile | null;
    sessionFocus?: string;
    provider?: string;
    mode?: string;
    knowledgeGraph?: any;
    conversationHistory?: ChatMessage[];
  }): CollectedContext {
    const { user, sessionFocus, provider, mode, knowledgeGraph } = params;

    const masteredConcepts: string[] = [];
    const weakConcepts: string[] = [];

    // Extract real knowledge graph masteries/weaknesses if available
    if (knowledgeGraph && Array.isArray(knowledgeGraph.nodes)) {
      const topicNodes = knowledgeGraph.nodes.filter((n: any) =>
        !sessionFocus || (n.label && n.label.toLowerCase().includes(sessionFocus.toLowerCase()))
      );
      topicNodes.forEach((n: any) => {
        if (n.mastery >= 80) {
          masteredConcepts.push(n.label);
        } else if (n.mastery < 50) {
          weakConcepts.push(n.label);
        }
      });
    }

    return {
      mode: mode || "Study Mode",
      provider: provider || user?.preferences?.selectedProvider || "Gemini 3.5 Flash",
      academicLevel: user?.academicLevel && user.academicLevel.trim() ? user.academicLevel : undefined,
      facultyDepartment: (user?.faculty || user?.department) ? `${user?.faculty || ''} / ${user?.department || ''}`.trim() : undefined,
      learningPreference: user?.learningStyle && user.learningStyle.trim() ? user.learningStyle : undefined,
      masteredConcepts: Array.from(new Set(masteredConcepts)).slice(0, 5),
      weakConcepts: Array.from(new Set(weakConcepts)).slice(0, 5),
      sessionFocus: sessionFocus || "General Knowledge",
    };
  }
}

/**
 * 3. INSTRUCTION BUILDER
 * Constructs objective pedagogical instructions, teaching targets, and response structure.
 */
export class InstructionBuilder {
  static build(analysis: IntentAnalysis, context: CollectedContext): PedagogicalInstructions {
    const teachingObjectives: string[] = [];
    const pedagogicalRules: string[] = [];

    // Objective mapping
    if (analysis.category === "Learn a concept") {
      teachingObjectives.push("Explain the core concept starting from intuitive physical systems before introducing formal abstractions.");
      teachingObjectives.push("Provide clear, textbook-grade KaTeX mathematical formulas for governing equations.");
      teachingObjectives.push("Include a real-world case study or practical application.");
      teachingObjectives.push("Identify common conceptual traps and misconceptions students frequently make.");
    } else if (analysis.category === "Solve a problem") {
      teachingObjectives.push("Deconstruct the problem step-by-step with explicit algebraic derivations.");
      teachingObjectives.push("Highlight key assumptions, units, and dimensional analysis.");
      teachingObjectives.push("Offer a Socratic checkpoint question to test student comprehension before revealing final solutions.");
    } else if (analysis.category === "Casual conversation") {
      teachingObjectives.push("Respond warmly, naturally, and conversationally.");
    } else {
      teachingObjectives.push(`Provide structured academic guidance tailored to ${analysis.category.toLowerCase()}.`);
      teachingObjectives.push("Maintain rigorous academic depth while ensuring clear readability.");
    }

    // Pedagogical rules
    pedagogicalRules.push("PRESERVE STUDENT WORDS: Answer the student's exact query without modifying, replacing, or paraphrasing their original prompt text.");
    pedagogicalRules.push("NO FICTIONAL PERSONAS: Never invent fake names, fictitious universities, or hallucinated student backgrounds.");
    pedagogicalRules.push("FORMATTING: Use clear Markdown headings, bullet points, and KaTeX notation ($...$ or $$...$$) for equations.");
    pedagogicalRules.push("PEDAGOGICAL DENSITY: Avoid conversational fluff or marketing chatter; focus purely on educational depth and clarity.");

    if (context.academicLevel) {
      pedagogicalRules.push(`ACADEMIC DENSITY MATCH: Tailor mathematical rigor and terminology to the student's registered level (${context.academicLevel}).`);
    }
    if (context.weakConcepts.length > 0) {
      pedagogicalRules.push(`REINFORCE WEAK CONCEPTS: Pay special attention to foundational concepts the student is currently reinforcing: ${context.weakConcepts.join(", ")}.`);
    }

    // Preferred response structure
    const responseStructure = analysis.isCasual
      ? ["Warm Conversational Response", "Friendly Invitation to Explore Academic Topics"]
      : [
          "Core Definition & Conceptual Overview",
          "Physical Intuition & Relatable Analogy",
          "Governing Equation & Mathematical Formulation (KaTeX)",
          "Real-World Practical Application / System Case Study",
          "Common Misconceptions & Pitfalls",
          "Socratic Reflection & Mini Recap Checkpoint"
        ];

    return {
      teachingObjectives,
      pedagogicalRules,
      responseStructure,
    };
  }
}

/**
 * 4. PROMPT COMPOSER
 * Combines Educational Context, Instructions, and Original Student Prompt into a clean system instruction packet.
 */
export class PromptComposer {
  static compose(
    originalPrompt: string,
    analysis: IntentAnalysis,
    context: CollectedContext,
    instructions: PedagogicalInstructions
  ): string {
    if (analysis.isCasual) {
      return originalPrompt;
    }

    const contextLines = [
      `Current Study Mode: ${context.mode}`,
      `Selected AI Provider: ${context.provider}`,
      `Target Discipline / Subject: ${analysis.subject}`,
      `Intent Category: ${analysis.category}`,
      `Complexity Target: ${analysis.complexity}`,
      context.academicLevel ? `Registered Academic Level: ${context.academicLevel}` : null,
      context.facultyDepartment ? `Field / Faculty: ${context.facultyDepartment}` : null,
      context.learningPreference ? `Learning Preference: ${context.learningPreference}` : null,
      context.masteredConcepts.length > 0 ? `Mastered Landmarks: ${context.masteredConcepts.join(", ")}` : null,
      context.weakConcepts.length > 0 ? `Priority Growth Areas: ${context.weakConcepts.join(", ")}` : null,
    ].filter(Boolean);

    return `[EDUCATIONAL CONTEXT ENGINE - SYSTEM INSTRUCTION PACKET]

=== 1. EDUCATIONAL CONTEXT ===
${contextLines.map(l => `• ${l}`).join("\n")}

=== 2. TEACHING OBJECTIVES ===
${instructions.teachingObjectives.map(o => `• ${o}`).join("\n")}

=== 3. PEDAGOGICAL CONSTRAINTS ===
${instructions.pedagogicalRules.map(r => `• ${r}`).join("\n")}

=== 4. PREFERRED RESPONSE STRUCTURE ===
${instructions.responseStructure.map((s, i) => `${i + 1}. ${s}`).join("\n")}

=== 5. ORIGINAL STUDENT REQUEST ===
IMPORTANT: The student's original prompt belongs to the student. Do NOT replace, alter, or rewrite their query below. Address their exact request in accordance with the educational context and instructions above:

"${originalPrompt}"`;
  }
}

/**
 * 5. STUDENT SUMMARY GENERATOR
 * Generates transparent educational summary and breakdown for UI presentation.
 */
export class StudentSummaryGenerator {
  static generate(
    originalPrompt: string,
    composedSystemPrompt: string,
    analysis: IntentAnalysis,
    context: CollectedContext,
    instructions: PedagogicalInstructions
  ): EducationalSummary {
    return {
      title: "✨ Optimized for Learning",
      subtitle: "We prepared your request by constructing structured educational context around your query.",
      checklist: [
        { label: "Learning context", detail: `Mapped to ${analysis.subject} (${analysis.category})` },
        { label: "Teaching objectives", detail: `${instructions.teachingObjectives.length} pedagogical learning targets attached` },
        { label: "Response structure", detail: `${instructions.responseStructure.length}-step structured tutorial sequence` },
        { label: "Better instructional guidance", detail: `Tailored for ${context.mode} on ${context.provider}` },
        { label: "Study-friendly formatting", detail: "LaTeX KaTeX equations and Markdown enabled" },
      ],
      detailsBreakdown: {
        intent: analysis.category,
        subject: analysis.subject,
        complexity: analysis.complexity,
        academicLevel: context.academicLevel || "Adaptive / General",
        teachingMode: context.mode,
        objectives: instructions.teachingObjectives,
        rules: instructions.pedagogicalRules,
        responseStructure: instructions.responseStructure,
      },
    };
  }
}

/**
 * UNIFIED EDUCATIONAL CONTEXT ENGINE (ECE) PIPELINE
 */
export class EducationalContextEngine {
  static process(params: {
    originalPrompt: string;
    user?: UserProfile | null;
    sessionFocus?: string;
    provider?: string;
    mode?: string;
    knowledgeGraph?: any;
    conversationHistory?: ChatMessage[];
  }): EducationalContextPacket {
    const { originalPrompt, user, sessionFocus, provider, mode, knowledgeGraph, conversationHistory } = params;

    // Module 1: Prompt Analyzer
    const analysis = PromptAnalyzer.analyze(originalPrompt, sessionFocus);

    // Module 2: Context Collector
    const context = ContextCollector.collect({
      user,
      sessionFocus,
      provider,
      mode,
      knowledgeGraph,
      conversationHistory,
    });

    // Module 3: Instruction Builder
    const instructions = InstructionBuilder.build(analysis, context);

    // Module 4: Prompt Composer
    const composedSystemPrompt = PromptComposer.compose(originalPrompt, analysis, context, instructions);

    // Module 5: Student Summary Generator
    const summary = StudentSummaryGenerator.generate(
      originalPrompt,
      composedSystemPrompt,
      analysis,
      context,
      instructions
    );

    return {
      originalPrompt,
      composedSystemPrompt,
      analysis,
      context,
      instructions,
      summary,
    };
  }
}
