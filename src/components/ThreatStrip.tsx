'use client';

import React from 'react';
import { useThreatStore } from '../store/useThreatStore';

export const ThreatStrip: React.FC = () => {
  const { currentThreat, threatSparkline, reSparkline, tlipSparkline, dcrossSparkline } =
    useThreatStore();

  const isMasking = currentThreat.isMaskingDetected;
  const threatScore = currentThreat.threatPercent;
  const threatBand = currentThreat.threatBand;

  // Band chip color coding
  const bandBadgeClass = isMasking
    ? 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/60 shadow-[0_0_10px_rgba(217,70,239,0.4)]'
    : threatBand === 'high'
    ? 'bg-rose-950/80 text-rose-300 border-rose-500/60'
    : threatBand === 'medium'
    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60';

  const bandLabel = isMasking
    ? 'MASKING'
    : threatBand.toUpperCase();

  // Helper for generating sparkline SVG points
  const renderSparkline = (values: number[], maxVal = 1.0, strokeColor = '#818cf8') => {
    if (!values || values.length < 2) return null;
    const w = 48;
    const h = 18;
    const points = values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * w;
        const normalized = Math.min(1, Math.max(0, val / maxVal));
        const y = h - normalized * (h - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-[48px] h-[18px] overflow-visible">
        <polyline fill="none" stroke={strokeColor} strokeWidth="1.3" points={points} />
      </svg>
    );
  };

  return (
    <div className="rounded-[10px] bg-[#141416] border border-[#27272a] p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
        <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold">
          THREAT ASSESSMENT STRIP
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          Composite Fusion &bull; &alpha;=0.25 &beta;=0.50 &gamma;=0.25
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center font-mono">
        {/* Item 1: Big Threat % number with band chip */}
        <div className="flex items-center gap-3">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {threatScore}%
          </div>
          <div className="space-y-1">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${bandBadgeClass}`}
            >
              {bandLabel}
            </span>
            <div className="text-[9px] text-zinc-500 truncate">COMPOSITE</div>
          </div>
        </div>

        {/* Item 2: Small gauge R_e (Emotion Risk) + sparkline */}
        <div className="bg-[#0e0e0f] rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[9px] text-zinc-400 uppercase">R_e (FACE)</div>
            <div className="text-base font-bold text-indigo-400 mt-0.5">
              {currentThreat.R_e.toFixed(2)}
            </div>
          </div>
          <div>{renderSparkline(reSparkline, 1.0, '#818cf8')}</div>
        </div>

        {/* Item 3: Small gauge T_lip (Lip Threat) + sparkline */}
        <div className="bg-[#0e0e0f] rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[9px] text-zinc-400 uppercase">T_lip (LIPS)</div>
            <div className="text-base font-bold text-teal-400 mt-0.5">
              {currentThreat.T_lip.toFixed(2)}
            </div>
          </div>
          <div>{renderSparkline(tlipSparkline, 1.0, '#2dd4bf')}</div>
        </div>

        {/* Item 4: Small gauge D_cross (Cross-Modal Discrepancy) + sparkline */}
        <div
          className={`rounded-lg p-2.5 border flex items-center justify-between transition-colors ${
            isMasking
              ? 'bg-fuchsia-950/40 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]'
              : 'bg-[#0e0e0f] border-white/5'
          }`}
        >
          <div>
            <div className={`text-[9px] uppercase ${isMasking ? 'text-fuchsia-300 font-bold' : 'text-zinc-400'}`}>
              D_cross
            </div>
            <div
              className={`text-base font-bold mt-0.5 ${
                isMasking ? 'text-fuchsia-400' : 'text-purple-400'
              }`}
            >
              {currentThreat.D_cross.toFixed(2)}
            </div>
          </div>
          <div>
            {renderSparkline(dcrossSparkline, 1.0, isMasking ? '#e879f9' : '#c084fc')}
          </div>
        </div>
      </div>
    </div>
  );
};
