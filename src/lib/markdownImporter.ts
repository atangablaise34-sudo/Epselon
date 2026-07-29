import { StudySession, ChatMessage } from "../types";
import { getCompletedSession, saveCompletedSession } from "./db";

export interface MarkdownImportResult {
  session: StudySession;
  status: "imported" | "updated" | "skipped_older" | "invalid";
  reason?: string;
}

/**
 * Validates whether a Markdown string is a valid Epselon export.
 */
export function validateEpselonMarkdown(markdown: string): boolean {
  if (!markdown || typeof markdown !== "string") return false;
  const hasMetadataHeader = markdown.includes("Session Metadata") || markdown.includes("Subject / Focus:");
  const hasDialogueOrPrompts = markdown.includes("Socratic Dialogue") || markdown.includes("Learning Inquiry") || markdown.includes("# ");
  return hasMetadataHeader || hasDialogueOrPrompts;
}

/**
 * Parses an Epselon exported Markdown string into a full StudySession object.
 */
export function parseMarkdownToSession(markdown: string, filename?: string): StudySession | null {
  if (!validateEpselonMarkdown(markdown)) return null;

  try {
    const lines = markdown.split("\n");

    // Title parsing
    let title = "Imported Study Session";
    const titleLine = lines.find((l) => l.startsWith("# "));
    if (titleLine) {
      title = titleLine.replace("# ", "").trim();
    } else if (filename) {
      title = filename.replace(/\.md$/i, "").replace(/_/g, " ");
    }

    // Extract metadata
    const extractMeta = (key: string): string => {
      const match = markdown.match(new RegExp(`- \\*\\*${key}:\\*\\*\\s*(.+)`, "i"));
      return match ? match[1].trim() : "";
    };

    const subject = extractMeta("Subject / Focus") || title || "General Study";
    const mode = extractMeta("Study Mode") || "Socratic";
    const statusVal = extractMeta("Status") || "COMPLETED";
    const difficulty = extractMeta("Difficulty Level") || "Intermediate";
    const bloomLevel = extractMeta("Bloom's Taxonomy Level") || "Analysis";
    
    const rawMastery = extractMeta("Mastery Score").replace("%", "");
    const mastery = rawMastery ? parseInt(rawMastery, 10) : 85;

    const createdAtStr = extractMeta("Created At");
    const exportDateStr = extractMeta("Finalized / Export Date");

    const createdAt = createdAtStr && !isNaN(Date.parse(createdAtStr))
      ? new Date(createdAtStr).toISOString()
      : new Date().toISOString();

    const lastUpdated = exportDateStr && !isNaN(Date.parse(exportDateStr))
      ? new Date(exportDateStr).toISOString()
      : createdAt;

    // Deterministic Session ID from title & creation timestamp if none exists
    const safeTitleSlug = subject.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const id = `session_imported_${safeTitleSlug}_${Date.parse(createdAt) || Date.now()}`;

    // Extract Sections
    const sections: Record<string, string> = {};
    let currentSection = "";
    lines.forEach((line) => {
      if (line.startsWith("## ")) {
        currentSection = line.replace("## ", "").trim();
        sections[currentSection] = "";
      } else if (currentSection) {
        sections[currentSection] += line + "\n";
      }
    });

    const getSectionText = (pattern: string): string => {
      const matchedKey = Object.keys(sections).find((k) => k.toLowerCase().includes(pattern.toLowerCase()));
      return matchedKey ? sections[matchedKey].trim() : "";
    };

    // Prompts
    const promptSec = getSectionText("Prompt") || getSectionText("Inquiry");
    let originalPrompt = "";
    let enhancedPrompt = "";
    if (promptSec) {
      const origMatch = promptSec.match(/\*\*Original Prompt:\*\*\s*\n?>\s*"?(.*?)"?\n/i);
      if (origMatch) originalPrompt = origMatch[1].trim();
      const enhMatch = promptSec.match(/\*\*Coached & Enhanced Prompt:\*\*\s*\n?>\s*"?(.*?)"?\n/i);
      if (enhMatch) enhancedPrompt = enhMatch[1].trim();
    }

    // Outline
    const outlineSec = getSectionText("Syllabus") || getSectionText("Landmarks");
    const outline: string[] = [];
    if (outlineSec) {
      outlineSec.split("\n").forEach((l) => {
        if (l.trim().startsWith("- ")) {
          outline.push(l.trim().replace(/^-\s*/, ""));
        }
      });
    }

    // Lesson Cards
    const cardsSec = getSectionText("Lesson") || getSectionText("Cards");
    const lessonCards: Array<{ id: string; title: string; content: string }> = [];
    if (cardsSec) {
      const cardBlocks = cardsSec.split(/(?=### Card \d+:|### )/g);
      cardBlocks.forEach((block, idx) => {
        if (!block.trim()) return;
        const cardTitleMatch = block.match(/### (?:Card \d+:\s*)?(.*)/);
        const cardTitle = cardTitleMatch ? cardTitleMatch[1].trim() : `Lesson Concept ${idx + 1}`;
        const content = block.replace(/### .*/, "").trim();
        if (content) {
          lessonCards.push({ id: `card_${id}_${idx}`, title: cardTitle, content });
        }
      });
    }

    // Reflection Answers
    const reflectSec = getSectionText("Reflection") || getSectionText("Self-Assessment");
    const reflectionAnswers: Array<{ question: string; answer: string; feedback?: string }> = [];
    if (reflectSec) {
      const items = reflectSec.split(/\*\*Question \d+:\*\*/i);
      items.forEach((item) => {
        if (!item.trim()) return;
        const qLines = item.trim().split("\n");
        const question = qLines[0].trim();
        const ansMatch = item.match(/> \*\*Student Answer:\*\*\s*(.*)/i);
        const fbMatch = item.match(/> \*\*Feedback \/ Evaluation:\*\*\s*(.*)/i);
        if (question && ansMatch) {
          reflectionAnswers.push({
            question,
            answer: ansMatch[1].trim(),
            feedback: fbMatch ? fbMatch[1].trim() : undefined,
          });
        }
      });
    }

    // Assessment
    const assessSec = getSectionText("Assessment");
    const assessmentAnswers: Array<{ question: string; selectedAnswer: string; isCorrect: boolean }> = [];
    if (assessSec) {
      const items = assessSec.split(/\*\*Item \d+:\*\*/i);
      items.forEach((item) => {
        if (!item.trim()) return;
        const lines = item.trim().split("\n");
        const question = lines[0].trim();
        const selMatch = item.match(/> \*\*Selected Answer:\*\*\s*(.*)/i);
        const resMatch = item.match(/> \*\*Result:\*\*\s*(.*)/i);
        if (question && selMatch) {
          assessmentAnswers.push({
            question,
            selectedAnswer: selMatch[1].trim(),
            isCorrect: resMatch ? resMatch[1].includes("Correct") : true,
          });
        }
      });
    }

    // Teacher Lens
    const teacherSec = getSectionText("Teacher Lens") || getSectionText("Examiner");
    let teacherLens: StudySession["teacherLens"] = null;
    if (teacherSec) {
      const notesMatch = teacherSec.match(/\*\*Discussion Notes:\*\*\s*\n?([\s\S]*?)(?=\*\*Key Strengths|\*\*Areas for Improvement|\*\*Examiner Grade|$)/i);
      const gradeMatch = teacherSec.match(/\*\*Examiner Grade Recommendation:\*\*\s*(.*)/i);
      
      const strengths: string[] = [];
      const strengthsMatch = teacherSec.match(/\*\*Key Strengths:\*\*\s*\n?([\s\S]*?)(?=\*\*Areas for Improvement|\*\*Examiner Grade|$)/i);
      if (strengthsMatch) {
        strengthsMatch[1].split("\n").forEach((l) => {
          if (l.trim().startsWith("- ")) strengths.push(l.trim().replace(/^-\s*/, ""));
        });
      }

      const gaps: string[] = [];
      const gapsMatch = teacherSec.match(/\*\*Areas for Improvement \/ Common Traps:\*\*\s*\n?([\s\S]*?)(?=\*\*Examiner Grade|$)/i);
      if (gapsMatch) {
        gapsMatch[1].split("\n").forEach((l) => {
          if (l.trim().startsWith("- ")) gaps.push(l.trim().replace(/^-\s*/, ""));
        });
      }

      teacherLens = {
        discussionNotes: notesMatch ? notesMatch[1].trim() : undefined,
        studentStrengths: strengths,
        gapAreas: gaps,
        gradeRecommendation: gradeMatch ? gradeMatch[1].trim() : undefined,
        completedAt: lastUpdated,
      };
    }

    // Knowledge Graph
    const kgSec = getSectionText("Knowledge Graph");
    const knowledgeGraphUpdates: StudySession["knowledgeGraphUpdates"] = [];
    if (kgSec) {
      kgSec.split("\n").forEach((l) => {
        if (l.trim().startsWith("- **Concept:**")) {
          const conceptMatch = l.match(/\*\*Concept:\*\*\s*([^(➔\n]+)(?:\(([^)]+)\))?(?:\s*➔\s*(.+))?/);
          if (conceptMatch) {
            knowledgeGraphUpdates.push({
              concept: conceptMatch[1].trim(),
              relationship: conceptMatch[2] ? conceptMatch[2].trim() : undefined,
              targetConcept: conceptMatch[3] ? conceptMatch[3].trim() : undefined,
            });
          }
        }
      });
    }

    // Dialogue Transcript
    const dialogueSec = getSectionText("Dialogue") || getSectionText("Transcript");
    const messages: ChatMessage[] = [];
    if (dialogueSec) {
      const msgBlocks = dialogueSec.split(/(?=### )/g);
      msgBlocks.forEach((block, idx) => {
        if (!block.trim()) return;
        const headerMatch = block.match(/### (.*?)(?:\s*\*\(.*?\)\*)?\n/);
        const headerText = headerMatch ? headerMatch[1].trim() : "";
        const sender: "mentor" | "student" = headerText.toLowerCase().includes("nimo") || headerText.toLowerCase().includes("mentor") || headerText.toLowerCase().includes("ai")
          ? "mentor"
          : "student";
        
        const bodyText = block.replace(/### .*\n/, "").replace(/^> .*\n/gm, "").trim();
        if (bodyText) {
          messages.push({
            id: `msg_imp_${id}_${idx}`,
            sender,
            text: bodyText,
            timestamp: "Imported Log",
          });
        }
      });
    }

    // Fallback welcome message if dialogue transcript was empty
    if (messages.length === 0) {
      messages.push({
        id: `msg_init_${id}`,
        sender: "mentor",
        text: `Restored session archive on "${subject}". All lesson study cards, reflection evaluations, and examiner notes have been loaded into your Local Knowledge Vault.`,
        timestamp: "Archived",
      });
    }

    // Recommendations & Personal Notes
    const recSec = getSectionText("Recommended");
    const recommendations: string[] = [];
    if (recSec) {
      recSec.split("\n").forEach((l) => {
        if (l.trim().startsWith("- ")) recommendations.push(l.trim().replace(/^-\s*/, ""));
      });
    }

    const notesSec = getSectionText("Personal Student Notes") || getSectionText("Notes");
    const personalNotes: string[] = [];
    if (notesSec) {
      notesSec.split("\n").forEach((l) => {
        if (l.trim().startsWith("- ")) personalNotes.push(l.trim().replace(/^-\s*/, ""));
      });
    }

    const session: StudySession = {
      id,
      title,
      mode,
      subject,
      createdAt,
      lastUpdated,
      status: (statusVal as any) || "COMPLETED",
      metadata: {
        imported: true,
        importSource: filename || "Markdown File",
        importedAt: new Date().toISOString(),
      },
      originalPrompt: originalPrompt || `Deep study session on ${subject}`,
      enhancedPrompt: enhancedPrompt || originalPrompt,
      messages,
      lessonCards,
      reflectionCards: [],
      reflectionAnswers,
      assessmentQuestions: [],
      assessmentAnswers,
      teacherLens,
      knowledgeGraphUpdates,
      mastery,
      recommendations: recommendations.length > 0 ? recommendations : [`Continue deep exploration of ${subject}`],
      personalNotes,
      attachments: [],
      exportStatus: {
        markdownGenerated: true,
        pdfGenerated: true,
        generatedAt: lastUpdated,
      },
      // Compatibility fields
      focus: subject,
      difficulty: difficulty as any,
      bloomLevel,
      strategy: mode,
      progress: 100,
      outline: outline.length > 0 ? outline : [`Core Principles of ${subject}`],
    };

    return session;
  } catch (err) {
    console.error("[MARKDOWN IMPORTER] Failed to parse markdown string:", err);
    return null;
  }
}

/**
 * Imports a Markdown string into the Local Knowledge Vault with strict duplicate detection.
 */
export async function importMarkdownFileToVault(markdownContent: string, filename?: string): Promise<MarkdownImportResult> {
  const session = parseMarkdownToSession(markdownContent, filename);
  if (!session) {
    return { session: null as any, status: "invalid", reason: "Invalid or unsupported Epselon Markdown header format." };
  }

  const existing = await getCompletedSession(session.id);
  if (existing) {
    const existingTime = Date.parse(existing.lastUpdated || existing.createdAt || "0");
    const importedTime = Date.parse(session.lastUpdated || session.createdAt || "0");

    if (importedTime <= existingTime) {
      console.log(`[MARKDOWN IMPORTER] Skipped duplicate session ${session.id} (Existing session is newer or identical).`);
      return { session: existing, status: "skipped_older", reason: "Existing session in Local Vault is up to date." };
    }

    console.log(`[MARKDOWN IMPORTER] Updating existing session ${session.id} with newer imported file.`);
    await saveCompletedSession(session);
    return { session, status: "updated" };
  }

  console.log(`[MARKDOWN IMPORTER] Successfully imported new session ${session.id} into Local Knowledge Vault.`);
  await saveCompletedSession(session);
  return { session, status: "imported" };
}
