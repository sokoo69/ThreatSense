'use client';

import { useMonitor } from '../../store/useMonitorStore';

export function EmotionCard() {
  const emotion = useMonitor((state) => state.assessment.emotion);
  const streamOn = useMonitor((state) => state.streams.face);
  const percent = emotion ? Math.round(emotion.confidence * 100) : 0;

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-medium text-slate-400">Facial Emotion</h2>

      {emotion ? (
        <>
          <p className="mt-2 text-3xl font-bold text-white">{emotion.label}</p>
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Emotion confidence"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${emotion.hostile ? 'bg-red-500' : 'bg-cyan-400'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums text-slate-200">{percent}%</span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-lg font-medium text-slate-400">
          {streamOn ? 'No face detected' : 'Stream off'}
        </p>
      )}
    </article>
  );
}
