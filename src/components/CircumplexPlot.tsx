'use client';

import React from 'react';
import { useThreatStore } from '../store/useThreatStore';

export const CircumplexPlot: React.FC = () => {
  const { valence, arousal, circumplexTrail } = useThreatStore();

  // Convert valence [-1, 1] and arousal [-1, 1] to 100x100 SVG coordinates
  // (0,0) center is at (50, 50)
  const mapCoord = (v: number, a: number) => {
    const x = 50 + v * 40;
    const y = 50 - a * 40; // SVG Y-axis is inverted
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const current = mapCoord(valence, arousal);

  return (
    <div className="w-[104px] h-[104px] p-1 rounded bg-black/75 backdrop-blur-md border border-white/10 flex flex-col justify-between font-mono text-[9px] text-zinc-400 select-none pointer-events-none">
      <div className="flex justify-between items-center px-1 text-[8px] text-zinc-500 uppercase">
        <span>V / A Circumplex</span>
        <span className="text-zinc-300 font-bold">2s</span>
      </div>

      <div className="relative w-full h-[80px]">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Subtle Axes */}
          <line x1="50" y1="5" x2="50" y2="95" stroke="#333338" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#333338" strokeWidth="1" strokeDasharray="2 2" />

          {/* Center Zero Marker */}
          <circle cx="50" cy="50" r="1.5" fill="#52525b" />

          {/* Trail Points */}
          {circumplexTrail.map((point, index) => {
            const { x, y } = mapCoord(point.valence, point.arousal);
            const opacity = 0.2 + (index / circumplexTrail.length) * 0.6;
            return (
              <circle
                key={`${point.timestamp}-${index}`}
                cx={x}
                cy={y}
                r="1.8"
                fill="#5b5bd6"
                opacity={opacity}
              />
            );
          })}

          {/* Current Live Head Point */}
          <circle cx={current.x} cy={current.y} r="3.5" fill="#818cf8" />
          <circle cx={current.x} cy={current.y} r="6" stroke="#818cf8" strokeWidth="1" fill="none" opacity="0.6" />
        </svg>

        {/* Axis Labels */}
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] text-zinc-600">-v</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-zinc-600">+v</span>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[7px] text-zinc-600">+a</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[7px] text-zinc-600">-a</span>
      </div>
    </div>
  );
};
