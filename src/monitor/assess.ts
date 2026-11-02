import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { computeThreatScore } from '../engine/threatEngine';
import { EmotionProbabilities, EngineSettings } from '../engine/types';
import { Assessment, InferenceFrame, StandbyReason, StreamToggles, ThreatStatus } from './types';
import { EMOTION_LABELS, LEXICON, lookupWord } from './vocabulary';

/**
 * Turns one analysis frame into what the operator sees.
 *
 * The risk numbers (R_e, T_lip, D_cross and the fused score) all come from the thesis
 * engine in src/engine/threatEngine.ts, so replacing a formula there updates this
 * dashboard too. This file only adds the operator rules on top:
 *
 *   Deception  Calm face plus a discrepancy over the engine's threshold. Score 90+.
 *   Critical   Hostile face and threatening speech agree. Score 85+.
 *   Elevated   One warning sign alone. Score 40 to 84.
 *   Normal     No warning signs. Score 30 or lower.
 *
 * Critical and Deception both compare the two streams, so a single stream can never
 * reach them. That keeps one unconfirmed signal from raising the highest alarms.
 */

/** Emotion risk from here up counts as a hostile face. */
const HOSTILE_FACE = 0.5;
/** Lip threat from here up counts as threatening speech. */
const THREATENING_SPEECH = 0.35;

const SCORE_RANGES = {
  deception: 90,
  critical: 85,
  elevatedMin: 40,
  elevatedMax: 84,
  normalMax: 30,
};

/** Stands in for the face when only the lip stream is running. */
const CALM_FACE: EmotionProbabilities = {
  angry: 0,
  disgust: 0,
  fear: 0,
  happy: 0,
  neutral: 1,
  sad: 0,
  surprise: 0,
};

const FACE_ONLY_NOTE = 'Face stream only. Critical and deception alerts need both streams.';
const LIP_ONLY_NOTE = 'Lip reading only. Critical and deception alerts need both streams.';

function standby(standbyReason: StandbyReason): Assessment {
  const reasons: Record<StandbyReason, string> = {
    streams_off: 'Turn on a stream to resume monitoring',
    no_signal: 'Waiting for video analysis',
    no_subject: 'No person in view',
  };

  return {
    status: 'standby',
    score: null,
    discrepancy: null,
    reason: reasons[standbyReason],
    note: null,
    standbyReason,
    emotion: null,
    speech: null,
  };
}

function singleStreamSettings(stream: 'face' | 'lip'): EngineSettings {
  return {
    ...DEFAULT_SETTINGS,
    alpha: stream === 'face' ? 1 : 0,
    beta: stream === 'lip' ? 1 : 0,
    gamma: 0,
    // No second stream means there is nothing to compare, so masking can never apply.
    maskingThreshold: Number.POSITIVE_INFINITY,
  };
}

export function assess(frame: InferenceFrame | null, streams: StreamToggles): Assessment {
  if (!streams.face && !streams.lip) return standby('streams_off');
  if (!frame) return standby('no_signal');

  const face = streams.face ? frame.face : null;
  const lip = streams.lip ? frame.lip : null;
  if (!face && !lip) return standby('no_subject');

  const bothStreams = Boolean(face && lip);
  const settings = bothStreams
    ? DEFAULT_SETTINGS
    : singleStreamSettings(face ? 'face' : 'lip');

  const engine = computeThreatScore(
    face?.emotions ?? CALM_FACE,
    lip ? [{ word: lip.word, confidence: lip.confidence, start: 0, end: 0 }] : [],
    lip?.amplitude ?? 0,
    settings,
    LEXICON,
    frame.timestamp
  );

  const hostileFace = Boolean(face) && engine.R_e >= HOSTILE_FACE;
  const threateningSpeech = Boolean(lip) && engine.T_lip >= THREATENING_SPEECH;

  let status: ThreatStatus = 'normal';
  if (engine.isMaskingDetected) status = 'deception';
  else if (hostileFace && threateningSpeech) status = 'critical';
  else if (hostileFace || threateningSpeech || engine.threatBand !== 'low') status = 'elevated';

  const raw = engine.rawThreatScore;
  const emotionLabel = EMOTION_LABELS[engine.dominantEmotion];
  const score = {
    deception: Math.round(SCORE_RANGES.deception + (100 - SCORE_RANGES.deception) * raw),
    critical: Math.round(SCORE_RANGES.critical + (100 - SCORE_RANGES.critical) * raw),
    elevated: Math.min(
      SCORE_RANGES.elevatedMax,
      Math.max(SCORE_RANGES.elevatedMin, engine.threatPercent)
    ),
    normal: Math.min(SCORE_RANGES.normalMax, engine.threatPercent),
  }[status as Exclude<ThreatStatus, 'standby'>];

  const word = lip?.word.trim() ?? '';
  const reason = {
    deception: `${emotionLabel} on the face, but the lips read “${word}”`,
    critical: `${emotionLabel} on the face with threatening speech “${word}”`,
    elevated: threateningSpeech
      ? `Threatening word “${word}” detected`
      : hostileFace
        ? `${emotionLabel} on the face`
        : 'Warning signs present',
    normal: 'No threat signs detected',
  }[status as Exclude<ThreatStatus, 'standby'>];

  const vocabulary = lip ? lookupWord(lip.word) : null;

  return {
    status,
    score,
    discrepancy: bothStreams ? engine.D_cross : null,
    reason,
    note: streams.face && streams.lip ? null : streams.face ? FACE_ONLY_NOTE : LIP_ONLY_NOTE,
    standbyReason: null,
    emotion: face
      ? {
          label: emotionLabel,
          confidence: engine.dominantEmotionProb,
          hostile: settings.emotionWeights[engine.dominantEmotion] >= HOSTILE_FACE,
        }
      : null,
    speech:
      lip && vocabulary
        ? {
            word,
            romanized: lip.romanized ?? vocabulary.romanized,
            translation: lip.translation ?? vocabulary.translation,
            confidence: lip.confidence,
            threat: vocabulary.threat,
          }
        : null,
  };
}
