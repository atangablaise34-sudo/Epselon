import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFocusMode } from "../context/FocusModeContext";
import { EventBus } from "../lib/EventBus";
import { sendChatMessage, enhancePrompt, createStudySession } from "../lib/api";
import { UserProfile, StudySession } from "../types";
import { Send, X } from "lucide-react";
import { voiceService } from "../lib/VoiceService";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface FocusModeOverlayProps {
  user: UserProfile;
  activeSessionId: string | null;
  activeSession?: StudySession;
  onSelectSession: (id: string | null) => void;
  onRefreshSessions: () => void;
  onRefreshUser?: () => void;
}

type FocusState = 
  | "OFF"
  | "ENTERING"
  | "LISTENING"
  | "PROCESSING_SPEECH"
  | "AI_THINKING"
  | "AI_SPEAKING"
  | "EXITING";

export default function FocusModeOverlay({
  user,
  activeSessionId,
  activeSession,
  onSelectSession,
  onRefreshSessions,
  onRefreshUser
}: FocusModeOverlayProps) {
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const [focusState, setFocusState] = useState<FocusState>("OFF");
  
  // Transcription and Speech Recognition states
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // AI Response and Speech states
  const [aiResponse, setAiResponse] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [spokenSentences, setSpokenSentences] = useState<string[]>([]);

  // Keyboard input states
  const [keyboardPrompt, setKeyboardPrompt] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);
  const shouldRestartRecognitionRef = useRef(true);

  // Split text into natural vocal sentences
  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    // Split on typical sentence ends, keeping the punctuation
    return text
      .replace(/([.!?])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Safe wrapper to start/restart speech recognition
  const startSpeechRecognition = () => {
    if (!isFocusMode) return;
    setMicError(null);
    voiceService.startListening(
      (text, isFinal) => {
        if (focusState !== "LISTENING" && focusState !== "PROCESSING_SPEECH") return;

        setTranscript(text);
        setFocusState("PROCESSING_SPEECH");
        EventBus.publish("speech_detected");

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          finalizeSpeech(text);
        }, 1600); // Trigger automatically after 1.6s of silence
      },
      () => {
        setIsRecording(false);
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        const errorMsg = typeof err === "object" && err !== null ? err.error : String(err);
        if (errorMsg === "not-allowed" || errorMsg === "permission-denied") {
          setMicError("Microphone access blocked. Please enable browser mic permission.");
        } else if (errorMsg === "service-not-allowed") {
          setMicError("Speech recognition is not permitted by your browser security configuration.");
        } else if (errorMsg === "no-speech") {
          // ignore transient no-speech
        } else {
          setMicError("Speech recognition encountered an issue. Please try again.");
        }
        setIsRecording(false);
      }
    );
    setIsRecording(true);
  };

  const stopSpeechRecognition = () => {
    voiceService.stopListening();
    setIsRecording(false);
  };

  // Sequence player for sentence by sentence progressive rendering & speaking
  const playSentencesSequentially = (sentencesList: string[], index: number = 0) => {
    if (!isFocusMode || !isComponentMounted.current) return;

    if (index >= sentencesList.length) {
      // Done speaking response. Loop back to Listening silently
      setFocusState("LISTENING");
      return;
    }

    setCurrentSentenceIndex(index);
    const textToSpeak = sentencesList[index];

    // Add current sentence to visible progressive spoken block
    setSpokenSentences((prev) => [...prev, textToSpeak]);

    voiceService.speak(
      textToSpeak,
      () => {
        EventBus.publish("speech_playback_started");
      },
      () => {
        EventBus.publish("speech_playback_finished");
        // Move to the next sentence
        setTimeout(() => {
          playSentencesSequentially(sentencesList, index + 1);
        }, 200);
      },
      user.preferences?.selectedVoiceId
    );
  };

  // Core controller state logic
  useEffect(() => {
    isComponentMounted.current = true;

    if (isFocusMode) {
      setFocusState("ENTERING");
      EventBus.publish("focus_started");
      voiceService.initialize();

      // Reset state variables
      setTranscript("");
      setInterimTranscript("");
      setAiResponse("");
      setSentences([]);
      setSpokenSentences([]);
      setCurrentSentenceIndex(-1);

      // Transition to LISTENING state
      setTimeout(() => {
        if (isComponentMounted.current) {
          setFocusState("LISTENING");
        }
      }, 500);
    } else {
      setFocusState("OFF");
      EventBus.publish("focus_ended");
      stopSpeechRecognition();
      voiceService.destroy();
    }

    return () => {
      isComponentMounted.current = false;
    };
  }, [isFocusMode]);

  // Handle SpeechRecognition startup and event callbacks
  useEffect(() => {
    if (focusState !== "LISTENING") {
      stopSpeechRecognition();
      return;
    }

    // Publish listening started
    EventBus.publish("listening_started");
    shouldRestartRecognitionRef.current = true;

    startSpeechRecognition();

    return () => {
      shouldRestartRecognitionRef.current = false;
      stopSpeechRecognition();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [focusState]);

  // Synchronize mic listening with keyboard input focus
  useEffect(() => {
    if (isInputFocused) {
      stopSpeechRecognition();
    } else if (focusState === "LISTENING" && isFocusMode) {
      const timer = setTimeout(() => {
        if (isFocusMode && focusState === "LISTENING" && !isInputFocused) {
          startSpeechRecognition();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInputFocused, focusState, isFocusMode]);

  // Finalize speech input, freezing the transcript for 500ms
  const finalizeSpeech = (finalPrompt: string) => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    stopSpeechRecognition();
    setFocusState("PROCESSING_SPEECH");
    EventBus.publish("speech_finished");

    setTimeout(() => {
      if (isComponentMounted.current && isFocusMode) {
        triggerIntelligencePipeline(finalPrompt);
      }
    }, 550);
  };

  // Run Socratic Learning Intent classification and execute message
  const triggerIntelligencePipeline = async (promptText: string) => {
    if (!promptText.trim()) {
      setFocusState("LISTENING");
      return;
    }

    setFocusState("AI_THINKING");
    EventBus.publish("thinking_started");

    try {
      // 1. Ensure target study session exists
      let targetId = activeSessionId;
      if (!targetId) {
        const title = promptText.length > 24 ? promptText.slice(0, 24) + "..." : promptText;
        const session = await createStudySession(
          `Focus: ${title}`,
          title,
          user.preferences.cognitiveLoad === "Master" ? "Advanced" : "Intermediate"
        );
        targetId = session.id;
        onSelectSession(session.id);
      }

      // 2. Classify intent via Socratic Learning Intent Engine
      const topic = activeSession?.focus || "General Science";
      const classification = await enhancePrompt(promptText, topic, targetId);

      // 3. Dispatch message securely to Educational Intelligence Socratic layer
      const updatedSession = await sendChatMessage(
        targetId,
        classification.enhancedPrompt,
        classification.isConversational
      );

      // 4. Refresh parent study sessions context to synchronize workspace state
      onRefreshSessions();
      if (onRefreshUser) onRefreshUser();

      // Extract generated response
      const mentorMsgs = updatedSession.messages.filter((m) => m.sender === "mentor");
      const lastResponse = mentorMsgs[mentorMsgs.length - 1];

      if (lastResponse && isComponentMounted.current) {
        EventBus.publish("thinking_finished");
        
        const responseText = lastResponse.text;
        setAiResponse(responseText);

        // Prepare Sequential Speech Synthesis and Progressive UI Card
        const list = splitIntoSentences(responseText);
        setSentences(list);
        setSpokenSentences([]);
        setCurrentSentenceIndex(-1);

        setFocusState("AI_SPEAKING");
        // Start progressive audio playback
        playSentencesSequentially(list, 0);
      } else {
        throw new Error("No mentor response generated");
      }
    } catch (err) {
      console.error("Focus mode AI route failed:", err);
      EventBus.publish("thinking_finished");
      setFocusState("LISTENING");
    }
  };

  // Handle ESC key to exit focus mode easily
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  if (!isFocusMode) return null;

  const currentSpeakerText = transcript || interimTranscript;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-between p-6 sm:p-12">
      {/* Background Dim Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md z-[-1]" />

      {/* Top Margin Header */}
      <div className="w-full flex justify-between items-center z-10 select-none pointer-events-auto">
        <button
          onClick={toggleFocusMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 transition-all text-[11px] font-mono uppercase tracking-wider font-semibold cursor-pointer shadow-md"
        >
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Go Back</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            Socratic Continuous Session
          </span>
        </motion.div>
      </div>

      {/* Main viewport centered container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl gap-8 relative">
        <AnimatePresence mode="wait">
          {/* 1. LISTENING / SPEAKING Transcripts and States */}
          {focusState === "LISTENING" && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center flex flex-col items-center gap-3 select-none"
            >
              <p className="text-sm font-sans tracking-wide text-slate-400 font-medium max-w-md">
                I'm ready. Speak naturally whenever you want to begin exploring.
              </p>
              
              {/* Voice Waveform Activity Indicator */}
              <div className="flex items-center justify-center gap-1.5 h-6 opacity-60 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-teal-400 rounded-full"
                    animate={{ height: [8, 14, 8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {focusState === "PROCESSING_SPEECH" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center px-4 max-w-2xl select-none"
            >
              <p className="text-2xl sm:text-3xl font-serif text-slate-100 italic tracking-wide font-medium leading-relaxed">
                "{currentSpeakerText || "Analyzing..."}"
              </p>
            </motion.div>
          )}

          {focusState === "AI_THINKING" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center select-none"
            >
              <div className="text-xs font-mono text-indigo-400 tracking-widest uppercase font-bold animate-pulse">
                Engaging Socratic Pipeline...
              </div>
            </motion.div>
          )}

          {focusState === "AI_SPEAKING" && spokenSentences.length > 0 && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-2xl px-6 py-8 rounded-3xl bg-slate-950/75 border border-slate-900 backdrop-blur-xl pointer-events-auto shadow-2xl flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Progress Bar Indicator */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-slate-900">
                <motion.div 
                  className="h-full bg-blue-500" 
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 select-none">
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold">
                  Socratic Explanation
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  Sentence {currentSentenceIndex + 1} of {sentences.length}
                </span>
              </div>

              {/* Progressive sentence scrolling blocks */}
              <div className="max-h-[220px] overflow-y-auto no-scrollbar flex flex-col gap-3 font-serif text-lg sm:text-xl text-slate-200 tracking-wide leading-relaxed">
                {spokenSentences.map((sentence, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ 
                      opacity: idx === currentSentenceIndex ? 1 : 0.45,
                      scale: idx === currentSentenceIndex ? 1 : 0.99 
                    }}
                    transition={{ duration: 0.3 }}
                    className={idx === currentSentenceIndex ? "text-white font-medium border-l-2 border-blue-500 pl-3" : "pl-3 border-l-2 border-transparent"}
                  >
                    {sentence}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time speech wave animation (only active when user is speaking) */}
        {isRecording && focusState === "PROCESSING_SPEECH" && (
          <div className="absolute bottom-4 flex items-center justify-center gap-1.5 h-16 opacity-85">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-full"
                animate={{
                  height: [12, 35 + Math.random() * 25, 12]
                }}
                transition={{
                  duration: 0.28,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="w-full flex flex-col items-center gap-4 z-10 pb-4">
        {/* Socratic Keyboard Prompt Input Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl px-4 pointer-events-auto select-text mb-1 relative"
        >
          {/* Top-right Button of the Input Field to Exit Focus Mode */}
          <div className="absolute right-6 -top-7">
            <button
              type="button"
              onClick={toggleFocusMode}
              className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-[10px] font-mono uppercase tracking-wider border border-slate-800/80 cursor-pointer flex items-center gap-1 transition-all hover:scale-105 active:scale-95 duration-200"
              title="Exit Focus Mode"
            >
              <X className="w-3 h-3" />
              <span>Exit Focus</span>
            </button>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (keyboardPrompt.trim() && focusState !== "AI_THINKING") {
                const promptText = keyboardPrompt;
                setKeyboardPrompt("");
                setIsInputFocused(false);
                triggerIntelligencePipeline(promptText);
              }
            }}
            className={`flex items-center gap-3 bg-slate-950/80 border rounded-full px-4 py-2 transition-all duration-300 backdrop-blur-2xl ${
              isInputFocused 
                ? "border-blue-500/80 shadow-lg shadow-blue-500/10 bg-slate-950" 
                : "border-slate-800/90 shadow-md shadow-black/30 hover:border-slate-700"
            }`}
          >
            <input
              type="text"
              value={keyboardPrompt}
              onChange={(e) => setKeyboardPrompt(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                // Short timeout to let button click trigger before blur hides focus
                setTimeout(() => setIsInputFocused(false), 200);
              }}
              placeholder="Ask a question or type a prompt..."
              className="flex-1 bg-transparent border-none outline-none text-slate-100 text-sm placeholder:text-slate-500 font-sans px-1"
            />
            
            <button
              type="submit"
              disabled={!keyboardPrompt.trim() || focusState === "AI_THINKING"}
              className={`p-2 rounded-full transition-all duration-300 ${
                keyboardPrompt.trim() && focusState !== "AI_THINKING"
                  ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer hover:scale-105"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>

        {micError ? (
          <p className="text-[10.5px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full select-none">
            ⚠️ {micError}
          </p>
        ) : (
          focusState === "LISTENING" && (
            isInputFocused ? (
              <div className="flex items-center gap-1.5 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">
                  Microphone Paused (Typing)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest font-semibold">
                  Microphone Active
                </span>
              </div>
            )
          )
        )}

        <div className="pointer-events-auto select-none flex items-center gap-3">
          <button
            onClick={toggleFocusMode}
            className="px-5 py-2.5 rounded-full bg-blue-600/90 hover:bg-blue-500 hover:-translate-y-0.5 text-[10.5px] font-mono text-white font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-blue-500/25 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Go Back to Chat</span>
          </button>

          <button
            onClick={toggleFocusMode}
            className="px-5 py-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 hover:-translate-y-0.5 border border-slate-800 text-[10.5px] font-mono text-slate-300 font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2 shadow-lg shadow-black/25 hover:shadow-black/40"
          >
            <span>Exit Focus</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950 text-[9px] border border-slate-800">
              ESC
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
