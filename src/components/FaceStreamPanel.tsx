'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Smile, Info, ShieldAlert } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';
import { EmotionType } from '../engine/types';

export const FaceStreamPanel: React.FC = () => {
  const { t } = useTranslation();
  const { smoothedEmotions, currentThreat, settings } = useThreatStore();

  const emotionsList: {
    key: EmotionType;
    label: string;
    color: string;
    barColor: string;
    bgTrack: string;
  }[] = [
    { key: 'angry', label: t('emotions.angry'), color: 'text-rose-400', barColor: 'bg-rose-500', bgTrack: 'bg-rose-950/40' },
    { key: 'fear', label: t('emotions.fear'), color: 'text-purple-400', barColor: 'bg-purple-500', bgTrack: 'bg-purple-950/40' },
    { key: 'disgust', label: t('emotions.disgust'), color: 'text-amber-400', barColor: 'bg-amber-500', bgTrack: 'bg-amber-950/40' },
    { key: 'sad', label: t('emotions.sad'), color: 'text-blue-400', barColor: 'bg-blue-500', bgTrack: 'bg-blue-950/40' },
    { key: 'neutral', label: t('emotions.neutral'), color: 'text-slate-300', barColor: 'bg-slate-400', bgTrack: 'bg-slate-900/60' },
    { key: 'happy', label: t('emotions.happy'), color: 'text-emerald-400', barColor: 'bg-emerald-500', bgTrack: 'bg-emerald-950/40' },
  ];

  return (
    <div className="soc-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Smile className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>{t('streams.streamA')}</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Continuous probability distribution (CNN / ViT)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Emotion Risk R_e</span>
            <div className="font-mono text-lg font-bold text-cyan-400">
              {currentThreat.R_e.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Emotion Distribution Bars */}
        <div className="mt-4 space-y-3">
          {emotionsList.map(({ key, label, color, barColor, bgTrack }) => {
            const prob = smoothedEmotions[key] ?? 0;
            const pct = Math.round(prob * 100);
            const baseline = settings.emotionBaselines[key] ?? 0;
            const baselinePct = Math.round(baseline * 100);
            const riskWeight = settings.emotionWeights[key] ?? 0;
            const isDominant = currentThreat.dominantEmotion === key;

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${color} ${isDominant ? 'font-bold' : ''}`}>
                      {label}
                    </span>
                    {isDominant && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700/60 text-[9px] font-mono text-cyan-300 font-semibold">
                        DOMINANT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[10px] text-slate-500">
                      w={riskWeight.toFixed(1)}
                    </span>
                    <span className="font-bold text-slate-200 min-w-[36px] text-right">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar with baseline marker */}
                <div className={`relative h-2 w-full rounded-full overflow-hidden ${bgTrack} border border-slate-800/80`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                  {/* Benign Baseline Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-cyan-300/80 z-10 shadow-sm"
                    style={{ left: `${baselinePct}%` }}
                    title={`Benign Baseline: ${baselinePct}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-0.5 bg-cyan-300" />
          <span>{t('streams.baselineMarker')}</span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Sliding window N={settings.smoothingWindowSize}
        </div>
      </div>
    </div>
  );
};
