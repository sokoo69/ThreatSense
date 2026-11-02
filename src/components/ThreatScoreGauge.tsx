'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';
import { THREAT_BANDS } from '../data/defaultSettings';

export const ThreatScoreGauge: React.FC = () => {
  const { t } = useTranslation();
  const { currentThreat, settings } = useThreatStore();

  const score = currentThreat.threatPercent;
  const isMasking = currentThreat.isMaskingDetected;
  const bandKey = currentThreat.threatBand;

  // Visual color determination
  const bandInfo = isMasking ? THREAT_BANDS.masking : THREAT_BANDS[bandKey];

  // SVG Circular progress math
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Normalized fusion weights
  const totalWeight = settings.alpha + settings.beta + settings.gamma;
  const normAlpha = totalWeight > 0 ? settings.alpha / totalWeight : 0.25;
  const normBeta = totalWeight > 0 ? settings.beta / totalWeight : 0.50;
  const normGamma = totalWeight > 0 ? settings.gamma / totalWeight : 0.25;

  const alphaContribution = Math.round(normAlpha * currentThreat.R_e * 100);
  const betaContribution = Math.round(normBeta * currentThreat.T_lip * 100);
  const gammaContribution = Math.round(normGamma * currentThreat.D_cross * 100);

  return (
    <div className="soc-card rounded-2xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-100">{t('threatScore.title')}</h3>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
            isMasking
              ? 'bg-fuchsia-950/80 border-fuchsia-500 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
              : `${bandInfo.bg} ${bandInfo.text} ${bandInfo.border}`
          }`}
        >
          {isMasking ? 'MASKING ELEVATED' : t(`threatScore.${bandKey}`)}
        </span>
      </div>

      {/* Circular Gauge Centerpiece */}
      <div className="my-5 flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="w-44 h-44 transform -rotate-90">
            {/* Background Circle Track */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="rgba(30, 41, 59, 0.6)"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke={bandInfo.color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
              style={{
                filter: isMasking
                  ? 'drop-shadow(0 0 10px rgba(217,70,239,0.8))'
                  : `drop-shadow(0 0 8px ${bandInfo.color}66)`,
              }}
            />
          </svg>

          {/* Centered Threat % Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight ${
                isMasking ? 'text-fuchsia-300' : bandInfo.text
              }`}
            >
              {score}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
              {t('threatScore.gaugeLabel')}
            </span>
          </div>
        </div>

        {/* Contribution Breakdown */}
        <div className="w-full sm:w-56 space-y-2.5">
          <div className="text-xs font-mono text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
            <span>{t('threatScore.breakdown')}</span>
            <span className="text-slate-500">Weight</span>
          </div>

          {/* Emotion Risk Contribution: alpha * R_e */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-400">&alpha; &bull; R_e (Face)</span>
              <span className="text-slate-200 font-bold">+{alphaContribution}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (alphaContribution / 100) * 100 * 2)}%` }}
              />
            </div>
          </div>

          {/* Lip Threat Contribution: beta * T_lip */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-teal-400">&beta; &bull; T_lip (Lips)</span>
              <span className="text-slate-200 font-bold">+{betaContribution}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (betaContribution / 100) * 100 * 2)}%` }}
              />
            </div>
          </div>

          {/* Cross-Modal Discrepancy: gamma * D_cross */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className={isMasking ? 'text-fuchsia-400 font-bold' : 'text-purple-400'}>
                &gamma; &bull; D_cross (Masking)
              </span>
              <span className="text-slate-200 font-bold">+{gammaContribution}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isMasking ? 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'bg-purple-400'
                }`}
                style={{ width: `${Math.min(100, (gammaContribution / 100) * 100 * 2)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div>
          BANDS: <span className="text-emerald-400">0-30 Low</span> &bull;{' '}
          <span className="text-amber-400">31-65 Med</span> &bull;{' '}
          <span className="text-rose-400">66-100 High</span>
        </div>
        {isMasking && (
          <div className="text-fuchsia-300 font-medium">
            &bull; {t('threatScore.elevatedFloor')}
          </div>
        )}
      </div>
    </div>
  );
};
