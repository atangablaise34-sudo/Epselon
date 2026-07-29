import { StudySession } from "../types";

const DB_NAME = "EpselonStudySessionDB";
const DB_VERSION = 1;
const DRAFT_STORE = "draft_sessions";
const COMPLETED_STORE = "completed_sessions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.warn("[INDEXEDDB] Database opening error:", (event.target as any)?.error);
      reject((event.target as any)?.error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(COMPLETED_STORE)) {
        db.createObjectStore(COMPLETED_STORE, { keyPath: "id" });
      }
    };
  });
}

// LocalStorage fallback helpers
const LOCAL_DRAFTS_KEY = "epselon_draft_sessions";
const LOCAL_COMPLETED_KEY = "epselon_completed_sessions";

function getLocalStorageItems(key: string): Record<string, StudySession> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveLocalStorageItem(key: string, session: StudySession) {
  try {
    const items = getLocalStorageItems(key);
    items[session.id] = session;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error("[LOCALSTORAGE] Failed to save item:", err);
  }
}

function removeLocalStorageItem(key: string, id: string) {
  try {
    const items = getLocalStorageItems(key);
    delete items[id];
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error("[LOCALSTORAGE] Failed to remove item:", err);
  }
}

// --- PUBLIC API ---

export async function saveDraftSession(session: StudySession): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(DRAFT_STORE, "readwrite");
    const store = tx.objectStore(DRAFT_STORE);
    store.put(session);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    saveLocalStorageItem(LOCAL_DRAFTS_KEY, session);
  }
}

export async function getDraftSession(id: string): Promise<StudySession | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(DRAFT_STORE, "readonly");
    const store = tx.objectStore(DRAFT_STORE);
    const request = store.get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        const fallback = getLocalStorageItems(LOCAL_DRAFTS_KEY)[id] || null;
        resolve(fallback);
      };
    });
  } catch (err) {
    return getLocalStorageItems(LOCAL_DRAFTS_KEY)[id] || null;
  }
}

export async function getAllDraftSessions(): Promise<StudySession[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(DRAFT_STORE, "readonly");
    const store = tx.objectStore(DRAFT_STORE);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        const fallback = Object.values(getLocalStorageItems(LOCAL_DRAFTS_KEY));
        resolve(fallback);
      };
    });
  } catch (err) {
    return Object.values(getLocalStorageItems(LOCAL_DRAFTS_KEY));
  }
}

export async function clearDraftSession(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(DRAFT_STORE, "readwrite");
    const store = tx.objectStore(DRAFT_STORE);
    store.delete(id);
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    // Fallback
  } finally {
    removeLocalStorageItem(LOCAL_DRAFTS_KEY, id);
  }
}

export async function saveCompletedSession(session: StudySession): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(COMPLETED_STORE, "readwrite");
    const store = tx.objectStore(COMPLETED_STORE);
    store.put(session);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    saveLocalStorageItem(LOCAL_COMPLETED_KEY, session);
  }
}

export async function getCompletedSession(id: string): Promise<StudySession | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(COMPLETED_STORE, "readonly");
    const store = tx.objectStore(COMPLETED_STORE);
    const request = store.get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        const fallback = getLocalStorageItems(LOCAL_COMPLETED_KEY)[id] || null;
        resolve(fallback);
      };
    });
  } catch (err) {
    return getLocalStorageItems(LOCAL_COMPLETED_KEY)[id] || null;
  }
}

export async function getAllCompletedSessions(): Promise<StudySession[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(COMPLETED_STORE, "readonly");
    const store = tx.objectStore(COMPLETED_STORE);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        const fallback = Object.values(getLocalStorageItems(LOCAL_COMPLETED_KEY));
        resolve(fallback);
      };
    });
  } catch (err) {
    return Object.values(getLocalStorageItems(LOCAL_COMPLETED_KEY));
  }
}

export async function deleteCompletedSession(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(COMPLETED_STORE, "readwrite");
    const store = tx.objectStore(COMPLETED_STORE);
    store.delete(id);
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    // Fallback
  } finally {
    removeLocalStorageItem(LOCAL_COMPLETED_KEY, id);
  }
}
