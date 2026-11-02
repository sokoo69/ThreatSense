/**
 * =========================================================================================
 * THREATSENSE CORE MATHEMATICAL ENGINE: DUAL-STREAM FUSION & AFFECTIVE MASKING DETECTOR
 * =========================================================================================
 *
 * RESEARCH PREMISE & ARCHITECTURAL AXIOM:
 * -----------------------------------------------------------------------------------------
 * This engine operates on a strict Dual-Stream architecture:
 *   - Stream A: Facial Emotion Recognition (Continuous probability distribution over 6 classes)
 *   - Stream B: Bengali Lip-Reading (LipBengal model: transcript, phonetic tokens, A_vol)
 *
 * CRITICAL RESEARCH INVARIANT:
 * Lip reading must NEVER be gated or skipped based on facial emotion.
 * An adversary conducting affective deception or masking deliberately sustains a placid,
 * smiling, or neutral facial exterior while articulating hostile or lethal threats in Bengali.
 * Thus, the core predictive signal is the Cross-Modal Discrepancy (D_cross) between streams.
 *
 * =========================================================================================
 * TODO: THESIS FORMULATION REPLACEMENT BLOCK
 * -----------------------------------------------------------------------------------------
 * Replace placeholder formulas with the exact A_vol, θ_W, D_cross definitions from the thesis.
 *
 * Required Thesis Symbols preserved in this codebase:
 *   - R_e      : Emotion Risk score derived from Stream A probabilities and risk weights.
 *   - θ_W      : Bengali Lexicon Threat Weight for individual uttered tokens (0.0 <= θ_W <= 1.0).
 *   - A_vol    : Lip-movement amplitude / spatial volume metric (0.0 <= A_vol <= 1.0).
 *   - g(A_vol) : Monotonic amplitude transfer function.
 *   - T_lip    : Lip Threat metric computed from weighted detected tokens scaled by g(A_vol).
 *   - D_cross  : Cross-Modal Discrepancy quantifying deception / affective masking.
 *   - α, β, γ  : Configurable fusion weights where α (R_e) + β (T_lip) + γ (D_cross) = 1.0.
 * =========================================================================================
 */

import {
  EmotionProbabilities,
  EmotionWeights,
  EmotionType,
  WordDetection,
  LexiconEntry,
  EngineSettings,
  ThreatCalculationResult,
  ThreatBand,
  ThreatWordMatch,
} from './types';

/**
 * Utility helper to clamp numerical values to [min, max]
 */
export function clip(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Identify the dominant emotion and its raw probability from distribution
 */
export function getDominantEmotion(emotions: EmotionProbabilities): {
  dominantEmotion: EmotionType;
  dominantEmotionProb: number;
} {
  let highestEmotion: EmotionType = 'neutral';
  let highestProb = -1;

  for (const [emotion, prob] of Object.entries(emotions) as [EmotionType, number][]) {
    if (prob > highestProb) {
      highestProb = prob;
      highestEmotion = emotion;
    }
  }

  return {
    dominantEmotion: highestEmotion,
    dominantEmotionProb: highestProb,
  };
}

/**
 * STREAM A: Emotion Risk (R_e)
 *
 * Computes R_e as the inner product of normalized emotion probabilities and risk weights:
 *   R_e = clip( Σ [ P(e) * w_e ] )
 *
 * Default weights assign high risk to anger/fear/disgust and zero to neutral/happy.
 */
export function computeEmotionRisk(
  emotions: EmotionProbabilities,
  weights: EmotionWeights
): number {
  let R_e = 0;
  for (const [emotion, prob] of Object.entries(emotions) as [EmotionType, number][]) {
    const weight = weights[emotion] ?? 0;
    R_e += prob * weight;
  }
  return clip(R_e, 0, 1);
}

/**
 * Amplitude Scaling Function: g(A_vol)
 *
 * Monotonic scaling transfer function.
 * Accounts for silent mouthing: even low amplitude lip motions still transmit meaningful
 * speech signals when word confidence is significant.
 */
export function g_volScaling(A_vol: number, volScalingK = 1.0): number {
  const clampedVol = clip(A_vol, 0, 1);
  if (clampedVol < 0.05) {
    // Very minimal movement
    return clip(0.25 * clampedVol * volScalingK, 0, 1);
  }
  // Smooth monotonic curve starting from base sensitivity 0.40
  // Ensuring subtle mouthing can still register full threat
  const baseSensitivity = 0.35;
  const scaled = baseSensitivity + (1.0 - baseSensitivity) * Math.pow(clampedVol, 0.7) * volScalingK;
  return clip(scaled, 0, 1);
}

/**
 * STREAM B: Lip Threat (T_lip)
 *
 * Identifies uttered Bengali tokens against lexicon weights (θ_W) and combines with
 * model word detection confidence conf(w) and lip volume metric A_vol:
 *
 * Placeholder Thesis Model:
 *   T_lip = clip( [ 1 - Π (1 - θ_W(w) * conf(w)) ] * g(A_vol) )
 * Using probabilistic soft-or combination so a single high-weight threat word (e.g., বোমা θ_W=0.95)
 * registers decisively, while multiple lesser words compound monotonically.
 */
export function computeLipThreat(
  words: WordDetection[],
  A_vol: number,
  lexicon: LexiconEntry[],
  volScalingK = 1.0
): { T_lip: number; matches: ThreatWordMatch[] } {
  const matches: ThreatWordMatch[] = [];

  // Create lexicon map for fast, normalized lookup
  const lexiconMap = new Map<string, LexiconEntry>();
  for (const entry of lexicon) {
    lexiconMap.set(entry.word.trim(), entry);
  }

  // Find all matches in detected word stream
  let accumulatedThreatScore = 0;
  let compoundNonThreatProbability = 1.0;

  for (const detected of words) {
    const cleanWord = detected.word.trim();
    const entry = lexiconMap.get(cleanWord);

    if (entry) {
      const θ_W = entry.weight;
      const conf = clip(detected.confidence, 0, 1);
      const effectiveWordRisk = θ_W * conf;

      compoundNonThreatProbability *= 1.0 - effectiveWordRisk;
      accumulatedThreatScore += effectiveWordRisk;

      matches.push({
        word: entry.word,
        romanized: entry.romanized,
        weight: θ_W,
        category: entry.category,
        confidence: conf,
      });
    }
  }

  if (matches.length === 0) {
    return { T_lip: 0, matches: [] };
  }

  // Soft probabilistic union bounded to [0, 1]
  const combinedWordThreat = 1.0 - compoundNonThreatProbability;
  const g_vol = g_volScaling(A_vol, volScalingK);

  // Final T_lip
  const T_lip = clip(combinedWordThreat * g_vol, 0, 1);

  return { T_lip, matches };
}

/**
 * CROSS-MODAL DISCREPANCY: D_cross
 *
 * Quantifies divergence between verbal threat level (T_lip) and facial threat appearance (R_e).
 * Affective deception / masking is characterized by:
 *   - High T_lip (threatening speech)
 *   - Low R_e (placid, smiling, or neutral facial demeanor)
 *
 * Placeholder Thesis Model:
 *   D_cross = max(0, T_lip - R_e)
 * When dominant emotion ∈ {neutral, happy}, discrepancy is amplified by maskingMultiplier.
 */
export function computeDiscrepancy(
  T_lip: number,
  R_e: number,
  dominantEmotion: EmotionType,
  maskingMultiplier = 1.25
): number {
  const rawDifference = Math.max(0, T_lip - R_e);

  // Affective masking amplification: Attacker uses calm expression to mask threat
  const isCalmFace = dominantEmotion === 'neutral' || dominantEmotion === 'happy';
  const multiplier = isCalmFace ? maskingMultiplier : 1.0;

  const D_cross = clip(rawDifference * multiplier, 0, 1);
  return Number(D_cross.toFixed(4));
}

/**
 * MASKING DETECTOR:
 *
 * Triggers when Cross-Modal Discrepancy exceeds threshold (default 0.40)
 * AND facial emotion appears benign (neutral or happy).
 */
export function detectMasking(
  D_cross: number,
  dominantEmotion: EmotionType,
  threshold = 0.40,
  dominantEmotionProb = 0.5
): { isMasking: boolean; reason?: string } {
  const isCalmFace = dominantEmotion === 'neutral' || dominantEmotion === 'happy';

  if (D_cross >= threshold && isCalmFace) {
    const emotionPct = Math.round(dominantEmotionProb * 100);
    const reason = `Face appears calm (${dominantEmotion} ${emotionPct}%) but Bengali lip content indicates a severe threat. Affective masking deception identified.`;
    return { isMasking: true, reason };
  }

  return { isMasking: false };
}

/**
 * Determine threat classification band:
 *   0 - 30  : Low
 *   31 - 65 : Medium
 *   66 - 100: High
 */
export function getThreatBand(threatPercent: number): ThreatBand {
  if (threatPercent <= 30) return 'low';
  if (threatPercent <= 65) return 'medium';
  return 'high';
}

/**
 * Compute anomaly score relative to expected ground truth baseline
 */
export function computeBaselineAnomaly(
  emotions: EmotionProbabilities,
  baselines: EmotionProbabilities
): number {
  let euclideanSum = 0;
  for (const [emotion, prob] of Object.entries(emotions) as [EmotionType, number][]) {
    const base = baselines[emotion] ?? 0;
    euclideanSum += Math.pow(prob - base, 2);
  }
  return clip(Math.sqrt(euclideanSum) / Math.SQRT2, 0, 1);
}

/**
 * MASTER THREAT ENGINE FUSION
 *
 * Computes:
 *   Threat% = 100 * clip( α*R_e + β*T_lip + γ*D_cross )
 *
 * If MASKING DETECTED:
 *   Elevates final threat floor to at least Medium (>= 40%), ensuring deceitful attacks
 *   cannot bypass security protocols through facial calmness.
 */
export function computeThreatScore(
  emotions: EmotionProbabilities,
  words: WordDetection[],
  A_vol: number,
  settings: EngineSettings,
  lexicon: LexiconEntry[],
  timestamp = Date.now()
): ThreatCalculationResult {
  const { dominantEmotion, dominantEmotionProb } = getDominantEmotion(emotions);

  // 1. Stream A: Emotion Risk (R_e)
  const R_e = computeEmotionRisk(emotions, settings.emotionWeights);

  // 2. Stream B: Lip Threat (T_lip)
  const { T_lip, matches: detectedThreatWords } = computeLipThreat(
    words,
    A_vol,
    lexicon,
    settings.volScalingK
  );

  // 3. Cross-Modal Discrepancy (D_cross)
  const D_cross = computeDiscrepancy(
    T_lip,
    R_e,
    dominantEmotion,
    settings.maskingMultiplier
  );

  // 4. Affective Masking Detection
  const { isMasking: isMaskingDetected, reason: maskingReason } = detectMasking(
    D_cross,
    dominantEmotion,
    settings.maskingThreshold,
    dominantEmotionProb
  );

  // 5. Threat Score Fusion: α*R_e + β*T_lip + γ*D_cross
  const totalWeight = settings.alpha + settings.beta + settings.gamma;
  const normAlpha = totalWeight > 0 ? settings.alpha / totalWeight : 0.25;
  const normBeta = totalWeight > 0 ? settings.beta / totalWeight : 0.50;
  const normGamma = totalWeight > 0 ? settings.gamma / totalWeight : 0.25;

  let rawThreatScore = normAlpha * R_e + normBeta * T_lip + normGamma * D_cross;
  rawThreatScore = clip(rawThreatScore, 0, 1);

  // Floor elevation if Masking is detected:
  // Threat must be raised to at least Medium band (minimum 40%)
  if (isMaskingDetected) {
    const maskingFloor = 0.40;
    rawThreatScore = Math.max(rawThreatScore, maskingFloor);
  }

  const threatPercent = Math.round(rawThreatScore * 100);
  const threatBand = getThreatBand(threatPercent);

  // Baseline Anomaly Metric (informational, does not gate lip reading)
  const anomalyScore = computeBaselineAnomaly(emotions, settings.emotionBaselines);

  return {
    R_e: Number(R_e.toFixed(4)),
    T_lip: Number(T_lip.toFixed(4)),
    D_cross: Number(D_cross.toFixed(4)),
    rawThreatScore: Number(rawThreatScore.toFixed(4)),
    threatPercent,
    threatBand,
    dominantEmotion,
    dominantEmotionProb: Number(dominantEmotionProb.toFixed(3)),
    isMaskingDetected,
    maskingReason,
    detectedThreatWords,
    timestamp,
    smoothedEmotions: { ...emotions },
    anomalyScore: Number(anomalyScore.toFixed(3)),
  };
}
