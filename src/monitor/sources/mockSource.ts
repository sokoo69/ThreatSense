import { EmotionProbabilities } from '../../engine/types';
import { presetFrame } from '../presets';
import { Box, InferenceFrame, InferenceSource, PresetId } from '../types';

const TICK_MS = 1000;

function wobble(value: number, amount: number): number {
  return value + (Math.random() - 0.5) * amount;
}

function jitterEmotions(emotions: EmotionProbabilities): EmotionProbabilities {
  const entries = Object.entries(emotions).map(
    ([emotion, probability]) => [emotion, Math.max(0, wobble(probability, 0.02))] as const
  );
  const total = entries.reduce((sum, [, probability]) => sum + probability, 0);

  return Object.fromEntries(
    entries.map(([emotion, probability]) => [emotion, probability / total])
  ) as EmotionProbabilities;
}

function jitterBox(box: Box | null): Box | null {
  return box && { ...box, x: wobble(box.x, 0.006), y: wobble(box.y, 0.006) };
}

function liveFrame(preset: PresetId): InferenceFrame {
  const { face, lip } = presetFrame(preset, Date.now());

  return {
    timestamp: Date.now(),
    face: face && { emotions: jitterEmotions(face.emotions), box: jitterBox(face.box) },
    lip: lip && {
      ...lip,
      confidence: Math.min(0.99, wobble(lip.confidence, 0.02)),
      amplitude: wobble(lip.amplitude, 0.04),
      box: jitterBox(lip.box),
    },
  };
}

/** Simulates a model by replaying the selected preset once a second with slight noise. */
export function createMockSource(): InferenceSource {
  let preset: PresetId = 'normal';

  return {
    kind: 'mock',
    initialFrame: presetFrame(preset),
    connect({ onFrame, onConnection }) {
      onConnection('mock');
      const timer = setInterval(() => onFrame(liveFrame(preset)), TICK_MS);
      return () => clearInterval(timer);
    },
    simulate(nextPreset) {
      preset = nextPreset;
      return liveFrame(preset);
    },
  };
}
