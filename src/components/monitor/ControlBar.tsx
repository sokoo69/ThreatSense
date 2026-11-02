'use client';

import { Upload, Video } from 'lucide-react';
import { ConnectionState, StreamToggles } from '../../monitor/types';
import { IngestionMode, useMonitor } from '../../store/useMonitorStore';

const PILLS: Record<ConnectionState, { text: string; dot: string; style: string }> = {
  mock: {
    text: 'System Active / Mock Mode',
    dot: 'bg-emerald-400',
    style: 'border-emerald-500/40 text-emerald-300',
  },
  live: {
    text: 'System Active / Live Backend',
    dot: 'bg-emerald-400',
    style: 'border-emerald-500/40 text-emerald-300',
  },
  connecting: {
    text: 'Connecting to Backend',
    dot: 'bg-amber-400',
    style: 'border-amber-500/40 text-amber-300',
  },
  offline: {
    text: 'Backend Offline',
    dot: 'bg-red-400',
    style: 'border-red-500/50 text-red-300',
  },
};

const INGESTION_OPTIONS: { value: IngestionMode; label: string; Icon: typeof Video }[] = [
  { value: 'live', label: 'Live CCTV / Webcam Feed', Icon: Video },
  { value: 'upload', label: 'Upload Video Footage', Icon: Upload },
];

function StreamSwitch({ stream, label }: { stream: keyof StreamToggles; label: string }) {
  const isOn = useMonitor((state) => state.streams[stream]);
  const toggleStream = useMonitor((state) => state.toggleStream);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => toggleStream(stream)}
      className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
        isOn
          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-100'
          : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
      }`}
    >
      <span
        aria-hidden
        className={`relative h-4 w-7 rounded-full transition-colors ${isOn ? 'bg-cyan-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-white transition-all ${isOn ? 'left-3.5' : 'left-0.5'}`}
        />
      </span>
      {label}
      <span className="w-6 text-xs font-semibold">{isOn ? 'ON' : 'OFF'}</span>
    </button>
  );
}

function IngestionTabs() {
  const ingestion = useMonitor((state) => state.ingestion);
  const setIngestion = useMonitor((state) => state.setIngestion);

  return (
    <fieldset className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
      <legend className="sr-only">Video source</legend>
      {INGESTION_OPTIONS.map(({ value, label, Icon }) => (
        <label
          key={value}
          className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-cyan-400 ${
            ingestion === value
              ? 'bg-slate-100 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <input
            type="radio"
            name="ingestion"
            value={value}
            checked={ingestion === value}
            onChange={() => setIngestion(value)}
            className="sr-only"
          />
          <Icon aria-hidden className="size-4" />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

export function ControlBar() {
  const connection = useMonitor((state) => state.connection);
  const pill = PILLS[connection];

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-slate-800 px-4 py-3 lg:px-6">
      <div className="flex flex-col items-start gap-1.5">
        <h1 className="text-lg font-bold leading-tight tracking-tight text-white">
          ThreatSense
          <span className="font-normal text-slate-400"> | Behavioral Threat Monitor</span>
        </h1>
        <span
          className={`flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.style}`}
        >
          <span aria-hidden className={`size-2 rounded-full ${pill.dot}`} />
          {pill.text}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StreamSwitch stream="face" label="Facial Affect Stream" />
          <StreamSwitch stream="lip" label="Bengali Lip Reading Stream" />
        </div>
        <IngestionTabs />
      </div>
    </header>
  );
}
