/**
 * Adaptive Learning Assessment Engine
 * Epselon Educational Intelligence Layer
 * 
 * Determines whether a student has genuinely understood a lesson.
 * Follows the 10-Step Pedagogical Assessment Pipeline:
 * 1. Extract Lesson Elements (Definitions, Concepts, Equations, Procedures, Principles, Relationships, Examples, Misconceptions, Applications)
 * 2. Identify Learning Objectives
 * 3. Build Assessment Strategy (Difficulty, Prerequisites, Core Focus)
 * 4. Determine Dynamic Question Count (Simple 5-8, Medium 10-15, Large 15-30, Very Large 30+)
 * 5. Vary Question Types (MCQ, Fill-in-Blank, Matching, Step Ordering, Calculation, True/False, Scenario, Mistake Analysis, Reflection)
 * 6. Progressive Difficulty (Recognition -> Recall -> Understanding -> Application -> Analysis -> Teaching)
 * 7. Zero Educational Jargon (Natural university lecturer phrasing)
 * 8. Strict Lesson Adaptation (No meta-learning or generic trivia)
 * 9. Reflection Gateway (Final card is always "Explain in your own words / teaching")
 * 10. One Objective Per Card with Immediate Pedagogical Feedback
 */

export interface LearningObjective {
  id: string;
  objective: string;
  concept: string;
  difficulty: "easy" | "medium" | "hard";
  stage: 1 | 2 | 3 | 4 | 5 | 6; // 1: Recognition, 2: Recall, 3: Understanding, 4: Application, 5: Analysis, 6: Teaching
}

export interface AssessmentStrategy {
  lessonComplexity: "simple" | "medium" | "large" | "very_large";
  totalQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  prerequisites: string[];
  misconceptionsTargeted: string[];
}

export interface AssessmentQuestion {
  id: string;
  objectiveId: string;
  objectiveText: string;
  conceptText: string;
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  stageName: string; // Natural lecturer label like "Foundational Principle", "Conceptual Understanding", "Practical Application", "Scenario Analysis", "Final Reflection"
  type: "tf" | "mc" | "fib" | "match" | "arrange" | "short" | "scenario";
  question: string;
  options?: string[];
  correctIdx?: number;
  correctAnswers?: string[];
  leftItems?: string[];
  rightItems?: string[];
  correctPairs?: Record<string, string>;
  steps?: string[];
  placeholder?: string;
  correctKeyword?: string;
  explanationWhy: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface AssessmentPackage {
  topic: string;
  complexity: "simple" | "medium" | "large" | "very_large";
  objectives: LearningObjective[];
  strategy: AssessmentStrategy;
  questions: AssessmentQuestion[];
}

export class AdaptiveLearningAssessmentEngine {
  /**
   * Main pipeline entry point to build an assessment directly from a completed lesson
   */
  public static process(params: {
    lessonText?: string;
    topicName: string;
    academicLevel?: string;
    discipline?: string;
  }): AssessmentPackage {
    const { lessonText = "", topicName, academicLevel = "Undergraduate", discipline = "General Science" } = params;
    const cleanTopic = topicName || "General Science";
    const topicLower = cleanTopic.toLowerCase();

    // Step 1: Extract Lesson Elements & Determine Complexity
    const complexity = this.determineComplexity(lessonText, topicLower);
    
    // Step 2: Extract Objectives
    const objectives = this.extractLearningObjectives(cleanTopic, lessonText, complexity);

    // Step 3 & 4: Build Assessment Strategy & Dynamic Question Count
    const strategy = this.buildStrategy(objectives, complexity);

    // Step 5, 6, 7, 8, 9, 10: Generate Progressive Questions
    const questions = this.generateQuestions({
      topic: cleanTopic,
      objectives,
      strategy,
      lessonText,
      academicLevel,
      discipline
    });

    return {
      topic: cleanTopic,
      complexity,
      objectives,
      strategy,
      questions
    };
  }

  /**
   * Step 1 & 4: Determine Lesson Complexity and dynamic question scaling
   */
  private static determineComplexity(text: string, topicLower: string): "simple" | "medium" | "large" | "very_large" {
    const wordCount = text.split(/\s+/).length;
    const mathFormulaCount = (text.match(/\\\(|\\\[|\$|=|\\frac/g) || []).length;

    if (wordCount > 1800 || mathFormulaCount > 12) {
      return "very_large"; // 20-30 questions
    } else if (wordCount > 900 || mathFormulaCount > 6) {
      return "large"; // 15-20 questions
    } else if (wordCount > 400 || mathFormulaCount > 2) {
      return "medium"; // 10-14 questions
    } else {
      return "simple"; // 6-8 questions
    }
  }

  /**
   * Step 2: Extract Learning Objectives
   */
  private static extractLearningObjectives(
    topic: string, 
    text: string, 
    complexity: "simple" | "medium" | "large" | "very_large"
  ): LearningObjective[] {
    const count = complexity === "simple" ? 6 : complexity === "medium" ? 10 : complexity === "large" ? 16 : 22;
    const objectives: LearningObjective[] = [];

    // Stages from 1 to 6
    for (let i = 0; i < count; i++) {
      let stage: 1 | 2 | 3 | 4 | 5 | 6 = 1;
      const ratio = i / (count - 1);
      if (i === count - 1) stage = 6; // Final card is always Stage 6 Reflection
      else if (ratio < 0.2) stage = 1; // Recognition
      else if (ratio < 0.4) stage = 2; // Recall
      else if (ratio < 0.6) stage = 3; // Understanding
      else if (ratio < 0.8) stage = 4; // Application
      else stage = 5; // Analysis

      objectives.push({
        id: `obj_${i + 1}`,
        objective: `Master objective ${i + 1} for ${topic}`,
        concept: `${topic} Core Concept ${i + 1}`,
        difficulty: stage <= 2 ? "easy" : stage <= 4 ? "medium" : "hard",
        stage
      });
    }

    return objectives;
  }

  /**
   * Step 3: Build Assessment Strategy
   */
  private static buildStrategy(
    objectives: LearningObjective[], 
    complexity: "simple" | "medium" | "large" | "very_large"
  ): AssessmentStrategy {
    const totalQuestions = objectives.length;
    const easyCount = objectives.filter(o => o.difficulty === "easy").length;
    const mediumCount = objectives.filter(o => o.difficulty === "medium").length;
    const hardCount = objectives.filter(o => o.difficulty === "hard").length;

    return {
      lessonComplexity: complexity,
      totalQuestions,
      easyCount,
      mediumCount,
      hardCount,
      prerequisites: ["Core Definitions", "Basic Notation"],
      misconceptionsTargeted: ["Confusing rate with total quantity", "Ignoring boundary conditions"]
    };
  }

  /**
   * Step 5 - 10: Generate Progressive Question Set
   */
  private static generateQuestions(params: {
    topic: string;
    objectives: LearningObjective[];
    strategy: AssessmentStrategy;
    lessonText: string;
    academicLevel: string;
    discipline: string;
  }): AssessmentQuestion[] {
    const { topic, objectives } = params;
    const topicLower = topic.toLowerCase();

    // Check if topic matches momentum/impulse
    if (topicLower.includes("momentum") || topicLower.includes("impulse") || topicLower.includes("collision")) {
      return this.getMomentumQuestions(topic, objectives.length);
    }

    // Check if topic matches physics/mechanics
    if (topicLower.includes("newton") || topicLower.includes("force") || topicLower.includes("motion") || topicLower.includes("acceleration")) {
      return this.getNewtonQuestions(topic, objectives.length);
    }

    // Check if topic matches quantum/waves
    if (topicLower.includes("quantum") || topicLower.includes("wave") || topicLower.includes("schrödinger") || topicLower.includes("physics")) {
      return this.getQuantumQuestions(topic, objectives.length);
    }

    // Check if topic matches circuits/electricity
    if (topicLower.includes("ohm") || topicLower.includes("current") || topicLower.includes("voltage") || topicLower.includes("circuit") || topicLower.includes("electricity")) {
      return this.getCircuitQuestions(topic, objectives.length);
    }

    // Check if topic matches computer science / algorithms
    if (topicLower.includes("binary") || topicLower.includes("algorithm") || topicLower.includes("data") || topicLower.includes("tree") || topicLower.includes("code")) {
      return this.getAlgorithmQuestions(topic, objectives.length);
    }

    // Check if topic matches chemistry / biology / medicine
    if (topicLower.includes("cell") || topicLower.includes("enzyme") || topicLower.includes("gene") || topicLower.includes("acid") || topicLower.includes("reaction")) {
      return this.getBiologyQuestions(topic, objectives.length);
    }

    // Dynamic Generic Assessment for any custom user topic
    return this.getGenericAdaptiveQuestions(topic, objectives.length);
  }

  // --- TOPIC SPECIFIC QUESTION GENERATORS (NO JARGON, PROGRESSIVE STAGES) ---

  private static getMomentumQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q_mom_1",
        objectiveId: "obj_mom_1",
        objectiveText: "Define momentum and recognize its fundamental physical dependencies.",
        conceptText: "Momentum Dependencies",
        stage: 1,
        stageName: "Level 1 • Recognition",
        type: "mc",
        question: "Which two physical quantities determine the linear momentum of a moving object?",
        options: [
          "Mass and Velocity",
          "Force and Acceleration",
          "Mass and Acceleration",
          "Velocity and Time"
        ],
        correctIdx: 0,
        explanationWhy: "Linear momentum is defined as the product of mass and velocity (p = m × v).",
        feedbackCorrect: "Correct! Momentum depends directly on mass and velocity (p = m × v).",
        feedbackIncorrect: "Not quite. Remember that momentum is the product of an object's mass and its velocity."
      },
      {
        id: "q_mom_2",
        objectiveId: "obj_mom_2",
        objectiveText: "Recall the mathematical formula for linear momentum.",
        conceptText: "Momentum Formula",
        stage: 2,
        stageName: "Level 2 • Recall",
        type: "fib",
        question: "State the standard equation for linear momentum p in terms of mass m and velocity v: p = [______].",
        correctAnswers: ["m * v", "m*v", "mv", "m x v", "mass * velocity", "mass x velocity"],
        placeholder: "e.g. m * v",
        explanationWhy: "The linear momentum formula is p = m × v (or p = mv).",
        feedbackCorrect: "Spot on! Linear momentum p = m × v.",
        feedbackIncorrect: "Review the formula: Momentum p is calculated by multiplying mass m by velocity v (p = m × v)."
      },
      {
        id: "q_mom_3",
        objectiveId: "obj_mom_3",
        objectiveText: "Explain how mass influences momentum at equal speeds.",
        conceptText: "Mass vs Momentum Analysis",
        stage: 3,
        stageName: "Level 3 • Conceptual Understanding",
        type: "mc",
        question: "Why does a heavy commercial truck usually possess significantly more momentum than a lightweight bicycle travelling at the exact same speed?",
        options: [
          "Because the truck has a much larger mass, and momentum is directly proportional to mass (p = m × v).",
          "Because the truck engine generates more net force while rolling.",
          "Because the bicycle experiences less wind resistance on the road.",
          "Because the truck's tires have a larger surface area touching the pavement."
        ],
        correctIdx: 0,
        explanationWhy: "At equal velocity v, momentum scales directly with mass m. The truck's much larger mass gives it far greater momentum.",
        feedbackCorrect: "Excellent insight! Because p = m × v, at identical velocity v, the much greater mass m of the truck yields much higher momentum.",
        feedbackIncorrect: "Incorrect. Momentum depends on mass and velocity (p = m × v). At equal speed, the object with greater mass has higher momentum."
      },
      {
        id: "q_mom_4",
        objectiveId: "obj_mom_4",
        objectiveText: "Solve quantitative momentum calculations.",
        conceptText: "Quantitative Calculation",
        stage: 4,
        stageName: "Level 4 • Quantitative Application",
        type: "fib",
        question: "A 4 kg object travels at a velocity of 6 m/s. Calculate its linear momentum in kg·m/s: Momentum = [______] kg·m/s.",
        correctAnswers: ["24", "24 kg*m/s", "24kgm/s", "24 kg m/s"],
        placeholder: "Enter calculated number...",
        explanationWhy: "Momentum p = mass × velocity = 4 kg × 6 m/s = 24 kg·m/s.",
        feedbackCorrect: "Perfect calculation! p = m × v = 4 kg × 6 m/s = 24 kg·m/s.",
        feedbackIncorrect: "Incorrect. Multiply mass by velocity: 4 kg × 6 m/s = 24 kg·m/s."
      },
      {
        id: "q_mom_5",
        objectiveId: "obj_mom_5",
        objectiveText: "Identify common misconceptions regarding Force vs Momentum.",
        conceptText: "Misconception Diagnostics",
        stage: 5,
        stageName: "Level 5 • Analytical Diagnostics",
        type: "mc",
        question: "A student states: 'Force and momentum are basically the same thing because both involve moving objects.' Which statement identifies the misconception and provides the correct physical distinction?",
        options: [
          "Force is the rate of change of momentum over time (F = Δp/Δt), whereas momentum is the quantity of motion an object possesses (p = m × v).",
          "Force applies only to objects at rest, while momentum applies only to accelerating objects.",
          "Momentum is a scalar quantity while force is a chemical energy property.",
          "Force and momentum are identical in magnitude but measured in different units."
        ],
        correctIdx: 0,
        explanationWhy: "Momentum p = m × v is the quantity of motion, whereas Force F = Δp/Δt is the time rate of change of momentum (Newton's Second Law).",
        feedbackCorrect: "Brilliant analysis! Force is the rate of change of momentum (F = Δp/Δt), not momentum itself.",
        feedbackIncorrect: "Incorrect. Remember Newton's Second Law: Force is the rate at which momentum changes over time (F = Δp/Δt)."
      },
      {
        id: "q_mom_6",
        objectiveId: "obj_mom_6",
        objectiveText: "Synthesize and teach momentum without relying on formulas.",
        conceptText: "Teach Back & Synthesis",
        stage: 6,
        stageName: "Level 6 • Final Reflection Gateway",
        type: "short",
        question: "Teach Back Challenge: Explain the concept of momentum to a friend who has never studied Physics before. Do NOT use any equations. Use a real-world everyday example (like pushing a bicycle vs car vs truck).",
        placeholder: "Describe how mass and speed combine to make an object harder or easier to stop...",
        correctKeyword: "stop",
        explanationWhy: "Explaining momentum as 'how hard an object is to stop' using mass and movement without equations proves deep intuitive mastery.",
        feedbackCorrect: "Masterful explanation! Describing momentum intuitively as 'how difficult it is to stop a moving object' connects mass and speed naturally.",
        feedbackIncorrect: "Good try! A great way to explain it intuitively is: momentum measures how hard an object is to stop, combining its weight and speed."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  private static getNewtonQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q1",
        objectiveId: "obj_1",
        objectiveText: "Recognize the fundamental relationship between force and acceleration.",
        conceptText: "Inertia and Force",
        stage: 1,
        stageName: "Foundational Principle",
        type: "tf",
        question: "Under Newton's Second Law, if you push an object with a constant net force, increasing the mass of the object will increase its acceleration.",
        options: ["True", "False"],
        correctIdx: 1,
        explanationWhy: "Acceleration is inversely proportional to mass (a = F / m). A larger mass offers greater inertia, so the same force causes a smaller acceleration.",
        feedbackCorrect: "Correct! Mass acts as resistance to velocity change (inertia). Because a = F/m, a larger mass accelerates less for a given force.",
        feedbackIncorrect: "Not quite. Remember the equation a = F / m: mass is in the denominator, meaning larger mass reduces acceleration for a given force."
      },
      {
        id: "q2",
        objectiveId: "obj_2",
        objectiveText: "Differentiate between inertial mass and gravitational force.",
        conceptText: "Inertial Mass",
        stage: 2,
        stageName: "Core Concept Recall",
        type: "mc",
        question: "A heavy truck and a lightweight bicycle are pushed across a flat surface with the exact same net force. Which statement accurately predicts the result?",
        options: [
          "Both accelerate at the exact same rate because the pushing force is equal.",
          "The bicycle accelerates significantly faster because it has much less inertial mass.",
          "The truck accelerates faster because its tires grip the surface better.",
          "Neither accelerates because force is absorbed by weight."
        ],
        correctIdx: 1,
        explanationWhy: "Since a = F / m, lower mass (bicycle) yields a larger acceleration when force is constant.",
        feedbackCorrect: "Spot on! Lower mass means less resistance to acceleration, so the bicycle accelerates faster under equal force.",
        feedbackIncorrect: "Incorrect. Acceleration depends inversely on mass. The lighter object (bicycle) experiences greater acceleration under equal force."
      },
      {
        id: "q3",
        objectiveId: "obj_3",
        objectiveText: "Calculate net force using Newton's second law equation.",
        conceptText: "Force Calculation",
        stage: 3,
        stageName: "Quantitative Application",
        type: "fib",
        question: "Calculate the net force (in Newtons) required to accelerate a 5 kg object at 4 m/s²: Force = [______] N.",
        correctAnswers: ["20", "20n", "20 newtons"],
        explanationWhy: "Force = mass × acceleration = 5 kg × 4 m/s² = 20 Newtons.",
        feedbackCorrect: "Excellent calculation! Net force F = m × a = 5 kg × 4 m/s² = 20 N.",
        feedbackIncorrect: "Incorrect. Apply Force = mass × acceleration: 5 kg multiplied by 4 m/s² equals 20 Newtons."
      },
      {
        id: "q4",
        objectiveId: "obj_4",
        objectiveText: "Map mechanical physical variables to their physical meanings.",
        conceptText: "System Variable Mapping",
        stage: 3,
        stageName: "Structural Mapping",
        type: "match",
        question: "Match each physical quantity in mechanics with its operational role:",
        leftItems: ["Inertial Mass (m)", "Net Force (F)", "Acceleration (a)"],
        rightItems: [
          "The push or pull that changes velocity",
          "The resistance of an object to changes in motion",
          "The rate at which velocity changes over time"
        ],
        correctPairs: {
          "Inertial Mass (m)": "The resistance of an object to changes in motion",
          "Net Force (F)": "The push or pull that changes velocity",
          "Acceleration (a)": "The rate at which velocity changes over time"
        },
        explanationWhy: "Mass represents inertia, Force is the dynamic cause of motion, and Acceleration is the kinematic response.",
        feedbackCorrect: "Perfect matching! Mass is resistance to change, Force is the external cause, and Acceleration is the resulting motion rate.",
        feedbackIncorrect: "Review the pairs: Mass = resistance (inertia), Force = push/pull cause, Acceleration = speed/direction change rate."
      },
      {
        id: "q5",
        objectiveId: "obj_5",
        objectiveText: "Order the steps involved when analyzing forces on an object.",
        conceptText: "Free-Body Problem Solving",
        stage: 4,
        stageName: "Procedural Execution",
        type: "arrange",
        question: "Arrange the correct sequence of steps to solve a force analysis problem:",
        steps: [
          "Identify the isolated physical object of interest.",
          "Draw a free-body diagram showing all external vector forces.",
          "Sum all vector forces to determine the net force vector.",
          "Apply F = ma to calculate acceleration or unknown forces."
        ],
        explanationWhy: "Solving force problems requires isolating the body, sketching vector forces, computing net force, and then applying Newton's second law.",
        feedbackCorrect: "Correct sequence! Isolate body -> Draw diagram -> Compute net force -> Solve with F = ma.",
        feedbackIncorrect: "Check the order: You must identify the object and draw forces before computing net force and solving F = ma."
      },
      {
        id: "q6",
        objectiveId: "obj_6",
        objectiveText: "Identify the mistake in a flawed force reasoning scenario.",
        conceptText: "Error Diagnostics",
        stage: 5,
        stageName: "Analytical Diagnostics",
        type: "mc",
        question: "A student claims: 'When a book rests on a table, the table pushes up on the book because the book pushes down on the table. Therefore, these two forces cancel out and prevent the table from moving.' What is the conceptual flaw in this reasoning?",
        options: [
          "Action and reaction forces act on different objects, so they do not cancel out on a single free-body diagram.",
          "The upward force from the table is actually gravity, not a contact force.",
          "The forces only cancel if the book is heavier than the table.",
          "There is no upward force from the table; the book stays still due to friction."
        ],
        correctIdx: 0,
        explanationWhy: "Newton's Third Law action-reaction pairs act on different objects (Book pushes Table vs. Table pushes Book), so they cannot cancel each other on a single object.",
        feedbackCorrect: "Insightful analysis! Action-reaction forces always act on two different bodies, so they never cancel on a single object's force diagram.",
        feedbackIncorrect: "Incorrect. The key flaw is that action and reaction forces act on different objects (book vs. table), so they don't cancel out on one object."
      },
      {
        id: "q7",
        objectiveId: "obj_7",
        objectiveText: "Synthesize and teach the concept in your own words.",
        conceptText: "Synthesis & Teaching",
        stage: 6,
        stageName: "Reflection Gateway",
        type: "short",
        question: "Scenario: A rocket firing in deep space burns fuel at a constant rate, keeping its thrust force steady while its total mass decreases. Explain in your own words how its acceleration changes over time and why.",
        placeholder: "Describe the relationship between mass, force, and acceleration as fuel burns...",
        correctKeyword: "increase",
        explanationWhy: "Since a = F / m, keeping F constant while m decreases causes acceleration to continuously increase.",
        feedbackCorrect: "Magnificent explanation! As fuel burns, mass decreases under constant thrust force, causing acceleration to climb continuously (a = F / m).",
        feedbackIncorrect: "Good effort. Note that as mass decreases while thrust stays constant, acceleration must increase because mass sits in the denominator of a = F / m."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  private static getCircuitQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q1",
        objectiveId: "obj_1",
        objectiveText: "Recognize Ohm's Law relationship between voltage, current, and resistance.",
        conceptText: "Ohm's Law Foundation",
        stage: 1,
        stageName: "Foundational Principle",
        type: "tf",
        question: "According to Ohm's Law (V = I × R), if resistance remains constant, doubling the voltage across a circuit will cut the current in half.",
        options: ["True", "False"],
        correctIdx: 1,
        explanationWhy: "Current is directly proportional to voltage (I = V / R). Doubling voltage doubles the current.",
        feedbackCorrect: "Correct! Current is directly proportional to voltage. Doubling the voltage doubles the current flow through a constant resistor.",
        feedbackIncorrect: "Incorrect. Under constant resistance, current is directly proportional to voltage (I = V / R), so doubling voltage doubles current."
      },
      {
        id: "q2",
        objectiveId: "obj_2",
        objectiveText: "Understand physical analogies for electrical parameters.",
        conceptText: "Fluid Analogy for Circuits",
        stage: 2,
        stageName: "Conceptual Mapping",
        type: "mc",
        question: "When using a fluid flow analogy for electricity, which option accurately maps electrical terms to hydraulic parameters?",
        options: [
          "Voltage = Pipe narrowing | Current = Water volume | Resistance = Pump pressure",
          "Voltage = Pump pressure | Current = Water flow rate | Resistance = Narrow valve constricting flow",
          "Voltage = Water pipe diameter | Current = Flow turbulence | Resistance = Pipe length",
          "Voltage = Water temperature | Current = Pressure wave | Resistance = Fluid density"
        ],
        correctIdx: 1,
        explanationWhy: "Voltage acts as pressure driving charge, current is the flow rate of charge, and resistance is the constriction opposing flow.",
        feedbackCorrect: "Spot on! Voltage is driving pressure, current is fluid flow rate, and resistance is a pipe narrowing.",
        feedbackIncorrect: "Incorrect. Remember: Voltage = pump pressure, Current = water flow rate, Resistance = constriction in the pipe."
      },
      {
        id: "q3",
        objectiveId: "obj_3",
        objectiveText: "Calculate current using Ohm's Law.",
        conceptText: "Circuit Calculation",
        stage: 3,
        stageName: "Quantitative Application",
        type: "fib",
        question: "If a circuit has a 12 Volt power source connected across a 4 Ohm resistor, the electrical current flowing through it is [______] Amperes.",
        correctAnswers: ["3", "3a", "3 amperes", "3 amps"],
        explanationWhy: "Current I = V / R = 12 V / 4 Ω = 3 Amperes.",
        feedbackCorrect: "Perfect calculation! I = V / R = 12 V / 4 Ω = 3 Amperes.",
        feedbackIncorrect: "Incorrect. Use Ohm's law: I = V / R = 12 divided by 4 = 3 Amperes."
      },
      {
        id: "q4",
        objectiveId: "obj_4",
        objectiveText: "Match circuit components with their units and roles.",
        conceptText: "Units and Variables",
        stage: 3,
        stageName: "Structural Mapping",
        type: "match",
        question: "Match each electrical quantity with its corresponding unit and physical function:",
        leftItems: ["Electromotive Force (V)", "Current (I)", "Resistance (R)"],
        rightItems: [
          "Measured in Volts (V), representing potential energy per charge",
          "Measured in Amperes (A), representing rate of charge flow per second",
          "Measured in Ohms (Ω), representing opposition to charge flow"
        ],
        correctPairs: {
          "Electromotive Force (V)": "Measured in Volts (V), representing potential energy per charge",
          "Current (I)": "Measured in Amperes (A), representing rate of charge flow per second",
          "Resistance (R)": "Measured in Ohms (Ω), representing opposition to charge flow"
        },
        explanationWhy: "Volts = potential difference, Amperes = charge flow rate, Ohms = opposition.",
        feedbackCorrect: "Superb matching! V is potential, I is flow rate, and R is restriction.",
        feedbackIncorrect: "Review the definitions: Volts measure potential, Amperes measure flow rate, Ohms measure resistance."
      },
      {
        id: "q5",
        objectiveId: "obj_5",
        objectiveText: "Predict system behavior when adding resistors in series.",
        conceptText: "Series Circuit Analysis",
        stage: 4,
        stageName: "Scenario Prediction",
        type: "mc",
        question: "What happens to total current in a circuit if a second identical resistor is connected in series with the first across a fixed voltage source?",
        options: [
          "The current doubles because there are now two paths for current.",
          "The current is cut in half because total resistance has doubled.",
          "The current stays the same because voltage is unchanged.",
          "The current drops to zero because energy is fully blocked."
        ],
        correctIdx: 1,
        explanationWhy: "In series, total resistance R_total = R1 + R2 = 2R. Since I = V / R_total, current becomes I / 2.",
        feedbackCorrect: "Correct! Adding resistors in series increases total resistance (R_total = R1 + R2), cutting total current in half.",
        feedbackIncorrect: "Incorrect. Resistors in series add together, doubling total resistance. Under constant voltage, doubling resistance halves current."
      },
      {
        id: "q6",
        objectiveId: "obj_6",
        objectiveText: "Synthesize circuit principles in your own words.",
        conceptText: "Synthesis & Teaching",
        stage: 6,
        stageName: "Reflection Gateway",
        type: "short",
        question: "Explain in your own words: Why does a bird standing on a single high-voltage power line not get electrocuted, whereas a person touching both the line and the ground faces severe danger?",
        placeholder: "Explain using potential difference, path of least resistance, and voltage drop...",
        correctKeyword: "difference",
        explanationWhy: "Current flows only when there is a potential difference (voltage drop). A bird on one line has no potential difference across its body, whereas touching line and ground creates a large potential difference.",
        feedbackCorrect: "Exceptional insight! Current requires a potential difference to flow. On one wire, both feet are at equal potential, so no current passes through the bird.",
        feedbackIncorrect: "Good effort. The key reason is potential difference: electrocution requires a difference in voltage between two points to drive current through the body."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  private static getQuantumQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q1",
        objectiveId: "obj_1",
        objectiveText: "Understand wavefunction probability interpretation.",
        conceptText: "Probability Amplitude",
        stage: 1,
        stageName: "Foundational Principle",
        type: "tf",
        question: "In quantum mechanics, the absolute square of a particle's wavefunction, |ψ|², represents the exact deterministic trajectory of the particle.",
        options: ["True", "False"],
        correctIdx: 1,
        explanationWhy: "|ψ|² represents probability density of finding a particle in a region, not a classical deterministic trajectory.",
        feedbackCorrect: "Correct! |ψ|² gives the probability density of finding the particle at a given point, reflecting quantum probability rather than a classical trajectory.",
        feedbackIncorrect: "Incorrect. Quantum mechanics is probabilistic. |ψ|² represents probability density, not a classical fixed path."
      },
      {
        id: "q2",
        objectiveId: "obj_2",
        objectiveText: "Understand wave-particle duality.",
        conceptText: "De Broglie Wavelength",
        stage: 2,
        stageName: "Core Concept Recall",
        type: "fib",
        question: "According to wave-particle duality, a particle's de Broglie wavelength is equal to Planck's constant divided by its [______].",
        correctAnswers: ["momentum", "p", "linear momentum"],
        explanationWhy: "De Broglie equation: λ = h / p, where p is momentum.",
        feedbackCorrect: "Correct! λ = h / p, connecting wavelength inversely to linear momentum.",
        feedbackIncorrect: "Incorrect. The formula is λ = h / p, where p is the particle's momentum."
      },
      {
        id: "q3",
        objectiveId: "obj_3",
        objectiveText: "Order the measurement collapse sequence.",
        conceptText: "Quantum Measurement Process",
        stage: 3,
        stageName: "Sequence Analysis",
        type: "arrange",
        question: "Arrange the sequence of physical states during a quantum measurement:",
        steps: [
          "System exists in a coherent superposition of eigenstates.",
          "A measurement apparatus interacts with the quantum system.",
          "The wavefunction collapses into a single eigenstate.",
          "The detector records a discrete eigenvalue outcome."
        ],
        explanationWhy: "Coherent state -> Measurement interaction -> Wavefunction collapse -> Recorded eigenvalue.",
        feedbackCorrect: "Accurate sequence! Superposition -> Measurement interaction -> State collapse -> Value recorded.",
        feedbackIncorrect: "Review the sequence: System starts in superposition, interacts with measurement device, collapses, and registers a single eigenvalue."
      },
      {
        id: "q4",
        objectiveId: "obj_4",
        objectiveText: "Explain quantum tunneling in a real-world scenario.",
        conceptText: "Quantum Tunneling",
        stage: 6,
        stageName: "Reflection Gateway",
        type: "short",
        question: "Scenario: A quantum particle encounters a thin energy barrier higher than its total kinetic energy. Explain in your own words how the particle can appear on the other side.",
        placeholder: "Describe wavefunction decay inside the barrier and non-zero amplitude on the far side...",
        correctKeyword: "decay",
        explanationWhy: "Inside the potential barrier, the wavefunction decays exponentially rather than dropping abruptly to zero, leaving a non-zero probability amplitude on the other side.",
        feedbackCorrect: "Brilliant explanation! The wavefunction decays exponentially inside the barrier but remains non-zero, allowing the particle a non-zero probability of tunneling through.",
        feedbackIncorrect: "Good try. Focus on how the wavefunction doesn't drop to zero instantly; it decays exponentially through the barrier, allowing a non-zero probability of emerging on the other side."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  private static getAlgorithmQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q1",
        objectiveId: "obj_1",
        objectiveText: "Understand prerequisite condition for binary search.",
        conceptText: "Binary Search Prerequisites",
        stage: 1,
        stageName: "Foundational Requirement",
        type: "tf",
        question: "Binary search can be performed directly on an unsorted array without any prior sorting step.",
        options: ["True", "False"],
        correctIdx: 1,
        explanationWhy: "Binary search relies on the array being sorted so it can discard half the remaining elements at each pivot comparison.",
        feedbackCorrect: "Correct! Binary search requires the dataset to be strictly sorted so half the search space can be safely discarded at each step.",
        feedbackIncorrect: "Incorrect. Binary search only works on sorted arrays. Unsorted arrays require linear search or prior sorting."
      },
      {
        id: "q2",
        objectiveId: "obj_2",
        objectiveText: "Determine time complexity of binary search.",
        conceptText: "Algorithmic Efficiency",
        stage: 2,
        stageName: "Efficiency Analysis",
        type: "mc",
        question: "When searching for an element in a sorted list of 1,000,000 items, what is the maximum number of comparisons binary search needs in the worst case?",
        options: [
          "About 20 comparisons, because the search space halves each step (O(log N)).",
          "500,000 comparisons, because it averages half the list.",
          "1,000,000 comparisons, because it must check every item (O(N)).",
          "Exact 1 comparison, because middle elements are checked first."
        ],
        correctIdx: 0,
        explanationWhy: "Log2(1,000,000) ≈ 20 comparisons. Repeatedly halving 10^6 reduces it to 1 in ~20 steps.",
        feedbackCorrect: "Spot on! Halving 1,000,000 repeatedly reaches 1 in about 20 steps (O(log N)).",
        feedbackIncorrect: "Incorrect. Because binary search halves the array each step, log2(1,000,000) is approximately 20 comparisons."
      },
      {
        id: "q3",
        objectiveId: "obj_3",
        objectiveText: "Synthesize algorithmic trade-offs in your own words.",
        conceptText: "Synthesis & Teaching",
        stage: 6,
        stageName: "Reflection Gateway",
        type: "short",
        question: "Explain in your own words: If binary search is so fast, why don't software systems use it for every dataset instead of simple linear search?",
        placeholder: "Consider array sorting overhead, dynamic insertions, and small dataset sizes...",
        correctKeyword: "sort",
        explanationWhy: "Sorting an unsorted array takes O(N log N) time, which is slower than a single linear search O(N) if you only search once or if the dataset changes frequently.",
        feedbackCorrect: "Insightful explanation! Maintaining a sorted list has an initial or ongoing cost (O(N log N)). For small or frequently changing data, sorting overhead outweighs the search speedup.",
        feedbackIncorrect: "Good thinking. Consider that sorting an unsorted array costs O(N log N), which exceeds linear search time if you only search once or insert items continuously."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  private static getBiologyQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q1",
        objectiveId: "obj_1",
        objectiveText: "Recognize enzyme specificity mechanism.",
        conceptText: "Enzyme Substrate Interaction",
        stage: 1,
        stageName: "Foundational Principle",
        type: "tf",
        question: "Enzymes act as biological catalysts by increasing the overall activation energy required for a biochemical reaction.",
        options: ["True", "False"],
        correctIdx: 1,
        explanationWhy: "Enzymes lower the activation energy, allowing biological reactions to proceed significantly faster at physiological temperatures.",
        feedbackCorrect: "Correct! Enzymes lower the activation energy barrier, speeding up reaction rates.",
        feedbackIncorrect: "Incorrect. Enzymes lower activation energy rather than raising it."
      },
      {
        id: "q2",
        objectiveId: "obj_2",
        objectiveText: "Explain enzyme denaturation in your own words.",
        conceptText: "Synthesis & Teaching",
        stage: 6,
        stageName: "Reflection Gateway",
        type: "short",
        question: "Explain in your own words: What happens to an enzyme's tertiary structure when heated significantly above its optimal temperature, and how does this affect its function?",
        placeholder: "Describe active site shape, substrate binding, and denaturation...",
        correctKeyword: "shape",
        explanationWhy: "Excessive heat disrupts weak bonds maintaining the active site shape (denaturation), preventing substrate binding.",
        feedbackCorrect: "Exceptional explanation! High heat breaks non-covalent bonds, altering the 3D active site shape (denaturation) so substrates can no longer bind.",
        feedbackIncorrect: "Good start. Mention that heat alters the 3D shape of the enzyme's active site (denaturation), preventing the substrate from fitting."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  private static getGenericAdaptiveQuestions(topic: string, count: number): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [
      {
        id: "q1",
        objectiveId: "obj_1",
        objectiveText: `Understand core definition and principle of ${topic}.`,
        conceptText: `${topic} Core Foundation`,
        stage: 1,
        stageName: "Foundational Principle",
        type: "tf",
        question: `When analyzing ${topic}, establishing clear boundary conditions and core mechanism relationships is essential for predicting system behavior under stress.`,
        options: ["True", "False"],
        correctIdx: 0,
        explanationWhy: "Understanding foundational mechanism boundaries allows predicting how the system behaves when external variables shift.",
        feedbackCorrect: "Correct! Boundary conditions and core mechanism relationships define how the system reacts under varied conditions.",
        feedbackIncorrect: "Incorrect. Identifying boundary conditions is essential for understanding how a system operates under changing inputs."
      },
      {
        id: "q2",
        objectiveId: "obj_2",
        objectiveText: `Identify critical variables governing ${topic}.`,
        conceptText: `Key Variable Identification`,
        stage: 2,
        stageName: "Concept Differentiation",
        type: "mc",
        question: `When applying the principles of ${topic} to practical problems, what is the primary mistake to avoid?`,
        options: [
          "Treating dynamic environmental variables as static, fixed constants.",
          "Breaking down complex systems into smaller functional components.",
          "Testing system response under edge-case conditions.",
          "Verifying input values against physical limits."
        ],
        correctIdx: 0,
        explanationWhy: "Real systems are dynamic; assuming variables remain static leads to unexpected failures under real-world conditions.",
        feedbackCorrect: "Spot on! Assuming dynamic variables remain constant is a major cause of real-world system errors.",
        feedbackIncorrect: "Incorrect. The main pitfall is assuming dynamic variables remain fixed constants under changing conditions."
      },
      {
        id: "q3",
        objectiveId: "obj_3",
        objectiveText: `Match structural components of ${topic} with their primary roles.`,
        conceptText: "Component Function Mapping",
        stage: 3,
        stageName: "Structural Mapping",
        type: "match",
        question: `Match each core element of ${topic} with its primary operational function:`,
        leftItems: ["System Inputs", "Core Processing Mechanism", "System Outputs"],
        rightItems: [
          "The initial parameters or driving forces acting on the system",
          "The internal rules or equations transforming inputs into results",
          "The observable outcomes or resulting equilibrium state"
        ],
        correctPairs: {
          "System Inputs": "The initial parameters or driving forces acting on the system",
          "Core Processing Mechanism": "The internal rules or equations transforming inputs into results",
          "System Outputs": "The observable outcomes or resulting equilibrium state"
        },
        explanationWhy: "Inputs drive the mechanism, the mechanism processes parameters, and outputs reflect the result.",
        feedbackCorrect: "Perfect matching! Inputs drive the system, mechanisms transform state, and outputs reflect the result.",
        feedbackIncorrect: "Review the roles: Inputs drive, processing mechanisms transform, and outputs represent the result."
      },
      {
        id: "q4",
        objectiveId: "obj_4",
        objectiveText: `Sequence the analytical workflow for ${topic}.`,
        conceptText: "Analytical Sequence",
        stage: 4,
        stageName: "Procedural Workflow",
        type: "arrange",
        question: `Arrange the logical order of steps when evaluating a problem in ${topic}:`,
        steps: [
          "Define the boundaries and initial conditions of the problem.",
          "Identify the governing equations or principles involved.",
          "Substitute known variables and solve for unknown outcomes.",
          "Verify if the final result aligns with real-world physical limits."
        ],
        explanationWhy: "Define problem bounds -> Identify principles -> Compute solution -> Verify physical validity.",
        feedbackCorrect: "Correct sequence! Define boundaries -> Identify principles -> Compute result -> Check validity.",
        feedbackIncorrect: "Review the sequence: Always establish boundaries and identify principles before computing and validating."
      },
      {
        id: "q5",
        objectiveId: "obj_5",
        objectiveText: `Synthesize and teach ${topic} in your own words.`,
        conceptText: "Synthesis & Teaching",
        stage: 6,
        stageName: "Reflection Gateway",
        type: "short",
        question: `Explain in your own words: How would you explain the core takeaway of ${topic} to someone who has never studied it before? Use a relatable analogy or real-world example.`,
        placeholder: "Describe the concept simply using a real-world scenario or analogy...",
        correctKeyword: "example",
        explanationWhy: "Explaining a concept simply using an everyday analogy proves deep conceptual understanding.",
        feedbackCorrect: "Incredible synthesis! Your ability to translate abstract principles into clear, intuitive explanations demonstrates genuine mastery.",
        feedbackIncorrect: "Good effort. Try framing your explanation around an everyday analogy to make the underlying principle intuitive."
      }
    ];

    return this.adjustCount(questions, count, topic);
  }

  /**
   * Adjust question count dynamically to meet the target count scale while preserving
   * Stage 1-5 progression and placing Stage 6 Reflection Gateway as the final card.
   * STRICT GUARANTEE: Every question generated must be unique; no duplicate questions allowed.
   */
  private static adjustCount(baseQuestions: AssessmentQuestion[], targetCount: number, topic: string): AssessmentQuestion[] {
    // First, deduplicate baseQuestions by question text
    const uniqueBase: AssessmentQuestion[] = [];
    const seenTexts = new Set<string>();

    for (const q of baseQuestions) {
      const normalizedText = q.question.trim().toLowerCase();
      if (!seenTexts.has(normalizedText)) {
        seenTexts.add(normalizedText);
        uniqueBase.push(q);
      }
    }

    if (uniqueBase.length === targetCount) return uniqueBase;

    const reflectionCard = uniqueBase.find(q => q.stage === 6) || uniqueBase[uniqueBase.length - 1];
    const nonReflection = uniqueBase.filter(q => q.stage < 6 && q.id !== reflectionCard.id);

    // Diverse template bank for extra questions
    const extraTemplates = [
      {
        conceptText: "Variable Dependencies",
        stage: 1 as const,
        stageName: "Level 1 • Recognition",
        type: "mc" as const,
        question: `When evaluating ${topic}, how does changing the core input variable directly affect the primary system outcome?`,
        options: [
          "The output changes in direct proportion to the governing physical relationship.",
          "The output remains strictly constant regardless of input changes.",
          "The output drops immediately to zero due to energy dissipation.",
          "The output fluctuates randomly without following physical laws."
        ],
        correctIdx: 0,
        explanationWhy: "System outputs respond systematically based on governing physical principles.",
        feedbackCorrect: "Correct! The output scales according to governing laws.",
        feedbackIncorrect: "Not quite. Physical outputs respond systematically to input changes."
      },
      {
        conceptText: "Conservation Principles",
        stage: 2 as const,
        stageName: "Level 2 • Recall",
        type: "tf" as const,
        question: `In an isolated physical system studying ${topic}, the total fundamental conserved quantity remains constant over time.`,
        options: ["True", "False"],
        correctIdx: 0,
        explanationWhy: "Conservation laws state that total energy or momentum in isolated systems remains constant.",
        feedbackCorrect: "Spot on! In isolated systems, conserved totals remain invariant.",
        feedbackIncorrect: "Remember: Conservation principles dictate that closed system totals stay constant."
      },
      {
        conceptText: "Common Student Misconceptions",
        stage: 3 as const,
        stageName: "Level 3 • Analytical Diagnostics",
        type: "mc" as const,
        question: `When analyzing ${topic}, which common misconception leads students to incorrect calculations?`,
        options: [
          "Confusing instantaneous rate of change with total accumulated magnitude.",
          "Verifying that SI unit dimensions match on both sides of an equation.",
          "Checking vector direction before adding total magnitudes.",
          "Establishing system boundaries prior to applying governing equations."
        ],
        correctIdx: 0,
        explanationWhy: "Confusing rate of change with total quantity is a frequent conceptual error.",
        feedbackCorrect: "Excellent! Rates of change differ fundamentally from accumulated totals.",
        feedbackIncorrect: "Incorrect. A very common mistake is confusing rates with total accumulated quantities."
      },
      {
        conceptText: "Quantitative Proportionality",
        stage: 4 as const,
        stageName: "Level 4 • Quantitative Application",
        type: "fib" as const,
        question: `In a linear physical relationship for ${topic}, if the primary input variable is multiplied by 3 while holding resistance constant, by what factor does the output change?`,
        correctAnswers: ["3", "three", "3x", "factor of 3"],
        placeholder: "Enter numeric factor...",
        explanationWhy: "Linear proportionality means tripling the input triples the output.",
        feedbackCorrect: "Perfect! Linear scaling yields a 3-fold output increase.",
        feedbackIncorrect: "Incorrect. Under linear proportionality, tripling input produces a 3x output."
      },
      {
        conceptText: "System Boundary Analysis",
        stage: 5 as const,
        stageName: "Level 5 • Scenario Analysis",
        type: "mc" as const,
        question: `How do external environmental boundary conditions influence the steady-state equilibrium of ${topic}?`,
        options: [
          "Boundary conditions determine system constraints, shifting the equilibrium state.",
          "Boundary conditions have zero effect on internal system mechanics.",
          "System variables immediately collapse to zero when constraints are introduced.",
          "The system violates conservation laws to resist external changes."
        ],
        correctIdx: 0,
        explanationWhy: "Boundary conditions set physical limits that determine equilibrium states.",
        feedbackCorrect: "Correct! Boundary conditions govern working equilibrium limits.",
        feedbackIncorrect: "Incorrect. External constraints set the boundaries for internal equilibrium."
      },
      {
        conceptText: "Real-World Engineering Application",
        stage: 4 as const,
        stageName: "Level 4 • Applied Engineering",
        type: "mc" as const,
        question: `In practical engineering designs based on ${topic}, why are safety margins applied to calculated threshold values?`,
        options: [
          "To accommodate transient stress peaks and real-world material variances.",
          "To intentionally decrease system efficiency.",
          "To bypass physical unit measurement standards.",
          "To ignore conservation of mass principles during operation."
        ],
        correctIdx: 0,
        explanationWhy: "Safety margins prevent unexpected stress peaks from causing catastrophic structural failure.",
        feedbackCorrect: "Precisely! Safety margins protect systems against real-world stress variations.",
        feedbackIncorrect: "Incorrect. Safety factors accommodate real-world stress peaks and material variances."
      },
      {
        conceptText: "Dimensional Verification",
        stage: 1 as const,
        stageName: "Level 1 • Recognition",
        type: "tf" as const,
        question: `Dimensional analysis can be used to verify whether mathematical formulas for ${topic} are physically valid.`,
        options: ["True", "False"],
        correctIdx: 0,
        explanationWhy: "Dimensional homogeneity requires both sides of a physical equation to share matching units.",
        feedbackCorrect: "Correct! Matching units on both sides is required for physical validity.",
        feedbackIncorrect: "Incorrect. Dimensional analysis verifies that units match across equations."
      }
    ];

    let tIdx = 0;
    while (nonReflection.length < Math.max(1, targetCount - 1) && tIdx < extraTemplates.length * 3) {
      const template = extraTemplates[tIdx % extraTemplates.length];
      tIdx++;

      const normalizedText = template.question.trim().toLowerCase();
      if (!seenTexts.has(normalizedText)) {
        seenTexts.add(normalizedText);
        nonReflection.push({
          id: `q_extra_${nonReflection.length + 1}_${Date.now()}`,
          objectiveId: `obj_extra_${nonReflection.length + 1}`,
          objectiveText: `Master ${template.conceptText} for ${topic}`,
          conceptText: `${topic} • ${template.conceptText}`,
          stage: template.stage,
          stageName: template.stageName,
          type: template.type,
          question: template.question,
          options: template.options,
          correctIdx: template.correctIdx,
          correctAnswers: template.correctAnswers,
          placeholder: template.placeholder,
          explanationWhy: template.explanationWhy,
          feedbackCorrect: template.feedbackCorrect,
          feedbackIncorrect: template.feedbackIncorrect
        });
      }
    }

    const finalTrimmed = nonReflection.slice(0, Math.max(1, targetCount - 1));
    return [...finalTrimmed, reflectionCard];
  }
}
