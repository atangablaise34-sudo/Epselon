type AppEvent = 
  | "PROMPT_REFINEMENT_STARTED"
  | "PROMPT_REFINEMENT_COMPLETED"
  | "PROMPT_SENT"
  | "AI_GENERATING"
  | "AI_RESPONSE_READY"
  | "RESPONSE_READING"
  | "RESPONSE_COMPLETED"
  | "REFLECTION_STARTED"
  | "FLASHCARDS_STARTED"
  | "FLASHCARD_CORRECT"
  | "FLASHCARD_INCORRECT"
  | "KNOWLEDGE_GRAPH_UPDATED"
  | "TOPIC_MASTERED"
  | "VOICE_LISTENING"
  | "VOICE_PROCESSING"
  | "VOICE_RESPONSE"
  | "FOCUS_MODE_ENTERED"
  | "FOCUS_MODE_EXITED"
  | "focus_started"
  | "listening_started"
  | "speech_detected"
  | "speech_finished"
  | "thinking_started"
  | "thinking_finished"
  | "speech_playback_started"
  | "speech_playback_finished"
  | "focus_ended"
  | "voice_started"
  | "voice_partial"
  | "voice_completed"
  | "speech_started"
  | "speech_cancelled";

type EventCallback = (payload?: any) => void;

class MentorLayerEventBus {
  private listeners: Map<AppEvent, Set<EventCallback>> = new Map();

  subscribe(event: AppEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  publish(event: AppEvent, payload?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }
}

export const EventBus = new MentorLayerEventBus();
