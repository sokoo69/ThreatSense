import { EngineSettings } from '../engine/types';

export const DEFAULT_SETTINGS: EngineSettings = {
  emotionWeights: {
    angry: 1.0,
    fear: 0.6,
    surprise: 0.3,
    disgust: 0.5,
    sad: 0.2,
    neutral: 0.0,
    happy: 0.0,
  },
  emotionBaselines: {
    angry: 0.03,
    neutral: 0.75,
    disgust: 0.02,
    sad: 0.05,
    happy: 0.12,
    fear: 0.03,
    surprise: 0,
  },
  alpha: 0.25,
  beta: 0.50,
  gamma: 0.25,
  maskingThreshold: 0.40,
  volScalingK: 1.0,
  maskingMultiplier: 1.25,
  smoothingWindowSize: 5,
};

export const THREAT_BANDS = {
  low: { min: 0, max: 30, label: 'Low', color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  medium: { min: 31, max: 65, label: 'Medium', color: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  high: { min: 66, max: 100, label: 'High', color: '#ef4444', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  masking: { label: 'Masking Detected', color: '#c026d3', bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/40' },
};
