import { UserProfile, UserPreferences, ProviderConnection, StudySession, ChatMessage, FlashcardCollection, Flashcard } from "../types";

const API_BASE = ""; // Relative routes since we're using Vite's server proxy

export async function fetchSession(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/session`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export interface AuthResponse {
  user?: UserProfile;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || "Failed to log in");
    error.requiresVerification = data.requiresVerification;
    error.email = data.email || email;
    throw error;
  }
  return data;
}

export async function registerUser(payload: Partial<UserProfile> & { password?: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || "Failed to register");
    error.requiresVerification = data.requiresVerification;
    error.email = data.email || payload.email;
    throw error;
  }
  return data;
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to resend verification email");
  }
  return data;
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
}

export async function saveOnboarding(payload: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save cognitive profile");
  }
  const data = await res.json();
  return data.user;
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/api/user/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update preferences");
  }
  const data = await res.json();
  return data.preferences;
}

export async function updateProviders(providers: ProviderConnection[]): Promise<{ providers: ProviderConnection[], user: UserProfile }> {
  const res = await fetch(`${API_BASE}/api/user/providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providers }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update providers");
  }
  return res.json();
}

export async function fetchStudySessions(): Promise<StudySession[]> {
  const res = await fetch(`${API_BASE}/api/study/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const data = await res.json();
  return data.sessions;
}

export async function createStudySession(title: string, focus: string, difficulty: string): Promise<StudySession> {
  const res = await fetch(`${API_BASE}/api/study/sessions/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, focus, difficulty }),
  });
  if (!res.ok) throw new Error("Failed to create study session");
  const data = await res.json();
  return data.session;
}

export async function sendChatMessage(sessionId: string, messageText: string, isConversational?: boolean): Promise<StudySession> {
  const res = await fetch(`${API_BASE}/api/study/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, messageText, isConversational }),
  });
  if (!res.ok) throw new Error("Failed to send message to Educational Intelligence Layer");
  const data = await res.json();
  return data.session;
}

export async function enhancePrompt(originalPrompt: string, topic: string, sessionId?: string | null): Promise<{
  enhancedPrompt: string;
  isConversational: boolean;
  contextPacket?: string;
  summary?: any;
  ecePacket?: any;
}> {
  const res = await fetch(`${API_BASE}/api/study/enhance-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalPrompt, topic, sessionId }),
  });
  if (!res.ok) throw new Error("Failed to assemble educational context");
  const data = await res.json();
  return {
    enhancedPrompt: data.enhancedPrompt || originalPrompt,
    isConversational: !!data.isConversational,
    contextPacket: data.contextPacket,
    summary: data.summary,
    ecePacket: data.ecePacket,
  };
}

export async function clearStudySession(sessionId: string): Promise<StudySession> {
  const res = await fetch(`${API_BASE}/api/study/sessions/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error("Failed to clear study session");
  const data = await res.json();
  return data.session;
}

export async function updateSessionIntent(sessionId: string, intent: string): Promise<StudySession> {
  const res = await fetch(`${API_BASE}/api/study/sessions/update-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, intent }),
  });
  if (!res.ok) throw new Error("Failed to update session intent");
  const data = await res.json();
  return data.session;
}

export async function fetchFlashcards(): Promise<{ collections: FlashcardCollection[]; flashcards: Flashcard[] }> {
  const res = await fetch(`${API_BASE}/api/flashcards`);
  if (!res.ok) throw new Error("Failed to fetch flashcards");
  return res.json();
}

export async function submitCardReview(cardId: string, result: "easy" | "medium" | "hard"): Promise<void> {
  const res = await fetch(`${API_BASE}/api/flashcards/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, result }),
  });
  if (!res.ok) throw new Error("Failed to submit card review");
}

export async function updateUserProfile(payload: {
  fullName: string;
  university: string;
  faculty: string;
  department: string;
  academicLevel: string;
  learningStyle: string;
  weeklyCommitment: string;
  learningObjectives: string;
}): Promise<{ success: boolean; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/api/user/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update academic profile");
  return res.json();
}

