'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  HelpCircle,
  RotateCcw,
  Download,
  Circle,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';
import { exportLogsToCSV } from '../utils/csvExport';

export const ControlsRow: React.FC = () => {
  const { t } = useTranslation();
  const {
    isStreaming,
    setIsStreaming,
    startCalibration,
    generateWhyExplanation,
    isRecording,
    setIsRecording,
    recordedFrames,
    whyWindowSeconds,
    setWhyWindowSeconds,
    exportSessionJSON,
    historyLogs,
  } = useThreatStore();

  const [showExportMenu, setShowExportMenu] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleExportCSV = () => {
    exportLogsToCSV(historyLogs, `threatsense_session_${Date.now()}.csv`);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    exportSessionJSON();
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
      {/* Left Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pause / Resume Button */}
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className="btn-control px-3 py-1.5 flex items-center gap-1.5"
          title={isStreaming ? 'Pause video stream and inference' : 'Resume live stream'}
        >
          {isStreaming ? <Pause className="w-3.5 h-3.5 text-zinc-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isStreaming ? 'Pause' : 'Resume'}</span>
        </button>

        {/* Why? Button (Indigo Primary) */}
        <button
          onClick={generateWhyExplanation}
          className="btn-primary-indigo px-3.5 py-1.5 flex items-center gap-1.5 font-semibold shadow-sm"
          title="Analyze why current threat and expression occurred in the selected window"
        >
          <span>Why?</span>
        </button>

        {/* Recalibrate Button */}
        <button
          onClick={startCalibration}
          className="btn-control px-3 py-1.5 flex items-center gap-1.5"
          title="Recalibrate resting face baseline (3 second neutral hold)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Recalibrate</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

        {/* Export Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-control px-3 py-1.5 flex items-center gap-1.5"
            title="Export session data as CSV or JSON"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute left-0 mt-1.5 w-44 rounded-lg bg-[#18181b] border border-zinc-700/80 shadow-2xl z-30 py-1 text-xs font-mono">
              <button
                onClick={handleExportCSV}
                className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV (UTF-8)</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Record Button */}
        <button
          onClick={toggleRecording}
          className={`btn-control px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
            isRecording ? 'border-rose-500/50 text-rose-300 bg-rose-950/40' : ''
          }`}
          title={isRecording ? 'Stop recording session telemetry' : 'Record telemetry to session history'}
        >
          <Circle
            className={`w-3 h-3 ${isRecording ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-zinc-500'}`}
          />
          <span>{isRecording ? `Recording (${recordedFrames.length})` : 'Record'}</span>
        </button>
      </div>

      {/* Right Side: "Why? window" Slider */}
      <div className="flex items-center gap-2.5 font-mono text-xs text-zinc-400 self-end sm:self-auto">
        <span>Why? window</span>
        <input
          type="range"
          min="2"
          max="30"
          step="1"
          value={whyWindowSeconds}
          onChange={(e) => setWhyWindowSeconds(parseInt(e.target.value, 10))}
          className="w-24 sm:w-28 accent-[#5b5bd6] bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
        />
        <span className="text-zinc-200 font-bold min-w-[24px] text-right">{whyWindowSeconds}s</span>
      </div>
    </div>
  );
};
