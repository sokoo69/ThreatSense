'use client';

import { useEffect } from 'react';
import { monitorStore } from '../../store/useMonitorStore';
import { ControlBar } from './ControlBar';
import { EmotionCard } from './EmotionCard';
import { IncidentLog } from './IncidentLog';
import { PresetButtons } from './PresetButtons';
import { SpeechCard } from './SpeechCard';
import { ThreatBanner } from './ThreatBanner';
import { VideoPanel } from './VideoPanel';

export function ThreatMonitor() {
  useEffect(() => monitorStore.getState().start(), []);

  return (
    <div className="monitor-root flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <ControlBar />

      <main className="flex flex-1 flex-col gap-4 p-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <VideoPanel />

          <section aria-label="Threat assessment" className="flex min-w-0 flex-col gap-3">
            <ThreatBanner />
            <div className="grid gap-3 sm:grid-cols-2">
              <EmotionCard />
              <SpeechCard />
            </div>
            <PresetButtons />
          </section>
        </div>

        <IncidentLog />
      </main>

      <footer className="px-4 pb-4 text-xs text-slate-400 lg:px-6">
        Decision support only. Detections can be wrong, so an operator must review every alert.
      </footer>
    </div>
  );
}
