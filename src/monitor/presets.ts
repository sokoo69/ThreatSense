import { EmotionProbabilities } from '../engine/types';
import { Box, InferenceFrame, PresetId } from './types';

export const FACE_BOX: Box = { x: 0.385, y: 0.14, w: 0.23, h: 0.52 };
export const LIP_BOX: Box = { x: 0.45, y: 0.47, w: 0.1, h: 0.1 };

interface Preset {
  id: PresetId;
  title: string;
  face: string;
  word: string;
  emotions: EmotionProbabilities;
  confidence: number;
  amplitude: number;
}

export const PRESETS: Preset[] = [
  {
    id: 'normal',
    title: 'Normal Pedestrian',
    face: 'Neutral face',
    word: 'আসুন',
    emotions: {
      angry: 0.01,
      disgust: 0.01,
      fear: 0.01,
      happy: 0.05,
      neutral: 0.88,
      sad: 0.02,
      surprise: 0.02,
    },
    confidence: 0.94,
    amplitude: 0.4,
  },
  {
    id: 'agitation',
    title: 'Overt Agitation',
    face: 'Angry face',
    word: 'আক্রমণ',
    emotions: {
      angry: 0.86,
      disgust: 0.06,
      fear: 0.02,
      happy: 0,
      neutral: 0.03,
      sad: 0.01,
      surprise: 0.02,
    },
    confidence: 0.92,
    amplitude: 0.8,
  },
  {
    id: 'deception',
    title: 'Deceptive Threat',
    face: 'Smiling face',
    word: 'বোমা',
    emotions: {
      angry: 0.01,
      disgust: 0,
      fear: 0,
      happy: 0.9,
      neutral: 0.07,
      sad: 0,
      surprise: 0.02,
    },
    confidence: 0.93,
    amplitude: 0.6,
  },
];

export function presetFrame(id: PresetId, timestamp = 0): InferenceFrame {
  const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0];

  return {
    timestamp,
    face: { emotions: preset.emotions, box: FACE_BOX },
    lip: {
      word: preset.word,
      confidence: preset.confidence,
      amplitude: preset.amplitude,
      box: LIP_BOX,
    },
  };
}
