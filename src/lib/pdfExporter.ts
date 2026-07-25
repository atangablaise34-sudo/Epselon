import jsPDF from "jspdf";
import { StudySession, UserProfile } from "../types";

/**
 * Cleanly exports a StudySession's structured markdown dialogue and concepts as a downloadable PDF file.
 */
export function exportStudySessionToPDF(session: StudySession, user?: UserProfile | null) {
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

  // Colors
  const darkBg = [15, 23, 42]; // Slate 900
  const brandPrimary = [79, 70, 229]; // Indigo 600
  const brandSecondary = [16, 185, 129]; // Emerald 500
  const textDark = [30, 41, 59]; // Slate 800
  const textMuted = [100, 116, 139]; // Slate 500

  // Helper for page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = 18;
      
      // Running header
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`EPSELON ACADEMIC STUDY NOTES • ${session.title}`, margin, 10);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 12, pageWidth - margin, 12);
    }
  };

  // --- 1. COVER / HEADER BANNER ---
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(margin, y, contentWidth, 34, "F");

  // Title inside banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  const cleanTitle = session.title.replace("Session: ", "").trim();
  doc.text(cleanTitle, margin + 6, y + 12);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // Indigo 200
  const subtitle = `Focus: ${session.focus || "General Study"}  |  Difficulty: ${session.difficulty}  |  Bloom Level: ${session.bloomLevel || "Analysis"}`;
  doc.text(subtitle, margin + 6, y + 20);

  // Metadata
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  const studentInfo = user ? `Student: ${user.fullName} (${user.university || "Academic Workspace"})` : "Epselon Cognitive Workspace";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  doc.text(`${studentInfo} • Generated ${dateStr}`, margin + 6, y + 27);

  y += 42;

  // --- 2. EXECUTIVE SUMMARY / OUTLINE ---
  if (session.outline && session.outline.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("1. Academic Syllabus & Concept Landmarks", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    session.outline.forEach((item, idx) => {
      checkPageBreak(7);
      doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.circle(margin + 2, y - 1, 1, "F");
      doc.text(item, margin + 6, y);
      y += 5.5;
    });

    y += 4;
  }

  // --- 3. EXTRACTED FORMULATIONS & AUTO-NOTES ---
  const autoNotes: Array<{ key: string; val: string }> = [];
  const equations: string[] = [];

  session.messages.forEach(m => {
    if (m.equation && !equations.includes(m.equation)) equations.push(m.equation);
    if (m.autoNotes) {
      m.autoNotes.forEach(an => {
        if (!autoNotes.some(n => n.key === an.key)) autoNotes.push(an);
      });
    }
  });

  if (autoNotes.length > 0 || equations.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("2. Key Formulations & Key Takeaways", margin, y);
    y += 6;

    if (autoNotes.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.text("Indexed Concepts:", margin, y);
      y += 5;

      autoNotes.forEach(an => {
        checkPageBreak(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`• ${an.key}: `, margin + 2, y);

        const keyWidth = doc.getTextWidth(`• ${an.key}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);

        const wrappedVal = doc.splitTextToSize(an.val, contentWidth - keyWidth - 4);
        doc.text(wrappedVal, margin + 2 + keyWidth, y);
        y += wrappedVal.length * 4.5 + 2;
      });
    }

    if (equations.length > 0) {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(brandSecondary[0], brandSecondary[1], brandSecondary[2]);
      doc.text("Mathematical Formulations:", margin, y);
      y += 5;

      equations.forEach(eq => {
        checkPageBreak(8);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin + 2, y - 3.5, contentWidth - 4, 7, "F");
        doc.setFont("courier", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(eq, margin + 5, y + 1);
        y += 9;
      });
    }

    y += 4;
  }

  // --- 4. SOCRATIC DIALOGUE TRANSCRIPT ---
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("3. Study Dialogue Transcript", margin, y);
  y += 7;

  session.messages.forEach((msg, idx) => {
    const isMentor = msg.sender === "mentor";
    const senderName = isMentor ? "Nimo (AI Mentor)" : (user?.fullName || "Student");

    // Estimate message height
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const splitText = doc.splitTextToSize(msg.text, contentWidth - 8);
    const msgBoxHeight = splitText.length * 4.2 + 10;

    checkPageBreak(Math.min(msgBoxHeight, 30));

    // Message Box Header
    doc.setFillColor(isMentor ? 238 : 240, isMentor ? 242 : 253, isMentor ? 255 : 244);
    doc.setDrawColor(isMentor ? 199 : 187, isMentor ? 210 : 247, isMentor ? 254 : 208);
    doc.roundedRect(margin, y, contentWidth, msgBoxHeight, 2, 2, "FD");

    // Sender Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    if (isMentor) {
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    } else {
      doc.setTextColor(16, 185, 129); // Emerald 600
    }
    doc.text(senderName.toUpperCase(), margin + 4, y + 5);

    // Timestamp
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    if (msg.timestamp) {
      doc.text(msg.timestamp, pageWidth - margin - 4, y + 5, { align: "right" });
    }

    // Message Body Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(splitText, margin + 4, y + 10);

    y += msgBoxHeight + 4;
  });

  // --- FOOTER FOR ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Epselon AI Study Workspace • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Trigger browser download
  const safeFileName = cleanTitle.replace(/[^a-zA-Z0-9_\-]/g, "_") || "Study_Session";
  doc.save(`${safeFileName}_Epselon_Notes.pdf`);
}

/**
 * Also exports a StudySession as a raw Markdown file (.md).
 */
export function exportStudySessionToMarkdown(session: StudySession, user?: UserProfile | null) {
  const cleanTitle = session.title.replace("Session: ", "").trim();
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  
  let markdown = `# ${cleanTitle}\n\n`;
  markdown += `**Subject Focus:** ${session.focus || "General Study"}  \n`;
  markdown += `**Difficulty Level:** ${session.difficulty}  \n`;
  markdown += `**Bloom's Taxonomy:** ${session.bloomLevel || "Analysis"}  \n`;
  markdown += `**Author:** ${user?.fullName || "Student"} (${user?.university || "Epselon Workspace"})  \n`;
  markdown += `**Export Date:** ${dateStr}  \n\n`;
  markdown += `---\n\n`;

  if (session.outline && session.outline.length > 0) {
    markdown += `## Syllabus & Concept Landmarks\n\n`;
    session.outline.forEach((item) => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n---\n\n`;
  }

  markdown += `## Study Dialogue Transcript\n\n`;
  session.messages.forEach((m) => {
    const sender = m.sender === "mentor" ? "Nimo (AI Mentor)" : (user?.fullName || "Student");
    markdown += `### ${sender} *(${m.timestamp || "Chat Log"})*\n\n${m.text}\n\n`;
    if (m.equation) {
      markdown += `\`\`\`latex\n${m.equation}\n\`\`\`\n\n`;
    }
    if (m.autoNotes && m.autoNotes.length > 0) {
      markdown += `> **Key Takeaways:**\n`;
      m.autoNotes.forEach((an) => {
        markdown += `> - **${an.key}:** ${an.val}\n`;
      });
      markdown += `\n`;
    }
  });

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFileName = cleanTitle.replace(/[^a-zA-Z0-9_\-]/g, "_") || "Study_Session";
  a.download = `${safeFileName}_Epselon_Notes.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
