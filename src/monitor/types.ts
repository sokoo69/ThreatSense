import { EmotionProbabilities } from '../engine/types';

/** A rectangle in normalized video coordinates: every value is 0 to 1. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * One analysis result. This is the only thing the dashboard needs from a backend:
 * the WebSocket sends one of these as JSON per analyzed window.
 *
 * `face` is null when no face is in view; `lip` is null when no word was decoded.
 */
export interface InferenceFrame {
  /** Milliseconds since the Unix epoch. */
  timestamp: number;
  face: {
    /** Seven-class probabilities that sum to 1. */
    emotions: EmotionProbabilities;
    box: Box | null;
  } | null;
  lip: {
    /** Decoded Bengali word, e.g. "বোমা". */
    word: string;
    /** Latin spelling. Falls back to the built-in vocabulary when omitted. */
    romanized?: string;
    /** English meaning. Falls back to the built-in vocabulary when omitted. */
    translation?: string;
    /** Word confidence from 0 to 1. */
    confidence: number;
    /** Mouth movement amount from 0 to 1 (A_vol). */
    amplitude: number;
    box: Box | null;
  } | null;
}

export interface StreamToggles {
  face: boolean;
  lip: boolean;
}

export type ThreatStatus = 'standby' | 'normal' | 'elevated' | 'critical' | 'deception';

export type StandbyReason = 'streams_off' | 'no_signal' | 'no_subject';

export type WordThreat = 'High' | 'Medium' | 'Low';

export interface EmotionReading {
  label: string;
  confidence: number;
  /** True for emotions that raise risk, such as anger. */
  hostile: boolean;
}

export interface SpeechReading {
  word: string;
  romanized: string | null;
  translation: string | null;
  confidence: number;
  threat: WordThreat;
}

export interface Assessment {
  status: ThreatStatus;
  /** 0 to 100, or null while nothing is being analyzed. */
  score: number | null;
  /** D_cross. Null unless both streams produced a reading. */
  discrepancy: number | null;
  /** One short sentence telling the operator why this status was reached. */
  reason: string;
  /** Warns when a stream is off and some alerts cannot fire. */
  note: string | null;
  standbyReason: StandbyReason | null;
  emotion: EmotionReading | null;
  speech: SpeechReading | null;
}

export interface Incident {
  id: number;
  timestamp: number;
  source: string;
  emotion: string | null;
  word: string | null;
  romanized: string | null;
  translation: string | null;
  discrepancy: number | null;
  score: number;
  status: Exclude<ThreatStatus, 'standby'>;
  reason: string;
  /** JPEG data URL of the video at the moment of the event. */
  snapshot: string | null;
  faceBox: Box | null;
  lipBox: Box | null;
}

export type ConnectionState = 'mock' | 'connecting' | 'live' | 'offline';

export type PresetId = 'normal' | 'agitation' | 'deception';

export interface SourceHandlers {
  /** Null means the feed has gone quiet, so the last reading must not stay on screen. */
  onFrame: (frame: InferenceFrame | null) => void;
  onConnection: (state: ConnectionState) => void;
}

/**
 * Everything that produces analysis results implements this interface. The store and
 * UI only talk to it, so swapping the mock for a real backend needs no UI change.
 */
export interface InferenceSource {
  kind: 'mock' | 'websocket';
  /** Shown before the first frame arrives. Must be deterministic for server rendering. */
  initialFrame: InferenceFrame | null;
  /** Starts producing frames. Returns a function that stops them. */
  connect: (handlers: SourceHandlers) => () => void;
  /** Mock only: switches to a demo preset and returns its first frame. */
  simulate?: (preset: PresetId) => InferenceFrame;
  /** Real backends only: receives a JPEG of the current video. */
  sendVideoFrame?: (jpeg: Blob) => void;
}
