'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Shield, AlertTriangle, Cpu, Terminal } from 'lucide-react';
import { useThreatStore, HistoryLogEntry } from '../store/useThreatStore';
import { THREAT_BANDS } from '../data/defaultSettings';

export const DetailDrawer: React.FC = () => {
  const { t } = useTranslation();
  const { selectedLogEntry, setSelectedLogEntry, settings } = useThreatStore();

  if (!selectedLogEntry) return null;

  const res = selectedLogEntry.result;
  const isMasking = res.isMaskingDetected;
  const bandKey = (res.threatBand || 'low') as 'low' | 'medium' | 'high';
  const bandInfo = isMasking ? THREAT_BANDS.masking : THREAT_BANDS[bandKey];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${bandInfo.bg} ${bandInfo.border}`}>
              <Shield className={`w-5 h-5 ${bandInfo.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">Telemetry Frame Trace</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${bandInfo.bg} ${bandInfo.text} border ${bandInfo.border}`}>
                  {isMasking ? 'MASKING DETECTED' : res.threatBand}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                {new Date(res.timestamp).toLocaleString()} &bull; ID: {selectedLogEntry.id}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedLogEntry(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 space-y-6 text-xs text-slate-300">
          {/* Threat Metric Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px]">THREAT %</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{res.threatPercent}%</div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px]">R_e (FACE)</span>
              <div className="text-xl font-bold text-cyan-400 mt-1">{res.R_e}</div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px]">T_lip (LIPS)</span>
              <div className="text-xl font-bold text-teal-400 mt-1">{res.T_lip}</div>
            </div>
            <div className={`p-3 rounded-xl border ${isMasking ? 'bg-fuchsia-950/60 border-fuchsia-500/60' : 'bg-slate-950/80 border-slate-800'}`}>
              <span className="text-slate-500 text-[10px]">D_cross</span>
              <div className={`text-xl font-bold mt-1 ${isMasking ? 'text-fuchsia-400' : 'text-purple-400'}`}>
                {res.D_cross}
              </div>
            </div>
          </div>

          {/* Masking Incident Card */}
          {isMasking && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-950/70 to-purple-950/70 border border-fuchsia-500/50 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-fuchsia-300 font-bold">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <span>AFFECTIVE MASKING AUDIT VERIFICATION</span>
              </div>
              <p className="text-slate-200 font-bengali text-sm leading-relaxed">
                {res.maskingReason}
              </p>
              <div className="text-[11px] font-mono text-fuchsia-300/80 pt-1 border-t border-fuchsia-800/60">
                Rule triggered: D_cross ({res.D_cross}) &ge; {settings.maskingThreshold} AND Dominant Face &in; &#123;neutral, happy&#125;.
              </div>
            </div>
          )}

          {/* Bengali Transcript & Transliteration */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
              Stream B: Bengali Utterance
            </span>
            <div className="text-lg font-bengali text-slate-100 leading-relaxed">
              {selectedLogEntry.transcript_bn}
            </div>
            <div className="text-xs font-mono text-slate-400 italic pt-1 border-t border-slate-800/80">
              Romanized: &ldquo;{selectedLogEntry.romanized}&rdquo;
            </div>
          </div>

          {/* Detected Threat Words */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
              <span>DETECTED LEXICON TOKENS ({res.detectedThreatWords.length})</span>
              <span className="text-slate-500">Weight &theta;_W</span>
            </div>

            {res.detectedThreatWords.length > 0 ? (
              <div className="space-y-1.5">
                {res.detectedThreatWords.map((word, i) => (
                  <div
                    key={`${word.word}-${i}`}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-bengali text-sm font-bold text-rose-300">
                        {word.word}
                      </span>
                      <span className="text-slate-400 text-[11px]">({word.romanized})</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300">
                        {word.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-rose-400 font-bold">&theta;_W = {word.weight}</span>
                      <span className="text-slate-500 text-[10px] ml-2">
                        conf: {Math.round(word.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-500 italic font-mono">
                No hostile lexicon tokens detected in this window.
              </div>
            )}
          </div>

          {/* Raw Face Emotion Vector */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] text-slate-400 uppercase">
              Stream A: Probability Distribution Vector
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {Object.entries(res.smoothedEmotions).map(([emotion, prob]) => {
                const isDominant = emotion === res.dominantEmotion;
                return (
                  <div
                    key={emotion}
                    className={`p-2 rounded-lg border ${
                      isDominant
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="capitalize text-[10px]">{emotion}</div>
                    <div className="font-bold text-sm mt-0.5">{Math.round((prob as number) * 100)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mathematical Thesis Derivation Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold border-b border-slate-800 pb-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>THESIS FORMULATION EVALUATION</span>
            </div>
            <div className="space-y-1 text-slate-400">
              <div>&bull; R_e = &Sigma; P(e) &times; w_e = <span className="text-cyan-300">{res.R_e}</span></div>
              <div>&bull; T_lip = clip(&Sigma;(&theta;_W &times; conf) &times; g(A_vol)) = <span className="text-teal-300">{res.T_lip}</span></div>
              <div>&bull; D_cross = max(0, T_lip - R_e) &times; M_mask = <span className="text-fuchsia-300">{res.D_cross}</span></div>
              <div>&bull; Fusion = {settings.alpha}&times;R_e + {settings.beta}&times;T_lip + {settings.gamma}&times;D_cross = <span className="text-rose-300">{res.rawThreatScore}</span></div>
              <div>&bull; Final Threat Score = <span className="text-white font-bold">{res.threatPercent}%</span> ({res.threatBand.toUpperCase()})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
