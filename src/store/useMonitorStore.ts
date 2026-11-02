import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { assess } from '../monitor/assess';
import { buildIncident, MAX_INCIDENTS, shouldLog } from '../monitor/incidents';
import { createSource } from '../monitor/sources';
import {
  Assessment,
  ConnectionState,
  InferenceFrame,
  InferenceSource,
  Incident,
  PresetId,
  StreamToggles,
} from '../monitor/types';

export type IngestionMode = 'live' | 'upload';

type FrameGrabber = () => string | null;

const LIVE_SOURCE_LABEL = 'Live Cam 01';
const NO_CLIP_LABEL = 'No clip loaded';

export interface MonitorState {
  streams: StreamToggles;
  ingestion: IngestionMode;
  uploadName: string | null;
  connection: ConnectionState;
  usesMockData: boolean;
  frame: InferenceFrame | null;
  assessment: Assessment;
  activePreset: PresetId | null;
  incidents: Incident[];

  /** Begins receiving frames. Returns a function that stops them. */
  start: () => () => void;
  toggleStream: (stream: keyof StreamToggles) => void;
  setIngestion: (mode: IngestionMode) => void;
  setUploadName: (name: string | null) => void;
  applyPreset: (preset: PresetId) => void;
  ingest: (frame: InferenceFrame | null, force?: boolean) => void;
  /** The active video registers here so log rows can keep a snapshot. Returns an unregister. */
  setFrameGrabber: (grabber: FrameGrabber) => () => void;
  sendVideoFrame: ((jpeg: Blob) => void) | null;
}

function sourceLabel({ ingestion, uploadName }: MonitorState): string {
  return ingestion === 'live' ? LIVE_SOURCE_LABEL : (uploadName ?? NO_CLIP_LABEL);
}

export function createMonitorStore(source: InferenceSource) {
  const lastLogged = new Map<string, number>();
  let grabFrame: FrameGrabber | null = null;
  let nextIncidentId = 1;

  const streams: StreamToggles = { face: true, lip: true };

  return createStore<MonitorState>((set, get) => ({
    streams,
    ingestion: 'live',
    uploadName: null,
    connection: source.kind === 'mock' ? 'mock' : 'connecting',
    usesMockData: source.kind === 'mock',
    frame: source.initialFrame,
    assessment: assess(source.initialFrame, streams),
    activePreset: source.kind === 'mock' ? 'normal' : null,
    incidents: [],
    sendVideoFrame: source.sendVideoFrame ?? null,

    start: () =>
      source.connect({
        onFrame: (frame) => get().ingest(frame),
        onConnection: (connection) => set({ connection }),
      }),

    toggleStream: (stream) => {
      const state = get();
      set({ streams: { ...state.streams, [stream]: !state.streams[stream] } });
      get().ingest(state.frame);
    },

    setIngestion: (ingestion) => set({ ingestion }),
    setUploadName: (uploadName) => set({ uploadName }),

    applyPreset: (preset) => {
      if (!source.simulate) return;
      set({ activePreset: preset });
      get().ingest(source.simulate(preset), true);
    },

    ingest: (frame, force = false) => {
      const state = get();
      const assessment = assess(frame, state.streams);
      const timestamp = frame?.timestamp ?? 0;

      let incident: Incident | null = null;
      if (shouldLog(assessment, timestamp, lastLogged, force)) {
        incident = buildIncident(nextIncidentId, assessment, {
          timestamp,
          source: sourceLabel(state),
          snapshot: grabFrame?.() ?? null,
          faceBox: state.streams.face ? (frame?.face?.box ?? null) : null,
          lipBox: state.streams.lip ? (frame?.lip?.box ?? null) : null,
        });
        nextIncidentId += 1;
      }

      set({
        frame,
        assessment,
        incidents: incident
          ? [incident, ...state.incidents].slice(0, MAX_INCIDENTS)
          : state.incidents,
      });
    },

    setFrameGrabber: (grabber) => {
      grabFrame = grabber;
      return () => {
        if (grabFrame === grabber) grabFrame = null;
      };
    },
  }));
}

export const monitorStore = createMonitorStore(createSource());

export function useMonitor<T>(selector: (state: MonitorState) => T): T {
  return useStore(monitorStore, selector);
}
