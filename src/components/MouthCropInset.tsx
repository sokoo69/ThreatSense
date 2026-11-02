'use client';

import React from 'react';
import { useThreatStore } from '../store/useThreatStore';

export const MouthCropInset: React.FC = () => {
  const { currentLipReading, currentThreat } = useThreatStore();
  const A_vol = currentLipReading.A_vol;
  const isSpeaking = currentLipReading.speaking;
  const isMasking = currentThreat.isMaskingDetected;

  // Lip height calculation based on A_vol
  const ry = Math.max(3, 14 * A_vol);

  return (
    <div className="w-[110px] h-[84px] p-1.5 rounded bg-black/75 backdrop-blur-md border border-white/10 flex flex-col justify-between font-mono text-[9px] text-zinc-400 select-none pointer-events-none">
      <div className="flex justify-between items-center text-[8px] text-zinc-500 uppercase">
        <span className="truncate">MOUTH ROI</span>
        <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      </div>

      {/* Magnified Mouth Landmark Simulation */}
      <div className="relative w-full h-[46px] bg-zinc-950/80 rounded border border-white/5 flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 50">
          {/* Subtle Mouth Box Guide */}
          <rect x="15" y="6" width="70" height="38" stroke="#27272a" strokeWidth="1" fill="none" strokeDasharray="2 2" />

          {/* Lip Wireframe Mesh */}
          <ellipse
            cx="50"
            cy="25"
            rx="24"
            ry={ry}
            fill="none"
            stroke={isMasking ? '#f472b6' : '#818cf8'}
            strokeWidth="1.5"
          />

          {/* Key Viseme Landmarks */}
          <circle cx="26" cy="25" r="1.5" fill="#a5b4fc" />
          <circle cx="74" cy="25" r="1.5" fill="#a5b4fc" />
          <circle cx="50" cy={25 - ry} r="1.5" fill="#a5b4fc" />
          <circle cx="50" cy={25 + ry} r="1.5" fill="#a5b4fc" />
        </svg>

        <span className="absolute bottom-0.5 right-1 text-[7px] text-zinc-500">LipBengal</span>
      </div>

      <div className="flex justify-between items-center text-[8px] text-zinc-400">
        <span>A_vol: {A_vol.toFixed(2)}</span>
        <span className={isSpeaking ? 'text-emerald-400' : 'text-zinc-500'}>
          {isSpeaking ? 'active' : 'silent'}
        </span>
      </div>
    </div>
  );
};
