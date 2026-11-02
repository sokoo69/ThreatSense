import { InferenceSource } from '../types';
import { createMockSource } from './mockSource';
import { createWebSocketSource } from './websocketSource';

/** Uses the real backend when NEXT_PUBLIC_STREAM_WS_URL is set, otherwise the mock. */
export function createSource(): InferenceSource {
  const url = process.env.NEXT_PUBLIC_STREAM_WS_URL;
  return url ? createWebSocketSource(url) : createMockSource();
}
