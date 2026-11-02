import { create } from 'zustand';
import {
  EmotionProbabilities,
  LipReadingResult,
  EngineSettings,
  ThreatCalculationResult,
  DemoScenarioId,
  LexiconEntry,
  EmotionType,
} from '../engine/types';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import initialLexicon from '../data/lexicon.bn.json';
import { computeThreatScore } from '../engine/threatEngine';
import { EmotionTracker } from '../engine/emotionTracker';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { predictEmotion, readLipsBengali, CircumplexTrailPoint } from '../api/adapters';
import { soundManager } from '../utils/soundAlert';

export interface RecordedSessionFrame {
  timestamp: number;
  timeStr: string;
  emotions: EmotionProbabilities;
  valence: number;
  arousal: number;
  intensity: number;
  transcript_bn: string;
  romanized: string;
  A_vol: number;
  T_lip: number;
  R_e: number;
  D_cross: number;
  threatPercent: number;
  threatBand: string;
  isMasking: boolean;
}

export interface HistoryLogEntry {
  id: string;
  result: ThreatCalculationResult;
  transcript_bn: string;
  romanized: string;
}

export interface TimelineDataPoint {
  time: string;
  timestamp: number;
  threatPercent: number;
  R_e: number;
  T_lip: number;
  D_cross: number;
  isMasking: boolean;
  dominantEmotion: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ThreatStoreState {
  // Streams & Camera
  isStreaming: boolean;
  isCameraActive: boolean;
  cameraMode: 'real' | 'simulated';
  cameraError: string | null;

  // Calibration Flow
  isCalibrating: boolean;
  calibrationCountdown: number;
  baselineEmotions: EmotionProbabilities | null;
  statesWarmupLeft: number;

  // Demo Mode
  isDemoMode: boolean;
  activeScenarioId: DemoScenarioId;

  // Sound
  isSoundMuted: boolean;

  // Settings & Lexicon
  settings: EngineSettings;
  lexicon: LexiconEntry[];

  // Real-Time Telemetry & HUD State
  currentEmotions: EmotionProbabilities;
  smoothedEmotions: EmotionProbabilities;
  valence: number;
  arousal: number;
  intensity: number;
  isAmbiguous: boolean;
  ambiguityLabel: string;
  topBlendshapes: Array<{ name: string; value: number }>;
  confidenceSparkline: number[];
  circumplexTrail: CircumplexTrailPoint[];

  // Lip Reading & Threat Engine
  currentLipReading: LipReadingResult;
  currentThreat: ThreatCalculationResult;

  // Sparklines for Threat Strip
  threatSparkline: number[];
  reSparkline: number[];
  tlipSparkline: number[];
  dcrossSparkline: number[];

  // Recording & Why? Analysis
  isRecording: boolean;
  recordedFrames: RecordedSessionFrame[];
  whyWindowSeconds: number;

  // Logs, Timeline, & Drawer
  historyLogs: HistoryLogEntry[];
  timelineData: TimelineDataPoint[];
  selectedLogEntry: HistoryLogEntry | null;

  // Conversation
  conversationMessages: ConversationMessage[];

  // Advanced Personal Emotion Calibration
  personalTemplates: Record<string, EmotionProbabilities>;
  rememberTemplates: boolean;

  // Actions
  setIsStreaming: (streaming: boolean) => void;
  setCameraActive: (active: boolean) => void;
  setCameraMode: (mode: 'real' | 'simulated') => void;
  setCameraError: (err: string | null) => void;
  setDemoMode: (enabled: boolean) => void;
  setActiveScenario: (id: DemoScenarioId) => void;
  setSoundMuted: (muted: boolean) => void;
  setWhyWindowSeconds: (secs: number) => void;
  setIsRecording: (recording: boolean) => void;
  startCalibration: () => void;
  tickInference: () => Promise<void>;
  generateWhyExplanation: () => void;
  askQuestion: (question: string) => void;
  summarizeSession: () => void;
  calibratePersonalEmotion: (emotion: EmotionType) => void;
  clearPersonalTemplates: () => void;
  setRememberTemplates: (remember: boolean) => void;
  exportSessionJSON: () => void;
  setSelectedLogEntry: (entry: HistoryLogEntry | null) => void;
  clearHistory: () => void;
  updateSettings: (newSettings: Partial<EngineSettings>) => void;
  resetSettings: () => void;
  addLexiconWord: (entry: LexiconEntry) => void;
  updateLexiconWord: (word: string, weight: number) => void;
  deleteLexiconWord: (word: string) => void;
  resetLexicon: () => void;
}

const emotionTracker = new EmotionTracker(DEFAULT_SETTINGS.smoothingWindowSize);
const defaultScenario = DEMO_SCENARIOS[3]; // Affective Masking
const initialThreat = computeThreatScore(
  defaultScenario.emotions,
  defaultScenario.lipReading.words,
  defaultScenario.lipReading.A_vol,
  DEFAULT_SETTINGS,
  initialLexicon as LexiconEntry[]
);

export const useThreatStore = create<ThreatStoreState>((set, get) => {
  // Load local preferences
  let initialSettings = DEFAULT_SETTINGS;
  let initialLexiconData = initialLexicon as LexiconEntry[];
  let savedTemplates: Record<string, EmotionProbabilities> = {};
  let savedRemember = false;

  if (typeof window !== 'undefined') {
    try {
      const s = localStorage.getItem('threatsense_settings');
      if (s) initialSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
      const l = localStorage.getItem('threatsense_lexicon');
      if (l) initialLexiconData = JSON.parse(l);
      const t = localStorage.getItem('threatsense_templates');
      if (t) savedTemplates = JSON.parse(t);
      const r = localStorage.getItem('threatsense_remember_templates');
      if (r) savedRemember = r === 'true';
    } catch {
      // fallback
    }
  }

  const initialLog: HistoryLogEntry = {
    id: `log-${Date.now()}`,
    result: initialThreat,
    transcript_bn: defaultScenario.lipReading.transcript_bn,
    romanized: defaultScenario.lipReading.romanized,
  };

  return {
    isStreaming: true,
    isCameraActive: true,
    cameraMode: 'simulated',
    cameraError: null,

    isCalibrating: false,
    calibrationCountdown: 3,
    baselineEmotions: null,
    statesWarmupLeft: 42,

    isDemoMode: true,
    activeScenarioId: 'affective_masking',

    isSoundMuted: false,

    settings: initialSettings,
    lexicon: initialLexiconData,

    currentEmotions: defaultScenario.emotions,
    smoothedEmotions: defaultScenario.emotions,
    valence: 0.34,
    arousal: 0.03,
    intensity: 0.38,
    isAmbiguous: false,
    ambiguityLabel: 'happy (subtle) · 82%',
    topBlendshapes: [
      { name: 'mouthSmileLeft', value: 0.72 },
      { name: 'mouthSmileRight', value: 0.70 },
      { name: 'jawOpen', value: 0.34 },
    ],
    confidenceSparkline: [0.8, 0.81, 0.83, 0.82, 0.82, 0.84, 0.82],
    circumplexTrail: [
      { valence: 0.32, arousal: 0.02, timestamp: Date.now() - 1500 },
      { valence: 0.33, arousal: 0.04, timestamp: Date.now() - 1000 },
      { valence: 0.34, arousal: 0.03, timestamp: Date.now() },
    ],

    currentLipReading: defaultScenario.lipReading,
    currentThreat: initialThreat,

    threatSparkline: [initialThreat.threatPercent, initialThreat.threatPercent, initialThreat.threatPercent],
    reSparkline: [initialThreat.R_e, initialThreat.R_e, initialThreat.R_e],
    tlipSparkline: [initialThreat.T_lip, initialThreat.T_lip, initialThreat.T_lip],
    dcrossSparkline: [initialThreat.D_cross, initialThreat.D_cross, initialThreat.D_cross],

    isRecording: false,
    recordedFrames: [],
    whyWindowSeconds: 8,

    historyLogs: [initialLog],
    timelineData: [
      {
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        threatPercent: initialThreat.threatPercent,
        R_e: initialThreat.R_e,
        T_lip: initialThreat.T_lip,
        D_cross: initialThreat.D_cross,
        isMasking: initialThreat.isMaskingDetected,
        dominantEmotion: initialThreat.dominantEmotion,
      },
    ],
    selectedLogEntry: null,

    conversationMessages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: 'ThreatSense Live session initialized. Both Stream A (Face Emotion) and Stream B (Bengali Lip-Reading) are actively running in parallel. Ask a question or click "Why?" to explain the current assessment window.',
        timestamp: Date.now(),
      },
    ],

    personalTemplates: savedTemplates,
    rememberTemplates: savedRemember,

    setIsStreaming: (isStreaming) => set({ isStreaming }),
    setCameraActive: (isCameraActive) => set({ isCameraActive }),
    setCameraMode: (cameraMode) => set({ cameraMode }),
    setCameraError: (cameraError) => set({ cameraError }),
    setDemoMode: (isDemoMode) => set({ isDemoMode }),
    setActiveScenario: (activeScenarioId) => {
      set({ activeScenarioId });
      get().tickInference();
    },
    setSoundMuted: (isSoundMuted) => {
      soundManager.setMuted(isSoundMuted);
      set({ isSoundMuted });
    },
    setWhyWindowSeconds: (whyWindowSeconds) => set({ whyWindowSeconds }),
    setIsRecording: (isRecording) => set({ isRecording }),

    startCalibration: () => {
      set({ isCalibrating: true, calibrationCountdown: 3 });
      const interval = setInterval(() => {
        const current = get().calibrationCountdown;
        if (current <= 1) {
          clearInterval(interval);
          const baseline = { ...get().smoothedEmotions };
          set({
            isCalibrating: false,
            calibrationCountdown: 0,
            baselineEmotions: baseline,
          });
          get().conversationMessages.push({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            text: `Resting face calibration captured successfully. Baseline neutral distribution established. Subsequent facial emotion deltas are now zero-referenced.`,
            timestamp: Date.now(),
          });
        } else {
          set({ calibrationCountdown: current - 1 });
        }
      }, 1000);
    },

    tickInference: async () => {
      const {
        activeScenarioId,
        settings,
        lexicon,
        isStreaming,
        baselineEmotions,
        statesWarmupLeft,
        isRecording,
      } = get();

      if (!isStreaming) return;

      try {
        const [faceResult, lipData] = await Promise.all([
          predictEmotion(null, activeScenarioId, baselineEmotions || undefined),
          readLipsBengali(undefined, activeScenarioId),
        ]);

        const smoothedEmotions = emotionTracker.addFrame(faceResult.emotions);
        const now = Date.now();

        const threatResult = computeThreatScore(
          smoothedEmotions,
          lipData.words,
          lipData.A_vol,
          settings,
          lexicon,
          now
        );

        if (threatResult.isMaskingDetected) {
          soundManager.playMaskingAlert();
        } else if (threatResult.threatBand === 'high') {
          soundManager.playHighThreatAlert();
        }

        const newConfidence = Math.max(...Object.values(smoothedEmotions));
        const confSpark = [...get().confidenceSparkline.slice(-18), newConfidence];

        const tSpark = [...get().threatSparkline.slice(-20), threatResult.threatPercent];
        const reSpark = [...get().reSparkline.slice(-20), threatResult.R_e];
        const tlipSpark = [...get().tlipSparkline.slice(-20), threatResult.T_lip];
        const dcSpark = [...get().dcrossSparkline.slice(-20), threatResult.D_cross];

        const trailPoint: CircumplexTrailPoint = {
          valence: faceResult.valence,
          arousal: faceResult.arousal,
          timestamp: now,
        };
        const updatedTrail = [...get().circumplexTrail.filter((p) => now - p.timestamp < 2200), trailPoint];

        const nextWarmup = statesWarmupLeft > 0 ? statesWarmupLeft - 1 : 0;

        let recorded = get().recordedFrames;
        if (isRecording) {
          const frame: RecordedSessionFrame = {
            timestamp: now,
            timeStr: new Date(now).toLocaleTimeString(),
            emotions: smoothedEmotions,
            valence: faceResult.valence,
            arousal: faceResult.arousal,
            intensity: faceResult.intensity,
            transcript_bn: lipData.transcript_bn,
            romanized: lipData.romanized,
            A_vol: lipData.A_vol,
            T_lip: threatResult.T_lip,
            R_e: threatResult.R_e,
            D_cross: threatResult.D_cross,
            threatPercent: threatResult.threatPercent,
            threatBand: threatResult.threatBand,
            isMasking: threatResult.isMaskingDetected,
          };
          recorded = [...recorded, frame];
        }

        // Add to history logs
        const existingLogs = get().historyLogs;
        const lastLog = existingLogs[0];
        const shouldAddLog =
          !lastLog ||
          now - lastLog.result.timestamp > 3500 ||
          lastLog.result.isMaskingDetected !== threatResult.isMaskingDetected;

        let updatedLogs = existingLogs;
        if (shouldAddLog) {
          const newEntry: HistoryLogEntry = {
            id: `log-${now}-${Math.random().toString(36).substr(2, 4)}`,
            result: threatResult,
            transcript_bn: lipData.transcript_bn,
            romanized: lipData.romanized,
          };
          updatedLogs = [newEntry, ...existingLogs.slice(0, 99)];
        }

        // Timeline point
        const timePoint: TimelineDataPoint = {
          time: new Date(now).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          timestamp: now,
          threatPercent: threatResult.threatPercent,
          R_e: threatResult.R_e,
          T_lip: threatResult.T_lip,
          D_cross: threatResult.D_cross,
          isMasking: threatResult.isMaskingDetected,
          dominantEmotion: threatResult.dominantEmotion,
        };
        const updatedTimeline = [...get().timelineData.slice(-34), timePoint];

        set({
          currentEmotions: faceResult.emotions,
          smoothedEmotions,
          valence: faceResult.valence,
          arousal: faceResult.arousal,
          intensity: faceResult.intensity,
          isAmbiguous: faceResult.isAmbiguous,
          ambiguityLabel: faceResult.ambiguityLabel || '',
          topBlendshapes: faceResult.topBlendshapes,
          confidenceSparkline: confSpark,
          circumplexTrail: updatedTrail,
          currentLipReading: lipData,
          currentThreat: threatResult,
          threatSparkline: tSpark,
          reSparkline: reSpark,
          tlipSparkline: tlipSpark,
          dcrossSparkline: dcSpark,
          statesWarmupLeft: nextWarmup,
          recordedFrames: recorded,
          historyLogs: updatedLogs,
          timelineData: updatedTimeline,
        });
      } catch (err) {
        console.error('Inference error:', err);
      }
    },

    generateWhyExplanation: () => {
      const { whyWindowSeconds, currentThreat, currentLipReading } = get();
      const isMasking = currentThreat.isMaskingDetected;
      const threatWords = currentThreat.detectedThreatWords.map((w) => `"${w.word}" (${w.romanized}, θ_W=${w.weight})`).join(', ');

      let explanation = `[Window: Last ${whyWindowSeconds}s Analysis]\n`;

      if (isMasking) {
        explanation += `• AFFECTIVE MASKING DETECTED: The subject sustains an outwardly placid face (${currentThreat.dominantEmotion} ${Math.round(
          currentThreat.dominantEmotionProb * 100
        )}%) while silently uttering hostile Bengali tokens [${threatWords || 'hostile content'}].\n`;
        explanation += `• Mathematical Discrepancy D_cross is ${currentThreat.D_cross} (exceeds threshold 0.40).\n`;
        explanation += `• Threat floor was elevated to Medium (${currentThreat.threatPercent}%) to prevent facial deception from bypassing security protocols.`;
      } else if (currentThreat.threatBand === 'high') {
        explanation += `• HIGH THREAT LEVEL (${currentThreat.threatPercent}%): Hostile facial affect (${currentThreat.dominantEmotion}) is congruent with verbal threat tokens [${threatWords}].\n`;
        explanation += `• Lip threat T_lip is ${currentThreat.T_lip} and Emotion Risk R_e is ${currentThreat.R_e}. Both streams indicate elevated aggression.`;
      } else if (currentThreat.threatBand === 'medium') {
        explanation += `• MODERATE THREAT (${currentThreat.threatPercent}%): Emotional arousal detected (${currentThreat.dominantEmotion}) with partial lexicon match or elevated physiological tension.`;
      } else {
        explanation += `• BENIGN BASELINE (${currentThreat.threatPercent}%): No hostile Bengali lexicon tokens detected. Facial expression is congruent with everyday baseline behavior.`;
      }

      set((state) => ({
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            text: explanation,
            timestamp: Date.now(),
          },
        ],
      }));
    },

    askQuestion: (question: string) => {
      const q = question.toLowerCase().trim();
      const { recordedFrames, currentThreat, currentLipReading } = get();

      let answer = '';

      if (q.includes('masking') || q.includes('deception') || q.includes('chhodmobesh')) {
        const maskCount = recordedFrames.filter((f) => f.isMasking).length;
        answer = `Affective masking occurs when an individual maintains a calm or smiling facade while mouthing threats in Bengali. In this session, masking was detected in ${
          currentThreat.isMaskingDetected ? 'the current window' : `${maskCount} recorded frames`
        }. Current D_cross is ${currentThreat.D_cross}.`;
      } else if (q.includes('peak') || q.includes('highest')) {
        const peak = recordedFrames.length > 0 ? Math.max(...recordedFrames.map((f) => f.threatPercent)) : currentThreat.threatPercent;
        answer = `The peak threat level recorded so far is ${peak}%.`;
      } else if (q.includes('word') || q.includes('lexicon') || q.includes('bengali') || q.includes('shobdo')) {
        const detected = currentThreat.detectedThreatWords.map((w) => `${w.word} (${w.romanized})`).join(', ');
        answer = detected
          ? `Detected threat tokens in the active window: ${detected}. Lip movement volume A_vol is ${currentLipReading.A_vol}.`
          : `No hostile tokens detected in the active transcript: "${currentLipReading.transcript_bn}".`;
      } else if (q.includes('emotion') || q.includes('face') || q.includes('expression')) {
        answer = `Current dominant facial emotion is ${currentThreat.dominantEmotion} (${Math.round(
          currentThreat.dominantEmotionProb * 100
        )}%) with valence ${get().valence} and arousal ${get().arousal}.`;
      } else {
        answer = `In this session, the current composite threat index is ${currentThreat.threatPercent}% (${currentThreat.threatBand.toUpperCase()}). Dominant face: ${currentThreat.dominantEmotion}. Lip threat: T_lip=${currentThreat.T_lip}. Discrepancy: D_cross=${currentThreat.D_cross}.`;
      }

      set((state) => ({
        conversationMessages: [
          ...state.conversationMessages,
          { id: `msg-q-${Date.now()}`, role: 'user', text: question, timestamp: Date.now() },
          { id: `msg-a-${Date.now()}`, role: 'assistant', text: answer, timestamp: Date.now() },
        ],
      }));
    },

    summarizeSession: () => {
      const { recordedFrames, currentThreat } = get();
      const frames = recordedFrames.length > 0 ? recordedFrames : [];
      const peak = frames.length > 0 ? Math.max(...frames.map((f) => f.threatPercent)) : currentThreat.threatPercent;
      const maskCount = frames.filter((f) => f.isMasking).length;

      const summary = `=== SESSION EXECUTIVE SUMMARY ===\n` +
        `• Total Monitored Frames: ${frames.length || 1}\n` +
        `• Peak Threat Recorded: ${peak}%\n` +
        `• Total Affective Masking Incidents: ${maskCount} frames\n` +
        `• Current State: ${currentThreat.threatBand.toUpperCase()} (Threat: ${currentThreat.threatPercent}%, D_cross: ${currentThreat.D_cross})\n` +
        `• Privacy Assurance: All MediaPipe and LipBengal inferences ran 100% in-browser on-device. Zero video frames were transmitted externally.`;

      set((state) => ({
        conversationMessages: [
          ...state.conversationMessages,
          { id: `msg-sum-${Date.now()}`, role: 'assistant', text: summary, timestamp: Date.now() },
        ],
      }));
    },

    calibratePersonalEmotion: (emotion: EmotionType) => {
      const { smoothedEmotions, personalTemplates, rememberTemplates } = get();
      const updated = { ...personalTemplates, [emotion]: { ...smoothedEmotions } };
      if (rememberTemplates && typeof window !== 'undefined') {
        localStorage.setItem('threatsense_templates', JSON.stringify(updated));
      }
      set({ personalTemplates: updated });
      get().conversationMessages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: `Personal template for "${emotion}" calibrated and saved to local memory.`,
        timestamp: Date.now(),
      });
    },

    clearPersonalTemplates: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('threatsense_templates');
      }
      set({ personalTemplates: {} });
    },

    setRememberTemplates: (rememberTemplates) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('threatsense_remember_templates', String(rememberTemplates));
      }
      set({ rememberTemplates });
    },

    exportSessionJSON: () => {
      const { recordedFrames, currentThreat, settings } = get();
      const payload = {
        exportedAt: new Date().toISOString(),
        settings,
        currentSnapshot: currentThreat,
        sessionFrames: recordedFrames,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threatsense_session_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },

    setSelectedLogEntry: (selectedLogEntry) => set({ selectedLogEntry }),
    clearHistory: () => set({ historyLogs: [], selectedLogEntry: null }),

    updateSettings: (partial) => {
      const updated = { ...get().settings, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('threatsense_settings', JSON.stringify(updated));
      }
      if (partial.smoothingWindowSize) {
        emotionTracker.setWindowSize(partial.smoothingWindowSize);
      }
      set({ settings: updated });
      get().tickInference();
    },

    resetSettings: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('threatsense_settings');
      }
      set({ settings: DEFAULT_SETTINGS });
      emotionTracker.setWindowSize(DEFAULT_SETTINGS.smoothingWindowSize);
      get().tickInference();
    },

    addLexiconWord: (entry) => {
      const current = get().lexicon;
      const exists = current.some((item) => item.word === entry.word);
      const updated = exists
        ? current.map((item) => (item.word === entry.word ? entry : item))
        : [...current, entry];

      if (typeof window !== 'undefined') {
        localStorage.setItem('threatsense_lexicon', JSON.stringify(updated));
      }
      set({ lexicon: updated });
      get().tickInference();
    },

    updateLexiconWord: (word, weight) => {
      const updated = get().lexicon.map((item) =>
        item.word === word ? { ...item, weight } : item
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('threatsense_lexicon', JSON.stringify(updated));
      }
      set({ lexicon: updated });
      get().tickInference();
    },

    deleteLexiconWord: (word) => {
      const updated = get().lexicon.filter((item) => item.word !== word);
      if (typeof window !== 'undefined') {
        localStorage.setItem('threatsense_lexicon', JSON.stringify(updated));
      }
      set({ lexicon: updated });
      get().tickInference();
    },

    resetLexicon: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('threatsense_lexicon');
      }
      set({ lexicon: initialLexicon as LexiconEntry[] });
      get().tickInference();
    },
  };
});
