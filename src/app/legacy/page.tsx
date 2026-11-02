'use client';

import React, { useState } from 'react';
import '../../i18n/config';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { useThreatStore } from '../../store/useThreatStore';
import { changeLanguage } from '../../i18n/config';
import { DEMO_SCENARIOS } from '../../data/demoScenarios';
import { DemoScenarioId } from '../../engine/types';
import { VideoPlayerHUD } from '../../components/VideoPlayerHUD';
import { ControlsRow } from '../../components/ControlsRow';
import { ThreatStrip } from '../../components/ThreatStrip';
import { ConversationSection } from '../../components/ConversationSection';
import { CalibrationSection } from '../../components/CalibrationSection';
import { HelpModal } from '../../components/HelpModal';

export default function ThreatSenseLivePage() {
  const { t, i18n } = useTranslation();
  const {
    activeScenarioId,
    setActiveScenario,
    isSoundMuted,
    setSoundMuted,
    isStreaming,
  } = useThreatStore();

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#ededee] py-6 sm:py-10 px-4">
      {/* Centered Column (max-width ~980px) with generous vertical spacing */}
      <div className="max-w-[980px] mx-auto space-y-7">
        {/* HEADER */}
        <header className="space-y-2.5">
          {/* Top Title & Control Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  ThreatSense Live
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#5b5bd6]/15 border border-[#5b5bd6]/30 text-[#818cf8] uppercase">
                  Dual-Stream
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-normal">
                Real-time facial expression analysis &amp; Bengali lip-reading with affective masking detection
              </p>
            </div>

            {/* Header Controls: Demo Selector, Sound, Lang, Help */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto font-mono text-xs">
              {/* Demo Mode Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={activeScenarioId}
                  onChange={(e) => setActiveScenario(e.target.value as DemoScenarioId)}
                  className="bg-transparent text-xs text-zinc-200 border-none focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[180px] font-mono"
                  title="Switch scripted demo scenario"
                >
                  {DEMO_SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#18181b] text-zinc-200">
                      {i18n.language === 'bn' ? s.titleBn : s.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundMuted(!isSoundMuted)}
                className="btn-control p-1.5"
                title={isSoundMuted ? 'Unmute alerts' : 'Mute alerts'}
              >
                {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
              </button>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="btn-control px-2 py-1 flex items-center gap-1 text-[11px]"
                title="Toggle Language: English / বাংলা"
              >
                <Languages className="w-3 h-3 text-indigo-400" />
                <span>{i18n.language === 'bn' ? 'বাংলা' : 'EN'}</span>
              </button>

              {/* Help Button */}
              <button
                onClick={() => setIsHelpOpen(true)}
                className="btn-control w-7 h-7 flex items-center justify-center font-bold text-zinc-400 hover:text-white"
                title="How to use ThreatSense Live"
              >
                ?
              </button>
            </div>
          </div>

          {/* Privacy Indicator Line & Legal Disclaimer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-zinc-500 gap-1 pt-0.5 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Runs entirely in your browser. No frames leave your device.</span>
            </div>
            <div className="italic text-zinc-500 text-[10.5px]">
              Decision-support tool. Predictions may be incorrect; human review required.
            </div>
          </div>
        </header>

        {/* VIDEO CONTAINER & IN-VIDEO READOUT */}
        <VideoPlayerHUD />

        {/* CONTROL ROW UNDER VIDEO */}
        <ControlsRow />

        {/* THREAT STRIP */}
        <ThreatStrip />

        {/* CONVERSATION SECTION */}
        <ConversationSection />

        {/* ADVANCED PERSONAL EMOTION CALIBRATION */}
        <CalibrationSection />

        {/* FOOTER */}
        <footer className="pt-6 border-t border-white/5 text-[11px] font-mono text-zinc-500 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span>MIT License &bull; Models: MediaPipe Face Landmarker &bull; LipBengal / LipNet (Bengali Visemes)</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>Calibrated, in-browser, no tracking</span>
              <a
                href="#github-repository"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
          <div className="text-[10px] text-zinc-600">
            Affective Masking Defense Protocol &bull; Discrepancy Gate D_cross &ge; 0.40 triggers Violet Masking Override.
          </div>
        </footer>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
