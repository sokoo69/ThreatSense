/**
 * =========================================================================================
 * THREATSENSE LIVE: ADAPTER LAYER & IN-BROWSER INFERENCE INTERFACES
 * =========================================================================================
 *
 * ARCHITECTURAL DESIGN:
 * -----------------------------------------------------------------------------------------
 * - Stream A: Facial Emotion Recognition (CNN / Vision Transformer / MediaPipe Blendshapes)
 * - Stream B: Bengali Lip-Reading (LipBengal / LipNet Conformer)
 * - All frames remain on-device (zero telemetry leak, strict client-side sandbox).
 *
 * ONNXRUNTIME-WEB & MEDIAPIPE ADAPTER SLOTS:
 * -----------------------------------------------------------------------------------------
 * In production:
 *   1. Import `* as ort from 'onnxruntime-web'`
 *   2. Load `emotion_model.onnx` and `lipbengal_conformer.onnx` into WebAssembly / WebGPU sessions.
 *   3. Feed client-side camera canvas frames directly into ort.Tensor.
 * =========================================================================================
 */

import { EmotionProbabilities, LipReadingResult, DemoScenarioId, EmotionType } from '../engine/types';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

export interface EmotionInferenceResult {
  emotions: EmotionProbabilities;
  valence: number; // [-1.0, 1.0] Pleasantness
  arousal: number; // [-1.0, 1.0] Physiological Activation
  intensity: number; // [0.0, 1.0]
  isAmbiguous: boolean;
  ambiguityLabel?: string;
  blendshapes: Record<string, number>;
  topBlendshapes: Array<{ name: string; value: number }>;
}

export interface CircumplexTrailPoint {
  valence: number;
  arousal: number;
  timestamp: number;
}

export const ONNX_CONFIG = {
  USE_SIMULATION: true,
  EMOTION_ONNX_PATH: '/models/emotion_cnn_v2.onnx',
  LIPBENGAL_ONNX_PATH: '/models/lipbengal_conformer_fp16.onnx',
};

/**
 * Calculates valence and arousal from emotion distribution
 */
export function computeValenceArousal(emotions: EmotionProbabilities): { valence: number; arousal: number; intensity: number } {
  // Russell's Circumplex Model coordinates:
  // Happy: (+0.8, +0.2)
  // Angry: (-0.7, +0.7)
  // Fear:  (-0.6, +0.8)
  // Disgust: (-0.6, +0.3)
  // Sad:   (-0.8, -0.5)
  // Neutral: (0.0, 0.0)
  const v =
    emotions.happy * 0.85 +
    emotions.angry * -0.72 +
    emotions.fear * -0.65 +
    emotions.disgust * -0.60 +
    emotions.sad * -0.75 +
    emotions.neutral * 0.05;

  const a =
    emotions.angry * 0.78 +
    emotions.fear * 0.82 +
    emotions.happy * 0.35 +
    emotions.disgust * 0.30 +
    emotions.sad * -0.45 +
    emotions.neutral * -0.05;

  const intensity = Math.min(1.0, Math.sqrt(v * v + a * a));

  return {
    valence: Number(Math.max(-1, Math.min(1, v)).toFixed(2)),
    arousal: Number(Math.max(-1, Math.min(1, a)).toFixed(2)),
    intensity: Number(intensity.toFixed(2)),
  };
}

/**
 * Simulates MediaPipe Face Landmarker Blendshapes matching the emotional state
 */
export function generateBlendshapes(
  emotions: EmotionProbabilities,
  A_vol: number
): { blendshapes: Record<string, number>; topBlendshapes: Array<{ name: string; value: number }> } {
  const shapes: Record<string, number> = {
    mouthSmileLeft: Number((emotions.happy * 0.88 + Math.random() * 0.03).toFixed(2)),
    mouthSmileRight: Number((emotions.happy * 0.86 + Math.random() * 0.03).toFixed(2)),
    browDownLeft: Number((emotions.angry * 0.75 + emotions.disgust * 0.45 + Math.random() * 0.03).toFixed(2)),
    browDownRight: Number((emotions.angry * 0.73 + emotions.disgust * 0.42 + Math.random() * 0.03).toFixed(2)),
    browInnerUp: Number((emotions.fear * 0.85 + emotions.sad * 0.65 + Math.random() * 0.03).toFixed(2)),
    jawOpen: Number((A_vol * 0.75 + emotions.fear * 0.25 + Math.random() * 0.03).toFixed(2)),
    mouthPucker: Number((A_vol > 0.4 ? 0.32 : 0.05).toFixed(2)),
    eyeWideLeft: Number((emotions.fear * 0.78 + emotions.angry * 0.2 + Math.random() * 0.03).toFixed(2)),
    noseSneerLeft: Number((emotions.disgust * 0.82 + Math.random() * 0.03).toFixed(2)),
    mouthFrownLeft: Number((emotions.sad * 0.72 + emotions.disgust * 0.3 + Math.random() * 0.03).toFixed(2)),
  };

  const sorted = Object.entries(shapes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return {
    blendshapes: shapes,
    topBlendshapes: sorted,
  };
}

/**
 * STREAM A ADAPTER: Facial Emotion Inference
 *
 * In production:
 * -------------------------------------------------------------------------------------
 * // ONNX Runtime Web hook:
 * const session = await ort.InferenceSession.create(ONNX_CONFIG.EMOTION_ONNX_PATH);
 * const feeds = { input_frame: tensor };
 * const results = await session.run(feeds);
 * -------------------------------------------------------------------------------------
 */
export async function predictEmotion(
  frame?: ImageData | HTMLCanvasElement | null,
  activeScenarioId: DemoScenarioId = 'affective_masking',
  baseline?: EmotionProbabilities
): Promise<EmotionInferenceResult> {
  // Micro simulation latency (15-30ms)
  await new Promise((resolve) => setTimeout(resolve, 20));

  const scenario =
    DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[3];

  let rawEmotions: EmotionProbabilities = { ...scenario.emotions };

  // Add realistic subtle jitter
  const keys = Object.keys(rawEmotions) as (keyof EmotionProbabilities)[];
  for (const k of keys) {
    const delta = (Math.random() - 0.5) * 0.03;
    rawEmotions[k] = Math.max(0, Math.min(1, rawEmotions[k] + delta));
  }
  const sum = keys.reduce((acc, k) => acc + rawEmotions[k], 0);
  if (sum > 0) {
    for (const k of keys) {
      rawEmotions[k] = Number((rawEmotions[k] / sum).toFixed(4));
    }
  }

  // Baseline correction if calibrated
  if (baseline) {
    for (const k of keys) {
      const baseVal = baseline[k] ?? 0;
      // Adjust relative to resting face
      rawEmotions[k] = Math.max(0, Math.min(1, rawEmotions[k] - baseVal * 0.3));
    }
  }

  // Check top-2 ambiguity
  const sortedEmotions = Object.entries(rawEmotions).sort((a, b) => b[1] - a[1]);
  const diff = sortedEmotions[0][1] - sortedEmotions[1][1];
  const isAmbiguous = diff < 0.12;
  const ambiguityLabel = isAmbiguous
    ? `ambiguous (top-2 close: ${sortedEmotions[0][0]}/${sortedEmotions[1][0]})`
    : `${sortedEmotions[0][0]} · ${Math.round(sortedEmotions[0][1] * 100)}%`;

  const va = computeValenceArousal(rawEmotions);
  const blend = generateBlendshapes(rawEmotions, scenario.lipReading.A_vol);

  return {
    emotions: rawEmotions,
    valence: va.valence,
    arousal: va.arousal,
    intensity: va.intensity,
    isAmbiguous,
    ambiguityLabel,
    blendshapes: blend.blendshapes,
    topBlendshapes: blend.topBlendshapes,
  };
}

/**
 * STREAM B ADAPTER: Bengali Lip Reading (LipBengal / LipNet Model)
 *
 * CRITICAL RULE: NEVER GATED BY EMOTION!
 * Always runs concurrently over mouth-ROI spatiotemporal frame sequences.
 *
 * In production:
 * -------------------------------------------------------------------------------------
 * // ONNX Runtime Web hook:
 * const session = await ort.InferenceSession.create(ONNX_CONFIG.LIPBENGAL_ONNX_PATH);
 * const feeds = { mouth_roi_sequence: mouthTensor };
 * const results = await session.run(feeds);
 * -------------------------------------------------------------------------------------
 */
export async function readLipsBengali(
  mouthFrames?: unknown[],
  activeScenarioId: DemoScenarioId = 'affective_masking'
): Promise<LipReadingResult> {
  await new Promise((resolve) => setTimeout(resolve, 25));

  const scenario =
    DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[3];

  const volumeJitter = (Math.random() - 0.5) * 0.06;
  const A_vol = Math.max(0.12, Math.min(1.0, scenario.lipReading.A_vol + volumeJitter));

  return {
    ...scenario.lipReading,
    A_vol: Number(A_vol.toFixed(3)),
    words: scenario.lipReading.words.map((w) => ({
      ...w,
      confidence: Number(
        Math.max(0.55, Math.min(0.99, w.confidence + (Math.random() - 0.5) * 0.03)).toFixed(3)
      ),
    })),
  };
}
