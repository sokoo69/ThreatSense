/**
 * =========================================================================================
 * THREATSENSE MOCK API & BACKEND INTEGRATION LAYER
 * =========================================================================================
 *
 * This module abstracts the Dual-Stream inference inference engine:
 *   - Stream A: Facial Emotion Recognition
 *   - Stream B: Bengali Lip Reading (LipBengal Model)
 *
 * MOCK ARCHITECTURE & SWAP INSTRUCTIONS:
 * -----------------------------------------------------------------------------------------
 * When the production Python/PyTorch/FastAPI backend is ready, replace the mock implementations
 * in `predictEmotion` and `readLipsBengali` with the fetch/WebSocket calls marked by the
 * TODO comments below.
 * =========================================================================================
 */

import { EmotionProbabilities, LipReadingResult, DemoScenarioId } from '../engine/types';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

// Real API Configuration placeholders
export const API_CONFIG = {
  USE_MOCK: true,
  // TODO(backend): Point to production FastAPI / Flask or ONNX serving instance
  EMOTION_ENDPOINT: process.env.NEXT_PUBLIC_EMOTION_API_URL || '/api/emotion',
  LIPREAD_ENDPOINT: process.env.NEXT_PUBLIC_LIPREAD_API_URL || '/api/lipread-bn',
  STREAM_WS_URL: process.env.NEXT_PUBLIC_STREAM_WS_URL || 'ws://localhost:8000/ws/stream',
};

/**
 * Add small realistic jitter to probabilities so the real-time gauges and charts feel alive
 */
function addRealisticNoise(emotions: EmotionProbabilities, noiseLevel = 0.03): EmotionProbabilities {
  const result: EmotionProbabilities = { ...emotions };
  const keys = Object.keys(emotions) as (keyof EmotionProbabilities)[];

  for (const k of keys) {
    const delta = (Math.random() - 0.5) * noiseLevel;
    result[k] = Math.max(0, Math.min(1, result[k] + delta));
  }

  // Normalize
  const sum = keys.reduce((acc, k) => acc + result[k], 0);
  if (sum > 0) {
    for (const k of keys) {
      result[k] = Number((result[k] / sum).toFixed(4));
    }
  }

  return result;
}

/**
 * STREAM A: Predict Face Emotion
 *
 * TODO(backend): POST /api/emotion
 * Payload: { image: base64Frame, timestamp: Date.now() }
 * Returns: { angry: float, neutral: float, disgust: float, sad: float, happy: float, fear: float }
 */
export async function predictEmotion(
  frame?: ImageData | HTMLCanvasElement | string | null,
  activeScenarioId: DemoScenarioId = 'affective_masking'
): Promise<EmotionProbabilities> {
  if (!API_CONFIG.USE_MOCK) {
    /*
     * -------------------------------------------------------------------------------------
     * TODO: REAL ENDPOINT INTEGRATION: POST /api/emotion
     * -------------------------------------------------------------------------------------
     * const response = await fetch(API_CONFIG.EMOTION_ENDPOINT, {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify({ frame, timestamp: Date.now() }),
     * });
     * return await response.json();
     */
    throw new Error('Real emotion backend not connected yet. Set API_CONFIG.USE_MOCK to true.');
  }

  // Simulate network latency (25ms - 60ms)
  await new Promise((resolve) => setTimeout(resolve, 35));

  const scenario =
    DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[3];

  return addRealisticNoise(scenario.emotions, 0.025);
}

/**
 * STREAM B: Bengali Lip Reading (LipBengal Model)
 *
 * CRITICAL RULE: NEVER GATED BY EMOTION!
 * This function processes the mouth ROI window independently of Stream A.
 *
 * TODO(backend): POST /api/lipread-bn
 * Payload: { frameSequence: base64Frames[], fps: 30, roi_box: [ymin, xmin, ymax, xmax] }
 * Returns: {
 *   transcript_bn: string,
 *   romanized: string,
 *   words: [{ word: string, confidence: number, start: number, end: number }],
 *   A_vol: number,
 *   speaking: boolean
 * }
 */
export async function readLipsBengali(
  frameSequence?: unknown[],
  activeScenarioId: DemoScenarioId = 'affective_masking'
): Promise<LipReadingResult> {
  if (!API_CONFIG.USE_MOCK) {
    /*
     * -------------------------------------------------------------------------------------
     * TODO: REAL ENDPOINT INTEGRATION: POST /api/lipread-bn
     * -------------------------------------------------------------------------------------
     * const response = await fetch(API_CONFIG.LIPREAD_ENDPOINT, {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify({ frames: frameSequence, timestamp: Date.now() }),
     * });
     * return await response.json();
     */
    throw new Error('Real LipBengal backend not connected yet. Set API_CONFIG.USE_MOCK to true.');
  }

  // Simulate model inference time (35ms - 75ms)
  await new Promise((resolve) => setTimeout(resolve, 45));

  const scenario =
    DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[3];

  // Apply subtle lip amplitude modulation to simulate real-time mouth movement
  const volumeJitter = (Math.random() - 0.5) * 0.08;
  const A_vol = Math.max(0.1, Math.min(1.0, scenario.lipReading.A_vol + volumeJitter));

  return {
    ...scenario.lipReading,
    A_vol: Number(A_vol.toFixed(3)),
    words: scenario.lipReading.words.map((w) => ({
      ...w,
      confidence: Number(Math.max(0.5, Math.min(0.99, w.confidence + (Math.random() - 0.5) * 0.04)).toFixed(3)),
    })),
  };
}

/**
 * REAL-TIME DUAL-STREAM WEBSOCKET CONNECTOR
 *
 * -----------------------------------------------------------------------------------------
 * TODO: WS /ws/stream
 * Connects to full-duplex video streaming worker.
 * -----------------------------------------------------------------------------------------
 */
export class RealtimeStreamClient {
  private ws: WebSocket | null = null;
  private isConnected = false;

  public connect(
    onData: (data: { emotions: EmotionProbabilities; lip: LipReadingResult }) => void,
    onError: (err: unknown) => void
  ) {
    if (API_CONFIG.USE_MOCK) {
      // In mock mode, the local reactive loop in useThreatStore drives updates
      return;
    }

    try {
      this.ws = new WebSocket(API_CONFIG.STREAM_WS_URL);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[ThreatSense WS] Connected to Dual-Stream socket');
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onData(parsed);
        } catch (e) {
          onError(e);
        }
      };

      this.ws.onerror = (e) => onError(e);
      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('[ThreatSense WS] Connection closed');
      };
    } catch (e) {
      onError(e);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  public sendFrame(frameData: string) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ frame: frameData, ts: Date.now() }));
    }
  }
}
