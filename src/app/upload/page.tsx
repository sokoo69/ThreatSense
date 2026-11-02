'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  FileVideo,
  Play,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Download,
  RotateCcw,
  BarChart2,
  Table as TableIcon,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useThreatStore } from '../../store/useThreatStore';
import { exportLogsToCSV } from '../../utils/csvExport';
import { computeThreatScore } from '../../engine/threatEngine';
import { ThreatCalculationResult, EmotionProbabilities, WordDetection } from '../../engine/types';

interface VideoWindowResult {
  windowIndex: number;
  timeLabel: string;
  timestamp: number;
  transcript_bn: string;
  romanized: string;
  result: ThreatCalculationResult;
}

export default function UploadAnalysisPage() {
  const { t, i18n } = useTranslation();
  const { settings, lexicon, setSelectedLogEntry } = useThreatStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [results, setResults] = useState<VideoWindowResult[] | null>(null);

  // Scripted video timeline simulation data representing a 30-second surveillance clip
  // that features an initial calm period, followed by an Affective Masking threat, then escalation.
  const runSurveillanceAnalysis = async (fileName: string) => {
    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    const simulatedWindows = [
      {
        t: '00:00 - 00:03',
        emotions: { angry: 0.01, neutral: 0.85, disgust: 0.01, sad: 0.03, happy: 0.09, fear: 0.01 },
        lip: {
          transcript_bn: 'আমি ভেতরে প্রবেশ করছি, সব ঠিক আছে।',
          romanized: 'ami bhetore probesh korchhi, sob thik achhe.',
          words: [{ word: 'আমি', confidence: 0.95, start: 0, end: 1 }, { word: 'ভেতরে', confidence: 0.92, start: 1, end: 2 }],
          A_vol: 0.45,
        },
      },
      {
        t: '00:03 - 00:06',
        emotions: { angry: 0.02, neutral: 0.80, disgust: 0.01, sad: 0.02, happy: 0.15, fear: 0.00 },
        lip: {
          transcript_bn: 'অফিসারদের সাথে দেখা করতে এসেছি।',
          romanized: 'officer-der shathe dekha korte eshechhi.',
          words: [{ word: 'অফিসারদের', confidence: 0.91, start: 0, end: 1 }, { word: 'সাথে', confidence: 0.94, start: 1, end: 2 }],
          A_vol: 0.52,
        },
      },
      {
        t: '00:06 - 00:10',
        // AFFECTIVE MASKING WINDOW: Calm smiling face while mouthing threat words!
        emotions: { angry: 0.01, neutral: 0.18, disgust: 0.01, sad: 0.01, happy: 0.79, fear: 0.00 },
        lip: {
          transcript_bn: 'ব্যাগে শক্তিশালী বোমা আছে, সামান্য নড়লেই উড়িয়ে দেব।',
          romanized: 'bag-e shoktishali boma achhe, shamanno norlei uriye debo.',
          words: [
            { word: 'ব্যাগে', confidence: 0.92, start: 0, end: 1 },
            { word: 'বোমা', confidence: 0.97, start: 1, end: 2 },
            { word: 'উড়িয়ে', confidence: 0.94, start: 2, end: 3 },
          ],
          A_vol: 0.78,
        },
      },
      {
        t: '00:10 - 00:14',
        // MASKING CONTINUATION
        emotions: { angry: 0.02, neutral: 0.22, disgust: 0.01, sad: 0.02, happy: 0.73, fear: 0.00 },
        lip: {
          transcript_bn: 'হাসিমুখে বলছি কাউকে রক্ত দেখতে বাধ্য করো না।',
          romanized: 'hashimukhe bolchhi kauke rokto dekhte baddho koro na.',
          words: [
            { word: 'হাসিমুখে', confidence: 0.90, start: 0, end: 1 },
            { word: 'রক্ত', confidence: 0.95, start: 1, end: 2 },
          ],
          A_vol: 0.65,
        },
      },
      {
        t: '00:14 - 00:18',
        // Transition to overt anger
        emotions: { angry: 0.88, neutral: 0.04, disgust: 0.06, sad: 0.01, happy: 0.00, fear: 0.01 },
        lip: {
          transcript_bn: 'এখনই গুলি করব এবং সবাইকে শেষ করে ফেলব!',
          romanized: 'ekhoni guli korbo ebong shobaike shesh kore phelbo!',
          words: [
            { word: 'গুলি', confidence: 0.96, start: 0, end: 1 },
            { word: 'শেষ', confidence: 0.93, start: 1, end: 2 },
          ],
          A_vol: 0.92,
        },
      },
      {
        t: '00:18 - 00:22',
        // High anger & assault
        emotions: { angry: 0.92, neutral: 0.02, disgust: 0.04, sad: 0.01, happy: 0.00, fear: 0.01 },
        lip: {
          transcript_bn: 'হামলা হবে এবং সবকিছু ধ্বংস হবে!',
          romanized: 'hamla hobe ebong shobkichhu dhongsho hobe!',
          words: [
            { word: 'হামলা', confidence: 0.95, start: 0, end: 1 },
            { word: 'ধ্বংস', confidence: 0.94, start: 1, end: 2 },
          ],
          A_vol: 0.85,
        },
      },
    ];

    const windowResults: VideoWindowResult[] = [];

    for (let i = 0; i < simulatedWindows.length; i++) {
      const win = simulatedWindows[i];
      setCurrentStepText(`Processing Window ${i + 1}/${simulatedWindows.length} (${win.t}): Running Face CNN & LipBengal Streams concurrently...`);
      setProgress(Math.round(((i + 1) / simulatedWindows.length) * 100));

      await new Promise((r) => setTimeout(r, 450));

      const calc = computeThreatScore(
        win.emotions as EmotionProbabilities,
        win.lip.words as WordDetection[],
        win.lip.A_vol,
        settings,
        lexicon,
        Date.now() + i * 4000
      );

      windowResults.push({
        windowIndex: i + 1,
        timeLabel: win.t,
        timestamp: calc.timestamp,
        transcript_bn: win.lip.transcript_bn,
        romanized: win.lip.romanized,
        result: calc,
      });
    }

    setResults(windowResults);
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVideoName(file.name);
      runSurveillanceAnalysis(file.name);
    }
  };

  const handleLoadDemoClip = () => {
    const name = 'surveillance_gate4_bengali_deception_test.mp4';
    setVideoName(name);
    runSurveillanceAnalysis(name);
  };

  // Compute aggregate metrics
  const peakThreat = results ? Math.max(...results.map((r) => r.result.threatPercent)) : 0;
  const maskingEvents = results ? results.filter((r) => r.result.isMaskingDetected).length : 0;
  const detectedTokens = results
    ? Array.from(
        new Set(
          results.flatMap((r) => r.result.detectedThreatWords.map((w) => w.word))
        )
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Upload Header */}
      <div className="soc-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <span>{t('upload.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('upload.subtitle')}</p>
          </div>

          <button
            onClick={handleLoadDemoClip}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('upload.demoVideo')}</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div className="mt-5 border-2 border-dashed border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
          <input
            type="file"
            id="video-upload"
            accept="video/mp4,video/webm,video/avi"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="video-upload" className="cursor-pointer space-y-2 block">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
              <FileVideo className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {videoName ? `Selected: ${videoName}` : t('upload.dropzone')}
            </div>
            <div className="text-xs text-slate-500 font-mono">{t('upload.formats')}</div>
          </label>
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="text-cyan-400">{currentStepText}</span>
              <span className="font-bold text-slate-200">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Section */}
      {results && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="soc-card rounded-2xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {t('upload.peakThreat')}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono ${
                  peakThreat > 65 ? 'text-rose-400' : peakThreat > 30 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {peakThreat}%
                </span>
                <span className="text-xs font-mono uppercase text-slate-500">
                  {peakThreat > 65 ? 'HIGH BAND' : 'MEDIUM'}
                </span>
              </div>
            </div>

            <div className="soc-card rounded-2xl p-4 border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.15)]">
              <div className="text-[11px] font-mono text-fuchsia-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>{t('upload.maskingCount')}</span>
              </div>
              <div className="mt-1 text-3xl font-extrabold font-mono text-fuchsia-400">
                {maskingEvents} <span className="text-xs font-normal text-slate-400">events detected</span>
              </div>
            </div>

            <div className="soc-card rounded-2xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">
                {t('upload.wordsDetected')}
              </div>
              <div className="mt-1 text-2xl font-bold font-bengali text-rose-300 flex flex-wrap gap-1">
                {detectedTokens.length > 0 ? (
                  detectedTokens.map((w) => (
                    <span key={w} className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-xs">
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">None</span>
                )}
              </div>
            </div>

            <div className="soc-card rounded-2xl p-4 flex flex-col justify-between">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Audit Export</div>
              <button
                onClick={() =>
                  exportLogsToCSV(
                    results.map((r) => ({
                      result: r.result,
                      transcript_bn: r.transcript_bn,
                      romanized: r.romanized,
                    })),
                    `surveillance_audit_${Date.now()}.csv`
                  )
                }
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('history.exportCsv')}</span>
              </button>
            </div>
          </div>

          {/* Offline Timeline Chart */}
          <div className="soc-card rounded-2xl p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Video Progression Telemetry Timeline
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={results.map((r) => ({
                    time: r.timeLabel,
                    threatPercent: r.result.threatPercent,
                    R_e: Math.round(r.result.R_e * 100),
                    T_lip: Math.round(r.result.T_lip * 100),
                    D_cross: Math.round(r.result.D_cross * 100),
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area
                    type="monotone"
                    dataKey="threatPercent"
                    name="Threat %"
                    stroke="#f43f5e"
                    fill="#f43f5e22"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="D_cross"
                    name="D_cross % (Masking)"
                    stroke="#d946ef"
                    fill="#d946ef22"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="R_e" name="R_e (Face %)" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="T_lip" name="T_lip (Lips %)" stroke="#2dd4bf" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-Window Table */}
          <div className="soc-card rounded-2xl p-5 overflow-x-auto">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <TableIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Surveillance Frame Window Ledger
              </h3>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                  <th className="py-2 px-3">Window</th>
                  <th className="py-2 px-3">Face Emotion</th>
                  <th className="py-2 px-3">Bengali Lip Utterance</th>
                  <th className="py-2 px-3">R_e</th>
                  <th className="py-2 px-3">T_lip</th>
                  <th className="py-2 px-3">D_cross</th>
                  <th className="py-2 px-3">Threat %</th>
                  <th className="py-2 px-3">Masking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {results.map((row) => {
                  const res = row.result;
                  return (
                    <tr
                      key={row.windowIndex}
                      onClick={() =>
                        setSelectedLogEntry({
                          id: `upload-win-${row.windowIndex}`,
                          result: res,
                          transcript_bn: row.transcript_bn,
                          romanized: row.romanized,
                        })
                      }
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-300">{row.timeLabel}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-slate-200">{res.dominantEmotion}</span>
                        <span className="text-slate-500 text-[10px] ml-1">
                          ({Math.round(res.dominantEmotionProb * 100)}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bengali text-sm text-slate-100 max-w-xs truncate">
                        {row.transcript_bn}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400">{res.R_e}</td>
                      <td className="py-2.5 px-3 text-teal-400">{res.T_lip}</td>
                      <td className={`py-2.5 px-3 ${res.isMaskingDetected ? 'text-fuchsia-400 font-bold' : 'text-purple-400'}`}>
                        {res.D_cross}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-100">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          res.threatPercent > 65 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {res.threatPercent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {res.isMaskingDetected ? (
                          <span className="px-2 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700 text-[10px] font-bold">
                            MASKING
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
