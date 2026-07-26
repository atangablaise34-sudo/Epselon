import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, Brain, Cpu, Clock, CheckCircle2, Circle, BookOpen, 
  ChevronRight, Sparkles, AlertCircle, RefreshCw, Lightbulb, HelpCircle, FileText, Eye,
  ChevronDown, Check, X, Edit2, ArrowRight, Wand2, Paperclip, Camera, Mic, Link,
  Folder, StopCircle, LogOut, Play, CameraOff, MessageSquare, GraduationCap, ArrowLeft, XCircle
} from "lucide-react";
import { UserProfile, StudySession, ChatMessage } from "../../types";
import { sendChatMessage, createStudySession, updatePreferences, clearStudySession, updateSessionIntent } from "../../lib/api";
import RadialPulseLoader from "../../../components/ui/loading-animation";
import TransformedLessonView from "./TransformedLessonView";
import MathFormula from "../../components/MathFormula";
import FormattedMarkdown from "../../components/FormattedMarkdown";
import EpselonLogo from "../../components/EpselonLogo";
import LearningCanvasView from "./LearningCanvasView";
import FocusModeOverlay from "../../components/FocusModeOverlay";
import { EventBus } from "../../lib/EventBus";
import { EducationalContextEngine, EducationalContextPacket } from "../../lib/protocol/educationalContextEngine";
import EducationalContextDetailsModal from "../../components/EducationalContextDetailsModal";
import { AdaptiveLearningAssessmentEngine } from "../../lib/protocol/adaptiveAssessmentEngine";
import TeacherLensOverlay from "./TeacherLensOverlay";

interface ReflectionCard {
  type: "tf" | "mc" | "fib" | "match" | "arrange" | "short" | "scenario";
  question: string;
  options?: string[];
  correctIdx?: number;
  correctAnswers?: string[];
  leftItems?: string[];
  rightItems?: string[];
  correctPairs?: Record<string, string>;
  steps?: string[];
  placeholder?: string;
  correctKeyword?: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  stageName?: string;
  objectiveText?: string;
  conceptText?: string;
  explanationWhy?: string;
}

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-3.1-flash-lite",
  chatgpt: "gpt-4o",
  claude: "claude-3-5-sonnet",
  deepseek: "deepseek-v3",
  grok: "grok-2-beta",
  openrouter: "meta-llama-3.1-405b",
  local: "llama3:8b",
};

import { useFocusMode } from "../../context/FocusModeContext";

interface StudySessionViewProps {
  user: UserProfile;
  sessions: StudySession[];
  activeSessionId: string | null;
  onRefreshSessions: () => void;
  onSelectSession: (id: string) => void;
  initialTopic?: string;
  onRefreshUser?: () => void;
}

export default function StudySessionView({ 
  user, 
  sessions, 
  activeSessionId, 
  onRefreshSessions, 
  onSelectSession,
  initialTopic,
  onRefreshUser
}: StudySessionViewProps) {
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  const handleUpdateIntent = async (sessionId: string, intent: string) => {
    try {
      await updateSessionIntent(sessionId, intent);
      onRefreshSessions();
    } catch (err) {
      console.error("Failed to update intent manually:", err);
    }
  };

  const handleClearSession = async (sessionId: string) => {
    try {
      await clearStudySession(sessionId);
      onRefreshSessions();
    } catch (err) {
      console.error("Failed to clear Socratic session:", err);
    }
  };

  // New session creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");

  // Learning Protocol expansion states
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<{ msgId: string; question: string; answer: string; feedback?: string } | null>(null);
  const [pmtAnswers, setPmtAnswers] = useState<Record<string, { selectedIdx: number; submitted: boolean }>>({});

  // Highlight to Define states
  const [selectionText, setSelectionText] = useState("");
  const [definitionResult, setDefinitionResult] = useState<{ word: string; definition: string; contextApplied: string } | null>(null);
  const [defineLoading, setDefineLoading] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [showDefinePopover, setShowDefinePopover] = useState(false);
  const [showFloatingDefineBtn, setShowFloatingDefineBtn] = useState(false);

  // Prompt Coach FSM State Machine (State 1 to 9)
  // 'idle' | 'enhancing' | 'show_card' | 'reviewed' | 'choose_ai' | 'learning_canvas'
  const [flowState, setFlowState] = useState<'idle' | 'enhancing' | 'show_card' | 'reviewed' | 'choose_ai' | 'learning_canvas'>('idle');
  const [preSelectedIntent, setPreSelectedIntent] = useState<string>("Study");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [coachOriginal, setCoachOriginal] = useState("");
  const [activeEcePacket, setActiveEcePacket] = useState<EducationalContextPacket | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [rememberAIChoice, setRememberAIChoice] = useState(false);
  const [selectedAI, setSelectedAI] = useState(user.preferences.selectedProvider || "gemini");

  // Attachment & Media states
  const [attachedAssets, setAttachedAssets] = useState<Array<{
    id: string;
    name: string;
    type: "file" | "folder" | "image" | "audio" | "link";
    size?: number;
    content?: string;
    path?: string;
    previewUrl?: string;
  }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Camera & Image Capture states
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraInitError, setCameraInitError] = useState<string | null>(null);

  // Manual Link Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [linkModalError, setLinkModalError] = useState<string | null>(null);

  // Sync cameraStreamRef
  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Automatically parse links from inputText
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = inputText.match(urlRegex);
    if (matches) {
      matches.forEach(match => {
        // Clean URL from trailing punctuation
        let url = match.replace(/[.,;!?)]$/, "");
        try {
          const parsed = new URL(url);
          const host = parsed.hostname.replace("www.", "");
          
          setAttachedAssets(prev => {
            const isAlreadyAttached = prev.some(
              asset => asset.type === "link" && asset.content === url
            );
            if (isAlreadyAttached) return prev;
            
            const newAsset = {
              id: Math.random().toString(36).substring(7),
              name: host,
              type: "link" as const,
              content: url,
              previewUrl: url
            };
            return [...prev, newAsset];
          });
        } catch (e) {
          // Ignore invalid URLs
        }
      });
    }
  }, [inputText]);

  const startLiveCamera = async () => {
    setShowLiveCamera(true);
    setCameraInitError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment or blocked by container settings.");
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(videoDevices);
      
      const constraints: MediaStreamConstraints = {
        video: videoDevices.length > 0 
          ? { deviceId: videoDevices[0].deviceId } 
          : { facingMode: "environment" }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraInitError(err?.message || "Could not access the camera. Make sure you grant permissions.");
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setSelectedCameraId(deviceId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        
        const newAsset = {
          id: Math.random().toString(36).substring(7),
          name: `Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`,
          type: "image" as const,
          content: dataUrl,
          previewUrl: dataUrl
        };
        setAttachedAssets(prev => [...prev, newAsset]);
        closeLiveCamera();
      }
    }
  };

  const closeLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowLiveCamera(false);
    setCameraInitError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAsset = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: "image" as const,
          size: file.size,
          content: reader.result as string,
          previewUrl: reader.result as string
        };
        setAttachedAssets(prev => [...prev, newAsset]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const folderName = files[0].webkitRelativePath?.split('/')[0] || "Imported Folder";
    const maxFilesToRead = Math.min(files.length, 5);
    let filesSummary = `Folder "${folderName}" contains ${files.length} items.\n`;
    const items: Array<{ name: string; content: string }> = [];
    
    const readNext = (index: number) => {
      if (index >= maxFilesToRead) {
        const contentStr = filesSummary + "\n" + items.map(item => `--- File: ${item.name} ---\n${item.content}`).join("\n");
        const newAsset = {
          id: Math.random().toString(36).substring(7),
          name: folderName,
          type: "folder" as const,
          size: Array.from(files).reduce((sum, f) => sum + f.size, 0),
          content: contentStr
        };
        setAttachedAssets(prev => [...prev, newAsset]);
        return;
      }
      
      const file = files[index];
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".json") || file.name.endsWith(".js") || file.name.endsWith(".ts")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          items.push({
            name: file.webkitRelativePath || file.name,
            content: (event.target?.result as string)?.slice(0, 1000) || "[Empty or Non-readable]"
          });
          readNext(index + 1);
        };
        reader.readAsText(file);
      } else {
        items.push({
          name: file.webkitRelativePath || file.name,
          content: `[Binary or non-text file of type ${file.type}]`
        });
        readNext(index + 1);
      }
    };
    
    readNext(0);
    e.target.value = '';
  };



  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API is not supported in this context or blocked by browser/iframe restrictions. Please open the app in a new tab or try a different browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioFile = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const newAsset = {
            id: Math.random().toString(36).substring(7),
            name: `Voice Note (${recordingSeconds}s)`,
            type: "audio" as const,
            size: audioBlob.size,
            content: reader.result as string,
            previewUrl: audioUrl
          };
          setAttachedAssets(prev => [...prev, newAsset]);
        };
        reader.readAsDataURL(audioFile);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      setError(err?.message || "Microphone access was denied or dismissed. Please enable microphone permissions in your browser or try opening the app in a new tab.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const handleAddLink = () => {
    setLinkInputUrl("");
    setLinkModalError(null);
    setShowLinkModal(true);
  };

  const submitAddLink = () => {
    if (!linkInputUrl.trim()) {
      setLinkModalError("Please enter a URL.");
      return;
    }
    
    let cleanUrl = linkInputUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    
    try {
      const parsed = new URL(cleanUrl);
      const host = parsed.hostname.replace("www.", "");
      
      const newAsset = {
        id: Math.random().toString(36).substring(7),
        name: host,
        type: "link" as const,
        content: cleanUrl,
        previewUrl: cleanUrl
      };
      
      setAttachedAssets(prev => [...prev, newAsset]);
      setShowLinkModal(false);
      setLinkInputUrl("");
      setLinkModalError(null);
    } catch (err) {
      setLinkModalError("Please enter a valid link URL.");
    }
  };

  const appendAssetsToText = (text: string) => {
    if (attachedAssets.length === 0) return text;
    
    let result = text;
    result += "\n\n### Attached Socratic Assets Context:";
    attachedAssets.forEach(asset => {
      if (asset.type === "link") {
        result += `\n- **Connected Platform Link:** [${asset.name}](${asset.content}) - The AI should prioritize and access content from this URL.`;
      } else if (asset.type === "folder") {
        result += `\n- **Device Folder Attached:** "${asset.name}"\n  - Contents:\n  ${asset.content}`;
      } else if (asset.type === "image") {
        result += `\n- **Visual Asset Uploaded:** "${asset.name}"\n  - Metadata: Image Format captured. Binary verified.`;
      } else if (asset.type === "audio") {
        result += `\n- **Voice Frequency Captured:** "${asset.name}"\n  - Metadata: Voice stream frequency integrated successfully.`;
      } else {
        result += `\n- **File Connected:** "${asset.name}" (${asset.size} bytes).`;
      }
    });
    return result;
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAsset = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: "file" as const,
          size: file.size,
          content: reader.result as string,
          previewUrl: undefined
        };
        setAttachedAssets(prev => [...prev, newAsset]);
      };
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  // Stage 8: Reflection Gateway States (Epselon Learning Protocol)
  const [reflectionActive, setReflectionActive] = useState(false);
  const [reflectionStep, setReflectionStep] = useState<'prompt' | 'cards' | 'success'>('prompt');
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [mcAnswer, setMcAnswer] = useState<number | null>(null);
  const [showCardFeedback, setShowCardFeedback] = useState(false);
  const [cardFeedback, setCardFeedback] = useState("");
  const [promptedSessions, setPromptedSessions] = useState<Record<string, boolean>>({});
  const [submittingReflection, setSubmittingReflection] = useState(false);

  // Stage 9: Teacher Lens Integration States
  const [showTeacherLens, setShowTeacherLens] = useState(false);
  const [isSlidingLeftForTeacherLens, setIsSlidingLeftForTeacherLens] = useState(false);
  const [isReviewingQuestions, setIsReviewingQuestions] = useState(false);

  // Advanced Interactive Reflection States
  const [correctCount, setCorrectCount] = useState(0);
  const [isCardAnswerCorrect, setIsCardAnswerCorrect] = useState<boolean | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});
  const [arrangedSteps, setArrangedSteps] = useState<string[]>([]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const reflectionCards = useMemo<ReflectionCard[]>(() => {
    const topicName = activeSession?.focus || "General Science";
    const latestMentorMsg = activeSession?.messages?.slice().reverse().find(m => m.sender === 'mentor')?.text || "";
    const pkg = AdaptiveLearningAssessmentEngine.process({
      lessonText: latestMentorMsg,
      topicName: topicName,
      academicLevel: user.academicLevel,
      discipline: user.faculty || user.department
    });

    const mapped = pkg.questions.map(q => ({
      type: q.type,
      question: q.question,
      options: q.options,
      correctIdx: q.correctIdx,
      correctAnswers: q.correctAnswers,
      leftItems: q.leftItems,
      rightItems: q.rightItems,
      correctPairs: q.correctPairs,
      steps: q.steps,
      placeholder: q.placeholder,
      correctKeyword: q.correctKeyword,
      feedbackCorrect: q.feedbackCorrect,
      feedbackIncorrect: q.feedbackIncorrect,
      stageName: q.stageName,
      objectiveText: q.objectiveText,
      conceptText: q.conceptText,
      explanationWhy: q.explanationWhy
    }));

    // Deduplicate mapped reflection cards by question text
    const uniqueCards: ReflectionCard[] = [];
    const seen = new Set<string>();
    for (const card of mapped) {
      const norm = card.question.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueCards.push(card);
      }
    }
    return uniqueCards;
  }, [activeSession?.id, activeSession?.focus, activeSession?.messages?.length, user.academicLevel, user.faculty, user.department]);

  // Auto-detect topic completion (Stage 8 Reflection Gateway)
  useEffect(() => {
    if (activeSession && activeSession.progress >= 100 && !promptedSessions[activeSession.id]) {
      setReflectionActive(true);
      EventBus.publish("REFLECTION_STARTED");
      setReflectionStep('prompt');
      setCurrentCardIdx(0);
      setReflectionAnswers([]);
      setTextAnswer("");
      setMcAnswer(null);
      setShowCardFeedback(false);
      setCorrectCount(0);
      setIsCardAnswerCorrect(null);
      setMatchAnswers({});
      setArrangedSteps([]);
      setPromptedSessions(prev => ({ ...prev, [activeSession.id]: true }));
    }
  }, [activeSession?.progress, activeSession?.id]);

  // Highlight to Define Selection Handling
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection) return;

      const text = selection.toString().trim();
      
      // We only care about selections that are single words or short terms (2 to 50 characters)
      if (text && text.length > 1 && text.length < 50) {
        // Find if selection lies inside our active chat workspace area
        const container = document.getElementById("study-chat-stream-container");
        if (container && container.contains(selection.anchorNode)) {
          setSelectionText(text);
          
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            // Position above the center of the selected text range
            setSelectionCoords({
              x: rect.left + rect.width / 2 + window.scrollX,
              y: rect.top + window.scrollY
            });
            setShowFloatingDefineBtn(true);
          } catch (e) {
            // Ignore range errors
          }
          return;
        }
      }
      
      setShowFloatingDefineBtn(false);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const fetchDefinition = async () => {
    if (!selectionText) return;
    setDefineLoading(true);
    setShowDefinePopover(true);
    setShowFloatingDefineBtn(false);
    setDefinitionResult(null);
    try {
      const response = await fetch("/api/study/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: selectionText,
          sessionId: activeSessionId
        })
      });
      if (!response.ok) {
        throw new Error("Failed to fetch definition");
      }
      const data = await response.json();
      setDefinitionResult(data);
    } catch (err) {
      console.error("Error fetching definition:", err);
      setDefinitionResult({
        word: selectionText,
        definition: `Could not define "${selectionText}". Please ensure you have a connection and try again.`,
        contextApplied: "Standard System Dictionary"
      });
    } finally {
      setDefineLoading(false);
    }
  };

  // Handle step initialization for Match and Arrange question formats
  useEffect(() => {
    if (reflectionActive && reflectionCards[currentCardIdx]) {
      const card = reflectionCards[currentCardIdx];
      if (card.type === 'arrange' && card.steps) {
        // Shuffle steps to initiate user interaction
        setArrangedSteps([...card.steps].sort(() => Math.random() - 0.5));
      } else {
        setArrangedSteps([]);
      }
      setMatchAnswers({});
      setIsCardAnswerCorrect(null);
    }
  }, [currentCardIdx, reflectionActive]);

  const handleJumpToCard = (targetIdx: number) => {
    if (targetIdx === currentCardIdx || targetIdx < 0 || targetIdx >= reflectionCards.length) return;
    
    // Save current card response in answers array
    const card = reflectionCards[currentCardIdx];
    let currentAnswer = "";
    if (card.type === "mc" || card.type === "tf") {
      currentAnswer = mcAnswer !== null ? (card.options?.[mcAnswer] || "") : "";
    } else if (card.type === "match") {
      currentAnswer = Object.entries(matchAnswers).map(([k, v]) => `${k} -> ${v}`).join(", ");
    } else if (card.type === "arrange") {
      currentAnswer = arrangedSteps.join(" -> ");
    } else {
      currentAnswer = textAnswer;
    }

    const updatedAnswers = [...reflectionAnswers];
    updatedAnswers[currentCardIdx] = currentAnswer;
    setReflectionAnswers(updatedAnswers);

    // Reset current active card input states
    setTextAnswer("");
    setMcAnswer(null);
    setShowCardFeedback(false);
    setCardFeedback("");
    setIsCardAnswerCorrect(null);
    
    setCurrentCardIdx(targetIdx);
  };

  const handleRetryCard = () => {
    setShowCardFeedback(false);
    setCardFeedback("");
    setIsCardAnswerCorrect(null);
  };

  const handleVerifyCardAnswer = () => {
    const card = reflectionCards[currentCardIdx];
    let isCorrect = false;

    if (card.type === "mc" || card.type === "tf") {
      if (mcAnswer === null) return;
      isCorrect = mcAnswer === card.correctIdx;
    } else if (card.type === "fib") {
      if (!textAnswer.trim()) return;
      const ansClean = textAnswer.trim().toLowerCase();
      isCorrect = card.correctAnswers?.some(correct => ansClean.includes(correct.toLowerCase())) || false;
    } else if (card.type === "match") {
      // All pairs must match perfectly
      const pairs = card.correctPairs || {};
      const leftKeys = card.leftItems || [];
      isCorrect = leftKeys.every(key => matchAnswers[key] === pairs[key]);
    } else if (card.type === "arrange") {
      // Must equal exactly card.steps in correct order
      const targetSteps = card.steps || [];
      isCorrect = arrangedSteps.every((step, sIdx) => step === targetSteps[sIdx]);
    } else {
      // short, scenario (Evaluation in your own words / application)
      if (!textAnswer.trim()) return;
      const ansClean = textAnswer.trim().toLowerCase();
      const lengthCheck = ansClean.length > 20;
      const keywordCheck = card.correctKeyword ? ansClean.includes(card.correctKeyword.toLowerCase()) : true;
      isCorrect = lengthCheck && keywordCheck;
    }

    setIsCardAnswerCorrect(isCorrect);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setCardFeedback(card.feedbackCorrect || "✓ Correct! Good thinking. You've demonstrated understanding of this level.");
    } else {
      setCardFeedback(card.feedbackIncorrect || "Review required: There is a misalignment in your response. You can try again or proceed freely.");
    }
    setShowCardFeedback(true);
  };

  const handleNextCard = async () => {
    const card = reflectionCards[currentCardIdx];
    let currentAnswer = "";

    if (card.type === "mc" || card.type === "tf") {
      currentAnswer = mcAnswer !== null ? (card.options?.[mcAnswer] || "") : "Skipped";
    } else if (card.type === "match") {
      currentAnswer = Object.entries(matchAnswers).length > 0 
        ? Object.entries(matchAnswers).map(([k, v]) => `${k} -> ${v}`).join(", ")
        : "Skipped";
    } else if (card.type === "arrange") {
      currentAnswer = arrangedSteps.length > 0 ? arrangedSteps.join(" -> ") : "Skipped";
    } else {
      currentAnswer = textAnswer.trim() || "Skipped";
    }

    const updatedAnswers = [...reflectionAnswers];
    updatedAnswers[currentCardIdx] = currentAnswer;
    setReflectionAnswers(updatedAnswers);

    setTextAnswer("");
    setMcAnswer(null);
    setShowCardFeedback(false);
    setCardFeedback("");
    setIsCardAnswerCorrect(null);

    if (currentCardIdx < reflectionCards.length - 1) {
      setCurrentCardIdx(prev => prev + 1);
    } else {
      setSubmittingReflection(true);
      try {
        const res = await fetch("/api/study/reflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.id,
            topic: activeSession.focus,
            answers: updatedAnswers
          })
        });
        if (res.ok) {
          if (onRefreshUser) onRefreshUser();
          onRefreshSessions();
          setReflectionStep('success');
        } else {
          setReflectionStep('success');
        }
      } catch (err) {
        console.error("Failed to commit reflection to engines", err);
        setReflectionStep('success');
      } finally {
        setSubmittingReflection(false);
      }
    }
  };

  const triggerEnhancement = async (original: string) => {
    if (!original.trim()) return;
    setCoachOriginal(original);
    setFlowState('enhancing');
    setPipelineStep(0);
    EventBus.publish("PROMPT_REFINEMENT_STARTED");

    const focusTopic = activeSession?.focus || "General Discipline";
    const provider = user.preferences?.selectedProvider || "Gemini 3.5 Flash";
    const mode = preSelectedIntent ? `${preSelectedIntent} Mode` : "Study Mode";

    // Process Educational Context Packet deterministically
    const packet = EducationalContextEngine.process({
      originalPrompt: original.trim(),
      user,
      sessionFocus: focusTopic,
      provider,
      mode,
      knowledgeGraph: user.knowledgeGraph,
    });

    setActiveEcePacket(packet);

    // Step-by-step indicator progression for context assembly
    let stepCount = 0;
    const stepInterval = setInterval(() => {
      stepCount++;
      setPipelineStep(prev => Math.min(prev + 1, 5));
    }, 300);

    try {
      const res = await fetch("/api/study/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalPrompt: original, topic: focusTopic, sessionId: activeSession?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ecePacket) {
          setActiveEcePacket(data.ecePacket);
        }
      }
    } catch (err) {
      console.warn("Using local ECE packet assembly:", err);
    }

    clearInterval(stepInterval);
    setPipelineStep(5);

    if (packet.analysis.isCasual) {
      setFlowState('idle');
      await executeSocraticDiscourseDispatch(original, true);
      return;
    }

    // Preserve student prompt 100% intact
    setInputText(original);
    EventBus.publish("PROMPT_REFINEMENT_COMPLETED");
    setTimeout(() => {
      setFlowState('show_card');
    }, 400);
  };

  useEffect(() => {
    if (flowState === 'show_card') {
      const timer = setTimeout(() => {
        setFlowState('reviewed');
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [flowState]);

  const executeSocraticDiscourseDispatch = async (overrideText?: string, isConversational: boolean = false) => {
    setLoading(true);
    setError(null);
    EventBus.publish("PROMPT_SENT");
    try {
      // Update provider preferences
      const nextModel = PROVIDER_DEFAULT_MODELS[selectedAI] || "gemini-3.1-flash-lite";
      await updatePreferences({
        selectedProvider: selectedAI,
        selectedModel: nextModel,
      });
      if (onRefreshUser) onRefreshUser();

      // Ensure active Socratic session exists
      let targetSessionId = activeSession?.id;
      if (!targetSessionId) {
        const titleSnippet = coachOriginal.slice(0, 24);
        const session = await createStudySession(
          `Discourse: ${titleSnippet}`,
          titleSnippet,
          user.preferences.cognitiveLoad === "Master" ? "Advanced" : "Intermediate"
        );
        targetSessionId = session.id;
        onSelectSession(session.id);

        if (preSelectedIntent) {
          try {
            await updateSessionIntent(session.id, preSelectedIntent);
          } catch (err) {
            console.error("Failed to set pre-selected intent on new session:", err);
          }
        }
      }

      // Append attached assets context
      const textToUse = overrideText ?? inputText;
      const finalMessage = appendAssetsToText(textToUse);
      EventBus.publish("AI_GENERATING");
      await sendChatMessage(targetSessionId, finalMessage, isConversational);
      EventBus.publish("AI_RESPONSE_READY");

      // Reset flow to learning_canvas
      setAttachedAssets([]);
      setInputText("");
      setFlowState('learning_canvas');
      onRefreshSessions();
      
      // Simulate reading duration for character state reset
      setTimeout(() => {
        EventBus.publish("RESPONSE_COMPLETED");
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to reach Socratic model.");
      EventBus.publish("RESPONSE_COMPLETED");
    } finally {
      setLoading(false);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  // Handle topic creation if opened with an initialTopic from Nexus
  useEffect(() => {
    if (initialTopic) {
      handleCreateSessionWithTopic(initialTopic);
    }
  }, [initialTopic]);

  // Focus mode greeting logic
  const lastFocusModeRef = useRef(false);

  useEffect(() => {
    lastFocusModeRef.current = isFocusMode;
  }, [isFocusMode]);

  // Set flowState to learning_canvas if we select a session with existing mentor responses
  useEffect(() => {
    if (activeSessionId) {
      const currentSession = sessions.find(s => s.id === activeSessionId);
      const hasMentorResponse = currentSession?.messages.some(m => m.sender === "mentor");
      if (hasMentorResponse) {
        setFlowState('learning_canvas');
      } else {
        setFlowState('idle');
      }
      setPreSelectedIntent(currentSession?.manualIntent || "Study");
    } else {
      setFlowState('idle');
      setPreSelectedIntent("Study");
    }
  }, [activeSessionId, sessions]);

  const handleCreateSessionWithTopic = async (topic: string) => {
    try {
      setLoading(true);
      const session = await createStudySession(
        `Discourse: ${topic}`,
        topic,
        user.preferences.cognitiveLoad === "Master" ? "Advanced" : "Intermediate"
      );
      onRefreshSessions();
      onSelectSession(session.id);
    } catch {
      setError("Failed to initialize a new Socratic path. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToUse = overrideText ?? inputText;
    if (!textToUse.trim() || loading) return;

    if (isFocusMode || flowState === 'reviewed' || flowState === 'learning_canvas') {
      const isGreeting = /^(hi|hello|hey|thanks|how are you|good morning|i'm ready|let's start|ready|what's up|yes|no|ok|okay|got it|cool|understood|i see|make sense|makes sense|awesome|great|good|nice)/i.test(textToUse.trim());
      await executeSocraticDiscourseDispatch(textToUse, isGreeting);
    } else if (flowState === 'idle') {
      triggerEnhancement(textToUse);
    }
  };

  const handleQuickTemplate = (text: string) => {
    setInputText(text);
  };

  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const session = await createStudySession(`Discourse: ${newTopic}`, newTopic, newDifficulty);
      onRefreshSessions();
      onSelectSession(session.id);
      setShowCreateModal(false);
      setNewTopic("");
    } catch {
      setError("Failed to create study session.");
    } finally {
      setLoading(false);
    }
  };

  // Compile all Auto-Notes dynamically extracted across messages in this session
  const accumulatedNotes = activeSession?.messages.reduce<Array<{ key: string, val: string }>>((acc, msg) => {
    if (msg.autoNotes) {
      msg.autoNotes.forEach(n => {
        // Avoid duplicate keys
        if (!acc.some(existing => existing.key === n.key)) {
          acc.push(n);
        }
      });
    }
    return acc;
  }, []) || [];
  
  const latestMentorMsg = activeSession?.messages.slice().reverse().find(m => m.sender === 'mentor');
  const isLatestMentorStudy = latestMentorMsg?.protocolTrace?.learningIntent?.intent === "Study" || latestMentorMsg?.protocolTrace?.intent?.category === "Study";
  const isLearningCanvasMode = !!(flowState === 'learning_canvas' && activeSession && latestMentorMsg && isLatestMentorStudy);

  return (
    <div className="relative w-full h-full flex flex-col bg-transparent">
      <div className="flex-1 transition-all duration-500 flex flex-col min-h-0">
        {/* Full Page Chat Feed Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden justify-between animate-fade-in relative">
          
          {isLearningCanvasMode ? (
            <div className={`flex-1 relative min-h-0 flex flex-col ${reflectionActive ? "overflow-hidden" : "overflow-y-auto no-scrollbar py-2"}`}>
              {/* Learning Canvas backdrop wrapper */}
              <div 
                className="flex-1 w-full h-full transition-all duration-500 overflow-y-auto no-scrollbar"
                style={{
                  filter: reflectionActive ? "blur(14px)" : "none",
                  pointerEvents: reflectionActive ? "none" : "auto",
                  opacity: reflectionActive ? 0.55 : 1
                }}
              >
                <LearningCanvasView
                  message={activeSession.messages.slice().reverse().find(m => m.sender === 'mentor')!}
                  session={activeSession}
                  user={user}
                  onCheckUnderstanding={() => {
                    setReflectionActive(true);
                    EventBus.publish("REFLECTION_STARTED");
                    setReflectionStep('cards');
                    setCurrentCardIdx(0);
                    setReflectionAnswers([]);
                    setTextAnswer("");
                    setMcAnswer(null);
                    setShowCardFeedback(false);
                    setCorrectCount(0);
                    setIsCardAnswerCorrect(null);
                    setMatchAnswers({});
                    setArrangedSteps([]);
                  }}
                  onBackToPrompt={() => {
                    setFlowState('idle');
                  }}
                  onNewChat={() => {
                    onSelectSession(null as any);
                    setFlowState('idle');
                    setInputText("");
                    setAttachedAssets([]);
                    setError(null);
                  }}
                />
              </div>

              {/* Slight dimmer layer */}
              {reflectionActive && (
                <div className="absolute inset-0 bg-slate-950/45 z-30 pointer-events-none" />
              )}

              {/* Reflection Gateway Slide-Up Overlay Panel */}
              <AnimatePresence mode="sync">
                {reflectionActive && !showTeacherLens && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                      initial={{ y: "100vh", opacity: 0 }}
                      animate={{ 
                        x: isSlidingLeftForTeacherLens ? -350 : 0, 
                        opacity: isSlidingLeftForTeacherLens ? 0 : 1, 
                        scale: isSlidingLeftForTeacherLens ? 0.9 : 1,
                        y: 0 
                      }}
                      exit={{ 
                        x: -350, 
                        opacity: 0, 
                        scale: 0.9 
                      }}
                      transition={{ 
                        type: "spring", 
                        damping: 28, 
                        stiffness: 110, 
                        mass: 0.9
                      }}
                      className="relative w-full max-w-2xl bg-[#090c15] border border-blue-900/35 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden"
                    >
                      {/* Premium Ambient Accent Line & Glows */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

                      {reflectionStep === 'cards' ? (
                        <div className="flex-1 flex flex-col justify-between min-h-0 relative z-10">
                          {/* Inner Sliding Content Layer */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentCardIdx}
                              initial={{ x: 120, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: -120, opacity: 0 }}
                              transition={{ duration: 0.35, ease: "easeInOut" }}
                              className="space-y-5"
                            >
                              {/* Header Meta Info + Exit X Button */}
                              <div className="flex items-start justify-between gap-3 border-b border-slate-900/60 pb-3">
                                <div>
                                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Active Topic Focus</span>
                                  <span className="text-xs font-serif italic text-blue-400 font-semibold truncate block max-w-sm">
                                    {activeSession?.focus || "Guided AI Study Investigation"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right">
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Progress State</span>
                                    <span className="text-xs font-mono text-slate-300 font-bold block">
                                      Card {currentCardIdx + 1} of {reflectionCards.length}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setReflectionActive(false)}
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                                    title="Close Flashcards"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Clickable Progress Pills (Card 1, Card 2, Card 3, Card 4...) */}
                              <div className="flex items-center justify-between bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-900/80 overflow-x-auto no-scrollbar gap-2">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {reflectionCards.map((_, idx) => {
                                    const isCurrent = idx === currentCardIdx;
                                    const isDone = idx < currentCardIdx;
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleJumpToCard(idx)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                          isCurrent
                                            ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] font-bold ring-1 ring-blue-400"
                                            : isDone
                                            ? "bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/40"
                                            : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                        }`}
                                        title={`Jump to Card ${idx + 1}`}
                                      >
                                        <span>Card {idx + 1}</span>
                                        {isDone && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono shrink-0 ml-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                                  ~{Math.max(1, Math.ceil((reflectionCards.length - currentCardIdx) * 0.4))} min
                                </span>
                              </div>

                              {/* Question Body Text */}
                              <div className="space-y-3">
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-950/60 border border-blue-900/40 text-[9px] font-mono text-blue-400 uppercase tracking-widest font-bold">
                                  {reflectionCards[currentCardIdx].stageName || 'Foundational Principle'}
                                </span>
                                <h3 className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed font-sans">
                                  {reflectionCards[currentCardIdx].question}
                                </h3>
                              </div>

                              {/* Interactive Inputs depending on type */}
                              <div className="min-h-[170px] flex flex-col justify-center py-1">
                                {reflectionCards[currentCardIdx].type === 'tf' && (
                                  <div className="grid grid-cols-2 gap-4">
                                    {reflectionCards[currentCardIdx].options?.map((option, oIdx) => {
                                      const isSelected = mcAnswer === oIdx;
                                      return (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          disabled={showCardFeedback}
                                          onClick={() => setMcAnswer(oIdx)}
                                          className={`py-6 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                            isSelected
                                              ? "bg-blue-950/50 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                                              : "bg-slate-950/30 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-950/60"
                                          }`}
                                        >
                                          <span className="text-sm font-bold">{option}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {reflectionCards[currentCardIdx].type === 'mc' && (
                                  <div className="space-y-2.5">
                                    {reflectionCards[currentCardIdx].options?.map((option, oIdx) => {
                                      const isSelected = mcAnswer === oIdx;
                                      return (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          disabled={showCardFeedback}
                                          onClick={() => setMcAnswer(oIdx)}
                                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 cursor-pointer ${
                                            isSelected
                                              ? "bg-blue-950/50 border-blue-500 text-white"
                                              : "bg-slate-950/30 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-950/60"
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[9px] shrink-0 ${isSelected ? "border-blue-400 text-blue-400 bg-blue-950/50" : "border-slate-800 text-slate-500"}`}>
                                            {String.fromCharCode(65 + oIdx)}
                                          </span>
                                          <span className="leading-normal">{option}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {reflectionCards[currentCardIdx].type === 'fib' && (
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-slate-500 uppercase block">Enter the missing keyword:</label>
                                    <input
                                      type="text"
                                      disabled={showCardFeedback}
                                      value={textAnswer}
                                      onChange={(e) => setTextAnswer(e.target.value)}
                                      placeholder="Type your answer here..."
                                      className="w-full bg-slate-950/60 border border-slate-900 focus:border-blue-500/50 rounded-xl p-3.5 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all font-mono"
                                    />
                                  </div>
                                )}

                                {reflectionCards[currentCardIdx].type === 'match' && (
                                  <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                                    {reflectionCards[currentCardIdx].leftItems?.map((left, idx) => (
                                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs">
                                        <span className="text-slate-300 font-medium">{left}</span>
                                        <select
                                          disabled={showCardFeedback}
                                          value={matchAnswers[left] || ""}
                                          onChange={(e) => setMatchAnswers(prev => ({ ...prev, [left]: e.target.value }))}
                                          className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 max-w-xs cursor-pointer"
                                        >
                                          <option value="">Select correct match...</option>
                                          {reflectionCards[currentCardIdx].rightItems?.map((right, rIdx) => (
                                            <option key={rIdx} value={right}>{right}</option>
                                          ))}
                                        </select>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {reflectionCards[currentCardIdx].type === 'arrange' && (
                                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                                    {arrangedSteps.map((step, idx) => (
                                      <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-300">
                                        <span className="leading-relaxed flex-1"><strong className="text-blue-500 font-mono mr-1.5">{idx + 1}.</strong> {step}</span>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            disabled={showCardFeedback || idx === 0}
                                            onClick={() => {
                                              const newSteps = [...arrangedSteps];
                                              const temp = newSteps[idx];
                                              newSteps[idx] = newSteps[idx - 1];
                                              newSteps[idx - 1] = temp;
                                              setArrangedSteps(newSteps);
                                            }}
                                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-20 cursor-pointer text-[10px]"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            type="button"
                                            disabled={showCardFeedback || idx === arrangedSteps.length - 1}
                                            onClick={() => {
                                              const newSteps = [...arrangedSteps];
                                              const temp = newSteps[idx];
                                              newSteps[idx] = newSteps[idx + 1];
                                              newSteps[idx + 1] = temp;
                                              setArrangedSteps(newSteps);
                                            }}
                                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-20 cursor-pointer text-[10px]"
                                          >
                                            ▼
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {(reflectionCards[currentCardIdx].type === 'short' || reflectionCards[currentCardIdx].type === 'scenario') && (
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-slate-500 uppercase block">Elaborate your conceptual explanation:</label>
                                    <textarea
                                      disabled={showCardFeedback}
                                      value={textAnswer}
                                      onChange={(e) => setTextAnswer(e.target.value)}
                                      placeholder={reflectionCards[currentCardIdx].placeholder || "Elaborate using logical relationships, equations, or analogies..."}
                                      rows={4}
                                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 font-sans resize-none leading-relaxed"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Feedback Dialog */}
                              {showCardFeedback && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`p-4 rounded-xl text-xs font-mono leading-relaxed space-y-1.5 ${
                                    isCardAnswerCorrect 
                                      ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-300" 
                                      : "bg-blue-950/30 border border-blue-900/40 text-blue-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold">
                                    <Cpu className={`w-3.5 h-3.5 ${isCardAnswerCorrect ? "text-emerald-400" : "text-blue-400"}`} />
                                    <span>Mentor Evaluation Trace</span>
                                  </div>
                                  <p>{cardFeedback}</p>
                                </motion.div>
                              )}
                            </motion.div>
                          </AnimatePresence>

                          {/* Non-Blocking Footer Actions */}
                          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-900/60 mt-4 shrink-0">
                            {!showCardFeedback ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleVerifyCardAnswer}
                                  disabled={
                                    (reflectionCards[currentCardIdx].type === 'mc' || reflectionCards[currentCardIdx].type === 'tf')
                                      ? mcAnswer === null 
                                      : reflectionCards[currentCardIdx].type === 'match'
                                      ? Object.keys(matchAnswers).length < (reflectionCards[currentCardIdx].leftItems?.length || 0)
                                      : !textAnswer.trim()
                                  }
                                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-35 text-white font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                                >
                                  Verify Answer
                                </button>

                                <button
                                  type="button"
                                  onClick={handleNextCard}
                                  disabled={submittingReflection}
                                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                                >
                                  {submittingReflection ? (
                                    <div className="flex items-center gap-2">
                                      <RadialPulseLoader size={16} color="#ffffff" showText={false} />
                                      <span>Saving...</span>
                                    </div>
                                  ) : currentCardIdx < reflectionCards.length - 1 ? (
                                    <>
                                      Next Question <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                                    </>
                                  ) : (
                                    <>
                                      Complete Gateway <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={handleRetryCard}
                                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Try Again</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={handleNextCard}
                                  disabled={submittingReflection}
                                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ml-auto"
                                >
                                  {submittingReflection ? (
                                    <div className="flex items-center gap-2">
                                      <RadialPulseLoader size={16} color="#ffffff" showText={false} />
                                      <span>Saving...</span>
                                    </div>
                                  ) : currentCardIdx < reflectionCards.length - 1 ? (
                                    <>
                                      Next Question <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      Complete Gateway <Check className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : !isReviewingQuestions ? (
                        /* SUCCESS COMPLETION SUMMARY SCORE CARD */
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-6 text-center py-4 relative z-10"
                        >
                          <div className="relative w-14 h-14 mx-auto">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50 inline-block">
                              Flashcard Gateway Complete
                            </span>
                            <h2 className="text-xl font-serif italic text-white font-semibold">General Score Evaluation</h2>
                            <div className="flex items-center justify-center gap-2 pt-1">
                              <span className="text-3xl font-mono font-extrabold text-white">{correctCount}</span>
                              <span className="text-lg font-mono text-slate-500">/ {reflectionCards.length}</span>
                              <span className="ml-2 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                                {Math.round((correctCount / (reflectionCards.length || 1)) * 100)}% Accuracy
                              </span>
                            </div>
                          </div>

                          {/* Evaluation Statistics Grid */}
                          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-900 space-y-3 text-xs text-left max-w-md mx-auto">
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                              <div className="flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                                <span>COGNITIVE PERFORMANCE SYNAPSE</span>
                              </div>
                              <span className="text-emerald-400">STATUS: VERIFIED</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-900 pt-3">
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase">Correct Questions</span>
                                <span className="text-emerald-400 font-mono text-xs font-bold">{correctCount} / {reflectionCards.length}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase">Mastery Index</span>
                                <span className="text-slate-200 font-mono text-xs font-bold">
                                  {Math.round((correctCount / (reflectionCards.length || 1)) * 100)}%
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase">Topic Confidence</span>
                                <span className="text-blue-400 font-mono text-[10px] font-bold">
                                  {correctCount >= (reflectionCards.length * 0.75) ? "HIGH MASTERY" : correctCount >= (reflectionCards.length * 0.5) ? "MODERATE" : "DEVELOPING"}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase">Examiner Preparedness</span>
                                <span className="text-indigo-400 font-mono text-[10px] font-bold">
                                  {correctCount >= (reflectionCards.length * 0.75) ? "READY FOR EXAM" : "CONCEPT REVIEW REQD"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* CTA Action buttons */}
                          <div className="flex flex-col gap-2.5 pt-2 max-w-md mx-auto">
                            <button
                              type="button"
                              onClick={() => setIsReviewingQuestions(true)}
                              className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800 text-blue-300 font-mono text-xs uppercase tracking-wider font-bold rounded-xl border border-blue-900/40 hover:border-blue-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                              <span>Review & Compare Questions ({reflectionCards.length})</span>
                            </button>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSlidingLeftForTeacherLens(true);
                                  setTimeout(() => setShowTeacherLens(true), 300);
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-[#371BF2] via-[#705FD9] to-[#9C8BD9] hover:opacity-95 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg shadow-[#371BF2]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <GraduationCap className="w-4 h-4 text-white" />
                                <span>Proceed to Teacher Lens™</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReflectionActive(false);
                                  setFlowState('idle');
                                }}
                                className="py-3 px-4 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs uppercase tracking-wider font-semibold rounded-xl border border-slate-800 transition-all cursor-pointer"
                              >
                                Return to Workspace
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        /* QUESTION COMPARISON & REVIEW PANEL */
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 py-2 relative z-10 text-left"
                        >
                          {/* Review Panel Header */}
                          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 uppercase tracking-wider font-bold">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Gateway Review & Comparison Mode</span>
                              </div>
                              <h3 className="text-base font-serif italic text-white font-semibold">
                                Review Submitted Flashcard Questions
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsReviewingQuestions(false)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-lg border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to Score</span>
                            </button>
                          </div>

                          {/* List of Questions with Student Answer vs Model Answer */}
                          <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
                            {reflectionCards.map((card, idx) => {
                              const studentAns = reflectionAnswers[idx] || "Skipped / No Answer Provided";
                              
                              let modelAns = "";
                              if (card.type === 'mc' || card.type === 'tf') {
                                modelAns = (card.options && card.correctIdx !== undefined && card.options[card.correctIdx])
                                  ? card.options[card.correctIdx]
                                  : "Model option response";
                              } else if (card.type === 'match' && card.correctPairs) {
                                modelAns = Object.entries(card.correctPairs).map(([k, v]) => `${k} -> ${v}`).join(", ");
                              } else if (card.type === 'arrange' && card.steps) {
                                modelAns = card.steps.join(" -> ");
                              } else if (card.correctKeyword) {
                                modelAns = `Key term / concept: "${card.correctKeyword}"`;
                              } else {
                                modelAns = card.explanationWhy || "Model analytical explanation";
                              }

                              return (
                                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-900 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-900/80 pb-2">
                                    <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">
                                      Card {idx + 1} • {card.type.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      Topic: {card.stageName || "Conceptual"}
                                    </span>
                                  </div>

                                  <p className="text-slate-200 font-serif italic text-xs leading-relaxed">
                                    "{card.question}"
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                                    {/* Student Answer */}
                                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                                      <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                                        Your Answer:
                                      </span>
                                      <p className="text-slate-200 font-mono text-xs break-words">
                                        {studentAns}
                                      </p>
                                    </div>

                                    {/* Model Answer */}
                                    <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 space-y-1">
                                      <span className="text-[9px] font-mono text-blue-400 uppercase font-bold block">
                                        Model Answer:
                                      </span>
                                      <p className="text-blue-200 font-mono text-xs break-words">
                                        {modelAns}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Explanation / Feedback */}
                                  {(card.feedbackCorrect || card.explanationWhy) && (
                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                                      <span className="text-slate-500 font-bold uppercase block mb-0.5">Mentor Insight:</span>
                                      <p>{card.feedbackCorrect || card.explanationWhy}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Bottom Action Footer for Review Mode */}
                          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsReviewingQuestions(false)}
                              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider font-semibold rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to Score Summary</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsSlidingLeftForTeacherLens(true);
                                setTimeout(() => setShowTeacherLens(true), 300);
                              }}
                              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#371BF2] via-[#705FD9] to-[#9C8BD9] hover:opacity-95 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg shadow-[#371BF2]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <GraduationCap className="w-4 h-4 text-white" />
                              <span>Proceed to Teacher Lens™</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Stage 9: Teacher Lens Overlay */}
              <AnimatePresence>
                {showTeacherLens && activeSession && (
                  <TeacherLensOverlay
                    topicName={activeSession.focus || "Guided AI Study Session"}
                    user={user}
                    session={activeSession}
                    performanceScore={{
                      correctCount,
                      totalCount: reflectionCards.length
                    }}
                    lessonText={activeSession.messages.slice().reverse().find(m => m.sender === 'mentor')?.text || ""}
                    onCloseSession={() => {
                      setShowTeacherLens(false);
                      setReflectionActive(false);
                      setIsSlidingLeftForTeacherLens(false);
                      if (onRefreshUser) onRefreshUser();
                      onRefreshSessions();
                    }}
                    onHighlightNexusTopic={(topic) => {
                      console.log("Teacher Lens selected Nexus topic:", topic);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              {/* Workspace Header (Renders always in chat feed branch) */}
              <div className="px-5 py-3 flex items-center justify-between relative z-10 border-b border-slate-900/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <EpselonLogo size={22} className="filter drop-shadow-[0_0_4px_rgba(224,27,242,0.2)]" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">
                      {activeSession ? activeSession.title : "Epselon Workspace"}
                    </h3>
                    {activeSession ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-600" />
                          Discourse Level: {activeSession.difficulty || "Proficient"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        AI Prompt Coach Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 relative">
                  {/* "New Chat" Button (Only show if conversation is active/initiated) */}
                  {activeSession && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        onSelectSession(null as any);
                        setFlowState('idle');
                        setInputText("");
                        setAttachedAssets([]);
                        setError(null);
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 text-[10px] font-mono uppercase tracking-wider font-bold text-blue-300 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/5 cursor-pointer"
                      title="Start a completely empty study workspace"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
                      <span>New Chat</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Main Empty State */}
              {(!activeSession || activeSession.messages.length === 0) && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center -mt-32">
                  <div className="text-center space-y-4 px-6">
                    <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white/90">
                      What would you like to learn today?
                    </h2>
                    <p className="text-slate-400 font-light text-sm md:text-base max-w-md mx-auto leading-relaxed">
                      Start a study session by describing what you're trying to understand. Epselon will help you think before the AI answers.
                    </p>
                  </div>
                </div>
              )}

          {/* Socratic Focus Mode Continuation Bar */}
          {activeSession && activeSession.messages.length > 1 && !isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-5 mt-4 p-3 bg-gradient-to-r from-blue-600/10 via-indigo-600/15 to-slate-950/40 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10"
            >
              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-sans text-slate-200 font-medium">
                    Continue chatting with Nimo in Focus Mode
                  </p>
                  <p className="text-[10px] font-sans text-slate-400 mt-0.5 leading-tight">
                    Nimo's voice synthesis is synchronized. Go back into focus to speak and listen hands-free.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleFocusMode}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded-lg border border-blue-400/50 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.03] cursor-pointer"
              >
                Go into Focus
              </button>
            </motion.div>
          )}

          {/* Chat Stream */}
          <div id="study-chat-stream-container" className="flex-1 p-5 pb-40 overflow-y-auto space-y-5 no-scrollbar relative z-10">
            {activeSession?.isOfflineSocraticMode && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 relative z-10 text-xs"
              >
                <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-amber-200">
                    Offline Study Mode Enabled
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                    The daily cloud API quota has been reached. Epselon has automatically switched to high-speed Offline Study Mode. Your custom derivations, regional analogies, and active recall moments remain fully functional!
                  </p>
                </div>
              </motion.div>
            )}

            {activeSession?.messages.map((msg) => {
            const isMentor = msg.sender === "mentor";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMentor ? "self-start" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar icon */}
                {isMentor && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-brand-light" />
                  </div>
                )}

                <div className="space-y-2 w-full">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isMentor
                        ? "bg-slate-900/60 border border-slate-800/80 text-slate-200"
                        : "bg-brand-primary border border-brand-medium text-white"
                    }`}
                  >
                    {isMentor && msg.id !== "msg_init" && !msg.text.startsWith("### 🛂") && (msg.protocolTrace?.learningIntent?.intent === "Study" || msg.protocolTrace?.intent?.category === "Study") ? (
                      <TransformedLessonView message={msg} topicName={activeSession?.focus || "General Science"} />
                    ) : (
                      <FormattedMarkdown>{msg.text}</FormattedMarkdown>
                    )}
                    
                    {/* Inline Formula Drawer */}
                    {(!isMentor || msg.id === "msg_init" || msg.text.startsWith("### 🛂")) && msg.equation && (
                      <MathFormula latex={msg.equation} label="Core Derivation" />
                    )}

                    {/* Protocol Trace Toggle Button */}
                    {isMentor && msg.protocolTrace && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                          className="flex items-center justify-between text-[10px] font-mono text-brand-light hover:text-brand-medium transition-colors w-full bg-slate-950/40 hover:bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800/40"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-brand-light animate-pulse" />
                            LEARNING PROTOCOL TRACE (STAGES 1-7)
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {expandedTraceId === msg.id ? "COLLAPSE ▲" : "EXPAND ENGINE STATE ▼"}
                          </span>
                        </button>

                        <AnimatePresence>
                          {expandedTraceId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-3 pt-2 text-[11px]"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {/* Stage 1: Intent Detection */}
                                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 space-y-1">
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-purple-400" /> STAGE 1: INTENT</span>
                                    <span className="text-purple-400 font-bold">{msg.protocolTrace.intent ? (msg.protocolTrace.intent.confidence * 100).toFixed(0) : "85"}% CONFIDENCE</span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-200 capitalize">
                                    {msg.protocolTrace.intent?.category.replace("_", " ")}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                                    {msg.protocolTrace.intent?.reason}
                                  </p>
                                </div>

                                {/* Stage 6: AI Routing */}
                                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 space-y-1">
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-emerald-400" /> STAGE 6: AI ROUTE</span>
                                    <span className="text-emerald-400 font-bold">AUTOMATIC</span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-200 uppercase">
                                    {msg.protocolTrace.routing?.providerId} - {msg.protocolTrace.routing?.model}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                                    {msg.protocolTrace.routing?.justification}
                                  </p>
                                </div>

                                {/* Stage 4: Pedagogical Scaffolding */}
                                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 space-y-1 md:col-span-2">
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" /> STAGE 4: PEDAGOGY ENGINE</span>
                                    <span className="text-orange-400 font-bold">{msg.protocolTrace.pedagogy?.style}</span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-200">
                                    Bloom Focus: {msg.protocolTrace.pedagogy?.bloomLevel}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-light space-y-1">
                                    <span className="font-semibold block text-slate-300">Active Scaffolding Rules Injected:</span>
                                    {msg.protocolTrace.pedagogy?.scaffoldingRules.map((rule, rIdx) => (
                                      <div key={rIdx} className="flex gap-1.5 items-start">
                                        <span className="text-orange-400 shrink-0 font-mono">•</span>
                                        <span>{rule}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Stage 5: Localized Curriculum */}
                                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 space-y-1 md:col-span-2">
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-cyan-400" /> STAGE 5: CURRICULUM SYLLABUS</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 font-light leading-relaxed">
                                    {msg.protocolTrace.curriculum?.contextSnippet}
                                  </p>
                                  {msg.protocolTrace.curriculum?.localExamples && msg.protocolTrace.curriculum.localExamples.length > 0 && (
                                    <div className="text-[9px] text-slate-400 font-mono space-y-0.5 pt-1 border-t border-slate-900">
                                      <span className="text-[8px] uppercase text-slate-500 font-bold">LOCAL CONTEXT LABS</span>
                                      {msg.protocolTrace.curriculum.localExamples.map((ex, exIdx) => (
                                        <div key={exIdx} className="truncate">→ {ex}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Stage 3: Prompt Coach */}
                                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 space-y-2 md:col-span-2">
                                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-900">
                                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-pink-400 animate-bounce" /> STAGE 3: INTELLIGENT PROMPT COACH</span>
                                    <span className="text-pink-400 font-bold">OPTIMIZED PIPELINE</span>
                                  </div>
                                  <div className="space-y-2 pt-1 font-sans">
                                    <div className="p-1.5 rounded bg-slate-900/60 text-[10px] font-mono border border-slate-800">
                                      <span className="text-slate-500 block uppercase text-[8px] font-bold">ORIGINAL PROMPT</span>
                                      <span className="text-slate-300">"{msg.protocolTrace.coach?.original}"</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold font-mono block">ENHANCEMENT SEQUENCE</span>
                                      {msg.protocolTrace.coach?.steps.map((step, sIdx) => (
                                        <div key={sIdx} className="flex gap-2 items-start text-[10px]">
                                          <div className="w-4 h-4 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-mono text-[9px] shrink-0">
                                            {sIdx + 1}
                                          </div>
                                          <div className="space-y-0.5 leading-tight">
                                            <span className="font-mono text-pink-400 text-[9px] block">{step.label}</span>
                                            <p className="text-slate-400 font-light text-[10px]">{step.explanation}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Picture Memory Test Block */}
                    {isMentor && msg.protocolTrace?.pictureMemoryTest && (
                      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-tr from-slate-900/40 via-purple-950/10 to-slate-900/40 border border-purple-500/35 space-y-3 font-sans relative overflow-hidden">
                        {/* Glow indicator */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-xl pointer-events-none" />

                        <div className="flex items-center gap-1.5 text-purple-300 pb-2 border-b border-purple-500/20">
                          <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
                          <span className="text-[10px] font-mono tracking-widest uppercase font-semibold">PICTURE MEMORY TEST</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
                            {msg.protocolTrace.pictureMemoryTest.question}
                          </p>

                          <div className="grid grid-cols-1 gap-1.5 pt-1">
                            {msg.protocolTrace.pictureMemoryTest.options.map((option: string, optIdx: number) => {
                              const answerState = pmtAnswers[msg.id];
                              const isSubmitted = answerState?.submitted;
                              const isSelected = answerState?.selectedIdx === optIdx;
                              const isCorrect = msg.protocolTrace.pictureMemoryTest.correctOptionIdx === optIdx;

                              let btnClass = "w-full text-left p-2.5 rounded-lg text-[10.5px] transition-all border cursor-pointer ";
                              if (!isSubmitted) {
                                btnClass += isSelected
                                  ? "bg-purple-950/40 border-purple-400 text-purple-200"
                                  : "bg-slate-950/40 border-slate-900 text-slate-300 hover:bg-slate-950 hover:text-white hover:border-slate-800";
                              } else {
                                if (isCorrect) {
                                  btnClass += "bg-emerald-950/30 border-emerald-500 text-emerald-200";
                                } else if (isSelected) {
                                  btnClass += "bg-rose-950/30 border-rose-500 text-rose-200";
                                } else {
                                  btnClass += "bg-slate-950/20 border-slate-950/40 text-slate-500 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => {
                                    setPmtAnswers(prev => ({
                                      ...prev,
                                      [msg.id]: { selectedIdx: optIdx, submitted: false }
                                    }));
                                  }}
                                  className={btnClass}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] text-slate-500 uppercase shrink-0">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span>{option}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Submit / Feedback panel */}
                          {pmtAnswers[msg.id] && (
                            <div className="pt-2">
                              {!pmtAnswers[msg.id].submitted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPmtAnswers(prev => ({
                                      ...prev,
                                      [msg.id]: { ...prev[msg.id], submitted: true }
                                    }));
                                    // Trigger user callback to refresh profile metrics
                                    if (onRefreshUser) onRefreshUser();
                                  }}
                                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                                >
                                  SUBMIT TEST ANSWER
                                </button>
                              ) : (
                                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-900 text-[10px] space-y-1 animate-fade-in">
                                  <div className="flex items-center gap-1">
                                    {pmtAnswers[msg.id].selectedIdx === msg.protocolTrace.pictureMemoryTest.correctOptionIdx ? (
                                      <span className="text-emerald-400 font-mono font-bold">✅ CORRECT! Photographic recall active.</span>
                                    ) : (
                                      <span className="text-rose-400 font-mono font-bold">❌ INCORRECT. Re-scan explanation text.</span>
                                    )}
                                  </div>
                                  <p className="text-slate-400 leading-relaxed">
                                    {msg.protocolTrace.pictureMemoryTest.explanationOfCorrectAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reflection Gateway Assessment (Stage 8) */}
                    {isMentor && msg.protocolTrace && (msg.protocolTrace.practiceQuestion || (msg.protocolTrace.reflectionQuestions && msg.protocolTrace.reflectionQuestions.length > 0)) && (
                      <div className="mt-4 p-3.5 rounded-xl bg-brand-dark/20 border border-brand-primary/30 space-y-3 font-sans">
                        <div className="flex items-center gap-1.5 text-brand-light pb-2 border-b border-brand-primary/20">
                          <CheckCircle2 className="w-4 h-4 text-brand-light animate-pulse" />
                          <span className="text-[10px] font-mono tracking-widest uppercase font-semibold">STAGE 8: REFLECTION GATEWAY</span>
                        </div>

                        <div className="space-y-2.5">
                          {msg.protocolTrace.practiceQuestion && (
                            <div className="space-y-1">
                              <span className="block text-[9px] font-mono text-brand-light font-bold uppercase">COMPREHENSION QUIZ TASK</span>
                              <p className="text-[11px] text-slate-200">{msg.protocolTrace.practiceQuestion}</p>
                            </div>
                          )}

                          {msg.protocolTrace.reflectionQuestions && msg.protocolTrace.reflectionQuestions.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="block text-[9px] font-mono text-brand-light font-bold uppercase">REFLECTION CHECKS</span>
                              {msg.protocolTrace.reflectionQuestions.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  type="button"
                                  onClick={() => setActiveQuestion({ msgId: msg.id, question: q, answer: "", feedback: undefined })}
                                  className="w-full text-left p-2 rounded bg-slate-950/60 hover:bg-slate-950 border border-slate-900 text-[10px] text-slate-300 hover:text-white transition-colors"
                                >
                                  {qIdx + 1}. {q}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Interactive Assessment Overlay Form */}
                        {activeQuestion && activeQuestion.msgId === msg.id && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-brand-primary/40 space-y-3 animate-fade-in text-[11px]">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-900">
                              <span>ACTIVE COGNITIVE GATE</span>
                              <button
                                type="button"
                                onClick={() => setActiveQuestion(null)}
                                className="text-red-400 hover:underline hover:text-red-300"
                              >
                                CLOSE ×
                              </button>
                            </div>

                            <p className="text-slate-300 leading-normal italic">"{activeQuestion.question}"</p>

                            {!activeQuestion.feedback ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!activeQuestion.answer.trim()) return;

                                  // Evaluate response length as standard proxy for effort
                                  const ans = activeQuestion.answer.toLowerCase();
                                  let isCorrect = false;
                                  let feedback = "Excellent reflection synthesis! Your active cognitive assimilation is successful.";
                                  if (ans.length > 15) {
                                    isCorrect = true;
                                  } else {
                                    feedback = "Your conceptual elaboration is brief. Try adding more mechanical depth to support active assimilation next time.";
                                  }

                                  // Trigger user callback to refresh profile metrics
                                  if (onRefreshUser) {
                                    onRefreshUser();
                                  }

                                  setActiveQuestion({
                                    ...activeQuestion,
                                    feedback: `${isCorrect ? "✅ SUCCESS: Mastery Level Boosted." : "⚠️ REVIEW RECOMMENDED."} ${feedback}`
                                  });
                                }}
                                className="space-y-2"
                              >
                                <textarea
                                  value={activeQuestion.answer}
                                  onChange={(e) => setActiveQuestion({ ...activeQuestion, answer: e.target.value })}
                                  placeholder="Synthesize your response here..."
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-[10px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-primary font-sans resize-none"
                                />
                                <button
                                  type="submit"
                                  className="w-full py-1.5 rounded bg-brand-primary hover:bg-brand-medium text-white font-mono text-[9px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                                >
                                  SUBMIT TO REFLECTION GATEWAY
                                </button>
                              </form>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[10.5px] text-brand-light font-mono leading-relaxed">{activeQuestion.feedback}</p>
                                <button
                                  type="button"
                                  onClick={() => setActiveQuestion(null)}
                                  className="w-full py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[9px]"
                                >
                                  PROCEED TO NEXT TOPIC
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <span className={`block text-[8px] font-mono text-slate-500 ${isMentor ? "" : "text-right"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%] self-start">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <RadialPulseLoader size={24} color="#371BF2" showText={false} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <RadialPulseLoader size={36} color="#371BF2" showText={false} />
                <span>AI Tutor is preparing your response...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 pb-6 pt-2 z-40 relative">
          
          {/* STATE 5: Educational Context Engine Summary Card Overlay */}
          <AnimatePresence>
            {flowState === 'show_card' && (
              <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative max-w-lg w-full bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl text-left space-y-5 overflow-hidden"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif italic text-white font-semibold flex items-center gap-2">
                        ✨ Optimized for Learning
                      </h3>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">
                        We prepared your request by assembling structured educational context around your query.
                      </p>
                    </div>
                  </div>

                  {/* Checklist of context additions */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                      Context Packet Summary:
                    </span>
                    {[
                      { title: "Learning context", detail: activeEcePacket ? `Mapped to ${activeEcePacket.analysis.subject}` : "Subject & discipline context attached" },
                      { title: "Teaching objectives", detail: "Pedagogical targets and goals defined" },
                      { title: "Response structure", detail: "Structured 6-part pedagogical response sequence" },
                      { title: "Better instructional guidance", detail: "Tailored pedagogical rules & level matching" },
                      { title: "Study-friendly formatting", detail: "LaTeX KaTeX equations and Markdown enabled" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-200">{item.title}</span>
                          <span className="text-[11px] text-slate-400 block font-light">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verbatim prompt notification */}
                  <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Original prompt preserved 100% verbatim. Zero words altered.</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDetailsModalOpen(true)}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setFlowState('reviewed')}
                      className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono font-bold uppercase tracking-wider text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* STATE 3 & 4: Educational Context Engine Assembly Animation */}
          {flowState === 'enhancing' ? (
            <div className="w-full max-w-xl bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-2xl space-y-4 font-sans relative overflow-hidden pointer-events-auto prompt-coach-gradient-border">
              {/* Ambient Background Shimmers */}
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-brand-medium/5 blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-brand-primary/[0.01] to-brand-light/[0.01] pointer-events-none animate-pulse" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-tr from-brand-dark to-brand-primary flex items-center justify-center relative">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
                    EDUCATIONAL CONTEXT ENGINE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  ASSEMBLING CONTEXT...
                </div>
              </div>

              {/* Textbox with glowing border and virtual cursor */}
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">Original Student Request: "{coachOriginal}"</span>
                <div className="p-4 rounded-xl bg-slate-950 border border-brand-primary/30 text-xs text-slate-200 leading-relaxed font-sans shadow-lg shadow-brand-primary/5 relative min-h-[90px] select-none">
                  <p className="inline whitespace-pre-wrap">{inputText}</p>
                  <span className="w-1.5 h-3.5 bg-indigo-400 inline-block ml-0.5 animate-pulse" />
                </div>
              </div>

              {/* Educational Pipeline Context Indicators */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Context Indicators:</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    "Adding Learning Context",
                    "Detecting Subject",
                    "Building Study Structure",
                    "Selecting Teaching Strategy",
                    "Preparing AI Instructions",
                    "Optimizing for Learning"
                  ].map((step, idx) => {
                    const isCompleted = pipelineStep > idx || (idx === 5 && pipelineStep === 5);
                    const isActive = pipelineStep === idx && idx < 5;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 text-xs transition-colors duration-300">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-700 shrink-0" />
                        )}
                        <span className={`text-[11px] font-light tracking-wide ${
                          isCompleted ? "text-slate-200 font-medium" : isActive ? "text-indigo-300 font-semibold animate-pulse" : "text-slate-600"
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* STATE 1, 2, 6, 7 Form Interface */
            <form onSubmit={handleSendMessage} className="w-full max-w-xl pointer-events-auto relative transition-all duration-300">
              
              {/* Educational Enhanced ribbon at the top of input if reviewed */}
              {flowState === 'reviewed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2.5 px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-[10px] font-mono text-indigo-300 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                    <span>CONTEXT PACKET ATTACHED: Ready for AI • 100% Student Prompt Preserved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDetailsModalOpen(true)}
                      className="text-indigo-400 hover:text-white underline font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                    >
                      View Details
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFlowState('idle');
                        setInputText(coachOriginal);
                      }}
                      className="text-slate-400 hover:text-white underline transition-colors uppercase tracking-wider text-[9px] font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-[24px] shadow-2xl transition-all focus-within:border-brand-primary/50 p-1.5 relative">
                
                {/* Input Top Action Bar */}
                {activeSession && (
                  <div className="flex items-center justify-between px-2.5 py-1 relative z-30">
                    {/* Left Actions: AI Model Dropdown */}
                    <div className="flex items-center gap-1 relative">
                      {/* AI Model Dropdown Container */}
                      <div className="relative">
                        <motion.button
                          key={`model-btn-${user.preferences.selectedProvider || "gemini"}`}
                          initial={{ scale: 0.85, rotate: 25 }}
                          animate={{ scale: 1, rotate: 0 }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ type: "spring", stiffness: 260, damping: 14 }}
                          type="button"
                          onClick={() => {
                            setShowModelDropdown(!showModelDropdown);
                          }}
                          className={`p-2 rounded-full transition-colors cursor-pointer relative flex items-center justify-center ${
                            showModelDropdown ? "bg-slate-800 text-emerald-400" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                          title={`AI Provider: ${user.preferences.selectedProvider || "Gemini"} (Click to change)`}
                        >
                          <Cpu className="w-4.5 h-4.5 text-emerald-400" />
                        </motion.button>

                        {showModelDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowModelDropdown(false)} />
                            <div className="absolute top-9 left-0 z-50 bg-slate-900 border border-slate-800 rounded-xl py-1.5 shadow-2xl w-44 flex flex-col gap-0.5 text-[11px] font-mono animate-scale-in">
                              {[
                                { key: "gemini", name: "Gemini" },
                                { key: "chatgpt", name: "ChatGPT" },
                                { key: "claude", name: "Claude" },
                                { key: "deepseek", name: "DeepSeek" },
                                { key: "grok", name: "Grok" },
                                { key: "openrouter", name: "OpenRouter" },
                                { key: "local", name: "Local" },
                              ].map((opt) => {
                                const isSel = (user.preferences.selectedProvider || "gemini") === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const nextModel = PROVIDER_DEFAULT_MODELS[opt.key] || "gemini-3.1-flash-lite";
                                        await updatePreferences({
                                          selectedProvider: opt.key,
                                          selectedModel: nextModel,
                                        });
                                        if (onRefreshUser) onRefreshUser();
                                      } catch (err) {
                                        console.error("Failed to update provider preferences:", err);
                                      }
                                      setShowModelDropdown(false);
                                    }}
                                    className={`px-3 py-1.5 text-left hover:bg-slate-800 flex items-center justify-between transition-colors ${
                                      isSel ? "text-emerald-400 font-bold bg-slate-850/40" : "text-slate-300"
                                    }`}
                                  >
                                    <span>{opt.name}</span>
                                    {isSel && <Check className="w-3 h-3 text-emerald-400" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Action: Exit Workspace Button / Exit Focus Mode Button */}
                    <div>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => {
                          if (isFocusMode) {
                            toggleFocusMode();
                          } else {
                            if (confirm("Are you sure you want to exit this workspace and switch to a completely new empty study canvas?")) {
                              onSelectSession(null);
                              setFlowState('idle');
                            }
                          }
                        }}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-full transition-colors cursor-pointer flex items-center justify-center relative"
                        title={isFocusMode ? "Exit Focus Mode" : "Exit Workspace (Start New Empty Canvas)"}
                      >
                        {isFocusMode ? (
                          <X className="w-4.5 h-4.5 text-rose-400" />
                        ) : (
                          <LogOut className="w-4.5 h-4.5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {/* Audio Recording Active Waveform Header */}
                {isRecording && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-rose-950/20 rounded-t-[20px] border-b border-rose-900/30 animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="font-mono text-[10.5px] text-rose-400 font-bold uppercase tracking-wider">
                        Capturing Audio Frequency...
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-medium ml-2 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <StopCircle className="w-3.5 h-3.5 animate-pulse" /> Stop Capture
                    </button>
                  </div>
                )}

                {/* Attached Socratic Assets Display Badges */}
                {attachedAssets.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-slate-800/80 max-h-[120px] overflow-y-auto">
                    {attachedAssets.map(asset => (
                      <div 
                        key={asset.id} 
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10.5px] text-slate-300 shadow-sm"
                      >
                        {asset.type === "image" && asset.previewUrl && (
                          <img src={asset.previewUrl} className="w-4 h-4 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        )}
                        {asset.type === "folder" && (
                          <Folder className="w-3.5 h-3.5 text-brand-light shrink-0" />
                        )}
                        {asset.type === "file" && (
                          <Paperclip className="w-3.5 h-3.5 text-brand-medium shrink-0" />
                        )}
                        {asset.type === "audio" && (
                          <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        {asset.type === "link" && (
                          <Link className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[120px] font-medium">{asset.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setAttachedAssets(prev => prev.filter(a => a.id !== asset.id))}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setAttachedAssets([])}
                      className="text-[10px] text-rose-400 hover:underline px-2 cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div className="grid">
                  <div 
                    className="invisible whitespace-pre-wrap col-start-1 col-end-2 row-start-1 row-end-2 px-3 pt-3 pb-1.5 sm:px-4 sm:pt-4 sm:pb-2 text-[14px] sm:text-[15px] font-sans min-h-[60px] max-h-[300px] break-words"
                    style={{ minWidth: 'min(100%, 360px)' }}
                  >
                    {inputText + ' '}
                  </div>
                  <textarea
                    id="inp_chat_msg"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if ((inputText.trim() || attachedAssets.length > 0) && !loading) {
                          handleSendMessage(e as any);
                        }
                      }
                    }}
                    placeholder="What would you like to understand today?"
                    className="w-full h-full col-start-1 col-end-2 row-start-1 row-end-2 bg-transparent border-none outline-none resize-none px-3 pt-3 pb-1.5 sm:px-4 sm:pt-4 sm:pb-2 text-[14px] sm:text-[15px] text-slate-200 placeholder:text-slate-500 font-sans overflow-y-auto no-scrollbar"
                    disabled={loading}
                    rows={1}
                  />
                </div>
                
                <div className="flex items-center justify-between px-2 sm:px-3 pb-1 sm:pb-1.5 pt-1 gap-1.5">
                  <div className="flex gap-0.5 sm:gap-1 text-slate-400">
                    {/* Document / Paperclip Button */}
                    <label className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-slate-200 rounded-full transition-colors cursor-pointer" title="Attach document">
                      <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleDocumentUpload} />
                    </label>

                    {/* Camera / Photos Button Menu */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setShowCameraMenu(prev => !prev)}
                        className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-slate-200 rounded-full transition-colors cursor-pointer"
                        title="Camera and photos"
                      >
                        <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </button>
                      
                      {showCameraMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCameraMenu(false)} />
                          <div className="absolute bottom-11 left-0 z-50 bg-slate-900 border border-slate-800 rounded-xl py-1.5 shadow-2xl w-40 flex flex-col gap-1 text-[11px] font-mono animate-scale-in">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCameraMenu(false);
                                startLiveCamera();
                              }}
                              className="px-3 py-2 text-left hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors text-slate-300"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-400" />
                              Take Photo
                            </button>
                            <label className="px-3 py-2 text-left hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors text-slate-300 cursor-pointer">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                              Choose Photo
                              <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                            </label>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Manual Link Button */}
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="p-1.5 sm:p-2 hover:bg-slate-800 hover:text-slate-200 rounded-full transition-colors cursor-pointer"
                      title="Attach website link"
                    >
                      <Link className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400" />
                    </button>

                    {/* Audio Record Button */}
                    <button 
                      type="button"
                      className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${isRecording ? "bg-rose-500/20 text-rose-400 animate-pulse" : "hover:bg-slate-800 hover:text-slate-200"}`}
                      title="Microphone audio capture" 
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={toggleFocusMode}
                      className={`px-2.5 py-1.5 min-[375px]:px-3.5 min-[375px]:py-2 sm:px-5 sm:py-2.5 rounded-full border border-blue-400 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] min-[375px]:text-xs sm:text-[14px] font-bold tracking-wide flex items-center justify-center shrink-0 transition-all gap-1 sm:gap-2 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:-translate-y-0.5 ${isFocusMode ? "animate-pulse ring-2 ring-white/50" : ""}`}
                      title="Enter immersive Focus Mode"
                    >
                      <Mic className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      <span className="hidden min-[420px]:inline">Focus Mode</span>
                      <span className="inline min-[420px]:hidden">Focus</span>
                    </button>

                    {flowState === 'reviewed' ? (
                      <button
                        id="btn_submit_chat_msg"
                        type="submit"
                        disabled={loading}
                        className="px-2.5 py-1.5 min-[375px]:px-3.5 min-[375px]:py-2 sm:px-5 sm:py-2.5 rounded-full bg-brand-primary hover:bg-brand-medium disabled:bg-brand-primary/50 disabled:text-slate-400 text-white text-[11px] min-[375px]:text-xs sm:text-[13px] font-semibold tracking-wide flex items-center justify-center shrink-0 transition-all gap-1.5 shadow-md shadow-brand-primary/10 cursor-pointer"
                      >
                        <span className="hidden min-[360px]:inline">Send to AI</span>
                        <span className="inline min-[360px]:hidden">Send</span>
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    ) : (
                      inputText.trim().length > 0 && (
                        <button
                          id="btn_enhance_prompt"
                          type="submit"
                          disabled={loading}
                          className="px-2.5 py-1.5 min-[375px]:px-3.5 min-[375px]:py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-500 text-white text-[11px] min-[375px]:text-xs sm:text-[13px] font-semibold tracking-wide flex items-center justify-center shrink-0 transition-all gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer animate-scale-in border border-slate-700"
                        >
                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-light animate-pulse" />
                          <span className="hidden min-[380px]:inline">Enhance Prompt</span>
                          <span className="inline min-[380px]:hidden">Enhance</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Center-aligned Learning Intent Mode pills (Claude AI style) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mt-3 px-1 w-full max-w-xl mx-auto">
                {[
                  { val: "Study", label: "Study Mode", icon: BookOpen, color: "text-indigo-400" },
                  { val: "Casual Conversation", label: "General Chat", icon: MessageSquare, color: "text-pink-400" },
                  { val: "Productivity", label: "Productivity", icon: Cpu, color: "text-emerald-400" },
                  { val: "Research", label: "Research", icon: Brain, color: "text-sky-400" },
                  { val: "Assessment", label: "Assessment", icon: FileText, color: "text-rose-400" },
                ].map((opt) => {
                  const isSel = activeSession 
                    ? (activeSession.manualIntent || "Study") === opt.val
                    : preSelectedIntent === opt.val;
                  const IconComponent = opt.icon;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={async () => {
                        setPreSelectedIntent(opt.val);
                        if (activeSession) {
                          try {
                            await handleUpdateIntent(activeSession.id, opt.val);
                          } catch (err) {
                            console.error("Failed to update intent:", err);
                          }
                        }
                      }}
                      className={`px-2.5 py-1 min-[380px]:px-3.5 min-[380px]:py-1.5 rounded-full text-[10px] min-[380px]:text-[11px] font-mono tracking-tight flex items-center gap-1 sm:gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
                        isSel 
                          ? "bg-slate-800 text-pink-400 border-slate-600 shadow-md shadow-pink-500/5 font-semibold" 
                          : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <IconComponent className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${opt.color}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </form>
          )}
        </div>
        
      </>
    )}
      </div>
    </div>

    {/* Live Camera View Overlay Modal */}
    <AnimatePresence>
      {showLiveCamera && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#090c15] border border-blue-900/35 rounded-2xl p-5 shadow-2xl relative flex flex-col gap-4 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="text-xs font-mono text-slate-200 uppercase tracking-wider font-bold">Live Camera Feed</h3>
              </div>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Video feed viewport */}
            <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-900 overflow-hidden flex items-center justify-center">
              {cameraInitError ? (
                <div className="text-center space-y-2 p-4">
                  <CameraOff className="w-10 h-10 text-rose-500 mx-auto animate-pulse" />
                  <p className="text-[11px] font-mono text-rose-400 font-semibold">{cameraInitError}</p>
                  <p className="text-[10px] text-slate-500 font-light max-w-xs leading-relaxed">
                    Make sure camera permissions are enabled in your browser or try opening the app in a new tab.
                  </p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl" />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] text-emerald-400 font-mono flex items-center gap-1.5 border border-emerald-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>VIDEO FEED ACTIVE</span>
                  </div>
                </>
              )}
            </div>

            {/* Controls & Device Selection */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {cameraDevices.length > 1 && !cameraInitError ? (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Source:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono rounded px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-44 truncate"
                  >
                    {cameraDevices.map((device, idx) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-[9px] font-mono text-slate-600">Standard facing constraints applied</div>
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={closeLiveCamera}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraInitError || !cameraStream}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600 text-white text-[10px] font-mono uppercase tracking-wider font-bold rounded-lg shadow-md transition-all disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capture Snapshot
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Manual Link Input Modal */}
    <AnimatePresence>
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#090c15] border border-blue-900/35 rounded-2xl p-5 shadow-2xl relative flex flex-col gap-4 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link className="w-4.5 h-4.5 text-emerald-400" />
                <h3 className="text-xs font-mono text-slate-200 uppercase tracking-wider font-bold">Attach Website Link</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkInputUrl("");
                  setLinkModalError(null);
                }}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-light font-sans">
              Connect external platform content (e.g., Wikipedia, YouTube, GitHub, or any website URL). Epselon will index and prioritize this node's context.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1.5">Website or Node URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/research-paper"
                  value={linkInputUrl}
                  onChange={(e) => {
                    setLinkInputUrl(e.target.value);
                    setLinkModalError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitAddLink();
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
              </div>

              {linkModalError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded text-[10.5px] font-mono text-rose-400">
                  ⚠️ {linkModalError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkInputUrl("");
                  setLinkModalError(null);
                }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddLink}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-mono uppercase tracking-wider font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                Connect Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <FocusModeOverlay 
      user={user}
      activeSessionId={activeSessionId}
      activeSession={activeSession}
      onSelectSession={onSelectSession}
      onRefreshSessions={onRefreshSessions}
      onRefreshUser={onRefreshUser}
    />

    {/* 🔮 HIGHLIGHT TO DEFINE FLOATING MICRO-INTERACTIONS */}
    <AnimatePresence>
      {/* 1. Small Hover/Floating "Define" Button over selected word */}
      {showFloatingDefineBtn && selectionCoords && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: -8 }}
          exit={{ opacity: 0, scale: 0.85, y: 10 }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: `${selectionCoords.x}px`,
            top: `${selectionCoords.y}px`,
            transform: "translate(-50%, -100%)", // perfectly center above the selection
          }}
        >
          <button
            type="button"
            onClick={fetchDefinition}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded-lg border border-blue-400/50 shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-white animate-pulse" />
            <span>Define "{selectionText.substring(0, 15)}{selectionText.length > 15 ? "..." : ""}"</span>
          </button>
        </motion.div>
      )}

      {/* 2. Floating Context-Aware Definition Overlay Card */}
      {showDefinePopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm pointer-events-auto">
          {/* Click backdrop to close */}
          <div className="absolute inset-0 animate-fade-in" onClick={() => setShowDefinePopover(false)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm bg-[#0a0d16] border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4 overflow-hidden z-10"
          >
            {/* Top Accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400">
                  AI Concept Definition
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDefinePopover(false)}
                className="p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {defineLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <div className="flex space-x-1.5 justify-center items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[10px] font-mono text-slate-500 animate-pulse">
                  Adapting definition to current session...
                </span>
              </div>
            ) : (
              <div className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Selected Term</span>
                  <h4 className="text-sm font-semibold text-white font-serif italic">
                    "{definitionResult?.word}"
                  </h4>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Context-Aware Meaning</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-light font-sans bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                    {definitionResult?.definition}
                  </p>
                </div>

                <div className="p-2 bg-blue-950/10 border border-blue-900/20 rounded-lg flex items-center gap-2 text-[9px] font-mono text-blue-400">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {definitionResult?.contextApplied}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDefinePopover(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[9px] uppercase tracking-wider font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                Close & Resume Study
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Educational Context Details Modal */}
    <EducationalContextDetailsModal
      isOpen={isDetailsModalOpen}
      onClose={() => setIsDetailsModalOpen(false)}
      packet={activeEcePacket}
    />

    </div>
  );
}
