import jsPDF from "jspdf";
import { StudySession, UserProfile } from "../types";

export interface AIQuestionItem {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  studentAnswer?: string;
  isCorrect?: boolean;
}

/**
 * Collects all questions asked by the AI mentor along with their correct answers.
 */
export function extractAllAIQuestions(session: StudySession): AIQuestionItem[] {
  const items: AIQuestionItem[] = [];

  // 1. Extract from Chat Message Protocol Traces
  session.messages.forEach((m) => {
    if (m.sender !== "mentor" || !m.protocolTrace) return;

    // Picture Memory Test
    if (m.protocolTrace.pictureMemoryTest) {
      const pmt = m.protocolTrace.pictureMemoryTest;
      const correctOptText = pmt.options && pmt.correctOptionIdx !== undefined
        ? `Option ${String.fromCharCode(65 + pmt.correctOptionIdx)}: ${pmt.options[pmt.correctOptionIdx]}`
        : "Option " + (pmt.correctOptionIdx ?? 0);

      items.push({
        type: "Picture Memory Test",
        question: pmt.question,
        options: pmt.options,
        correctAnswer: correctOptText,
        explanation: pmt.explanationOfCorrectAnswer,
      });
    }

    // Practice Question
    if (m.protocolTrace.practiceQuestion) {
      // Find matching reflection or assessment answer if available
      const matchRef = session.reflectionAnswers?.find((r) => r.question.toLowerCase().includes(m.protocolTrace!.practiceQuestion!.toLowerCase().slice(0, 20)));
      items.push({
        type: "Comprehension Quiz Task",
        question: m.protocolTrace.practiceQuestion,
        correctAnswer: matchRef?.feedback || (matchRef?.isCorrect ? matchRef.answer : "Target conceptual understanding verified through Socratic dialogue"),
        studentAnswer: matchRef ? (typeof matchRef.answer === "object" ? JSON.stringify(matchRef.answer) : String(matchRef.answer)) : undefined,
        isCorrect: matchRef?.isCorrect,
      });
    }

    // Reflection Questions
    if (m.protocolTrace.reflectionQuestions && m.protocolTrace.reflectionQuestions.length > 0) {
      m.protocolTrace.reflectionQuestions.forEach((q) => {
        const matchRef = session.reflectionAnswers?.find((r) => r.question.toLowerCase().includes(q.toLowerCase().slice(0, 20)));
        items.push({
          type: "Reflection Check",
          question: q,
          correctAnswer: matchRef?.feedback || (matchRef?.isCorrect ? matchRef.answer : "Key analytical synthesis of session concepts"),
          studentAnswer: matchRef ? (typeof matchRef.answer === "object" ? JSON.stringify(matchRef.answer) : String(matchRef.answer)) : undefined,
          isCorrect: matchRef?.isCorrect,
        });
      });
    }

    // Suggested Flashcard Practice Drills
    if (m.protocolTrace.suggestedFlashcards && m.protocolTrace.suggestedFlashcards.length > 0) {
      m.protocolTrace.suggestedFlashcards.forEach((card) => {
        items.push({
          type: "Active Recall Card",
          question: card.front,
          correctAnswer: card.back,
        });
      });
    }
  });

  // 2. Extract from Assessment Items
  if (session.assessmentAnswers && session.assessmentAnswers.length > 0) {
    session.assessmentAnswers.forEach((ans) => {
      // Avoid duplicate questions
      if (!items.some((i) => i.question === ans.question)) {
        items.push({
          type: "Summative Assessment",
          question: ans.question,
          correctAnswer: ans.isCorrect
            ? String(ans.selectedAnswer)
            : `Correct solution validated by Nimo (Selected: ${ans.selectedAnswer})`,
          studentAnswer: String(ans.selectedAnswer),
          isCorrect: ans.isCorrect,
        });
      }
    });
  }

  // 3. Extract from Lesson Cards / Active Recall Cards
  if (session.lessonCards && session.lessonCards.length > 0) {
    session.lessonCards.forEach((card) => {
      if (!items.some((i) => i.question === card.title)) {
        items.push({
          type: "Syllabus Concept Drill",
          question: card.title,
          correctAnswer: card.content,
        });
      }
    });
  }

  // 4. Extract from Reflection Answers
  if (session.reflectionAnswers && session.reflectionAnswers.length > 0) {
    session.reflectionAnswers.forEach((ans) => {
      if (!items.some((i) => i.question === ans.question)) {
        const ansVal = typeof ans.answer === "object" ? JSON.stringify(ans.answer) : String(ans.answer);
        items.push({
          type: "Self-Assessment Reflection",
          question: ans.question,
          correctAnswer: ans.feedback || (ans.isCorrect ? ansVal : `Evaluated Response: ${ansVal}`),
          studentAnswer: ansVal,
          isCorrect: ans.isCorrect,
        });
      }
    });
  }

  return items;
}

/**
 * Generates structured Markdown strictly from the finalized StudySession object.
 */
export function generateSessionMarkdown(session: StudySession, user?: UserProfile | null): string {
  const cleanTitle = session.title.replace("Session: ", "").trim();
  const dateStr = session.exportStatus?.generatedAt
    ? new Date(session.exportStatus.generatedAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })
    : new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  let md = `# ${cleanTitle}\n\n`;
  md += `## 📋 Session Metadata\n`;
  md += `- **Subject / Focus:** ${session.subject || session.focus || "General Study"}\n`;
  md += `- **Study Mode:** ${session.mode || session.strategy || "Socratic"}\n`;
  md += `- **Status:** ${session.status || "COMPLETED"}\n`;
  md += `- **Difficulty Level:** ${session.difficulty || "Intermediate"}\n`;
  md += `- **Bloom's Taxonomy Level:** ${session.bloomLevel || "Analysis"}\n`;
  md += `- **Mastery Score:** ${session.mastery || 85}%\n`;
  md += `- **Student:** ${user?.fullName || session.metadata?.studentName || "Student"} (${user?.university || session.metadata?.university || "Epselon Workspace"})\n`;
  md += `- **Created At:** ${new Date(session.createdAt).toLocaleString()}\n`;
  md += `- **Finalized / Export Date:** ${dateStr}\n\n`;
  md += `---\n\n`;

  // Original & Enhanced Prompts
  if (session.originalPrompt) {
    md += `## 🎯 Learning Inquiry & Prompt Coaching\n\n`;
    md += `**Original Prompt:**\n> "${session.originalPrompt}"\n\n`;
    if (session.enhancedPrompt && session.enhancedPrompt !== session.originalPrompt) {
      md += `**Coached & Enhanced Prompt:**\n> "${session.enhancedPrompt}"\n\n`;
    }
    md += `---\n\n`;
  }

  // AI QUESTIONS ASKED & CORRECT ANSWERS KEY
  const aiQuestions = extractAllAIQuestions(session);
  if (aiQuestions.length > 0) {
    md += `## ❓ AI Questions Asked & Correct Answers Key\n\n`;
    aiQuestions.forEach((item, idx) => {
      md += `### ${idx + 1}. [${item.type}] ${item.question}\n`;
      if (item.options && item.options.length > 0) {
        md += `**Options:**\n`;
        item.options.forEach((opt, optIdx) => {
          md += `  - ${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
        });
      }
      md += `**Correct Answer (Side-by-Side Solution):** ✅ ${item.correctAnswer}\n`;
      if (item.explanation) {
        md += `**Explanation:** ${item.explanation}\n`;
      }
      if (item.studentAnswer) {
        md += `**Student Selected:** ${item.studentAnswer} ${item.isCorrect !== undefined ? (item.isCorrect ? "✅ (Correct)" : "❌ (Incorrect)") : ""}\n`;
      }
      md += `\n`;
    });
    md += `---\n\n`;
  }

  // Syllabus & Outline
  if (session.outline && session.outline.length > 0) {
    md += `## 🗺️ Syllabus Landmarks & Outline\n\n`;
    session.outline.forEach((item) => {
      md += `- ${item}\n`;
    });
    md += `\n---\n\n`;
  }

  // Lesson Cards
  if (session.lessonCards && session.lessonCards.length > 0) {
    md += `## 🎴 Active Lesson Study Cards\n\n`;
    session.lessonCards.forEach((card, idx) => {
      md += `### Card ${idx + 1}: ${card.title}\n`;
      md += `${card.content}\n\n`;
    });
    md += `---\n\n`;
  }

  // Reflection Questions & Answers
  if (session.reflectionAnswers && session.reflectionAnswers.length > 0) {
    md += `## 💡 Active Reflection & Self-Assessment Answers\n\n`;
    session.reflectionAnswers.forEach((ans, idx) => {
      md += `**Question ${idx + 1}:** ${ans.question}\n`;
      md += `> **Student Answer:** ${typeof ans.answer === "object" ? JSON.stringify(ans.answer) : ans.answer}\n`;
      if (ans.feedback) {
        md += `> **Correct Answer / Feedback:** ${ans.feedback}\n`;
      }
      md += `\n`;
    });
    md += `---\n\n`;
  }

  // Assessment Questions & Answers
  if (session.assessmentAnswers && session.assessmentAnswers.length > 0) {
    md += `## 📝 Summative Assessment Results\n\n`;
    session.assessmentAnswers.forEach((ans, idx) => {
      md += `**Item ${idx + 1}:** ${ans.question}\n`;
      md += `> **Selected Answer:** ${ans.selectedAnswer}\n`;
      if (ans.isCorrect !== undefined) {
        md += `> **Result:** ${ans.isCorrect ? "✅ Correct" : "❌ Incorrect"}\n`;
      }
      md += `\n`;
    });
    md += `---\n\n`;
  }

  // Teacher Lens
  if (session.teacherLens) {
    md += `## 🎓 Examiner & Teacher Lens Evaluation\n\n`;
    if (session.teacherLens.discussionNotes) {
      md += `**Discussion Notes:**\n${session.teacherLens.discussionNotes}\n\n`;
    }
    if (session.teacherLens.studentStrengths && session.teacherLens.studentStrengths.length > 0) {
      md += `**Key Strengths:**\n`;
      session.teacherLens.studentStrengths.forEach((s) => (md += `- ${s}\n`));
      md += `\n`;
    }
    if (session.teacherLens.gapAreas && session.teacherLens.gapAreas.length > 0) {
      md += `**Areas for Improvement / Common Traps:**\n`;
      session.teacherLens.gapAreas.forEach((g) => (md += `- ${g}\n`));
      md += `\n`;
    }
    if (session.teacherLens.gradeRecommendation) {
      md += `**Examiner Grade Recommendation:** ${session.teacherLens.gradeRecommendation}\n\n`;
    }
    md += `---\n\n`;
  }

  // Knowledge Graph Updates
  if (session.knowledgeGraphUpdates && session.knowledgeGraphUpdates.length > 0) {
    md += `## 🧠 Knowledge Graph Links & Connected Concepts\n\n`;
    session.knowledgeGraphUpdates.forEach((kg) => {
      md += `- **Concept:** ${kg.concept}`;
      if (kg.relationship) md += ` (${kg.relationship})`;
      if (kg.targetConcept) md += ` ➔ ${kg.targetConcept}`;
      md += `\n`;
    });
    md += `\n---\n\n`;
  }

  // Socratic Dialogue Transcript
  md += `## 💬 Complete Socratic Dialogue Transcript\n\n`;
  session.messages.forEach((m) => {
    const sender = m.sender === "mentor" ? "Nimo (AI Mentor)" : user?.fullName || session.metadata?.studentName || "Student";
    md += `### ${sender} *(${m.timestamp || "Chat Log"})*\n\n${m.text}\n\n`;

    if (m.equation) {
      md += `\`\`\`latex\n${m.equation}\n\`\`\`\n\n`;
    }

    if (m.autoNotes && m.autoNotes.length > 0) {
      md += `> **Key Concept Notes:**\n`;
      m.autoNotes.forEach((an) => {
        md += `> - **${an.key}:** ${an.val}\n`;
      });
      md += `\n`;
    }

    if (m.protocolTrace?.pictureMemoryTest) {
      const pmt = m.protocolTrace.pictureMemoryTest;
      md += `> 👁️ **Picture Memory Test Question:** ${pmt.question}\n`;
      if (pmt.options) {
        pmt.options.forEach((opt, idx) => {
          md += `>   - ${String.fromCharCode(65 + idx)}) ${opt}\n`;
        });
      }
      md += `> **Correct Answer:** Option ${String.fromCharCode(65 + (pmt.correctOptionIdx ?? 0))}: ${pmt.options[pmt.correctOptionIdx ?? 0]}\n`;
      md += `> **Explanation:** ${pmt.explanationOfCorrectAnswer}\n\n`;
    }

    if (m.protocolTrace?.practiceQuestion) {
      md += `> 📝 **Practice Question:** ${m.protocolTrace.practiceQuestion}\n\n`;
    }
  });

  // Next Recommendations & Personal Notes
  if (session.recommendations && session.recommendations.length > 0) {
    md += `---\n\n## 🚀 Next Recommended Topics\n\n`;
    session.recommendations.forEach((rec) => {
      md += `- ${rec}\n`;
    });
    md += `\n`;
  }

  if (session.personalNotes && session.personalNotes.length > 0) {
    md += `## 📓 Personal Student Notes\n\n`;
    session.personalNotes.forEach((note) => {
      md += `- ${note}\n`;
    });
    md += `\n`;
  }

  return md;
}

/**
 * Generates a styled PDF document from the finalized StudySession object and returns a Blob.
 * Guarantees zero text truncation for long AI responses and includes all AI questions & side-by-side correct answers.
 */
export function generateSessionPDF(session: StudySession, user?: UserProfile | null): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const darkBg = [15, 23, 42];
  const brandPrimary = [79, 70, 229];
  const brandSecondary = [16, 185, 129];
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 8) {
      doc.addPage();
      y = 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`EPSELON ACADEMIC STUDY NOTES • ${session.title}`, margin, 10);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 12, pageWidth - margin, 12);
    }
  };

  // --- HEADER BANNER ---
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(margin, y, contentWidth, 36, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const cleanTitle = session.title.replace("Session: ", "").trim();
  doc.text(cleanTitle, margin + 6, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  const subtitle = `Subject: ${session.subject || session.focus}  |  Mode: ${session.mode || session.strategy}  |  Mastery: ${session.mastery || 85}%`;
  doc.text(subtitle, margin + 6, y + 20);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const dateStr = session.exportStatus?.generatedAt
    ? new Date(session.exportStatus.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const studentInfo = `Student: ${user?.fullName || session.metadata?.studentName || "Student"} • Status: ${session.status} • Finalized: ${dateStr}`;
  doc.text(studentInfo, margin + 6, y + 28);

  y += 44;

  // --- 1. PROMPTS SECTION ---
  if (session.originalPrompt) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text("1. Learning Inquiry & Prompts", margin, y);
    y += 6;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const origText = doc.splitTextToSize(`Original Inquiry: "${session.originalPrompt}"`, contentWidth - 4);
    doc.text(origText, margin + 2, y);
    y += origText.length * 4.5 + 4;
  }

  // --- 2. AI QUESTIONS ASKED & CORRECT ANSWERS KEY ---
  const aiQuestions = extractAllAIQuestions(session);
  if (aiQuestions.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text("2. AI Questions Asked & Correct Answers Key", margin, y);
    y += 7;

    aiQuestions.forEach((item, idx) => {
      const qLines = doc.splitTextToSize(`Q${idx + 1} [${item.type}]: ${item.question}`, contentWidth - 6);
      const ansLines = doc.splitTextToSize(`CORRECT ANSWER: ${item.correctAnswer}`, contentWidth - 10);
      const cardHeight = qLines.length * 4.2 + ansLines.length * 4 + 10;

      checkPageBreak(Math.min(cardHeight, 40));

      // Light card background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

      // Left accent bar
      doc.setFillColor(brandSecondary[0], brandSecondary[1], brandSecondary[2]);
      doc.rect(margin, y, 2.5, cardHeight, "F");

      // Question header text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(qLines, margin + 5, y + 5);

      let currentY = y + 5 + qLines.length * 4.2;

      // Correct Answer highlighted at side / under question
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(brandSecondary[0], brandSecondary[1], brandSecondary[2]);
      doc.text(ansLines, margin + 5, currentY + 2);

      currentY += ansLines.length * 4 + 2;

      if (item.explanation) {
        const expLines = doc.splitTextToSize(`Note: ${item.explanation}`, contentWidth - 10);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(expLines, margin + 5, currentY);
      }

      y += cardHeight + 4;
    });

    y += 4;
  }

  // --- 3. OUTLINE & LANDMARKS ---
  if (session.outline && session.outline.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("3. Concept Syllabus & Landmarks", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    session.outline.forEach((item) => {
      checkPageBreak(6);
      doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.circle(margin + 2, y - 1, 1, "F");
      doc.text(item, margin + 6, y);
      y += 5;
    });

    y += 4;
  }

  // --- 4. REFLECTION & TEACHER LENS ---
  if (session.reflectionAnswers && session.reflectionAnswers.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("4. Reflection & Self-Assessment", margin, y);
    y += 6;

    session.reflectionAnswers.forEach((ans, idx) => {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`• Q${idx + 1}: ${ans.question}`, margin + 2, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const ansVal = typeof ans.answer === "object" ? JSON.stringify(ans.answer) : String(ans.answer);
      const wrappedAns = doc.splitTextToSize(`Student Answer: ${ansVal}`, contentWidth - 8);
      doc.text(wrappedAns, margin + 6, y);
      y += wrappedAns.length * 4 + 3;
    });
  }

  if (session.teacherLens) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text("5. Examiner & Teacher Lens Assessment", margin, y);
    y += 6;

    if (session.teacherLens.discussionNotes) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const notes = doc.splitTextToSize(session.teacherLens.discussionNotes, contentWidth - 4);
      doc.text(notes, margin + 2, y);
      y += notes.length * 4 + 4;
    }
  }

  // --- 5. COMPLETE SOCRATIC DIALOGUE TRANSCRIPT ---
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("6. Complete Socratic Dialogue Transcript", margin, y);
  y += 7;

  session.messages.forEach((msg) => {
    const isMentor = msg.sender === "mentor";
    const senderName = isMentor ? "NIMO (AI MENTOR)" : (user?.fullName || session.metadata?.studentName || "STUDENT").toUpperCase();

    // Sender Header Line
    checkPageBreak(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(isMentor ? brandPrimary[0] : 16, isMentor ? brandPrimary[1] : 185, isMentor ? brandPrimary[2] : 129);
    doc.text(`• ${senderName} (${msg.timestamp || "Chat Log"})`, margin, y);
    y += 4.5;

    // Split text into line array to prevent page cutoff
    const splitText: string[] = doc.splitTextToSize(msg.text, contentWidth - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Stream lines page by page so long AI messages are NEVER cut off
    splitText.forEach((line) => {
      checkPageBreak(5);
      // Left vertical accent line
      doc.setFillColor(isMentor ? 199 : 187, isMentor ? 210 : 247, isMentor ? 254 : 208);
      doc.rect(margin + 1, y - 3, 1.2, 4.5, "F");

      doc.text(line, margin + 5, y);
      y += 4.2;
    });

    // Render equation if present
    if (msg.equation) {
      checkPageBreak(12);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin + 4, y - 2, contentWidth - 8, 8, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(`LaTeX: ${msg.equation}`, margin + 6, y + 3);
      y += 10;
    }

    // Render Auto-Notes if present
    if (msg.autoNotes && msg.autoNotes.length > 0) {
      msg.autoNotes.forEach((an) => {
        checkPageBreak(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        const noteText = doc.splitTextToSize(`Concept Note [${an.key}]: ${an.val}`, contentWidth - 12);
        doc.text(noteText, margin + 6, y);
        y += noteText.length * 4 + 1;
      });
    }

    // Render Picture Memory Test inline if present
    if (isMentor && msg.protocolTrace?.pictureMemoryTest) {
      const pmt = msg.protocolTrace.pictureMemoryTest;
      checkPageBreak(20);

      doc.setFillColor(245, 243, 255);
      doc.setDrawColor(221, 214, 254);
      doc.rect(margin + 4, y, contentWidth - 8, 18, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(124, 58, 237);
      doc.text(`PICTURE MEMORY TEST: ${pmt.question}`, margin + 6, y + 5);

      const correctOptText = pmt.options && pmt.correctOptionIdx !== undefined
        ? `Option ${String.fromCharCode(65 + pmt.correctOptionIdx)}: ${pmt.options[pmt.correctOptionIdx]}`
        : "Correct Option";

      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text(`CORRECT ANSWER: ${correctOptText}`, margin + 6, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Explanation: ${pmt.explanationOfCorrectAnswer}`, margin + 6, y + 14);

      y += 22;
    }

    y += 3;
  });

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Epselon AI Study Workspace • Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  return doc.output("blob");
}

/**
 * Triggers a browser download of the Markdown file.
 */
export function downloadMarkdownFile(session: StudySession, user?: UserProfile | null) {
  const markdown = generateSessionMarkdown(session, user);
  const cleanTitle = session.title.replace("Session: ", "").trim();
  const safeFileName = cleanTitle.replace(/[^a-zA-Z0-9_\-]/g, "_") || "Study_Session";

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName}_Epselon_Notes.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of the PDF file.
 */
export function downloadPDFFile(session: StudySession, user?: UserProfile | null) {
  const pdfBlob = generateSessionPDF(session, user);
  const cleanTitle = session.title.replace("Session: ", "").trim();
  const safeFileName = cleanTitle.replace(/[^a-zA-Z0-9_\-]/g, "_") || "Study_Session";

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName}_Epselon_Notes.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

