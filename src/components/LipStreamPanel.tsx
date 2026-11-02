'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Mic, Volume2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';
import { WordTooltip } from './WordTooltip';

export const LipStreamPanel: React.FC = () => {
  const { t } = useTranslation();
  const { currentLipReading, currentThreat, lexicon } = useThreatStore();

  // Helper map for fast lexicon weight lookup
  const lexiconMap = new Map(lexicon.map((e) => [e.word.trim(), e]));

  // Words breakdown in transcript
  const transcriptTokens = currentLipReading.transcript_bn.split(' ').filter(Boolean);

  return (
    <div className="soc-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">{t('streams.streamB')}</h3>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-teal-400/90 font-mono font-semibold uppercase tracking-wider">
                &bull; NEVER GATED BY EMOTION
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Lip Threat T_lip</span>
            <div className={`font-mono text-lg font-bold ${
              currentThreat.T_lip > 0.6 ? 'text-rose-400' : currentThreat.T_lip > 0.2 ? 'text-amber-400' : 'text-teal-400'
            }`}>
              {currentThreat.T_lip.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Live Bengali Transcript Box */}
        <div className="mt-4 bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-teal-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              <span>LIVE BENGALI TRANSCRIPT (বাংলা হরফ)</span>
            </span>
            <span className="text-[10px] text-slate-500">LipBengal 3D-ResNet</span>
          </div>

          {/* Bengali text with interactive word highlighting */}
          <div className="text-base sm:text-lg font-bengali leading-relaxed text-slate-100 min-h-[3rem] py-1">
            {transcriptTokens.map((token, idx) => {
              // Clean punctuation for lexicon match
              const cleanToken = token.replace(/[।,!?]/g, '').trim();
              const match = currentThreat.detectedThreatWords.find((w) => w.word === cleanToken);
              const lexiconEntry = lexiconMap.get(cleanToken);

              return (
                <WordTooltip
                  key={`${token}-${idx}`}
                  word={token}
                  match={
                    match ||
                    (lexiconEntry
                      ? {
                          word: lexiconEntry.word,
                          romanized: lexiconEntry.romanized,
                          weight: lexiconEntry.weight,
                          category: lexiconEntry.category,
                          confidence: 0.9,
                        }
                      : undefined)
                  }
                />
              );
            })}
          </div>

          {/* Romanized Transliteration */}
          <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400 italic">
            <span className="text-slate-500 not-italic mr-1.5 text-[10px] uppercase font-bold">
              Romanized:
            </span>
            &ldquo;{currentLipReading.romanized}&rdquo;
          </div>
        </div>

        {/* Lip Movement Amplitude Meter (A_vol) & Speaking Detector */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
              <span>Mouth Amplitude (A_vol)</span>
              <span className="text-teal-300 font-bold">{currentLipReading.A_vol.toFixed(3)}</span>
            </div>
            {/* Audio VU style meter */}
            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
              <div
                className="h-full rounded-sm bg-gradient-to-r from-teal-500 via-cyan-400 to-rose-500 transition-all duration-150"
                style={{ width: `${Math.round(currentLipReading.A_vol * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                currentLipReading.speaking ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-mono text-slate-300">
                {currentLipReading.speaking ? t('streams.speaking') : t('streams.silent')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Mouth Motion ROI</span>
          </div>
        </div>
      </div>

      {/* Detected Threat Tokens List */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
          <span>{t('streams.threatWords')}:</span>
          <span className="text-slate-500">
            {currentThreat.detectedThreatWords.length} matched
          </span>
        </div>

        {currentThreat.detectedThreatWords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {currentThreat.detectedThreatWords.map((match, i) => (
              <span
                key={`${match.word}-${i}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/70 border border-rose-600/40 text-rose-300 text-xs font-bengali shadow-sm"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span className="font-bold">{match.word}</span>
                <span className="text-[10px] font-mono text-rose-400/90">
                  (&theta;_W={match.weight})
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic font-mono">
            {t('streams.noThreatWords')}
          </div>
        )}
      </div>
    </div>
  );
};
