'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  VideoOff,
  Maximize2,
  Scan,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';

export const LiveWebcamFeed: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentThreat,
    currentLipReading,
    cameraMode,
    setCameraMode,
    cameraError,
    setCameraError,
  } = useThreatStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize camera stream when in 'real' mode
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (cameraMode === 'real') {
      setIsInitializing(true);
      setCameraError(null);

      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        .then((s) => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setIsInitializing(false);
        })
        .catch((err) => {
          console.warn('Camera permission denied or camera not found:', err);
          setCameraError(t('camera.permissionDenied'));
          setCameraMode('simulated');
          setIsInitializing(false);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraMode, setCameraError, setCameraMode, t]);

  // Render bounding boxes & mouth ROI on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderOverlay = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // If simulated mode, draw dark high-tech security silhouette
      if (cameraMode === 'simulated') {
        // Subtle cyber grid
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Stylized face silhouette outline
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2 - 10, 85, 110, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Eye guides
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fillRect(width / 2 - 40, height / 2 - 35, 12, 4);
        ctx.fillRect(width / 2 + 28, height / 2 - 35, 12, 4);

        // Nose line
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2 - 25);
        ctx.lineTo(width / 2 - 4, height / 2);
        ctx.lineTo(width / 2, height / 2 + 2);
        ctx.stroke();
      }

      // 1. Face Bounding Box
      const faceBox = {
        x: width * 0.28,
        y: height * 0.16,
        w: width * 0.44,
        h: height * 0.65,
      };

      const isMasking = currentThreat.isMaskingDetected;
      const boxColor = isMasking
        ? 'rgba(217, 70, 239, 0.85)' // Violet for masking!
        : currentThreat.threatBand === 'high'
        ? 'rgba(244, 63, 94, 0.85)'  // Red for high threat
        : 'rgba(6, 182, 212, 0.75)'; // Cyan default

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      // Corner brackets style
      const corner = 18;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(faceBox.x, faceBox.y + corner);
      ctx.lineTo(faceBox.x, faceBox.y);
      ctx.lineTo(faceBox.x + corner, faceBox.y);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(faceBox.x + faceBox.w - corner, faceBox.y);
      ctx.lineTo(faceBox.x + faceBox.w, faceBox.y);
      ctx.lineTo(faceBox.x + faceBox.w, faceBox.y + corner);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(faceBox.x, faceBox.y + faceBox.h - corner);
      ctx.lineTo(faceBox.x, faceBox.y + faceBox.h);
      ctx.lineTo(faceBox.x + corner, faceBox.y + faceBox.h);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(faceBox.x + faceBox.w - corner, faceBox.y + faceBox.h);
      ctx.lineTo(faceBox.x + faceBox.w, faceBox.y + faceBox.h);
      ctx.lineTo(faceBox.x + faceBox.w, faceBox.y + faceBox.h - corner);
      ctx.stroke();

      // Face label banner
      ctx.fillStyle = isMasking ? 'rgba(88, 28, 135, 0.9)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(faceBox.x, faceBox.y - 24, faceBox.w, 22);
      ctx.strokeStyle = boxColor;
      ctx.strokeRect(faceBox.x, faceBox.y - 24, faceBox.w, 22);

      ctx.font = '600 11px monospace';
      ctx.fillStyle = '#ffffff';
      const emotionText = `FACE: ${currentThreat.dominantEmotion.toUpperCase()} (${Math.round(
        currentThreat.dominantEmotionProb * 100
      )}%)`;
      ctx.fillText(emotionText, faceBox.x + 8, faceBox.y - 9);

      // 2. Mouth ROI (Stream B Region of Interest)
      const mouthBox = {
        x: width * 0.38,
        y: height * 0.54,
        w: width * 0.24,
        h: height * 0.18,
      };

      ctx.strokeStyle = 'rgba(20, 184, 166, 0.9)'; // Teal/Cyan
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(mouthBox.x, mouthBox.y, mouthBox.w, mouthBox.h);
      ctx.setLineDash([]);

      // Mouth ROI Tag
      ctx.fillStyle = 'rgba(13, 148, 136, 0.85)';
      ctx.fillRect(mouthBox.x, mouthBox.y + mouthBox.h, mouthBox.w, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 9px monospace';
      ctx.fillText(
        `LIP-ROI [A_vol: ${currentLipReading.A_vol}]`,
        mouthBox.x + 6,
        mouthBox.y + mouthBox.h + 12
      );

      // Animated 8-Point Lip Contour Wireframe
      const cx = mouthBox.x + mouthBox.w / 2;
      const cy = mouthBox.y + mouthBox.h / 2;
      const rx = mouthBox.w * 0.35;
      const ry = Math.max(3, mouthBox.h * 0.25 * currentLipReading.A_vol);

      ctx.strokeStyle = isMasking ? '#f472b6' : '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Key landmark dots
      const dots = [
        { x: cx - rx, y: cy },
        { x: cx + rx, y: cy },
        { x: cx, y: cy - ry },
        { x: cx, y: cy + ry },
        { x: cx - rx * 0.7, y: cy - ry * 0.7 },
        { x: cx + rx * 0.7, y: cy - ry * 0.7 },
        { x: cx - rx * 0.7, y: cy + ry * 0.7 },
        { x: cx + rx * 0.7, y: cy + ry * 0.7 },
      ];

      ctx.fillStyle = isMasking ? '#f43f5e' : '#38bdf8';
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    animId = requestAnimationFrame(renderOverlay);
    return () => cancelAnimationFrame(animId);
  }, [cameraMode, currentThreat, currentLipReading]);

  return (
    <div className="soc-card rounded-2xl overflow-hidden relative flex flex-col">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs font-bold text-slate-200">CAM-01 [LIVE FEED]</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {cameraMode === 'real' ? 'HARDWARE' : 'SIMULATED SOC HUD'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCameraMode(cameraMode === 'real' ? 'simulated' : 'real')}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
            title="Toggle between hardware webcam and simulated security camera feed"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>{cameraMode === 'real' ? t('camera.simulateFeed') : t('camera.startWebcam')}</span>
          </button>
        </div>
      </div>

      {/* Camera Video / Canvas Area */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Real video element (only rendered when cameraMode === 'real') */}
        {cameraMode === 'real' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        )}

        {/* Canvas overlay with face bounding box & mouth ROI */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Scanline FX */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-transparent h-12 w-full animate-scanline" />

        {/* Camera HUD Diagnostics */}
        <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1 text-[10px] font-mono text-slate-400 space-y-0.5 pointer-events-none">
          <div className="text-cyan-400 font-semibold flex items-center gap-1">
            <Scan className="w-3 h-3" />
            <span>ROI TRACKER ACTIVE</span>
          </div>
          <div>RES: 1280x720 | 30.0 FPS</div>
          <div>LIP MODEL: LipBengal-v2</div>
        </div>

        {/* Camera Permission Alert Banner */}
        {cameraError && (
          <div className="absolute bottom-3 left-3 right-3 bg-amber-950/90 border border-amber-600/50 rounded-lg p-2.5 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={() => setCameraError(null)}
              className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 text-[10px] font-mono border border-amber-700"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Feed Bottom Status */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">CONCURRENT STREAMS:</span>
          <span className="text-cyan-400">Stream A (Face)</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-teal-400">Stream B (LipBengal)</span>
        </div>
        <div className="text-slate-500 hidden sm:block">
          STATUS: <span className="text-emerald-400">PARALLEL SYNC</span>
        </div>
      </div>
    </div>
  );
};
