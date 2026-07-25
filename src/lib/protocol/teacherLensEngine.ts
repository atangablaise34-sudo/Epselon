export interface CommonMistake {
  mistake: string;
  explanation: string;
  correction: string;
}

export interface MarkingCriterion {
  element: string;
  earnedMark: boolean;
  whyItEarnsMarks: string;
}

export interface FutureTopicNode {
  id: string;
  title: string;
  description: string;
}

export interface TeacherLensData {
  topicName: string;
  learningObjectives: string[];
  commonMistakes: CommonMistake[];
  examStyles: {
    title: string;
    description: string;
    frequency: "Very High" | "High" | "Moderate";
  }[];
  markingBreakdown: MarkingCriterion[];
  teacherAdvice: {
    headline: string;
    body: string;
    intuitiveAnalogy: string;
  };
  futureTopics: FutureTopicNode[];
  performanceSummary: {
    understandingText: string;
    reflectionText: string;
    assessmentText: string;
    confidenceLevel: "High" | "Medium" | "Developing";
    masteryStatus: "Mastered" | "Proficient" | "Developing";
    readinessText: string;
  };
}

export interface TeacherLensInput {
  topicName: string;
  lessonText?: string;
  academicLevel?: string;
  discipline?: string;
  performanceScore?: {
    correctCount: number;
    totalCount: number;
  };
}

export class TeacherLensEngine {
  public static generate(input: TeacherLensInput): TeacherLensData {
    const rawTopic = input.topicName || "Academic Study";
    const topic = rawTopic.trim();
    const topicLower = topic.toLowerCase();
    
    const correct = input.performanceScore?.correctCount ?? 3;
    const total = input.performanceScore?.totalCount ?? 4;
    const scorePct = total > 0 ? (correct / total) * 100 : 75;

    // --- 1. LEARNING OBJECTIVES ---
    const learningObjectives = [
      `Define and explain the core axioms of ${topic}`,
      `Identify the fundamental variables and boundary constraints governing ${topic}`,
      `Calculate and derive key quantitative relationships in ${topic}`,
      `Apply ${topic} principles to real-world engineering and scientific scenarios`,
      `Solve complex examination questions and diagnostic case studies under timed conditions`
    ];

    // --- 2. COMMON STUDENT MISTAKES ---
    let commonMistakes: CommonMistake[] = [];

    if (topicLower.includes("momentum") || topicLower.includes("force") || topicLower.includes("motion") || topicLower.includes("physics")) {
      commonMistakes = [
        {
          mistake: "Confusing Force (F) with Momentum (p)",
          explanation: "Students often treat momentum as a force acting on a body. Force is the time derivative of momentum (dp/dt), while momentum is mass times velocity (m·v).",
          correction: "Momentum is what a body possesses while moving; Force is the external action required to change that momentum."
        },
        {
          mistake: "Treating Momentum as a scalar rather than a vector quantity",
          explanation: "In multi-body collisions, students frequently add magnitudes directly without assigning positive and negative directional signs.",
          correction: "Always establish a coordinate axis (+ / -) before writing conservation of momentum equations (p_initial = p_final)."
        },
        {
          mistake: "Assuming kinetic energy is conserved in every collision",
          explanation: "Students confuse momentum conservation with kinetic energy conservation in inelastic interactions.",
          correction: "Momentum is ALWAYS conserved in closed isolated systems. Kinetic energy is only conserved in perfectly elastic collisions."
        },
        {
          mistake: "Omitting standard SI units in final derivations",
          explanation: "Dropping units like kg·m/s or N·s leads to unforced mark deductions on university exams.",
          correction: "State units explicitly at every substitution step, verifying dimensional homogeneity."
        }
      ];
    } else if (topicLower.includes("entropy") || topicLower.includes("thermo") || topicLower.includes("heat") || topicLower.includes("energy")) {
      commonMistakes = [
        {
          mistake: "Confusing Heat Transfer (Q) with Internal Energy (U)",
          explanation: "Heat is energy in transit across a boundary; internal energy is a state function stored within the thermodynamic system.",
          correction: "Treat Q as a process variable (path dependent) and U as an intrinsic property of state."
        },
        {
          mistake: "Assuming entropy cannot decrease in any subsystem",
          explanation: "Students misunderstand the Second Law, thinking local entropy can never drop.",
          correction: "Local entropy CAN decrease if work is done on the subsystem, provided total universal entropy (system + surroundings) increases."
        },
        {
          mistake: "Mixing up gauge pressure and absolute pressure in gas law equations",
          explanation: "Plugging gauge pressure directly into PV = nRT yields incorrect numerical results.",
          correction: "Always convert gauge pressure to absolute pressure (P_abs = P_gauge + P_atm) and temperatures to Kelvin."
        },
        {
          mistake: "Neglecting boundary work in non-quasistatic rapid expansions",
          explanation: "Applying reversible work formulas W = ∫P dV to turbulent or rapid unconstrained expansions.",
          correction: "Reversible work expressions only apply to ideal quasistatic processes; use energy balance for sudden changes."
        }
      ];
    } else if (topicLower.includes("search") || topicLower.includes("binary") || topicLower.includes("algorithm") || topicLower.includes("data") || topicLower.includes("code")) {
      commonMistakes = [
        {
          mistake: "Applying Binary Search to an unsorted array or list",
          explanation: "Binary Search relies on monotonic ordering to eliminate half the search space at each step.",
          correction: "Ensure the dataset is strictly sorted first, or factor in the O(N log N) sorting overhead."
        },
        {
          mistake: "Integer overflow in calculating the mid point index",
          explanation: "Writing `mid = (low + high) / 2` causes integer overflow when low + high exceeds 2^31 - 1.",
          correction: "Use `mid = low + (high - low) / 2` to guarantee overflow-safe arithmetic."
        },
        {
          mistake: "Off-by-one errors in boundary condition updates",
          explanation: "Updating `high = mid` instead of `high = mid - 1` leads to infinite loops when element is missing.",
          correction: "Carefully trace boundary convergence when low == high."
        },
        {
          mistake: "Confusing worst-case time complexity with average-case",
          explanation: "Assuming Big-O always measures average runtime rather than the mathematical upper bound.",
          correction: "Specify O(N), Ω(N), and Θ(N) precisely when writing algorithm analysis essays."
        }
      ];
    } else {
      // General academic fallback
      commonMistakes = [
        {
          mistake: "Relying on superficial memorization without understanding underlying mechanisms",
          explanation: "Students memorize key terms verbatim but struggle when examiners rephrase questions or introduce novel edge cases.",
          correction: "Focus on *why* the principle holds and how key variables interact before memorizing definitions."
        },
        {
          mistake: "Ignoring essential boundary conditions and physical assumptions",
          explanation: "Applying formulas or theoretical frameworks outside their valid domain (e.g. assuming ideal linear behavior).",
          correction: "Explicitly state the underlying assumptions at the start of your examination answers to earn full credit."
        },
        {
          mistake: "Failing to connect theoretical models to practical applications",
          explanation: "Treating the topic as abstract theory rather than a dynamic model of real-world phenomena.",
          correction: "Anchor every theoretical concept with a concrete real-world industrial or regional example."
        },
        {
          mistake: "Omitting intermediate derivation steps in written solutions",
          explanation: "Jumping straight to the final answer without showing the logical sequence of work.",
          correction: "Write out the general formula first, show explicit substitution, and underline the final evaluated answer with units."
        }
      ];
    }

    // --- 3. EXAM STYLES ---
    const examStyles = [
      {
        title: "Short Conceptual Definitions & Axioms",
        description: "Examiners test your mastery of precise terminology, fundamental principles, and foundational definitions.",
        frequency: "High" as const
      },
      {
        title: "Quantitative Derivations & Calculations",
        description: "Multi-step numerical problems requiring formula selection, variable substitution, and unit verification.",
        frequency: "Very High" as const
      },
      {
        title: "Diagram & Graph Interpretation",
        description: "Analyzing visual representations, state transitions, wave graphs, or system boundaries under variable loads.",
        frequency: "Moderate" as const
      },
      {
        title: "Socratic Essay & Comparative Analysis",
        description: "Explaining underlying mechanisms, comparing competing models, and discussing systemic trade-offs.",
        frequency: "High" as const
      },
      {
        title: "Real-World Case Study Application",
        description: "Applying the theoretical model to solve an operational or industrial scenario in real time.",
        frequency: "Moderate" as const
      }
    ];

    // --- 4. MARKING BREAKDOWN ---
    const markingBreakdown: MarkingCriterion[] = [
      {
        element: "Formula & Base Principle Identification",
        earnedMark: true,
        whyItEarnsMarks: "Proves to the examiner that you recognized the core system framework, securing partial credit even if arithmetic errors occur later."
      },
      {
        element: "Correct Variable Mapping & Substitution",
        earnedMark: true,
        whyItEarnsMarks: "Demonstrates that you correctly extracted problem parameters and converted them into appropriate standard units."
      },
      {
        element: "Step-by-Step Intermediate Derivation",
        earnedMark: scorePct >= 60,
        whyItEarnsMarks: "Examiners look for logical continuity. Clear intermediate steps prevent total point loss from simple calculation slips."
      },
      {
        element: "Evaluated Final Quantity & SI Units",
        earnedMark: scorePct >= 75,
        whyItEarnsMarks: "Validates quantitative precision and attention to mathematical detail required in professional practice."
      },
      {
        element: "Conceptual Interpretation & Real-World Meaning",
        earnedMark: scorePct >= 85,
        whyItEarnsMarks: "Top-tier marks are awarded when students add a concluding sentence explaining what the result physically signifies."
      }
    ];

    // --- 5. TEACHER'S ADVICE ---
    const teacherAdvice = {
      headline: `How to master ${topic} for exams and long-term retention`,
      body: `If you only memorize equations or bullet points, you'll feel anxious during exams because any slight variation in wording will throw you off. Instead, build a physical or conceptual mental model. Imagine the system in action—feel the forces, trace the energy, or walk through the algorithm step by step. When you understand the 'why', the 'how' becomes second nature.`,
      intuitiveAnalogy: topicLower.includes("momentum")
        ? "Imagine pushing a lightweight bicycle, then a family sedan, then a massive loaded cargo truck. The truck has immense momentum even at slow speeds because of its mass. Once it's moving, stopping it requires a huge force applied over time (Impulse). That's momentum intuition."
        : `Think of ${topic} as a self-balancing ecosystem. Every variable acts like a lever—when one shifts, the system compensates according to boundary laws until equilibrium is restored.`
    };

    // --- 6. FUTURE TOPIC CONNECTIONS ---
    const futureTopics: FutureTopicNode[] = [
      {
        id: "current",
        title: topic,
        description: "Foundational mastery achieved in today's lesson session."
      },
      {
        id: "next_1",
        title: topicLower.includes("momentum") ? "Impulse & Force Time-Integrals" : `${topic}: Advanced Dynamics`,
        description: "Explores how forces acting over time intervals change system momentum vectors."
      },
      {
        id: "next_2",
        title: topicLower.includes("momentum") ? "Elastic & Inelastic Collisions" : "Multi-Variable System Modeling",
        description: "Analyzes kinetic energy dissipation and velocity vectors in 2D and 3D interactions."
      },
      {
        id: "next_3",
        title: "Universal Conservation Laws",
        description: "Integrates energy, momentum, and angular momentum into unified field frameworks."
      }
    ];

    // --- 7. PERSONAL PERFORMANCE SUMMARY ---
    let confidenceLevel: "High" | "Medium" | "Developing" = "Medium";
    let masteryStatus: "Mastered" | "Proficient" | "Developing" = "Proficient";
    let understandingText = "You demonstrated strong conceptual grasp of the core definitions and axioms.";
    let reflectionText = "Your reflection responses showed good critical thinking when identifying systemic relationships.";
    let assessmentText = `You scored ${correct} out of ${total} (${Math.round(scorePct)}%) on the adaptive diagnostic assessment.`;
    let readinessText = `You are well-prepared to move forward into connected topics.`;

    if (scorePct >= 85) {
      confidenceLevel = "High";
      masteryStatus = "Mastered";
      understandingText = "You displayed exceptional mastery of both theoretical principles and quantitative relationships.";
      reflectionText = "Your responses were precise, well-reasoned, and correctly applied boundary conditions.";
      readinessText = `You have achieved full mastery of ${topic} and are ready to tackle advanced problem sets!`;
    } else if (scorePct < 60) {
      confidenceLevel = "Developing";
      masteryStatus = "Developing";
      understandingText = "You have established a foundational baseline, though key derivations require additional practice.";
      reflectionText = "Spending more time reviewing common student mistakes will help solidify your mental model.";
      readinessText = `We recommend completing 1-2 additional active recall practice cards before advancing.`;
    }

    return {
      topicName: topic,
      learningObjectives,
      commonMistakes,
      examStyles,
      markingBreakdown,
      teacherAdvice,
      futureTopics,
      performanceSummary: {
        understandingText,
        reflectionText,
        assessmentText,
        confidenceLevel,
        masteryStatus,
        readinessText
      }
    };
  }
}
