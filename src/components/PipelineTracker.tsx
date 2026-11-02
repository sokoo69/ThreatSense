'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Smile, MessageSquare, GitFork, Cpu, ShieldCheck } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';

export const PipelineTracker: React.FC = () => {
  const { t } = useTranslation();
  const { isStreaming, currentThreat } = useThreatStore();

  const isMasking = currentThreat.isMaskingDetected;

  return (
    <div className="soc-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-100">{t('pipeline.title')}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            SYNCHRONOUS PARALLEL EXECUTION
          </span>
        </div>
      </div>

      {/* Interactive Architecture Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-xs font-mono">
        {/* Node 1: Camera Input */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center relative">
          <Camera className="w-5 h-5 text-slate-300 mb-1" />
          <span className="font-bold text-slate-200">Surveillance Frame</span>
          <span className="text-[10px] text-slate-500">1280x720 @ 30fps</span>
          <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
            DUAL SPLIT
          </div>
        </div>

        {/* Node 2: Stream A & B Split */}
        <div className="space-y-2 md:col-span-2">
          {/* Stream A Box */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold text-cyan-300">Stream A: Face CNN</div>
                <div className="text-[10px] text-slate-400">P(e) &rarr; R_e = {currentThreat.R_e}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          {/* Stream B Box */}
          <div className="bg-slate-900/90 border border-teal-500/30 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <div>
                <div className="font-bold text-teal-300">Stream B: LipBengal</div>
                <div className="text-[10px] text-slate-400">&theta;_W, A_vol &rarr; T_lip = {currentThreat.T_lip}</div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          </div>
        </div>

        {/* Node 3: Discrepancy & Fusion */}
        <div
          className={`border rounded-xl p-3 flex flex-col items-center text-center transition-all ${
            isMasking
              ? 'bg-fuchsia-950/60 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.4)]'
              : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}
        >
          <GitFork className={`w-5 h-5 mb-1 ${isMasking ? 'text-fuchsia-400' : 'text-purple-400'}`} />
          <span className="font-bold">D_cross Fusion</span>
          <span className="text-[10px] text-slate-400">
            D_cross: <strong>{currentThreat.D_cross}</strong>
          </span>
          <div
            className={`mt-2 text-[9px] px-1.5 py-0.5 rounded font-bold ${
              isMasking
                ? 'bg-fuchsia-900 text-fuchsia-200 border border-fuchsia-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isMasking ? 'MASKING ACTIVE' : 'CONGRUENT'}
          </div>
        </div>

        {/* Node 4: Final Output Dispatch */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="font-bold text-slate-200">Alert Dispatch</span>
          <span className="text-[10px] text-slate-400">
            Band: <strong className="text-white">{currentThreat.threatBand.toUpperCase()}</strong> ({currentThreat.threatPercent}%)
          </span>
          <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            SOC MONITOR
          </div>
        </div>
      </div>
    </div>
  );
};
