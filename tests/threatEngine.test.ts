import { describe, it, expect } from 'vitest';
import {
  computeEmotionRisk,
  computeLipThreat,
  computeDiscrepancy,
  detectMasking,
  computeThreatScore,
  getDominantEmotion,
  getThreatBand,
  clip,
} from '../src/engine/threatEngine';
import { DEFAULT_SETTINGS } from '../src/data/defaultSettings';
import { LexiconEntry, WordDetection } from '../src/engine/types';
import lexiconData from '../src/data/lexicon.bn.json';

const sampleLexicon: LexiconEntry[] = lexiconData as LexiconEntry[];

describe('ThreatSense Engine - Pure Logic & Thesis Formulas', () => {
  it('correctly clips numbers to [0, 1]', () => {
    expect(clip(-0.5)).toBe(0);
    expect(clip(1.5)).toBe(1);
    expect(clip(0.42)).toBe(0.42);
  });

  it('determines the dominant emotion correctly', () => {
    const emotions = {
      angry: 0.1,
      neutral: 0.15,
      disgust: 0.05,
      sad: 0.05,
      happy: 0.60,
      fear: 0.05,
      surprise: 0,
    };
    const { dominantEmotion, dominantEmotionProb } = getDominantEmotion(emotions);
    expect(dominantEmotion).toBe('happy');
    expect(dominantEmotionProb).toBe(0.60);
  });

  it('computes Stream A Emotion Risk (R_e) correctly', () => {
    const calmEmotions = {
      angry: 0.0,
      neutral: 0.8,
      disgust: 0.0,
      sad: 0.0,
      happy: 0.2,
      fear: 0.0,
      surprise: 0,
    };
    // Neutral and happy default weights are 0.0
    expect(computeEmotionRisk(calmEmotions, DEFAULT_SETTINGS.emotionWeights)).toBe(0);

    const angryEmotions = {
      angry: 0.8,
      neutral: 0.1,
      disgust: 0.1,
      sad: 0.0,
      happy: 0.0,
      fear: 0.0,
      surprise: 0,
    };
    // 0.8 * 1.0 (angry) + 0.1 * 0.5 (disgust) = 0.85
    const R_e = computeEmotionRisk(angryEmotions, DEFAULT_SETTINGS.emotionWeights);
    expect(R_e).toBeCloseTo(0.85, 2);
  });

  it('computes Stream B Lip Threat (T_lip) from Bengali words with θ_W and A_vol', () => {
    const detectedWords: WordDetection[] = [
      { word: 'বোমা', confidence: 0.9, start: 0, end: 1 }, // weight 0.95
    ];
    // High lip volume
    const { T_lip, matches } = computeLipThreat(detectedWords, 0.85, sampleLexicon, 1.0);
    expect(matches.length).toBe(1);
    expect(matches[0].word).toBe('বোমা');
    expect(matches[0].weight).toBe(0.95);
    expect(T_lip).toBeGreaterThan(0.7);

    // Benign words
    const benignWords: WordDetection[] = [
      { word: 'হ্যালো', confidence: 0.9, start: 0, end: 1 },
      { word: 'ধন্যবাদ', confidence: 0.9, start: 1, end: 2 },
    ];
    const benignResult = computeLipThreat(benignWords, 0.85, sampleLexicon, 1.0);
    expect(benignResult.matches.length).toBe(0);
    expect(benignResult.T_lip).toBe(0);
  });

  it('calculates Cross-Modal Discrepancy (D_cross) and amplifies during calm demeanor', () => {
    // Case 1: Anger matches threat (No affective masking)
    const D_congruent = computeDiscrepancy(0.8, 0.8, 'angry', 1.25);
    expect(D_congruent).toBe(0); // 0.8 - 0.8 = 0

    // Case 2: Threatening lip while smiling/neutral (Affective Masking!)
    // T_lip = 0.85, R_e = 0.05, dominant = happy -> (0.85 - 0.05) * 1.25 = 1.0
    const D_masking = computeDiscrepancy(0.85, 0.05, 'happy', 1.25);
    expect(D_masking).toBe(1.0);
    expect(D_masking).toBeGreaterThan(0.40);
  });

  it('triggers MASKING DETECTED state when discrepancy exceeds threshold on calm face', () => {
    const maskingCheck = detectMasking(0.55, 'happy', 0.40, 0.85);
    expect(maskingCheck.isMasking).toBe(true);
    expect(maskingCheck.reason).toContain('Affective masking deception identified');

    // Does NOT trigger masking if face is openly angry (even if discrepancy exists)
    const angryCheck = detectMasking(0.55, 'angry', 0.40, 0.85);
    expect(angryCheck.isMasking).toBe(false);
  });

  it('elevates threat score to at least Medium when masking is detected', () => {
    // Face is calm (happy 90%)
    const calmFace = {
      angry: 0.0,
      neutral: 0.1,
      disgust: 0.0,
      sad: 0.0,
      happy: 0.9,
      fear: 0.0,
      surprise: 0,
    };
    // Lip articulates severe threat
    const threatWords: WordDetection[] = [
      { word: 'বোমা', confidence: 0.95, start: 0, end: 1 },
      { word: 'গুলি', confidence: 0.90, start: 1, end: 2 },
    ];

    const result = computeThreatScore(
      calmFace,
      threatWords,
      0.8,
      DEFAULT_SETTINGS,
      sampleLexicon
    );

    expect(result.isMaskingDetected).toBe(true);
    expect(result.dominantEmotion).toBe('happy');
    expect(result.threatPercent).toBeGreaterThanOrEqual(40); // Floor elevated
    expect(result.threatBand).not.toBe('low');
  });

  it('never gates or skips lip reading based on facial emotion', () => {
    // 100% neutral face
    const neutralFace = {
      angry: 0.0,
      neutral: 1.0,
      disgust: 0.0,
      sad: 0.0,
      happy: 0.0,
      fear: 0.0,
      surprise: 0,
    };

    const words: WordDetection[] = [
      { word: 'খুন', confidence: 0.9, start: 0, end: 1 },
    ];

    const result = computeThreatScore(
      neutralFace,
      words,
      0.75,
      DEFAULT_SETTINGS,
      sampleLexicon
    );

    // Stream B ran completely, T_lip was evaluated, detected word matches populated
    expect(result.T_lip).toBeGreaterThan(0.5);
    expect(result.detectedThreatWords.length).toBe(1);
    expect(result.detectedThreatWords[0].word).toBe('খুন');
  });

  it('categorizes threat into correct bands: Low, Medium, High', () => {
    expect(getThreatBand(0)).toBe('low');
    expect(getThreatBand(30)).toBe('low');
    expect(getThreatBand(31)).toBe('medium');
    expect(getThreatBand(65)).toBe('medium');
    expect(getThreatBand(66)).toBe('high');
    expect(getThreatBand(100)).toBe('high');
  });
});
