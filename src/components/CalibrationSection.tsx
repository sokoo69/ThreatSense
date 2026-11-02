'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Check, Shield } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';
import { EmotionType } from '../engine/types';

export const CalibrationSection: React.FC = () => {
  const {
    personalTemplates,
    calibratePersonalEmotion,
    clearPersonalTemplates,
    rememberTemplates,
    setRememberTemplates,
  } = useThreatStore();

  const [activeCalibrating, setActiveCalibrating] = useState<EmotionType | null>(null);
  const [countdown, setCountdown] = useState(3);

  const emotions: EmotionType[] = ['angry', 'neutral', 'disgust', 'sad', 'happy', 'fear', 'surprise'];

  const handleHold3s = (emotion: EmotionType) => {
    setActiveCalibrating(emotion);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          calibratePersonalEmotion(emotion);
          setActiveCalibrating(null);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <details className="group rounded-[10px] bg-[#121214] border border-[#27272a] p-4 text-xs font-mono transition-all">
      <summary className="cursor-pointer font-medium text-zinc-300 hover:text-white flex items-center justify-between select-none">
        <span className="flex items-center gap-2">
          <span className="text-[#5b5bd6] group-open:rotate-90 transition-transform inline-block">
            &#9656;
          </span>
          <span>Personal emotion calibration (advanced)</span>
        </span>
        <span className="text-[10px] text-zinc-500">
          {Object.keys(personalTemplates).length} calibrated
        </span>
      </summary>

      <div className="mt-4 pt-3 border-t border-white/5 space-y-4">
        {/* Experimental Warning */}
        <div className="bg-amber-950/40 border border-amber-600/30 rounded-lg p-3 text-amber-200/90 text-[11px] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Experimental:</strong> Subject-specific calibration overrides standard blendshape and probability baselines. Use this if your natural resting face or micro-expressions diverge noticeably from standard models.
          </p>
        </div>

        {/* Per-emotion "hold 3 s" buttons */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-400 uppercase">Per-Emotion Templates (Hold 3s)</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {emotions.map((emotion) => {
              const isSaved = Boolean(personalTemplates[emotion]);
              const isHolding = activeCalibrating === emotion;

              return (
                <button
                  key={emotion}
                  onClick={() => handleHold3s(emotion)}
                  disabled={activeCalibrating !== null}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    isHolding
                      ? 'bg-indigo-950/80 border-[#5b5bd6] text-white animate-pulse'
                      : isSaved
                      ? 'bg-[#18181b] border-emerald-500/30 text-zinc-200'
                      : 'bg-[#18181b] border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="capitalize font-bold text-xs">{emotion}</div>
                    <div className="text-[9px] text-zinc-500">
                      {isHolding ? `Hold... ${countdown}s` : isSaved ? 'Calibrated' : 'Hold 3s'}
                    </div>
                  </div>
                  {isSaved && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls: Opt-in Checkbox & Clear Stored Data */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200 select-none">
            <input
              type="checkbox"
              checked={rememberTemplates}
              onChange={(e) => setRememberTemplates(e.target.checked)}
              className="rounded accent-[#5b5bd6] h-3.5 w-3.5"
            />
            <span className="text-[11px]">Remember my templates on this device (localStorage)</span>
          </label>

          <button
            onClick={clearPersonalTemplates}
            className="btn-control px-2.5 py-1 text-[11px] text-zinc-400 hover:text-rose-300 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear stored data</span>
          </button>
        </div>
      </div>
    </details>
  );
};
