'use client';

import React from 'react';
import { useThreatStore } from '../store/useThreatStore';

export const InVideoFaceHUD: React.FC = () => {
  const {
    smoothedEmotions,
    valence,
    arousal,
    intensity,
    ambiguityLabel,
    isAmbiguous,
    confidenceSparkline,
    statesWarmupLeft,
    topBlendshapes,
  } = useThreatStore();

  // Top 3 emotions
  const sortedEmotions = Object.entries(smoothedEmotions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Tiny sparkline polyline coordinates (60px wide, 12px high)
  const sparkPoints = confidenceSparkline
    .map((val, idx) => {
      const x = (idx / Math.max(1, confidenceSparkline.length - 1)) * 65;
      const y = 14 - val * 12;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="hud-panel p-2.5 w-[164px] sm:w-[172px] space-y-2 select-none shadow-xl border border-white/10">
      {/* 1. Header line in amber */}
      <div className="text-[10px] font-mono font-medium text-amber-400 truncate border-b border-white/10 pb-1">
        {ambiguityLabel || 'analyzing...'}
      </div>

      {/* 2. Top 3 emotions: name, small bar, percent right-aligned */}
      <div className="space-y-1">
        {sortedEmotions.map(([name, prob]) => {
          const pct = Math.round(prob * 100);
          return (
            <div key={name} className="flex items-center justify-between gap-1.5 text-[9.5px]">
              <span className="capitalize text-zinc-300 w-11 truncate">{name}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-indigo-400 transition-all duration-200"
                  style={{
                    width: `${pct}%`,
                    opacity: Math.max(0.25, prob),
                  }}
                />
              </div>
              <span className="text-zinc-200 font-bold w-7 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* 3. Valence / Arousal values */}
      <div className="flex justify-between items-center text-[10px] text-zinc-300 pt-1 border-t border-white/5">
        <span>
          v <strong className="text-zinc-100">{valence >= 0 ? `+${valence.toFixed(2)}` : valence.toFixed(2)}</strong>
        </span>
        <span>
          a <strong className="text-zinc-100">{arousal >= 0 ? `+${arousal.toFixed(2)}` : arousal.toFixed(2)}</strong>
        </span>
      </div>

      {/* 4. INTENSITY mini bar with percent */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[9px] text-zinc-400">
          <span>INTENSITY</span>
          <span className="text-zinc-200 font-bold">{Math.round(intensity * 100)}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-sm overflow-hidden">
          <div
            className="h-full bg-amber-400/80 transition-all duration-200"
            style={{ width: `${Math.round(intensity * 100)}%` }}
          />
        </div>
      </div>

      {/* 5. Tiny sparkline of top-1 confidence over last ~6s */}
      <div className="flex items-center justify-between text-[8.5px] text-zinc-400 pt-0.5">
        <span>CONF ~6s</span>
        <svg className="w-[65px] h-[14px] overflow-visible">
          <polyline
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.2"
            points={sparkPoints}
          />
        </svg>
      </div>

      {/* 6. STATES warming up · Xs left line */}
      <div className="text-[9px] text-zinc-400 border-t border-white/5 pt-1 truncate">
        {statesWarmupLeft > 0 ? (
          <span className="text-amber-400/90">STATES warming up · {statesWarmupLeft}s left</span>
        ) : (
          <span className="text-emerald-400/90">STATES ready · continuous</span>
        )}
      </div>

      {/* 7. ACTIVE top-3 blendshapes with values */}
      <div className="space-y-0.5 pt-0.5">
        <div className="text-[8px] text-zinc-500 uppercase tracking-wider">ACTIVE BLENDSHAPES</div>
        {topBlendshapes.map((b) => (
          <div key={b.name} className="flex justify-between text-[8.5px] text-zinc-400">
            <span className="truncate max-w-[100px] text-zinc-300">{b.name}</span>
            <span className="text-indigo-300 font-bold">{b.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
