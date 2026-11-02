'use client';

import { WordThreat } from '../../monitor/types';
import { useMonitor } from '../../store/useMonitorStore';

const BADGES: Record<WordThreat, string> = {
  High: 'bg-red-600 text-white',
  Medium: 'bg-amber-400 text-slate-950',
  Low: 'bg-emerald-700 text-white',
};

export function SpeechCard() {
  const speech = useMonitor((state) => state.assessment.speech);
  const streamOn = useMonitor((state) => state.streams.lip);

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-medium text-slate-400">Visual Speech (Bengali Lip Reading)</h2>

      {speech ? (
        <>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-3xl font-bold text-white">
            {speech.word}
            {speech.translation && (
              <span className="text-lg font-medium text-slate-300">({speech.translation})</span>
            )}
          </p>
          <p className="mt-3">
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold ${BADGES[speech.threat]}`}
            >
              Threat Weight: {speech.threat}
            </span>
          </p>
        </>
      ) : (
        <p className="mt-2 text-lg font-medium text-slate-400">
          {streamOn ? 'No word decoded' : 'Stream off'}
        </p>
      )}
    </article>
  );
}
