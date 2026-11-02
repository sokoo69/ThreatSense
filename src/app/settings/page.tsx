'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sliders,
  BookOpen,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Save,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useThreatStore } from '../../store/useThreatStore';
import { EmotionType, LexiconEntry } from '../../engine/types';

export default function SettingsPage() {
  const { t } = useTranslation();
  const {
    settings,
    updateSettings,
    resetSettings,
    lexicon,
    addLexiconWord,
    updateLexiconWord,
    deleteLexiconWord,
    resetLexicon,
  } = useThreatStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);

  // New word form state
  const [newWord, setNewWord] = useState('');
  const [newRomanized, setNewRomanized] = useState('');
  const [newWeight, setNewWeight] = useState(0.85);
  const [newCategory, setNewCategory] = useState('Weapons');

  const categories = ['ALL', ...Array.from(new Set(lexicon.map((item) => item.category)))];

  const filteredLexicon = lexicon.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.word.includes(searchTerm) ||
      item.romanized.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    addLexiconWord({
      word: newWord.trim(),
      romanized: newRomanized.trim() || 'custom',
      weight: Number(newWeight.toFixed(2)),
      category: newCategory,
    });

    setNewWord('');
    setNewRomanized('');
    setShowAddModal(false);
    triggerSaveAlert();
  };

  const triggerSaveAlert = () => {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Settings Header */}
      <div className="soc-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>{t('settings.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('settings.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {saveBanner && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{t('settings.saved')}</span>
            </span>
          )}
          <button
            onClick={() => {
              resetSettings();
              triggerSaveAlert();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('settings.resetDefaults')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Emotion Risk Weights & Baselines */}
        <div className="soc-card rounded-2xl p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">
              {t('settings.emotionWeights')} &amp; Baselines
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Configures w_e in R_e = &Sigma; P(e)&middot;w_e and benign baseline markers.
            </p>
          </div>

          <div className="space-y-4">
            {(Object.keys(settings.emotionWeights) as EmotionType[]).map((emotion) => {
              const weight = settings.emotionWeights[emotion];
              const baseline = settings.emotionBaselines[emotion];

              return (
                <div key={emotion} className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="capitalize font-bold text-slate-200">{emotion}</span>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>
                        Risk w_e: <strong className="text-cyan-400">{weight.toFixed(2)}</strong>
                      </span>
                      <span>
                        Base: <strong className="text-slate-300">{baseline.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 w-12">Weight</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSettings({
                          emotionWeights: { ...settings.emotionWeights, [emotion]: val },
                        });
                        triggerSaveAlert();
                      }}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Baseline Slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 w-12">Baseline</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={baseline}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSettings({
                          emotionBaselines: { ...settings.emotionBaselines, [emotion]: val },
                        });
                        triggerSaveAlert();
                      }}
                      className="w-full accent-slate-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Threat Fusion & Affective Masking Parameters */}
        <div className="soc-card rounded-2xl p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">
              {t('settings.fusionWeights')} &amp; Discrepancy Gate
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Threat% = 100&middot;(&alpha;&middot;R_e + &beta;&middot;T_lip + &gamma;&middot;D_cross)
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Alpha */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-cyan-400">&alpha; (Emotion Risk R_e)</span>
                <span className="text-slate-200 font-bold">{settings.alpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.alpha}
                onChange={(e) => {
                  updateSettings({ alpha: parseFloat(e.target.value) });
                  triggerSaveAlert();
                }}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Beta */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-teal-400">&beta; (Lip Threat T_lip)</span>
                <span className="text-slate-200 font-bold">{settings.beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.beta}
                onChange={(e) => {
                  updateSettings({ beta: parseFloat(e.target.value) });
                  triggerSaveAlert();
                }}
                className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Gamma */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-purple-400">&gamma; (Cross-Modal Discrepancy D_cross)</span>
                <span className="text-slate-200 font-bold">{settings.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.gamma}
                onChange={(e) => {
                  updateSettings({ gamma: parseFloat(e.target.value) });
                  triggerSaveAlert();
                }}
                className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Masking Threshold */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-fuchsia-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Masking Threshold (&theta;_mask)</span>
                </span>
                <span className="text-fuchsia-300 font-bold">{settings.maskingThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={settings.maskingThreshold}
                onChange={(e) => {
                  updateSettings({ maskingThreshold: parseFloat(e.target.value) });
                  triggerSaveAlert();
                }}
                className="w-full accent-fuchsia-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                If D_cross &ge; &theta;_mask and dominant emotion &in; &#123;neutral, happy&#125;, &ldquo;MASKING DETECTED&rdquo; triggers.
              </p>
            </div>

            {/* g(A_vol) scaling factor */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">g(A_vol) Sensitivity Multiplier</span>
                <span className="text-slate-200 font-bold">{settings.volScalingK.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.volScalingK}
                onChange={(e) => {
                  updateSettings({ volScalingK: parseFloat(e.target.value) });
                  triggerSaveAlert();
                }}
                className="w-full accent-slate-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Sliding window size */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Sliding Window Size (N frames)</span>
                <span className="text-slate-200 font-bold">{settings.smoothingWindowSize}</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={settings.smoothingWindowSize}
                onChange={(e) => {
                  updateSettings({ smoothingWindowSize: parseInt(e.target.value, 10) });
                  triggerSaveAlert();
                }}
                className="w-full accent-slate-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Bengali Threat Lexicon Management */}
      <div className="soc-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>{t('settings.lexiconTitle')}</span>
                <span className="text-xs font-mono text-slate-500">
                  ({lexicon.length} tokens active)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Bengali threat dictionary in lexicon.bn.json with weights &theta;_W
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('settings.addWord')}</span>
            </button>
            <button
              onClick={() => {
                resetLexicon();
                triggerSaveAlert();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors"
              title="Reset lexicon to thesis default 26 entries"
            >
              Reset Lexicon
            </button>
          </div>
        </div>

        {/* Lexicon Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search Bengali word or romanized..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lexicon Table */}
        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-4">{t('settings.word')} (বাংলা)</th>
                <th className="py-2.5 px-4">{t('settings.romanized')}</th>
                <th className="py-2.5 px-4">{t('settings.category')}</th>
                <th className="py-2.5 px-4">{t('settings.weight')} (&theta;_W)</th>
                <th className="py-2.5 px-4 text-right">{t('settings.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLexicon.map((entry) => (
                <tr key={entry.word} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-bengali text-base font-bold text-rose-300">
                    {entry.word}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{entry.romanized}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                      {entry.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-400 min-w-[32px]">
                        {entry.weight.toFixed(2)}
                      </span>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={entry.weight}
                        onChange={(e) => {
                          updateLexiconWord(entry.word, parseFloat(e.target.value));
                          triggerSaveAlert();
                        }}
                        className="w-24 accent-rose-400 bg-slate-800 h-1 rounded cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => {
                        deleteLexiconWord(entry.word);
                        triggerSaveAlert();
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove word from lexicon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>{t('settings.addWord')}</span>
            </h3>

            <form onSubmit={handleAddWord} className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">Bengali Script (বাংলা শব্দ)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বোমা, হামলা..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bengali text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Romanized Transliteration</label>
                <input
                  type="text"
                  placeholder="e.g. boma, hamla..."
                  value={newRomanized}
                  onChange={(e) => setNewRomanized(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-400">Threat Weight (&theta;_W)</label>
                  <span className="text-rose-400 font-bold">{newWeight.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Add Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
