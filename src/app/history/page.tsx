'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History as HistoryIcon,
  Download,
  Trash2,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { useThreatStore } from '../../store/useThreatStore';
import { exportLogsToCSV } from '../../utils/csvExport';
import { ThreatBand } from '../../engine/types';

export default function HistoryPage() {
  const { t } = useTranslation();
  const { historyLogs, clearHistory, setSelectedLogEntry } = useThreatStore();

  const [selectedBand, setSelectedBand] = useState<string>('ALL');
  const [maskingOnly, setMaskingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs
  const filteredLogs = historyLogs.filter((entry) => {
    const res = entry.result;
    if (selectedBand !== 'ALL' && res.threatBand !== selectedBand.toLowerCase()) {
      return false;
    }
    if (maskingOnly && !res.isMaskingDetected) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inBn = entry.transcript_bn.toLowerCase().includes(term);
      const inRom = entry.romanized.toLowerCase().includes(term);
      const inEmotion = res.dominantEmotion.toLowerCase().includes(term);
      if (!inBn && !inRom && !inEmotion) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="soc-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-cyan-400" />
              <span>{t('history.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('history.subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportLogsToCSV(historyLogs)}
              disabled={historyLogs.length === 0}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('history.exportCsv')}</span>
            </button>

            <button
              onClick={clearHistory}
              disabled={historyLogs.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-mono transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('history.clearLogs')}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t('history.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Band Filters */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((band) => (
                <button
                  key={band}
                  onClick={() => setSelectedBand(band)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                    selectedBand === band
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>

            {/* Masking Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 hover:border-fuchsia-500/50 transition-colors">
              <input
                type="checkbox"
                checked={maskingOnly}
                onChange={(e) => setMaskingOnly(e.target.checked)}
                className="rounded accent-fuchsia-500 h-3.5 w-3.5"
              />
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>{t('history.maskingOnly')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="soc-card rounded-2xl overflow-hidden border border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">{t('history.time')}</th>
                <th className="py-3 px-4">{t('history.emotion')}</th>
                <th className="py-3 px-4">{t('history.transcript')}</th>
                <th className="py-3 px-4">{t('history.tLip')}</th>
                <th className="py-3 px-4">{t('history.dCross')}</th>
                <th className="py-3 px-4">{t('history.threatPct')}</th>
                <th className="py-3 px-4">{t('history.status')}</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((entry) => {
                  const res = entry.result;
                  const isMasking = res.isMaskingDetected;
                  const isHigh = res.threatBand === 'high';

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedLogEntry(entry)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(res.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize font-medium text-slate-200">
                          {res.dominantEmotion}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({Math.round(res.dominantEmotionProb * 100)}%)
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bengali text-sm text-slate-100 truncate">
                          {entry.transcript_bn}
                        </div>
                        <div className="text-[10px] text-slate-500 italic truncate">
                          {entry.romanized}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-teal-400">{res.T_lip.toFixed(3)}</td>

                      <td
                        className={`py-3 px-4 ${
                          isMasking ? 'text-fuchsia-400 font-bold' : 'text-purple-400'
                        }`}
                      >
                        {res.D_cross.toFixed(3)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : res.threatBand === 'medium'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {res.threatPercent}%
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isMasking ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-950 border border-fuchsia-500/60 text-fuchsia-300 text-[10px] font-bold shadow-[0_0_8px_rgba(217,70,239,0.3)]">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>MASKING</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] uppercase">
                            {res.threatBand}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 inline-block transition-colors" />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-mono text-xs">
                    {t('history.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
