import { StudySession, UserProfile } from "../types";
import { downloadPDFFile, downloadMarkdownFile, generateSessionMarkdown, generateSessionPDF } from "./sessionExporter";

export function exportStudySessionToPDF(session: StudySession, user?: UserProfile | null) {
  downloadPDFFile(session, user);
}

export function exportStudySessionToMarkdown(session: StudySession, user?: UserProfile | null) {
  downloadMarkdownFile(session, user);
}

export { generateSessionMarkdown, generateSessionPDF, downloadMarkdownFile, downloadPDFFile };
