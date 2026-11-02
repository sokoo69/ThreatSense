'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Activity,
  UploadCloud,
  Sliders,
  History,
  Info,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
} from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';
import { changeLanguage } from '../i18n/config';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { DemoScenarioId } from '../engine/types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const {
    isSoundMuted,
    setSoundMuted,
    activeScenarioId,
    setActiveScenario,
    isStreaming,
    setIsStreaming,
  } = useThreatStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    changeLanguage(nextLang);
  };

  const navLinks = [
    { href: '/', label: t('nav.live'), icon: Activity },
    { href: '/upload', label: t('nav.upload'), icon: UploadCloud },
    { href: '/settings', label: t('nav.settings'), icon: Sliders },
    { href: '/history', label: t('nav.history'), icon: History },
    { href: '/about', label: t('nav.about'), icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      {/* Top Disclaimer Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/60 px-4 py-1 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-medium text-slate-300">{t('app.disclaimer')}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center shadow-lg group-hover:border-cyan-400 transition-colors">
                <ShieldAlert className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {t('app.title')}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-400 font-semibold">
                    v1.0 DUAL-STREAM
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-bengali truncate max-w-[260px] sm:max-w-none">
                  {t('app.subtitle')}
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls: Demo Switcher, Sound, Language, Live Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Scenario Selector */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <select
                value={activeScenarioId}
                onChange={(e) => setActiveScenario(e.target.value as DemoScenarioId)}
                className="bg-transparent text-xs text-slate-200 border-none focus:outline-none focus:ring-0 cursor-pointer font-medium max-w-[170px]"
                title="Select scripted demo scenario"
              >
                {DEMO_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {i18n.language === 'bn' ? s.titleBn : s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Stream Play/Pause Toggle */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                isStreaming
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title={isStreaming ? 'Pause Stream' : 'Resume Stream'}
            >
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isStreaming ? t('app.live') : 'PAUSED'}</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundMuted(!isSoundMuted)}
              className={`p-2 rounded-lg border text-sm transition-colors ${
                isSoundMuted
                  ? 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                  : 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/40'
              }`}
              title={isSoundMuted ? t('app.soundMuted') : t('app.soundUnmuted')}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Language Toggle: English / বাংলা */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500/40 text-xs font-semibold transition-colors"
              title="Toggle Language: English / বাংলা"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{i18n.language === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
