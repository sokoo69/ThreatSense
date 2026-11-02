'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Info,
  ShieldAlert,
  GitMerge,
  Cpu,
  BookOpen,
  Sparkles,
  Terminal,
  CheckCircle2,
  Code,
} from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="soc-card rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>RESEARCH METHODOLOGY &amp; ARCHITECTURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {t('about.title')}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed font-mono">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Core Research Premise */}
      <div className="soc-card rounded-2xl p-6 sm:p-8 space-y-4 border-fuchsia-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {t('about.premiseTitle')}
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-bengali">
          {t('about.premiseText')}
        </p>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 font-mono space-y-2">
          <div className="text-cyan-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>ARCHITECTURAL AXIOM: ZERO-GATING PRINCIPLE</span>
          </div>
          <p>
            In legacy multi-modal architectures, facial emotion models frequently act as an attention or early-exit gate.
            If the face is classified as <em>Neutral</em> or <em>Happy</em>, computation for lip reading is truncated or discarded.
            In ThreatSense, <strong>both streams run continuously and in parallel on every single video window</strong>.
            The vital signal is the <strong>Discrepancy (D_cross)</strong> between facial affect and verbal articulation.
          </p>
        </div>
      </div>

      {/* Visual Dual-Stream Diagram */}
      <div className="soc-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <GitMerge className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">
            Dual-Stream Deep Learning Architecture
          </h2>
        </div>

        {/* Diagram Flow */}
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-cyan-300 font-bold text-sm">SURVEILLANCE VIDEO INGESTION</div>
            <div className="text-slate-500 text-[11px] mt-0.5">30 FPS Camera &bull; Frame Sliding Window (N=5)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stream A Card */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 space-y-2">
              <div className="text-cyan-400 font-bold flex items-center justify-between">
                <span>STREAM A: FACIAL EMOTION</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">CONTINUOUS</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                CNN / Vision Transformer (ViT) classifies probability distribution across 6 basic states:
                Angry, Fear, Disgust, Sad, Neutral, Happy.
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[11px]">
                Output: R_e = &Sigma; P(e)&middot;w_e
              </div>
            </div>

            {/* Stream B Card */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-teal-500/40 space-y-2">
              <div className="text-teal-400 font-bold flex items-center justify-between">
                <span>STREAM B: LIPBENGAL MODEL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">NEVER GATED</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Mouth ROI extraction &rarr; 3D-ResNet Spatiotemporal Frontend &rarr; Conformer Encoder &rarr; CTC Decoder.
                Translates lip kinematics into Bengali text and calculates A_vol.
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-teal-300 text-[11px]">
                Output: T_lip = clip(&Sigma;(&theta;_W&middot;conf)&middot;g(A_vol))
              </div>
            </div>
          </div>

          {/* Fusion Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border border-fuchsia-500/40 space-y-2 text-center">
            <div className="text-fuchsia-300 font-bold text-sm">
              CROSS-MODAL DISCREPANCY &amp; FUSION ENGINE
            </div>
            <div className="text-slate-400 text-[11px] max-w-xl mx-auto">
              D_cross = max(0, T_lip - R_e) &times; M_mask
              <br />
              If D_cross &ge; 0.40 AND Dominant Face &in; &#123;neutral, happy&#125; &rarr; <strong>MASKING DETECTED</strong>
              <br />
              Final Composite Threat% = 100&middot;(&alpha;&middot;R_e + &beta;&middot;T_lip + &gamma;&middot;D_cross)
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Symbols Table */}
      <div className="soc-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">
            {t('about.mathTitle')}
          </h2>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-4">Symbol</th>
                <th className="py-2.5 px-4">Definition</th>
                <th className="py-2.5 px-4">Default Value / Bounds</th>
                <th className="py-2.5 px-4">Function in Thesis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-4 font-bold text-cyan-400">R_e</td>
                <td className="py-2.5 px-4">Emotion Risk Metric</td>
                <td className="py-2.5 px-4">[0.0, 1.0]</td>
                <td className="py-2.5 px-4">&Sigma; P(e)&middot;w_e (Angry: 1.0, Fear: 0.6)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-teal-400">&theta;_W</td>
                <td className="py-2.5 px-4">Lexicon Token Weight</td>
                <td className="py-2.5 px-4">[0.0, 1.0]</td>
                <td className="py-2.5 px-4">Threat severity of Bengali word in lexicon.bn.json</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-teal-400">A_vol</td>
                <td className="py-2.5 px-4">Lip Movement Amplitude</td>
                <td className="py-2.5 px-4">[0.0, 1.0]</td>
                <td className="py-2.5 px-4">Physical mouth vertical/horizontal displacement</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-teal-400">g(A_vol)</td>
                <td className="py-2.5 px-4">Volume Scaling Function</td>
                <td className="py-2.5 px-4">Monotonic curve</td>
                <td className="py-2.5 px-4">Allows subtle silent mouthing to produce high threat</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-teal-400">T_lip</td>
                <td className="py-2.5 px-4">Lip Threat Metric</td>
                <td className="py-2.5 px-4">[0.0, 1.0]</td>
                <td className="py-2.5 px-4">Verbal threat extracted from LipBengal model</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-fuchsia-400">D_cross</td>
                <td className="py-2.5 px-4">Cross-Modal Discrepancy</td>
                <td className="py-2.5 px-4">[0.0, 1.0]</td>
                <td className="py-2.5 px-4">Core deception signal: max(0, T_lip - R_e)&middot;M_mask</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-rose-400">&alpha;, &beta;, &gamma;</td>
                <td className="py-2.5 px-4">Fusion Contribution Weights</td>
                <td className="py-2.5 px-4">0.25, 0.50, 0.25</td>
                <td className="py-2.5 px-4">Weights determining final composite threat index</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bengali Linguistic & Viseme Challenges */}
      <div className="soc-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-slate-100">
            {t('about.linguisticTitle')}
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-bengali">
          {t('about.linguisticText')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-teal-400 font-bold">1. Bilabial Plosives</span>
            <p className="text-slate-400 text-[11px] mt-1">
              ব vs ভ (b vs bh) and প vs ফ (p vs ph) share identical lip closure shapes but distinct aspiration dynamics.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-teal-400 font-bold">2. Retroflex vs Dental</span>
            <p className="text-slate-400 text-[11px] mt-1">
              ত/থ (dental) vs ট/ঠ (retroflex) require subtle tongue tip visibility modeling behind the teeth aperture.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-teal-400 font-bold">3. Nasalized Vowels</span>
            <p className="text-slate-400 text-[11px] mt-1">
              চন্দ্রবিন্দু (ঁ) alters airflow without major mouth geometric change; temporal duration models disambiguate context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
