import { UserProfile, UserPreferences, ProviderConnection, StudySession, ChatMessage, FlashcardCollection, Flashcard } from "../types";

const API_BASE = ""; // Relative routes since we're using Vite's server proxy

const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const userId = typeof localStorage !== "undefined" ? localStorage.getItem("activeSessionUserId") : null;
  if (userId && typeof input === "string" && input.startsWith(API_BASE + "/api/")) {
    init = init || {};
    init.headers = {
      ...init.headers,
      "x-user-id": userId
    };
  }
  return fetch(input, init);
};


async function parseApiResponse<T = any>(res: Response, defaultErrorMsg: string): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  let data: any = {};

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = { error: "Invalid JSON payload returned from server" };
    }
  } else {
    const text = await res.text();
    // If response is HTML or text error message
    data = { error: text ? (text.length > 180 ? `${text.substring(0, 180)}...` : text) : defaultErrorMsg };
  }

  if (!res.ok) {
    const error: any = new Error(data.error || data.message || `${defaultErrorMsg} (HTTP ${res.status})`);
    error.requiresVerification = data.requiresVerification;
    error.email = data.email;
    throw error;
  }

  return data as T;
}

export async function fetchSession(): Promise<UserProfile | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/auth/session`);
    if (!res.ok) return null;
    const data = await parseApiResponse(res, "Failed to fetch session");
    return data.user || null;
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
  const res = await apiFetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseApiResponse<AuthResponse>(res, "Failed to log in");
}

export async function registerUser(payload: Partial<UserProfile> & { password?: string }): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<AuthResponse>(res, "Failed to register");
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseApiResponse<{ message: string }>(res, "Failed to resend verification email");
}

export async function logoutUser(): Promise<void> {
  await apiFetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
}

export async function saveOnboarding(payload: Partial<UserProfile>): Promise<UserProfile> {
  const res = await apiFetch(`${API_BASE}/api/auth/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<{ user: UserProfile }>(res, "Failed to save cognitive profile");
  return data.user;
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const res = await apiFetch(`${API_BASE}/api/user/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  const data = await parseApiResponse<{ preferences: UserPreferences }>(res, "Failed to update preferences");
  return data.preferences;
}

export async function updateProviders(providers: ProviderConnection[]): Promise<{ providers: ProviderConnection[], user: UserProfile }> {
  const res = await apiFetch(`${API_BASE}/api/user/providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providers }),
  });
  return parseApiResponse<{ providers: ProviderConnection[], user: UserProfile }>(res, "Failed to update providers");
}

export async function fetchStudySessions(): Promise<StudySession[]> {
  const res = await apiFetch(`${API_BASE}/api/study/sessions`);
  const data = await parseApiResponse<{ sessions: StudySession[] }>(res, "Failed to fetch sessions");
  return data.sessions || [];
}

export async function createStudySession(title: string, focus: string, difficulty: string): Promise<StudySession> {
  const res = await apiFetch(`${API_BASE}/api/study/sessions/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, focus, difficulty }),
  });
  const data = await parseApiResponse<{ session: StudySession }>(res, "Failed to create study session");
  return data.session;
}

export async function sendChatMessage(sessionId: string, messageText: string, isConversational?: boolean): Promise<StudySession> {
  const res = await apiFetch(`${API_BASE}/api/study/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, messageText, isConversational }),
  });
  const data = await parseApiResponse<{ session: StudySession }>(res, "Failed to send message");
  return data.session;
}

export async function enhancePrompt(originalPrompt: string, topic: string, sessionId?: string | null): Promise<{
  enhancedPrompt: string;
  isConversational: boolean;
  contextPacket?: string;
  summary?: any;
  ecePacket?: any;
}> {
  const res = await apiFetch(`${API_BASE}/api/study/enhance-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalPrompt, topic, sessionId }),
  });
  const data = await parseApiResponse<any>(res, "Failed to assemble educational context");
  return {
    enhancedPrompt: data.enhancedPrompt || originalPrompt,
    isConversational: !!data.isConversational,
    contextPacket: data.contextPacket,
    summary: data.summary,
    ecePacket: data.ecePacket,
  };
}

export async function clearStudySession(sessionId: string): Promise<StudySession> {
  const res = await apiFetch(`${API_BASE}/api/study/sessions/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const data = await parseApiResponse<{ session: StudySession }>(res, "Failed to clear study session");
  return data.session;
}

export async function updateSessionIntent(sessionId: string, intent: string): Promise<StudySession> {
  const res = await apiFetch(`${API_BASE}/api/study/sessions/update-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, intent }),
  });
  const data = await parseApiResponse<{ session: StudySession }>(res, "Failed to update session intent");
  return data.session;
}

export async function finalizeStudySessionApi(session: StudySession): Promise<StudySession> {
  const res = await apiFetch(`${API_BASE}/api/study/sessions/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
  });
  const data = await parseApiResponse<{ session: StudySession }>(res, "Failed to finalize study session");
  return data.session || session;
}

export async function fetchFlashcards(): Promise<{ collections: FlashcardCollection[]; flashcards: Flashcard[] }> {
  const res = await apiFetch(`${API_BASE}/api/flashcards`);
  return parseApiResponse<{ collections: FlashcardCollection[]; flashcards: Flashcard[] }>(res, "Failed to fetch flashcards");
}

export async function submitCardReview(cardId: string, result: "easy" | "medium" | "hard"): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/flashcards/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, result }),
  });
  await parseApiResponse(res, "Failed to submit card review");
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
  const res = await apiFetch(`${API_BASE}/api/user/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<{ success: boolean; user: UserProfile }>(res, "Failed to update academic profile");
}

