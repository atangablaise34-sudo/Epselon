import { StudySession, UserProfile } from "../types";
import { getAllCompletedSessions, getAllDraftSessions, saveCompletedSession } from "./db";
import { importMarkdownFileToVault, parseMarkdownToSession } from "./markdownImporter";
import EventBus from "./EventBus";

export interface VaultGraphNode {
  id: string;
  name: string;
  category: string;
  mastery: number;
  connections: string[];
  relationships?: Array<{ target: string; relationship: string }>;
  sessionId?: string;
}

export interface VaultSearchItem {
  sessionId: string;
  title: string;
  subject: string;
  type: "session" | "concept" | "teacher_lens" | "dialogue";
  snippet: string;
  timestamp: string;
  mastery: number;
}

class VaultService {
  private sessionsMap: Map<string, StudySession> = new Map();
  private graphNodes: VaultGraphNode[] = [];
  private searchIndex: VaultSearchItem[] = [];
  private isInitialized = false;

  /**
   * APPLICATION STARTUP PIPELINE:
   * 1. Initialize DB & load local sessions
   * 2. Populate Recall & Knowledge Graph
   * 3. Build Search Index
   * 4. Background Markdown import check
   */
  public async initializeVault(): Promise<{ sessionsCount: number; nodesCount: number }> {
    if (this.isInitialized) {
      return { sessionsCount: this.sessionsMap.size, nodesCount: this.graphNodes.length };
    }

    try {
      console.log("%c[VAULT SERVICE] Initializing Local Knowledge Vault...", "color: #10b981; font-weight: bold;");

      // 1. Load existing completed sessions from IndexedDB
      const completed = await getAllCompletedSessions();
      completed.forEach((s) => this.sessionsMap.set(s.id, s));

      // Also check drafts to include in search/recall if needed
      const drafts = await getAllDraftSessions();
      drafts.forEach((d) => {
        if (!this.sessionsMap.has(d.id)) {
          this.sessionsMap.set(d.id, d);
        }
      });

      // 2. Reconstruct Knowledge Graph & Search Index
      this.rebuildKnowledgeGraph();
      this.rebuildSearchIndex();

      this.isInitialized = true;
      EventBus.publish("VAULT_UPDATED", { count: this.sessionsMap.size });

      console.log(`%c[VAULT SERVICE] Vault initialized with ${this.sessionsMap.size} sessions and ${this.graphNodes.length} graph nodes.`, "color: #10b981;");

      return { sessionsCount: this.sessionsMap.size, nodesCount: this.graphNodes.length };
    } catch (err) {
      console.error("[VAULT SERVICE] Failed to initialize Local Knowledge Vault:", err);
      return { sessionsCount: 0, nodesCount: 0 };
    }
  }

  /**
   * Returns all finalized sessions stored in the Local Knowledge Vault.
   */
  public getAllSessions(): StudySession[] {
    return Array.from(this.sessionsMap.values());
  }

  /**
   * Retrieves a specific session from the Local Knowledge Vault by ID.
   */
  public getSession(id: string): StudySession | null {
    return this.sessionsMap.get(id) || null;
  }

  /**
   * Synchronizes or saves a session into the Local Knowledge Vault.
   */
  public async saveSessionToVault(session: StudySession): Promise<void> {
    this.sessionsMap.set(session.id, session);
    await saveCompletedSession(session);
    this.rebuildKnowledgeGraph();
    this.rebuildSearchIndex();
    EventBus.publish("VAULT_UPDATED", { count: this.sessionsMap.size, updatedId: session.id });
  }

  /**
   * Imports raw Markdown content into the Local Knowledge Vault.
   */
  public async importMarkdown(markdownText: string, filename?: string) {
    const result = await importMarkdownFileToVault(markdownText, filename);
    if (result.status === "imported" || result.status === "updated") {
      this.sessionsMap.set(result.session.id, result.session);
      this.rebuildKnowledgeGraph();
      this.rebuildSearchIndex();
      EventBus.publish("VAULT_UPDATED", { count: this.sessionsMap.size, importedId: result.session.id });
      EventBus.publish("IMPORT_NOTIFICATION", {
        message: `Imported session "${result.session.title}" (${result.session.subject})`,
        session: result.session,
      });
    }
    return result;
  }

  /**
   * RECONSTRUCT KNOWLEDGE GRAPH
   * Recreates graph nodes and cross-subject connections strictly offline from local vault sessions.
   */
  public rebuildKnowledgeGraph(): VaultGraphNode[] {
    const nodeMap = new Map<string, VaultGraphNode>();

    this.sessionsMap.forEach((session) => {
      const subject = session.subject || session.focus || "General Discipline";
      const subjectId = `node_${subject.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

      if (!nodeMap.has(subjectId)) {
        nodeMap.set(subjectId, {
          id: subjectId,
          name: subject,
          category: session.strategy || session.mode || "Core Discipline",
          mastery: session.mastery || 80,
          connections: [],
          relationships: [],
          sessionId: session.id,
        });
      }

      const parentNode = nodeMap.get(subjectId)!;

      // Extract outline topics
      if (session.outline) {
        session.outline.forEach((topic) => {
          const topicId = `concept_${topic.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          if (!nodeMap.has(topicId)) {
            nodeMap.set(topicId, {
              id: topicId,
              name: topic,
              category: subject,
              mastery: Math.max(70, session.mastery || 80),
              connections: [subjectId],
              relationships: [{ target: subject, relationship: "Sub-topic of" }],
              sessionId: session.id,
            });
            parentNode.connections.push(topicId);
          }
        });
      }

      // Extract explicit Knowledge Graph updates
      if (session.knowledgeGraphUpdates) {
        session.knowledgeGraphUpdates.forEach((kg) => {
          const kgId = `concept_${kg.concept.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          if (!nodeMap.has(kgId)) {
            nodeMap.set(kgId, {
              id: kgId,
              name: kg.concept,
              category: subject,
              mastery: Math.min(100, (session.mastery || 80) + (kg.masteryDelta || 5)),
              connections: [subjectId],
              relationships: [],
              sessionId: session.id,
            });
            parentNode.connections.push(kgId);
          }

          if (kg.targetConcept) {
            const targetId = `concept_${kg.targetConcept.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
            const existingKgNode = nodeMap.get(kgId)!;
            if (!existingKgNode.connections.includes(targetId)) {
              existingKgNode.connections.push(targetId);
              existingKgNode.relationships?.push({ target: kg.targetConcept, relationship: kg.relationship || "Connected to" });
            }
          }
        });
      }
    });

    this.graphNodes = Array.from(nodeMap.values());
    return this.graphNodes;
  }

  /**
   * RECONSTRUCT SEARCH INDEX
   * Builds an instant offline search index across all titles, prompts, teacher lens notes, and dialogue.
   */
  public rebuildSearchIndex(): VaultSearchItem[] {
    const items: VaultSearchItem[] = [];

    this.sessionsMap.forEach((session) => {
      // 1. Session Title & Focus
      items.push({
        sessionId: session.id,
        title: session.title,
        subject: session.subject || session.focus || "General",
        type: "session",
        snippet: `${session.mode || "Socratic"} Mode session on ${session.subject}. Mastery: ${session.mastery || 85}%`,
        timestamp: session.lastUpdated || session.createdAt,
        mastery: session.mastery || 85,
      });

      // 2. Prompts
      if (session.originalPrompt) {
        items.push({
          sessionId: session.id,
          title: `Inquiry: ${session.title}`,
          subject: session.subject || "Prompt",
          type: "concept",
          snippet: session.enhancedPrompt || session.originalPrompt,
          timestamp: session.createdAt,
          mastery: session.mastery || 85,
        });
      }

      // 3. Teacher Lens
      if (session.teacherLens && session.teacherLens.discussionNotes) {
        items.push({
          sessionId: session.id,
          title: `Teacher Lens: ${session.title}`,
          subject: session.subject || "Assessment",
          type: "teacher_lens",
          snippet: session.teacherLens.discussionNotes,
          timestamp: session.teacherLens.completedAt || session.lastUpdated,
          mastery: session.mastery || 85,
        });
      }

      // 4. Study Cards
      if (session.lessonCards) {
        session.lessonCards.forEach((card) => {
          items.push({
            sessionId: session.id,
            title: `Card: ${card.title}`,
            subject: session.subject || "Study Card",
            type: "concept",
            snippet: card.content.slice(0, 180),
            timestamp: session.lastUpdated,
            mastery: session.mastery || 85,
          });
        });
      }
    });

    this.searchIndex = items;
    return this.searchIndex;
  }

  /**
   * Search across all stored study history offline.
   */
  public searchVault(query: string): VaultSearchItem[] {
    if (!query || !query.trim()) return this.searchIndex.slice(0, 20);
    const q = query.toLowerCase().trim();
    return this.searchIndex.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.snippet.toLowerCase().includes(q)
    );
  }

  public getKnowledgeGraphNodes(): VaultGraphNode[] {
    return this.graphNodes.length > 0 ? this.graphNodes : this.rebuildKnowledgeGraph();
  }
}

export const vaultService = new VaultService();
export default vaultService;
