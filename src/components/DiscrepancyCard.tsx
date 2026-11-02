'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ShieldAlert, GitCommit, HelpCircle, ArrowRight } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';

export const DiscrepancyCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentThreat, settings } = useThreatStore();

  const isMasking = currentThreat.isMaskingDetected;
  const D_cross = currentThreat.D_cross;
  const threshold = settings.maskingThreshold;
  const pct = Math.min(100, Math.round(D_cross * 100));

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 ${
        isMasking
          ? 'soc-card-active-masking border-fuchsia-500/70 shadow-[0_0_35px_rgba(217,70,239,0.35)]'
          : 'soc-card'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Header & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`p-1.5 rounded-lg border ${
                isMasking
                  ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.6)]'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}
            >
              <GitCommit className="w-4 h-4" />
            </div>

            <h3 className="font-bold text-sm sm:text-base text-slate-100">
              {t('discrepancy.title')}
            </h3>

            {isMasking ? (
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.6)] animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('discrepancy.maskingAlert')}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono border border-slate-700">
                {t('discrepancy.normal')}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            {isMasking ? (
              <span className="text-fuchsia-300 font-medium font-bengali">
                {currentThreat.maskingReason || t('discrepancy.explanation')}
              </span>
            ) : (
              t('discrepancy.subtitle')
            )}
          </p>
        </div>

        {/* Live Discrepancy Metric & Threshold Meter */}
        <div className="flex items-center gap-5 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Score (D_cross)
            </span>
            <div
              className={`font-mono text-2xl sm:text-3xl font-extrabold ${
                isMasking ? 'text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'text-cyan-400'
              }`}
            >
              {D_cross.toFixed(3)}
            </div>
          </div>

          {/* Vertical/Horizontal Gauge */}
          <div className="w-36 sm:w-44 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.00</span>
              <span className="text-fuchsia-400 font-bold">
                Threshold: {threshold.toFixed(2)}
              </span>
              <span>1.00</span>
            </div>

            <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              {/* Dynamic Fill */}
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isMasking
                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_12px_rgba(217,70,239,0.8)]'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-400'
                }`}
                style={{ width: `${pct}%` }}
              />

              {/* Threshold Marker Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-fuchsia-400 shadow-[0_0_6px_rgba(217,70,239,1)] z-10"
                style={{ left: `${Math.round(threshold * 100)}%` }}
                title={`Masking Trigger Threshold: ${threshold}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Breakdown Callout */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">FORMULA:</span>
          <span className="text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            D_cross = max(0, T_lip - R_e) &times; M_mask
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:inline" />
          <span className="text-slate-400 hidden sm:inline">
            T_lip({currentThreat.T_lip}) - R_e({currentThreat.R_e})
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Dominant Face: <strong className="text-slate-200">{currentThreat.dominantEmotion}</strong> ({Math.round(currentThreat.dominantEmotionProb * 100)}%)
        </div>
      </div>
    </div>
  );
};
