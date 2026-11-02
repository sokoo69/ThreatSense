'use client';

import React from 'react';
import { useThreatStore } from '../store/useThreatStore';
import { WordTooltip } from './WordTooltip';

export const InVideoLipHUD: React.FC = () => {
  const { currentLipReading, currentThreat, lexicon } = useThreatStore();
  const lexiconMap = new Map(lexicon.map((e) => [e.word.trim(), e]));
  const tokens = currentLipReading.transcript_bn.split(' ').filter(Boolean);

  return (
    <div className="hud-panel p-2.5 w-[220px] sm:w-[260px] space-y-1.5 select-none shadow-xl border border-white/10">
      {/* Header: "LIP · BN" + speaking dot */}
      <div className="flex justify-between items-center text-[10px] border-b border-white/10 pb-1">
        <div className="flex items-center gap-1.5 font-bold text-zinc-200">
          <span className="text-indigo-400">LIP &bull; BN</span>
          <span className="text-[9px] text-zinc-500 font-normal">LipBengal 3D</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentLipReading.speaking ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
            }`}
          />
          <span className={currentLipReading.speaking ? 'text-emerald-400' : 'text-zinc-500'}>
            {currentLipReading.speaking ? 'speaking' : 'silent'}
          </span>
        </div>
      </div>

      {/* Live Bengali Transcript with Threat Word Highlighting */}
      <div className="font-bengali text-xs sm:text-[13px] text-zinc-100 leading-normal min-h-[1.7rem] py-0.5">
        {tokens.map((token, idx) => {
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

      {/* Romanized Line */}
      <div className="text-[9.5px] text-zinc-400 italic truncate font-mono">
        &ldquo;{currentLipReading.romanized}&rdquo;
      </div>

      {/* A_vol Mini Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[9px]">
        <span className="text-zinc-500 uppercase">A_vol</span>
        <div className="flex-1 h-1 bg-zinc-800 rounded-sm overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-150"
            style={{ width: `${Math.round(currentLipReading.A_vol * 100)}%` }}
          />
        </div>
        <span className="text-zinc-300 font-bold">{currentLipReading.A_vol.toFixed(2)}</span>
      </div>
    </div>
  );
};
