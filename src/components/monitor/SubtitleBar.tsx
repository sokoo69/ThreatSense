'use client';

import { capitalize } from '../../monitor/vocabulary';
import { useMonitor } from '../../store/useMonitorStore';

export function SubtitleBar() {
  const speech = useMonitor((state) => state.assessment.speech);
  if (!speech) return null;

  return (
    <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-baseline gap-x-3 rounded-md bg-slate-950/85 px-3 py-2 sm:inset-x-6 sm:bottom-4 sm:px-4">
      <p className="text-base font-semibold text-white sm:text-2xl">
        শনাক্তকৃত শব্দ: {speech.word}
        {speech.romanized && (
          <span className="text-slate-300"> [{capitalize(speech.romanized)}]</span>
        )}
      </p>
      {speech.translation && (
        <p className="text-sm text-slate-200 sm:text-base">{speech.translation}</p>
      )}
      <p className="ml-auto text-sm font-semibold tabular-nums text-slate-200 sm:text-base">
        {Math.round(speech.confidence * 100)}%
      </p>
    </div>
  );
}
