export type EmotionType = 'angry' | 'neutral' | 'disgust' | 'sad' | 'happy' | 'fear' | 'surprise';

export type EmotionProbabilities = Record<EmotionType, number>;

export type EmotionWeights = Record<EmotionType, number>;

export type EmotionBaselines = Record<EmotionType, number>;

export interface LexiconEntry {
  word: string;
  romanized: string;
  weight: number; // θ_W ∈ [0, 1]
  category: string;
}

export interface WordDetection {
  word: string;
  romanized?: string;
  confidence: number;
  start: number;
  end: number;
  lexiconWeight?: number;
  category?: string;
}

export interface LipReadingResult {
  transcript_bn: string;
  romanized: string;
  words: WordDetection[];
  A_vol: number; // Lip-movement amplitude / volume ∈ [0, 1]
  speaking: boolean;
}

export interface EngineSettings {
  emotionWeights: EmotionWeights;
  emotionBaselines: EmotionBaselines;
  alpha: number; // Weight for Emotion Risk R_e
  beta: number;  // Weight for Lip Threat T_lip
  gamma: number; // Weight for Discrepancy D_cross
  maskingThreshold: number; // Threshold for D_cross to trigger masking alert (default 0.40)
  volScalingK: number;      // Scaling parameter for g(A_vol)
  maskingMultiplier: number; // Boost multiplier for D_cross under calm emotions (default 1.25)
  smoothingWindowSize: number; // Window size for temporal probability smoothing
}

export type ThreatBand = 'low' | 'medium' | 'high';

export interface ThreatWordMatch {
  word: string;
  romanized: string;
  weight: number;
  category: string;
  confidence: number;
}

export interface ThreatCalculationResult {
  R_e: number;
  T_lip: number;
  D_cross: number;
  rawThreatScore: number;
  threatPercent: number; // 0 to 100
  threatBand: ThreatBand;
  dominantEmotion: EmotionType;
  dominantEmotionProb: number;
  isMaskingDetected: boolean;
  maskingReason?: string;
  detectedThreatWords: ThreatWordMatch[];
  timestamp: number;
  smoothedEmotions: EmotionProbabilities;
  anomalyScore?: number; // Face emotion delta relative to benign baseline
}

export type DemoScenarioId =
  | 'calm'
  | 'rising_anger'
  | 'fear_spike'
  | 'affective_masking'
  | 'true_negative';

export interface DemoScenario {
  id: DemoScenarioId;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  dominantEmotion: EmotionType;
  emotions: EmotionProbabilities;
  lipReading: LipReadingResult;
  expectedMasking: boolean;
  threatBand: ThreatBand;
}
