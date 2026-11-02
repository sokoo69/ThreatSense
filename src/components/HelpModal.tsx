'use client';

import React from 'react';
import { X, ShieldCheck, Sparkles, Eye, Camera, Lock } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#27272a] rounded-[12px] max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl text-xs text-zinc-300 font-mono">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center">
              ?
            </div>
            <h3 className="font-bold text-sm text-white">How to Use ThreatSense Live</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Section 1: Quickstart */}
          <div className="space-y-1">
            <div className="text-indigo-400 font-bold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>1. Getting Started &amp; Baseline Calibration</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Enable your webcam (or keep the high-fidelity simulated feed). Click <strong>[Recalibrate]</strong> to hold a relaxed neutral face for 3 seconds. The system zero-references resting facial muscle tones so subsequent expressions are accurately measured.
            </p>
          </div>

          {/* Section 2: HUD Overlays */}
          <div className="space-y-1">
            <div className="text-indigo-400 font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>2. In-Video Real-Time Readout</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              • <strong>Face HUD (Anchored Left)</strong>: Continuously tracks top-3 emotions, valence/arousal coordinates, intensity, and active blendshapes.<br />
              • <strong>Lip HUD (Anchored Over Mouth)</strong>: Continuous Bengali lip reading, romanized line, mouth movement amplitude (A_vol), and threat word highlights.<br />
              • <strong>Insets</strong>: 2D Circumplex plot (bottom-left) and magnified mouth crop (bottom-right).
            </p>
          </div>

          {/* Section 3: Research Premise */}
          <div className="space-y-1 bg-fuchsia-950/30 p-2.5 rounded-lg border border-fuchsia-500/30">
            <div className="text-fuchsia-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. Affective Masking (The Research Premise)</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              An adversary may smile or maintain a placid expression while silently mouthing threats in Bengali (e.g. &ldquo;বোমা&rdquo;, &ldquo;গুলি&rdquo;). Lip reading is <strong>NEVER gated or skipped</strong> by facial emotions. When discrepancy <em>D_cross &ge; 0.40</em> on a calm face, the violet <strong>MASKING DETECTED</strong> state activates.
            </p>
          </div>

          {/* Section 4: Privacy */}
          <div className="space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>4. Complete Device-Local Privacy</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              All MediaPipe blendshape extractions and LipBengal model passes execute strictly within your local browser runtime. Zero video frames or personal telemetry ever leave your device.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary-indigo px-4 py-1.5 text-xs font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
