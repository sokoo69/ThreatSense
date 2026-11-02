import { InferenceFrame, InferenceSource } from '../types';

const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 10_000;
/** If frames stop for this long the last reading is out of date and must leave the screen. */
const STALE_AFTER_MS = 3000;
/** Skip video frames rather than queue them when the connection falls behind. */
const MAX_BUFFERED_BYTES = 1_000_000;

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Ignores anything that does not match the InferenceFrame contract in ../types.ts. */
export function parseFrame(raw: string): InferenceFrame | null {
  try {
    const data = JSON.parse(raw) as InferenceFrame | null;
    if (!data || !isNumber(data.timestamp)) return null;

    const faceValid = data.face === null || Boolean(data.face?.emotions);
    const lipValid =
      data.lip === null ||
      (typeof data.lip?.word === 'string' &&
        isNumber(data.lip.confidence) &&
        isNumber(data.lip.amplitude));

    return faceValid && lipValid ? data : null;
  } catch {
    return null;
  }
}

/**
 * Connects to the backend. It receives InferenceFrame JSON messages and sends each
 * captured video frame as one binary JPEG message.
 */
export function createWebSocketSource(url: string): InferenceSource {
  let socket: WebSocket | null = null;

  return {
    kind: 'websocket',
    initialFrame: null,
    connect({ onFrame, onConnection }) {
      let stopped = false;
      let retryDelay = FIRST_RETRY_MS;
      let retryTimer: ReturnType<typeof setTimeout> | undefined;
      let staleTimer: ReturnType<typeof setTimeout> | undefined;

      const watchForSilence = () => {
        clearTimeout(staleTimer);
        staleTimer = setTimeout(() => onFrame(null), STALE_AFTER_MS);
      };

      const open = () => {
        onConnection('connecting');
        const ws = new WebSocket(url);
        socket = ws;

        ws.onopen = () => {
          retryDelay = FIRST_RETRY_MS;
          onConnection('live');
          watchForSilence();
        };

        ws.onmessage = (event: MessageEvent) => {
          if (typeof event.data !== 'string') return;
          const frame = parseFrame(event.data);
          if (!frame) return;
          watchForSilence();
          onFrame(frame);
        };

        ws.onclose = () => {
          clearTimeout(staleTimer);
          if (stopped) return;
          onConnection('offline');
          onFrame(null);
          retryTimer = setTimeout(open, retryDelay);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
        };
      };

      open();

      return () => {
        stopped = true;
        clearTimeout(retryTimer);
        clearTimeout(staleTimer);
        socket?.close();
        socket = null;
      };
    },
    sendVideoFrame(jpeg) {
      if (socket?.readyState === WebSocket.OPEN && socket.bufferedAmount < MAX_BUFFERED_BYTES) {
        socket.send(jpeg);
      }
    },
  };
}
