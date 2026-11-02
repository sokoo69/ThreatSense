'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldAlert, Sparkles, X, ChevronRight } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';

export const AlertBanner: React.FC = () => {
  const { t } = useTranslation();
  const { currentThreat, activeScenarioId, setActiveScenario } = useThreatStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // Re-display if state changes
  const isMasking = currentThreat.isMaskingDetected;
  const isHighThreat = currentThreat.threatBand === 'high';

  if (isDismissed || (!isMasking && !isHighThreat)) {
    return null;
  }

  if (isMasking) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-950/90 via-purple-950/90 to-fuchsia-950/90 border-y border-fuchsia-500/50 px-4 py-3 shadow-[0_0_35px_rgba(217,70,239,0.35)] animate-pulse-glow z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.5)] animate-bounce">
              <Sparkles className="w-5 h-5 text-fuchsia-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-fuchsia-900 border border-fuchsia-400 text-fuchsia-200 uppercase tracking-wider">
                  {t('discrepancy.maskingAlert')}
                </span>
                <span className="text-xs font-mono text-fuchsia-300">
                  D_cross: <strong className="text-white">{currentThreat.D_cross}</strong> &ge; 0.40
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900/80 text-fuchsia-300 border border-fuchsia-500/30">
                  Floor Elevated: &ge;40%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 font-bengali">
                {currentThreat.maskingReason || t('discrepancy.explanation')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <span className="text-[11px] text-fuchsia-300/80 font-mono hidden sm:inline">
              LipBengal &bull; Dual-Stream Deception Isolation
            </span>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-fuchsia-900/40 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // High Threat Alert (Rose/Red)
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-rose-950/90 via-red-950/90 to-rose-950/90 border-y border-rose-500/50 px-4 py-3 shadow-[0_0_35px_rgba(244,63,94,0.35)] z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-900 border border-rose-400 text-rose-100 uppercase tracking-wider">
                {t('threatScore.high')} ({currentThreat.threatPercent}%)
              </span>
              <span className="text-xs text-rose-300 font-mono">
                R_e: {currentThreat.R_e} | T_lip: {currentThreat.T_lip}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Elevated hostility detected across surveillance streams. Operator review required.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-rose-900/40 transition-colors"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
