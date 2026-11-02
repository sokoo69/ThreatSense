'use client';

import React, { useState } from 'react';
import { ThreatWordMatch } from '../engine/types';

interface WordTooltipProps {
  word: string;
  match?: ThreatWordMatch;
  confidence?: number;
}

export const WordTooltip: React.FC<WordTooltipProps> = ({ word, match, confidence }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!match) {
    // Normal word in transcript
    return <span className="text-slate-300 hover:text-white transition-colors">{word} </span>;
  }

  // Weight-based color coding
  const isLethal = match.weight >= 0.85;
  const isMedium = match.weight >= 0.65;

  const badgeColor = isLethal
    ? 'bg-rose-500/25 border-rose-500/50 text-rose-300 hover:border-rose-400'
    : isMedium
    ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 hover:border-amber-400'
    : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:border-yellow-400';

  return (
    <span
      className="relative inline-block mx-0.5 my-0.5"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span
        className={`px-1.5 py-0.5 rounded cursor-pointer border font-semibold font-bengali transition-all duration-150 shadow-sm ${badgeColor}`}
      >
        {word}
        <span className="ml-1 text-[10px] font-mono opacity-80">
          [{match.weight.toFixed(2)}]
        </span>
      </span>

      {/* Hover Tooltip Card */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-left text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-bold text-base font-bengali text-rose-300">
              {match.word}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-[10px] font-mono text-rose-300">
              &theta;_W = {match.weight}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Transliteration:</span>
              <span className="font-mono text-slate-200">{match.romanized}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="text-cyan-300 font-medium">{match.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model Conf:</span>
              <span className="font-mono text-emerald-400">
                {Math.round((confidence ?? match.confidence) * 100)}%
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
              Contribution: &theta;_W &times; conf = {(match.weight * (confidence ?? match.confidence)).toFixed(3)}
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
