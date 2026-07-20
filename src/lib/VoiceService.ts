import { EventBus } from "./EventBus";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface NimoVoiceProfile {
  id: string;
  name: string;
  gender: "female" | "male" | "child";
  pitch: number;
  rate: number;
  keywords: string[];
}

export const NIMO_VOICES: NimoVoiceProfile[] = [
  {
    id: "nimo-female-1",
    name: "Nimo - Clara (Gentle Female)",
    gender: "female",
    pitch: 1.05,
    rate: 1.05,
    keywords: ["Samantha", "Google US English", "Zira", "Clara", "Female"]
  },
  {
    id: "nimo-female-2",
    name: "Nimo - Emily (Expressive Female)",
    gender: "female",
    pitch: 1.15,
    rate: 1.1,
    keywords: ["Google UK English Female", "Hazel", "Emily", "Microsoft Susan", "Female"]
  },
  {
    id: "nimo-male-1",
    name: "Nimo - Arthur (Deep Scholar Male)",
    gender: "male",
    pitch: 0.88,
    rate: 1.0,
    keywords: ["Daniel", "Google US English Male", "Microsoft David", "David", "Arthur", "Male"]
  },
  {
    id: "nimo-male-2",
    name: "Nimo - Jack (Energetic Guide Male)",
    gender: "male",
    pitch: 0.95,
    rate: 1.08,
    keywords: ["Google UK English Male", "Microsoft George", "Jack", "Ravi", "Male"]
  },
  {
    id: "nimo-child-1",
    name: "Nimo - Toby (Curious Boy Kid)",
    gender: "child",
    pitch: 1.45,
    rate: 1.12,
    keywords: ["Google US English", "Samantha", "Flo", "Fred"]
  },
  {
    id: "nimo-child-2",
    name: "Nimo - Lily (Bright Girl Kid)",
    gender: "child",
    pitch: 1.55,
    rate: 1.15,
    keywords: ["Google UK English Female", "Zira", "Victoria", "Eddy"]
  },
  {
    id: "nimo-child-3",
    name: "Nimo - Pip (Playful Mascot Kid)",
    gender: "child",
    pitch: 1.65,
    rate: 1.2,
    keywords: ["Google US English", "Samantha", "Zira", "Reed"]
  }
];

class VoiceService {
  private recognition: any = null;
  private isListeningActive = false;
  private isSpeakingActive = false;
  private lastTranscript = "";
  
  // Callbacks
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;

  initialize() {
    if (this.recognition) return;

    try {
      const SpeechRecognition =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (!SpeechRecognition) {
        console.warn("SpeechRecognition is not supported in this browser.");
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        EventBus.publish("voice_started");
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentResult = (finalTranscript + interimTranscript).trim();
        if (currentResult) {
          EventBus.publish("voice_partial", { text: currentResult, isFinal: finalTranscript !== "" });
          if (this.onResultCallback) {
            this.onResultCallback(currentResult, finalTranscript !== "");
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          this.isListeningActive = false;
          console.warn("Speech Recognition Error:", event.error);
        } else {
          console.error("Speech Recognition Error:", event.error);
        }
        if (this.onErrorCallback) {
          this.onErrorCallback(event);
        }
      };

      rec.onend = () => {
        // If we are still supposed to be listening, auto-restart
        if (this.isListeningActive && !this.isSpeakingActive) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already running
          }
        } else {
          EventBus.publish("voice_completed");
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        }
      };

      this.recognition = rec;
    } catch (err) {
      console.error("Error initializing Speech Recognition:", err);
    }
  }

  startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (err: any) => void
  ) {
    this.initialize();
    
    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;
    this.isListeningActive = true;

    if (!this.recognition) {
      onError(new Error("Speech recognition not supported in this browser."));
      return;
    }

    try {
      this.recognition.start();
    } catch (e) {
      // Already listening
    }
  }

  stopListening() {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }

  cancelListening() {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Already aborted
      }
    }
  }

  speak(text: string, onStart: () => void, onEnd: () => void, voiceId?: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onEnd();
      return;
    }

    this.stopSpeaking();
    this.isSpeakingActive = true;

    // Remove markdown symbols and format text for TTS
    const cleanText = text
      .replace(/[*_`#\-]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Default rate/pitch
    let selectedPitch = 1.0;
    let selectedRate = 1.05;
    let preferredVoice = null;

    const voices = window.speechSynthesis.getVoices();
    const activeProfile = NIMO_VOICES.find(v => v.id === voiceId);

    if (activeProfile) {
      selectedPitch = activeProfile.pitch;
      selectedRate = activeProfile.rate;

      // Search for first matching system voice based on profile keywords
      for (const kw of activeProfile.keywords) {
        preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            v.name.toLowerCase().includes(kw.toLowerCase())
        );
        if (preferredVoice) break;
      }
    }

    // Fallback if no specific voice selected or found
    if (!preferredVoice) {
      preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("Microsoft"))
      ) || voices.find((v) => v.lang.startsWith("en"));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = selectedRate;
    utterance.pitch = selectedPitch;

    utterance.onstart = () => {
      EventBus.publish("speech_started");
      onStart();
    };

    utterance.onend = () => {
      this.isSpeakingActive = false;
      EventBus.publish("speech_finished");
      onEnd();
    };

    utterance.onerror = (err) => {
      console.warn("Speech synthesis error event:", err);
      this.isSpeakingActive = false;
      EventBus.publish("speech_finished");
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    this.isSpeakingActive = false;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      EventBus.publish("speech_cancelled");
    }
  }

  destroy() {
    this.stopListening();
    this.stopSpeaking();
    this.recognition = null;
    this.onResultCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
  }
}

export const voiceService = new VoiceService();
