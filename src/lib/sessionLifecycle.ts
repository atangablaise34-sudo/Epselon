import { StudySession, ChatMessage, UserProfile, SessionStatus } from "../types";
import { saveDraftSession, saveCompletedSession, clearDraftSession } from "./db";
import { generateSessionMarkdown, generateSessionPDF } from "./sessionExporter";

function logLifecycle(event: string, details?: any) {
  console.log(`%c[LIFECYCLE] ${event}`, "color: #6366f1; font-weight: bold;", details || "");
}

/**
 * Creates a new living StudySession object.
 */
export function createLivingStudySession(params: {
  title?: string;
  subject?: string;
  mode?: string;
  difficulty?: string;
  originalPrompt?: string;
  user?: UserProfile | null;
}): StudySession {
  const now = new Date().toISOString();
  const id = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  const subject = params.subject || params.title || "General Discipline";
  const title = params.title || `Session: ${subject}`;
  const mode = params.mode || "Socratic";
  const difficulty = params.difficulty || "Intermediate";

  const session: StudySession = {
    id,
    title,
    mode,
    subject,
    createdAt: now,
    lastUpdated: now,
    status: "CREATED",
    metadata: {
      studentName: params.user?.fullName || "Student",
      university: params.user?.university || "Academic Workspace",
      faculty: params.user?.faculty || "General",
      department: params.user?.department || "General",
    },
    originalPrompt: params.originalPrompt || "",
    enhancedPrompt: "",
    messages: [
      {
        id: "msg_init_" + id,
        sender: "mentor",
        text: `Welcome to your deep-focus session on "${subject}". I have set up our learning framework for ${difficulty} level (${mode} Mode). What aspect would you like to explore first?`,
        timestamp: "Just Now",
      },
    ],
    lessonCards: [],
    reflectionCards: [],
    reflectionAnswers: [],
    assessmentQuestions: [],
    assessmentAnswers: [],
    teacherLens: null,
    knowledgeGraphUpdates: [],
    mastery: 10,
    recommendations: [`Explore fundamental principles of ${subject}`, `Practice Socratic problem solving`],
    personalNotes: [],
    attachments: [],
    exportStatus: {
      markdownGenerated: false,
      pdfGenerated: false,
    },
    // Backward compatibility
    focus: subject,
    difficulty,
    bloomLevel: "Analysis",
    strategy: mode,
    progress: 5,
    outline: [`Core Principles of ${subject}`, `Analytical Breakdown`, `Real-World Application`],
  };

  logLifecycle("Session Created", { id, title, status: session.status });
  // Save initial draft asynchronously
  saveDraftSession(session).catch((err) => console.warn("[DRAFT] Failed to save initial draft:", err));

  return session;
}

/**
 * Updates the prompt when submitted/coached.
 */
export function updateSessionPrompt(session: StudySession, originalPrompt: string, enhancedPrompt?: string): StudySession {
  const updated: StudySession = {
    ...session,
    status: session.status === "CREATED" ? "ACTIVE" : session.status,
    originalPrompt: originalPrompt || session.originalPrompt,
    enhancedPrompt: enhancedPrompt || session.enhancedPrompt || originalPrompt,
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("Prompt Updated", { id: session.id, originalPrompt, enhancedPrompt });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * Appends an AI message to the active session.
 */
export function appendAIMessage(session: StudySession, message: ChatMessage): StudySession {
  const exists = session.messages.some((m) => m.id === message.id);
  const newMessages = exists ? session.messages : [...session.messages, message];

  const updated: StudySession = {
    ...session,
    status: session.status === "CREATED" ? "ACTIVE" : session.status,
    messages: newMessages,
    progress: Math.min(95, Math.max(session.progress || 10, newMessages.length * 15)),
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("AI Response Added", { id: session.id, messageId: message.id, sender: message.sender });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * Appends or updates a study card.
 */
export function addLessonCard(session: StudySession, card: { id: string; title: string; content: string; type?: string }): StudySession {
  const exists = session.lessonCards.some((c) => c.id === card.id || c.title === card.title);
  const lessonCards = exists ? session.lessonCards : [...session.lessonCards, card];

  const updated: StudySession = {
    ...session,
    lessonCards,
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("Study Card Added", { id: session.id, cardTitle: card.title });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * Saves reflection answers.
 */
export function recordReflection(session: StudySession, answers: any[]): StudySession {
  const updated: StudySession = {
    ...session,
    status: "REFLECTING",
    reflectionAnswers: answers,
    mastery: Math.min(100, (session.mastery || 10) + 15),
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("Reflection Saved", { id: session.id, answerCount: answers.length });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * Saves assessment results.
 */
export function recordAssessment(session: StudySession, answers: any[]): StudySession {
  const updated: StudySession = {
    ...session,
    status: "ASSESSMENT",
    assessmentAnswers: answers,
    mastery: Math.min(100, (session.mastery || 10) + 20),
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("Assessment Saved", { id: session.id, answerCount: answers.length });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * Saves Teacher Lens data.
 */
export function recordTeacherLens(session: StudySession, teacherLensData: any): StudySession {
  const updated: StudySession = {
    ...session,
    status: "TEACHER_LENS",
    teacherLens: teacherLensData,
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("Teacher Lens Saved", { id: session.id, teacherLensData });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * Appends knowledge graph link / update.
 */
export function recordKnowledgeGraphUpdate(session: StudySession, update: { concept: string; targetConcept?: string; relationship?: string; masteryDelta?: number }): StudySession {
  const updated: StudySession = {
    ...session,
    knowledgeGraphUpdates: [...(session.knowledgeGraphUpdates || []), update],
    lastUpdated: new Date().toISOString(),
  };

  logLifecycle("Knowledge Graph Updated", { id: session.id, concept: update.concept });
  saveDraftSession(updated).catch(() => {});
  return updated;
}

/**
 * FINALIZATION PIPELINE:
 * Triggered ONLY when student explicitly finishes studying ("Finish Session").
 */
export async function finalizeSession(
  session: StudySession,
  user?: UserProfile | null
): Promise<{
  finalizedSession: StudySession;
  markdownContent: string;
  pdfBlob: Blob;
}> {
  const now = new Date().toISOString();

  // 1. Verify and freeze session object
  const finalizedSession: StudySession = {
    ...session,
    status: "COMPLETED",
    progress: 100,
    mastery: Math.max(session.mastery || 75, 85),
    lastUpdated: now,
    exportStatus: {
      markdownGenerated: true,
      pdfGenerated: true,
      generatedAt: now,
    },
  };

  logLifecycle("Session Finalized", { id: session.id, title: session.title, status: "COMPLETED" });

  // 2. Generate Markdown from the FINAL session object
  const markdownContent = generateSessionMarkdown(finalizedSession, user);
  logLifecycle("Markdown Generated", { id: session.id, length: markdownContent.length });

  // 3. Generate PDF from the exact same FINAL session object
  const pdfBlob = generateSessionPDF(finalizedSession, user);
  logLifecycle("PDF Generated", { id: session.id, blobSize: pdfBlob.size });

  // 4. Update Recall Data & Knowledge Graph
  const recallConcept = {
    concept: finalizedSession.subject || finalizedSession.title,
    masteryDelta: 10,
    relationship: "Completed Study Session",
  };
  finalizedSession.knowledgeGraphUpdates = [...(finalizedSession.knowledgeGraphUpdates || []), recallConcept];
  logLifecycle("Recall Updated", { id: session.id, subject: finalizedSession.subject });

  // 5. Save finalized session locally in IndexedDB completed_sessions
  await saveCompletedSession(finalizedSession);

  // 6. Clear draft store
  await clearDraftSession(session.id);

  return {
    finalizedSession,
    markdownContent,
    pdfBlob,
  };
}
