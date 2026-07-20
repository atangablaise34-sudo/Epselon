import { KnowledgeGraphState, CognitiveNode, CognitiveLink } from "./types";

// Predefined relational concept database to grow the graph organically and establish cross-subject links
interface PredefinedConcept {
  label: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  desc: string;
  category: string;
  prereqs: string[];
  related: string[];
  nextConcepts: string[];
}

export const PREDEFINED_CONCEPTS: Record<string, PredefinedConcept> = {
  // Quantum Mechanics Series
  "schrödinger wavefunction": {
    label: "Schrödinger Wavefunction",
    subject: "Quantum Physics",
    difficulty: "hard",
    desc: "A mathematical description of the quantum state of an isolated physical system.",
    category: "Wave Mechanics",
    prereqs: ["Complex Numbers", "Classical Wave Physics"],
    related: ["Heisenberg Uncertainty Principle", "Eigenstates & Operators"],
    nextConcepts: ["Heisenberg Uncertainty Principle", "Eigenstates & Operators"]
  },
  "heisenberg uncertainty principle": {
    label: "Heisenberg Uncertainty Principle",
    subject: "Quantum Physics",
    difficulty: "medium",
    desc: "Asserts a fundamental limit to the precision with which certain pairs of physical properties can be known.",
    category: "Quantum Principles",
    prereqs: ["Schrödinger Wavefunction"],
    related: ["De Broglie Duality"],
    nextConcepts: ["Double-Slit Diffraction"]
  },
  "eigenstates & operators": {
    label: "Eigenstates & Operators",
    subject: "Quantum Physics",
    difficulty: "hard",
    desc: "Represent physical observables as linear operators acting on Hilbert space vectors.",
    category: "Mathematical Setup",
    prereqs: ["Schrödinger Wavefunction"],
    related: ["Hilbert Space Formulations"],
    nextConcepts: ["Hilbert Space Formulations"]
  },
  "double-slit diffraction": {
    label: "Double-Slit Diffraction",
    subject: "Quantum Physics",
    difficulty: "medium",
    desc: "The classic demonstration of quantum wave-particle superposition and interference patterns.",
    category: "Physical Experiments",
    prereqs: ["Classical Wave Physics"],
    related: ["De Broglie Duality"],
    nextConcepts: ["Heisenberg Uncertainty Principle"]
  },
  "de broglie duality": {
    label: "De Broglie Duality",
    subject: "Quantum Physics",
    difficulty: "easy",
    desc: "Formulates that any moving particle has an associated wave character with λ = h/p.",
    category: "Wave Mechanics",
    prereqs: ["Classical Wave Physics"],
    related: ["Double-Slit Diffraction"],
    nextConcepts: ["Heisenberg Uncertainty Principle"]
  },
  "hilbert space formulations": {
    label: "Hilbert Space Formulations",
    subject: "Quantum Physics",
    difficulty: "hard",
    desc: "An abstract vector space possessing the structure of an inner product that allows length and angle measurement.",
    category: "Mathematical Setup",
    prereqs: ["Eigenstates & Operators"],
    related: ["Quantum Mechanics"],
    nextConcepts: []
  },

  // Physics: Newtonian Motion
  "newton's laws": {
    label: "Newton's Laws",
    subject: "Newtonian Physics",
    difficulty: "easy",
    desc: "Three physical laws that together laid the foundation for classical mechanics.",
    category: "Classical Mechanics",
    prereqs: ["Classical Wave Physics"],
    related: ["Force", "Mass", "Acceleration"],
    nextConcepts: ["Force"]
  },
  "force": {
    label: "Force",
    subject: "Newtonian Physics",
    difficulty: "easy",
    desc: "An interaction that, when unopposed, will change the motion of an object.",
    category: "Classical Mechanics",
    prereqs: ["Newton's Laws"],
    related: ["Mass", "Acceleration"],
    nextConcepts: ["Mass", "Acceleration"]
  },
  "mass": {
    label: "Mass",
    subject: "Newtonian Physics",
    difficulty: "easy",
    desc: "A quantitative measure of inertia, a fundamental property of all matter.",
    category: "Classical Mechanics",
    prereqs: ["Newton's Laws"],
    related: ["Force", "Acceleration"],
    nextConcepts: ["Momentum"]
  },
  "acceleration": {
    label: "Acceleration",
    subject: "Newtonian Physics",
    difficulty: "easy",
    desc: "The rate at which the velocity of an object changes with time.",
    category: "Classical Mechanics",
    prereqs: ["Newton's Laws"],
    related: ["Force", "Mass"],
    nextConcepts: ["Momentum"]
  },
  "momentum": {
    label: "Momentum",
    subject: "Newtonian Physics",
    difficulty: "medium",
    desc: "The product of the mass and velocity of an object, describing its quantity of motion.",
    category: "Classical Mechanics",
    prereqs: ["Force", "Mass", "Acceleration"],
    related: ["Impulse"],
    nextConcepts: ["Impulse"]
  },
  "impulse": {
    label: "Impulse",
    subject: "Newtonian Physics",
    difficulty: "medium",
    desc: "The integral of a force over the time interval for which it acts, changing momentum.",
    category: "Classical Mechanics",
    prereqs: ["Momentum"],
    related: ["Force"],
    nextConcepts: []
  },

  // Thermodynamics Series
  "heat transfer": {
    label: "Heat Transfer",
    subject: "Thermodynamics",
    difficulty: "medium",
    desc: "The movement of thermal energy from one physical system to another.",
    category: "Thermodynamics",
    prereqs: ["Energy"],
    related: ["Thermodynamics", "Entropy", "Conduction", "Radiation"],
    nextConcepts: ["Thermodynamics"]
  },
  "thermodynamics": {
    label: "Thermodynamics",
    subject: "Thermodynamics",
    difficulty: "hard",
    desc: "The branch of physics that deals with the relationships between heat and other forms of energy.",
    category: "Thermodynamics",
    prereqs: ["Heat Transfer"],
    related: ["Entropy", "Energy"],
    nextConcepts: ["Entropy"]
  },
  "entropy": {
    label: "Entropy",
    subject: "Thermodynamics",
    difficulty: "hard",
    desc: "An intrinsic measure of disorder or complexity, acting as a foundational pivot across physics, mechanics, chemistry, and information theory.",
    category: "Thermodynamics",
    prereqs: ["Thermodynamics"],
    related: ["Energy"],
    nextConcepts: []
  },
  "conduction": {
    label: "Conduction",
    subject: "Thermodynamics",
    difficulty: "easy",
    desc: "The process by which heat or electricity is directly transmitted through a substance.",
    category: "Thermal Mechanics",
    prereqs: ["Heat Transfer"],
    related: ["Radiation"],
    nextConcepts: []
  },
  "radiation": {
    label: "Radiation",
    subject: "Thermodynamics",
    difficulty: "medium",
    desc: "The emission or transmission of energy in the form of waves or particles through space.",
    category: "Thermal Mechanics",
    prereqs: ["Heat Transfer"],
    related: ["Conduction"],
    nextConcepts: []
  },

  // Math & Engineering
  "calculus": {
    label: "Calculus",
    subject: "Mathematics",
    difficulty: "medium",
    desc: "The mathematical study of continuous change, encompassing derivatives and integrals.",
    category: "Mathematics",
    prereqs: ["Complex Numbers"],
    related: ["Engineering Mathematics"],
    nextConcepts: ["Engineering Mathematics"]
  },
  "engineering mathematics": {
    label: "Engineering Mathematics",
    subject: "Engineering",
    difficulty: "hard",
    desc: "Specialized mathematical methods and techniques used to solve complex engineering systems.",
    category: "Mathematics",
    prereqs: ["Calculus"],
    related: ["Machine Design"],
    nextConcepts: ["Machine Design"]
  },
  "machine design": {
    label: "Machine Design",
    subject: "Engineering",
    difficulty: "hard",
    desc: "The formulation, development, and selection of mechanical structures for maximum efficiency.",
    category: "Mechanical Engineering",
    prereqs: ["Engineering Mathematics"],
    related: ["Control Systems"],
    nextConcepts: ["Control Systems"]
  },
  "control systems": {
    label: "Control Systems",
    subject: "Engineering",
    difficulty: "hard",
    desc: "Manages, commands, directs, or regulates the behavior of other devices or systems using control loops.",
    category: "Systems Engineering",
    prereqs: ["Machine Design"],
    related: ["Fluid Mechanics"],
    nextConcepts: ["Fluid Mechanics"]
  },
  "fluid mechanics": {
    label: "Fluid Mechanics",
    subject: "Engineering",
    difficulty: "hard",
    desc: "The branch of physics concerned with the mechanics of fluids (liquids, gases, and plasmas) and the forces on them.",
    category: "Systems Engineering",
    prereqs: ["Control Systems"],
    related: [],
    nextConcepts: []
  }
};

/**
 * Normalizes a topic/concept name to a clean, unique ID.
 */
export function getNormalizedConceptId(name: string): string {
  return "node_" + name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/**
 * Calculates the categorical state of a node based on its mastery and confidence.
 */
export function calculateNodeState(mastery: number, confidence: number, forceNeedsRevision = false): CognitiveNode["state"] {
  if (forceNeedsRevision) return "Needs Revision";
  if (confidence < 45) return "Needs Revision";
  
  if (mastery < 15) return "Unknown";
  if (mastery < 30) return "Introduced";
  if (mastery < 50) return "Learning";
  if (mastery < 70) return "Practicing";
  if (mastery < 90) return "Confident";
  return "Mastered";
}

/**
 * Dynamically self-heals and migrates older database objects to the new 
 * highly-structured Knowledge Object specification at runtime.
 */
export function ensureKnowledgeObjectFields(node: any, topic?: string): CognitiveNode {
  const label = node.label || topic || "Unknown Concept";
  const finalId = node.id || getNormalizedConceptId(label);
  
  const mastery = typeof node.mastery === "number" ? node.mastery : 10;
  const confidence = typeof node.confidenceScore === "number" ? node.confidenceScore : 25;

  return {
    id: finalId,
    label: label,
    canonicalName: node.canonicalName || label,
    aliases: node.aliases || [label],
    definition: node.definition || node.desc || `An emerging conceptual paradigm in the student's study curriculum.`,
    contexts: node.contexts || (node.group ? [node.group] : ["General Science"]),
    difficulty: node.difficulty || "medium",
    examples: node.examples || [],
    equations: node.equations || (node.equation ? [node.equation] : []),
    prerequisites: node.prerequisites || node.prereqs || [],
    relatedConcepts: node.relatedConcepts || [],
    mastery: mastery,
    sourceConversations: node.sourceConversations || [],
    learningSessions: node.learningSessions || [],
    
    // Legacy fields mapped safely:
    group: node.group || "general",
    confidenceScore: confidence,
    timesStudied: node.timesStudied || 0,
    timesReviewed: node.timesReviewed || 0,
    reflectionScores: node.reflectionScores || [],
    practiceScores: node.practiceScores || [],
    lastStudiedDate: node.lastStudiedDate || new Date().toISOString(),
    state: node.state || calculateNodeState(mastery, confidence),
    prerequisiteConcepts: node.prerequisiteConcepts || node.prereqs || [],
    recommendedNextConcepts: node.recommendedNextConcepts || [],
    
    // Dynamic visual status indicators:
    recentActivity: node.recentActivity || false,
    ringProgress: node.ringProgress || mastery
  };
}

/**
 * Performs a highly-sophisticated similarity search across existing Knowledge Objects.
 * This ensures equivalent concepts studied in different subjects (e.g., "Entropy" 
 * in physics vs computer science) merge cleanly instead of fragmenting.
 */
export function similaritySearch(graph: KnowledgeGraphState, topic: string): CognitiveNode | null {
  const cleanTopic = topic.toLowerCase().trim();
  const normalizedId = getNormalizedConceptId(topic);

  // 1. Direct ID match
  let found = graph.nodes.find(n => n.id === normalizedId);
  if (found) return found;

  // 2. Exact match on canonicalName, label or aliases
  found = graph.nodes.find(n => {
    const canonical = n.canonicalName?.toLowerCase() || "";
    const label = n.label?.toLowerCase() || "";
    const aliases = (n.aliases || []).map(a => a.toLowerCase());
    return canonical === cleanTopic || label === cleanTopic || aliases.includes(cleanTopic);
  });
  if (found) return found;

  // 3. Substring matching for singular/plural or prefix variants
  found = graph.nodes.find(n => {
    const canonical = n.canonicalName?.toLowerCase() || "";
    const label = n.label?.toLowerCase() || "";
    return (canonical.length > 3 && (canonical.includes(cleanTopic) || cleanTopic.includes(canonical))) ||
           (label.length > 3 && (label.includes(cleanTopic) || cleanTopic.includes(label)));
  });
  if (found) return found;

  return null;
}

/**
 * Retrieves or creates a node in the graph, ensuring full compliance with the 
 * Knowledge Object schema, organic connection growth, and cross-subject fusion.
 */
export function getOrCreateNode(graph: KnowledgeGraphState, topic: string): CognitiveNode {
  // Try to find the existing Node utilizing our similarity matching (fuses multiple domains!)
  const existingNode = similaritySearch(graph, topic);
  if (existingNode) {
    const updated = ensureKnowledgeObjectFields(existingNode, topic);
    const idx = graph.nodes.findIndex(n => n.id === existingNode.id);
    if (idx !== -1) {
      graph.nodes[idx] = updated;
    }
    return updated;
  }

  const nodeId = getNormalizedConceptId(topic);
  const cleanKey = topic.toLowerCase().trim();
  const predefined = PREDEFINED_CONCEPTS[cleanKey];

  const rawNode: any = {
    id: nodeId,
    label: predefined?.label || topic,
    canonicalName: predefined?.label || topic,
    aliases: [topic],
    definition: predefined?.desc || `Foundational conceptual map for studying ${topic}.`,
    contexts: predefined?.subject ? [predefined.subject] : ["General Science"],
    difficulty: predefined?.difficulty || "medium",
    examples: [],
    equations: [],
    prerequisites: predefined?.prereqs || [],
    relatedConcepts: predefined?.related || [],
    mastery: 10,
    sourceConversations: [],
    learningSessions: [],
    group: predefined?.subject.toLowerCase().replace(/\s+/g, "_") || "general",
    confidenceScore: 25,
    timesStudied: 0,
    timesReviewed: 0,
    reflectionScores: [],
    practiceScores: [],
    lastStudiedDate: new Date().toISOString(),
    prerequisiteConcepts: predefined?.prereqs || [],
    recommendedNextConcepts: predefined?.nextConcepts || [],
    state: "Introduced",
    recentActivity: true,
    ringProgress: 10
  };

  const newNode = ensureKnowledgeObjectFields(rawNode, topic);
  graph.nodes.push(newNode);

  // Automatically grow connections organically using predefined relationships
  if (predefined) {
    // 1. Prerequisites
    predefined.prereqs.forEach(prereq => {
      const prereqNode = getOrCreateNode(graph, prereq);
      const prereqId = prereqNode.id;
      
      // Add dependency link with appropriate relationship type
      if (!graph.links.some(l => (l.source === prereqId && l.target === nodeId) || (l.source === nodeId && l.target === prereqId))) {
        graph.links.push({
          source: prereqId,
          target: nodeId,
          type: "Prerequisite",
          strength: 60
        });
      }
    });

    // 2. Related connections (cross-subject or horizontal)
    predefined.related.forEach(rel => {
      const relNode = getOrCreateNode(graph, rel);
      const relId = relNode.id;
      
      if (!graph.links.some(l => (l.source === relId && l.target === nodeId) || (l.source === nodeId && l.target === relId))) {
        graph.links.push({
          source: nodeId,
          target: relId,
          type: "Builds Upon",
          strength: 40
        });
      }
    });
  } else {
    // If we have a custom topic, try to connect it to an existing central node to maintain graph integrity
    if (graph.nodes.length > 1) {
      const parentNode = graph.nodes[0];
      if (parentNode.id !== nodeId) {
        if (!graph.links.some(l => l.source === parentNode.id && l.target === nodeId)) {
          graph.links.push({
            source: parentNode.id,
            target: nodeId,
            type: "Builds Upon",
            strength: 30
          });
        }
      }
    }
  }

  return newNode;
}

/**
 * 1. TRIGGER: LESSON COMPLETION
 * Reading the lesson builds base confidence and signals understanding.
 */
export function triggerLessonCompletion(graph: KnowledgeGraphState, topic: string): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  node.timesStudied = (node.timesStudied || 0) + 1;
  node.mastery = Math.min(100, Math.max(node.mastery, node.mastery + 15));
  node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + 15);
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 2. TRIGGER: REFLECTION COMPLETION
 * Diagnostic validation from a reflection gateway score.
 */
export function triggerReflectionCompletion(graph: KnowledgeGraphState, topic: string, score: number): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  node.timesReviewed = (node.timesReviewed || 0) + 1;
  if (!node.reflectionScores) node.reflectionScores = [];
  node.reflectionScores.push(score);

  // Evolve mastery and confidence based on score
  const masteryBoost = Math.round(score * 0.15); // max +15
  const confidenceBoost = Math.round(score * 0.12); // max +12
  node.mastery = Math.min(100, node.mastery + masteryBoost);
  node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + confidenceBoost);
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 3. TRIGGER: QUIZ COMPLETION
 * End-of-concept mini-quizzes and dynamic questions.
 */
export function triggerQuizCompletion(graph: KnowledgeGraphState, topic: string, isCorrect: boolean): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  node.timesReviewed = (node.timesReviewed || 0) + 1;
  if (!node.practiceScores) node.practiceScores = [];
  node.practiceScores.push(isCorrect ? 100 : 0);

  if (isCorrect) {
    node.mastery = Math.min(100, node.mastery + 8);
    node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + 10);
  } else {
    node.confidenceScore = Math.max(0, (node.confidenceScore || 0) - 12);
    node.mastery = Math.max(0, node.mastery - 2);
  }
  
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 4. TRIGGER: FLASHCARD REVIEW
 * Active Leitner box review outcome.
 */
export function triggerFlashcardReview(graph: KnowledgeGraphState, conceptName: string, isCorrect: boolean): KnowledgeGraphState {
  const node = getOrCreateNode(graph, conceptName);
  node.timesReviewed = (node.timesReviewed || 0) + 1;

  if (isCorrect) {
    node.mastery = Math.min(100, node.mastery + 5);
    node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + 8);
  } else {
    node.confidenceScore = Math.max(0, (node.confidenceScore || 0) - 15);
    node.mastery = Math.max(0, node.mastery - 3);
  }

  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 5. TRIGGER: PRACTICE SESSION
 * Completed independent practice or problem solving.
 */
export function triggerPracticeSession(graph: KnowledgeGraphState, topic: string, score: number): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  node.timesReviewed = (node.timesReviewed || 0) + 1;
  if (!node.practiceScores) node.practiceScores = [];
  node.practiceScores.push(score);

  const boost = Math.round(score * 0.1);
  node.mastery = Math.min(100, node.mastery + boost);
  node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + boost);
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 6. TRIGGER: REPEATED TOPIC VISITS
 * Re-studying or re-visiting a lesson boosts familiarity.
 */
export function triggerRepeatedTopicVisits(graph: KnowledgeGraphState, topic: string): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  node.timesStudied = (node.timesStudied || 0) + 1;
  
  // Minor incremental boost in confidence due to familiarity
  node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + 4);
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 7. TRIGGER: SUCCESSFUL EXPLANATION
 * When Socratic coach detects student gave a brilliant answer or definition.
 */
export function triggerSuccessfulExplanation(graph: KnowledgeGraphState, topic: string): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  node.timesReviewed = (node.timesReviewed || 0) + 1;
  
  // High mastery/confidence boost for active cognitive retrieval
  node.mastery = Math.min(100, node.mastery + 12);
  node.confidenceScore = Math.min(100, (node.confidenceScore || 0) + 15);
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore);

  return { ...graph };
}

/**
 * 8. TRIGGER: REPEATED MISTAKES
 * Failing concepts or hitting roadblocks repeatedly.
 */
export function triggerRepeatedMistakes(graph: KnowledgeGraphState, topic: string): KnowledgeGraphState {
  const node = getOrCreateNode(graph, topic);
  
  node.confidenceScore = Math.max(0, (node.confidenceScore || 0) - 20);
  node.mastery = Math.max(0, node.mastery - 5);
  node.lastStudiedDate = new Date().toISOString();
  node.recentActivity = true;
  node.ringProgress = node.mastery;
  node.state = calculateNodeState(node.mastery, node.confidenceScore, true); // Force Needs Revision

  return { ...graph };
}

/**
 * KNOWLEDGE DECAY SIMULATOR
 * Decreases confidence score over time if not studied/reviewed.
 * Simulates memory forgetting curves realistically.
 */
export function applyKnowledgeDecay(graph: KnowledgeGraphState, daysPassed: number = 1): KnowledgeGraphState {
  const now = new Date();
  
  graph.nodes.forEach((rawNode, idx) => {
    const node = ensureKnowledgeObjectFields(rawNode);
    graph.nodes[idx] = node;

    // Decay the glow state (recent activity) over time
    node.recentActivity = false;

    if (!node.lastStudiedDate) return;
    const lastDate = new Date(node.lastStudiedDate);
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 3) {
      // Decay confidence Score by 4% per simulated day beyond 3 days of neglect
      const decayAmount = Math.round(4 * daysPassed);
      node.confidenceScore = Math.max(10, (node.confidenceScore || 25) - decayAmount);
      node.state = calculateNodeState(node.mastery, node.confidenceScore || 25);
    }
  });

  return { ...graph };
}

/**
 * FLASHCARD AUTO-GENERATION TRIGGERS
 * Detects if any node has transitioned to a state where automated Leitner revision
 * flashcards should be issued automatically.
 */
export interface FlashcardTriggerAction {
  conceptId: string;
  conceptLabel: string;
  front: string;
  back: string;
}

export function detectFlashcardTriggers(graph: KnowledgeGraphState): FlashcardTriggerAction[] {
  const triggers: FlashcardTriggerAction[] = [];
  
  graph.nodes.forEach(rawNode => {
    const node = ensureKnowledgeObjectFields(rawNode);
    // Only trigger for concepts where flashcard generation has not already occurred
    // We check node state: if they are "Learning", "Practicing", or "Mastered"
    if (node.state === "Learning" || node.state === "Practicing" || node.state === "Mastered") {
      const hasHighTimesStudied = (node.timesStudied || 0) >= 1;
      const isNewConcept = node.timesReviewed === 0 || !node.reflectionScores || node.reflectionScores.length === 0;
      
      if (hasHighTimesStudied && isNewConcept) {
        triggers.push({
          conceptId: node.id,
          conceptLabel: node.label,
          front: `Explicate the core intellectual model and core system boundaries of ${node.label}.`,
          back: `The primary framework of ${node.label} represents a critical node in ${node.contexts.join(" & ") || "scientific theories"}. Key prerequisite anchors include: ${(node.prerequisites || []).join(", ") || "first-principles"}.`
        });
      }
    }
  });

  return triggers;
}

/**
 * RECOMMENDATION ENGINE
 * Analyzes the Knowledge Graph to generate priorities, reviews, next topics, and missing prerequisites.
 */
export interface GraphRecommendations {
  topicsToReview: string[];
  missingPrerequisites: Array<{ struggleTopic: string; missingTopic: string }>;
  nextBestTopics: string[];
  weakConcepts: string[];
  strongConcepts: string[];
  revisionPriorities: string[];
}

export function generateRecommendations(graph: KnowledgeGraphState): GraphRecommendations {
  const weakConcepts: string[] = [];
  const strongConcepts: string[] = [];
  const topicsToReview: string[] = [];
  const revisionPriorities: string[] = [];
  const missingPrerequisites: Array<{ struggleTopic: string; missingTopic: string }> = [];
  const nextBestTopics: string[] = [];

  graph.nodes.forEach(rawNode => {
    const node = ensureKnowledgeObjectFields(rawNode);
    // Weak and strong concepts
    if (node.mastery < 50 || node.state === "Needs Revision") {
      weakConcepts.push(node.label);
    } else if (node.mastery >= 75 && node.state === "Mastered") {
      strongConcepts.push(node.label);
    }

    // Revision priorities
    if (node.state === "Needs Revision" || (node.confidenceScore && node.confidenceScore < 50)) {
      revisionPriorities.push(node.label);
      topicsToReview.push(node.label);
    }

    // Prerequisite warning detection
    if ((node.mastery < 60 || node.state === "Needs Revision") && node.prerequisites && node.prerequisites.length > 0) {
      node.prerequisites.forEach(prereqLabel => {
        const prereqId = getNormalizedConceptId(prereqLabel);
        const prereqNode = graph.nodes.find(n => n.id === prereqId);
        if (!prereqNode || prereqNode.mastery < 60 || prereqNode.state === "Needs Revision") {
          missingPrerequisites.push({
            struggleTopic: node.label,
            missingTopic: prereqLabel
          });
        }
      });
    }

    // Suggest recommended next best topic
    if (node.mastery >= 70 && node.recommendedNextConcepts && node.recommendedNextConcepts.length > 0) {
      node.recommendedNextConcepts.forEach(nextLabel => {
        const nextId = getNormalizedConceptId(nextLabel);
        const nextNode = graph.nodes.find(n => n.id === nextId);
        if (!nextNode || nextNode.mastery < 15) {
          if (!nextBestTopics.includes(nextLabel)) {
            nextBestTopics.push(nextLabel);
          }
        }
      });
    }
  });

  // Default suggestions if lists are empty
  if (nextBestTopics.length === 0) {
    Object.values(PREDEFINED_CONCEPTS).forEach(prec => {
      const id = getNormalizedConceptId(prec.label);
      if (!graph.nodes.some(n => n.id === id)) {
        nextBestTopics.push(prec.label);
      }
    });
  }

  return {
    topicsToReview: Array.from(new Set(topicsToReview)).slice(0, 4),
    missingPrerequisites: missingPrerequisites.slice(0, 3),
    nextBestTopics: Array.from(new Set(nextBestTopics)).slice(0, 4),
    weakConcepts: Array.from(new Set(weakConcepts)).slice(0, 4),
    strongConcepts: Array.from(new Set(strongConcepts)).slice(0, 4),
    revisionPriorities: Array.from(new Set(revisionPriorities)).slice(0, 4)
  };
}

/**
 * PERSONALIZATION ENGINE CONSULTANT
 * Returns custom instructions for the AI model's system prompt based on graph state.
 */
export function getPersonalizationDirective(graph: KnowledgeGraphState, currentTopic: string): string {
  const nodeId = getNormalizedConceptId(currentTopic);
  const node = graph.nodes.find(n => n.id === nodeId);
  
  let directive = "";

  if (node) {
    if (node.state === "Needs Revision" || node.mastery < 55) {
      directive += `\n[PERSONALIZATION DIRECTIVE] Student has a WEAK or NEGLECTED understanding of the current topic "${node.label}" (Mastery: ${node.mastery}%, Confidence: ${node.confidenceScore}%). SLOW DOWN explanations, decompose equations to their most fundamental algebraic axioms, use visceral analogies, and offer more concrete physical illustrations. Avoid complex cognitive leaps.`;
    } else if (node.state === "Mastered" || node.mastery >= 85) {
      directive += `\n[PERSONALIZATION DIRECTIVE] Student has MASTERED the current topic "${node.label}" (Mastery: ${node.mastery}%). Skip basic introductory definitions. Dive immediately into advanced applications, complex boundary constraints, and rigorous mathematical proofs. Offer high-difficulty active recall prompts.`;
    } else {
      directive += `\n[PERSONALIZATION DIRECTIVE] Student is currently active in practicing "${node.label}" (Mastery: ${node.mastery}%). Provide balanced scaffolded explanations under Bloom's higher-order cognitive domains.`;
    }

    // Check prerequisites
    if (node.prerequisites && node.prerequisites.length > 0) {
      const understoodPrereqs: string[] = [];
      const strugglingPrereqs: string[] = [];

      node.prerequisites.forEach(prLabel => {
        const prId = getNormalizedConceptId(prLabel);
        const prNode = graph.nodes.find(n => n.id === prId);
        if (prNode && prNode.mastery >= 70) {
          understoodPrereqs.push(prLabel);
        } else {
          strugglingPrereqs.push(prLabel);
        }
      });

      if (understoodPrereqs.length > 0) {
        directive += `\n[COGNITIVE ASSUMPTION] Do NOT repeat core definitions for prerequisites the student already understands: ${understoodPrereqs.join(", ")}. Connect the current lesson directly to these stable anchor concepts.`;
      }
      if (strugglingPrereqs.length > 0) {
        directive += `\n[SOCIOPEDAGOGICAL WARNING] Student exhibits potential gaps in critical prerequisite dependencies: ${strugglingPrereqs.join(", ")}. Gently weave in references or micro-review blocks of these prerequisites where they intersect with "${node.label}".`;
      }
    }
  } else {
    // If the topic is completely new, analyze overall strengths/weaknesses of the user
    const masteredCount = graph.nodes.filter(n => n.mastery >= 75).map(n => n.label);
    const weakCount = graph.nodes.filter(n => n.mastery < 50).map(n => n.label);

    if (masteredCount.length > 0) {
      directive += `\n[STUDENT CORE STRENGTHS] Student is highly confident in: ${masteredCount.slice(0, 3).join(", ")}. You can draw cross-subject connections or structural analogies to these concepts.`;
    }
    if (weakCount.length > 0) {
      directive += `\n[STUDENT INTELLECTUAL ROADBLOCKS] Student exhibits historical struggles in: ${weakCount.slice(0, 3).join(", ")}. Be cautious of mathematical tools resembling those areas.`;
    }
  }

  return directive;
}

/**
 * REDESIGNED KNOWLEDGE GRAPH AUTO-UPDATE & EXTRACTION ENGINE
 * Every completed learning session, this parses response content/topics, extracts concepts, 
 * definitions, examples, equations, and misconceptions, updates mastery, and links relationships dynamically.
 * It is called at the end of every active study conversation turn.
 */
export function extractAndEnrichKnowledge(
  graph: KnowledgeGraphState,
  sessionFocus: string,
  sessionText: string,
  sessionId: string,
  academicSubject: string
): KnowledgeGraphState {
  // Ensure all existing nodes are in compliance with our standard KnowledgeObject schema
  graph.nodes = graph.nodes.map(n => ensureKnowledgeObjectFields(n));

  // Find or create the main focal concept utilizing our similarity matches
  const mainNode = getOrCreateNode(graph, sessionFocus);
  
  // Set dynamic visual parameters & track session metadata
  mainNode.timesStudied = (mainNode.timesStudied || 0) + 1;
  mainNode.lastStudiedDate = new Date().toISOString();
  mainNode.recentActivity = true;

  if (!mainNode.learningSessions.includes(sessionId)) {
    mainNode.learningSessions.push(sessionId);
  }
  
  if (!mainNode.contexts.includes(academicSubject)) {
    mainNode.contexts.push(academicSubject);
  }

  // 1. Extract Equations dynamically from text
  const equations: string[] = [];
  const eqRegex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
  let eqMatch;
  while ((eqMatch = eqRegex.exec(sessionText)) !== null) {
    const rawEq = (eqMatch[1] || eqMatch[2] || eqMatch[3] || "").trim();
    if (rawEq && rawEq.length > 3 && !equations.includes(rawEq)) {
      equations.push(rawEq);
    }
  }

  if (equations.length === 0) {
    // Sub-search for common mathematical expressions containing standard LaTeX triggers
    const lines = sessionText.split("\n");
    lines.forEach(line => {
      if (line.includes("=") && (line.includes("\\") || line.includes("Δ") || line.includes("Ψ") || line.includes("∇") || line.includes("ℏ") || line.includes("λ") || line.includes("c^2"))) {
        const cleanLine = line.replace(/^[-\*\s]*/, "").trim();
        if (cleanLine.length > 5 && cleanLine.length < 100) {
          equations.push(cleanLine);
        }
      }
    });
  }

  // Strengthen/add extracted equations, never overwriting previous learnings
  equations.forEach(eq => {
    if (!mainNode.equations.includes(eq)) {
      mainNode.equations.push(eq);
    }
  });

  // 2. Extract Examples & Analogies dynamically from text
  const examples: string[] = [];
  const lines = sessionText.split("\n");
  lines.forEach(line => {
    const lower = line.toLowerCase();
    if ((lower.includes("example:") || lower.includes("analogy:") || lower.includes("instance:") || lower.includes("like a")) && line.length > 20 && line.length < 200) {
      examples.push(line.replace(/^[-\*\s]*(example|analogy|instance):\s*/i, "").trim());
    }
  });

  examples.forEach(ex => {
    if (!mainNode.examples.includes(ex)) {
      mainNode.examples.push(ex);
    }
  });

  // 3. Update Mastery Score & Spaced Repetition status
  mainNode.mastery = Math.min(100, mainNode.mastery + 12);
  mainNode.ringProgress = mainNode.mastery;
  mainNode.confidenceScore = Math.min(100, (mainNode.confidenceScore || 25) + 10);
  mainNode.state = calculateNodeState(mainNode.mastery, mainNode.confidenceScore);

  // 4. Strengthen Relationships / Create New Edges organically using PREDEFINED or similarity targets
  Object.keys(PREDEFINED_CONCEPTS).forEach(preKey => {
    if (preKey !== sessionFocus.toLowerCase().trim() && sessionText.toLowerCase().includes(preKey)) {
      const relatedNode = getOrCreateNode(graph, PREDEFINED_CONCEPTS[preKey].label);
      const relationshipType = PREDEFINED_CONCEPTS[preKey].prereqs.includes(mainNode.canonicalName) 
        ? "Prerequisite" 
        : (PREDEFINED_CONCEPTS[preKey].related.includes(mainNode.canonicalName) ? "Builds Upon" : "Frequently Studied Together");
      
      const sourceId = mainNode.id;
      const targetId = relatedNode.id;

      if (sourceId !== targetId) {
        const linkIndex = graph.links.findIndex(l => 
          (l.source === sourceId && l.target === targetId) || 
          (l.source === targetId && l.target === sourceId)
        );

        if (linkIndex !== -1) {
          graph.links[linkIndex].strength = Math.min(100, (graph.links[linkIndex].strength || 40) + 15);
        } else {
          graph.links.push({
            source: sourceId,
            target: targetId,
            type: relationshipType,
            strength: 40
          });
        }
      }
    }
  });

  return { ...graph };
}
