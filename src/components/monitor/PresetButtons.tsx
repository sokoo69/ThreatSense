'use client';

import { PRESETS } from '../../monitor/presets';
import { useMonitor } from '../../store/useMonitorStore';

export function PresetButtons() {
  const activePreset = useMonitor((state) => state.activePreset);
  const applyPreset = useMonitor((state) => state.applyPreset);
  const usesMockData = useMonitor((state) => state.usesMockData);

  if (!usesMockData) return null;

  return (
    <section aria-label="Quick demo presets">
      <h2 className="mb-2 text-sm font-medium text-slate-400">Quick Demo Presets</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {PRESETS.map((preset, index) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={activePreset === preset.id}
            onClick={() => applyPreset(preset.id)}
            className={`rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
              activePreset === preset.id
                ? 'border-slate-200 bg-slate-100 text-slate-950'
                : 'border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500'
            }`}
          >
            <span className="block text-sm font-semibold">
              {index + 1}. {preset.title}
            </span>
            <span
              className={`block text-xs ${activePreset === preset.id ? 'text-slate-700' : 'text-slate-400'}`}
            >
              {preset.face} + {preset.word}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
