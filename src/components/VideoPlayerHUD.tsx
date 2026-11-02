'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useThreatStore } from '../store/useThreatStore';
import { InVideoFaceHUD } from './InVideoFaceHUD';
import { InVideoLipHUD } from './InVideoLipHUD';
import { CircumplexPlot } from './CircumplexPlot';
import { MouthCropInset } from './MouthCropInset';
import { Camera, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export const VideoPlayerHUD: React.FC = () => {
  const {
    currentThreat,
    cameraMode,
    setCameraMode,
    cameraError,
    setCameraError,
    isCalibrating,
    calibrationCountdown,
  } = useThreatStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Target and Lerped Face coordinates for smooth tracking
  const [faceCoords, setFaceCoords] = useState({ x: 340, y: 130, w: 200, h: 260 });
  const [lerpFace, setLerpFace] = useState({ x: 340, y: 130, w: 200, h: 260 });

  const isMasking = currentThreat.isMaskingDetected;

  // Camera stream handling
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (cameraMode === 'real') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
        .then((s) => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraError(null);
        })
        .catch((err) => {
          console.warn('Camera access denied:', err);
          setCameraError('Camera access denied. Operating in simulated on-device camera mode.');
          setCameraMode('simulated');
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
  }, [cameraMode, setCameraError, setCameraMode]);

  // Smooth LERP animation loop to follow face box seamlessly
  useEffect(() => {
    let animId: number;
    const lerpFactor = 0.12;

    const updateLerp = () => {
      setLerpFace((prev) => {
        // Subtle natural micro-sway in simulated mode
        const targetX = cameraMode === 'simulated' ? 340 + Math.sin(Date.now() / 1500) * 12 : faceCoords.x;
        const targetY = cameraMode === 'simulated' ? 120 + Math.cos(Date.now() / 2000) * 8 : faceCoords.y;

        const nextX = prev.x + (targetX - prev.x) * lerpFactor;
        const nextY = prev.y + (targetY - prev.y) * lerpFactor;
        return { ...prev, x: nextX, y: nextY };
      });

      animId = requestAnimationFrame(updateLerp);
    };

    animId = requestAnimationFrame(updateLerp);
    return () => cancelAnimationFrame(animId);
  }, [faceCoords, cameraMode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] rounded-[12px] overflow-hidden bg-[#0a0a0c] border border-[#27272a] shadow-2xl select-none"
    >
      {/* 1. Underlying Video / Simulated Camera Surface */}
      {cameraMode === 'real' ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      ) : (
        /* High-fidelity Minimalist Dark Simulated Face Canvas */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#111114] via-[#0d0d0f] to-[#08080a] flex items-center justify-center">
          {/* Subtle Cyber Grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#5b5bd6 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Minimalist Face Silhouette centered */}
          <div className="relative w-44 h-56 rounded-[80px] border border-zinc-800/60 flex flex-col items-center justify-center">
            {/* Eyes guide */}
            <div className="flex gap-12 mb-6">
              <div className="w-3.5 h-1 rounded-full bg-zinc-700/80" />
              <div className="w-3.5 h-1 rounded-full bg-zinc-700/80" />
            </div>
            {/* Subtle nose bridge */}
            <div className="w-0.5 h-6 bg-zinc-800 mb-5" />
            {/* Mouth contour silhouette */}
            <div className="w-12 h-2.5 rounded-full border border-zinc-700/80" />
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>LOCAL IN-BROWSER SIMULATION</span>
          </div>
        </div>
      )}

      {/* 2. Top In-Video Masking Alert Banner */}
      {isMasking && (
        <div className="absolute top-0 inset-x-0 z-30 bg-fuchsia-950/90 border-b border-fuchsia-500/60 px-4 py-2 text-center text-xs text-fuchsia-200 font-mono font-medium flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-fuchsia-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>
            <strong>MASKING DETECTED</strong> &mdash; face appears calm but lip content indicates a threat
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-300">
            D_cross: {currentThreat.D_cross}
          </span>
        </div>
      )}

      {/* 3. Resting Face Calibration Countdown Overlay */}
      {isCalibrating && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center border-2 border-rose-500 animate-pulse">
          <div className="text-rose-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
            INITIAL RESTING FACE CALIBRATION
          </div>
          <div className="text-white text-lg sm:text-xl font-medium max-w-md">
            Hold a neutral relaxed face for 3 seconds
          </div>
          <div className="mt-4 font-mono text-5xl font-extrabold text-rose-400">
            {calibrationCountdown}
          </div>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            Capturing neutral resting baseline to zero-reference emotion and mouth movement
          </p>
        </div>
      )}

      {/* 4. Thin 1px Indigo Face Bounding Box Drawn On Video */}
      <div
        className={`absolute pointer-events-none transition-all duration-75 ${
          isMasking
            ? 'pulsing-violet-box rounded-[6px]'
            : 'border border-[#5b5bd6] rounded-[4px]'
        }`}
        style={{
          left: `${(lerpFace.x / 880) * 100}%`,
          top: `${(lerpFace.y / 495) * 100}%`,
          width: '24%',
          height: '52%',
        }}
      >
        {/* Subtle Tag Top-Right of Box */}
        <span
          className={`absolute -top-4 left-0 text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
            isMasking ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/50' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
          }`}
        >
          {isMasking ? 'MASKING' : currentThreat.dominantEmotion}
        </span>
      </div>

      {/* 5. In-Video Readout Panel 1: Anchored to the LEFT of the face box at its top edge */}
      <div
        className="absolute z-20 transition-all duration-75 hidden sm:block"
        style={{
          left: `max(12px, calc(${(lerpFace.x / 880) * 100}% - 178px))`,
          top: `${Math.max(12, (lerpFace.y / 495) * 100)}%`,
        }}
      >
        <InVideoFaceHUD />
      </div>

      {/* Mobile fallback for Face HUD (docks top-left) */}
      <div className="absolute top-2 left-2 z-20 sm:hidden">
        <InVideoFaceHUD />
      </div>

      {/* 6. In-Video Readout Panel 2: Anchored just BELOW the face box over mouth area */}
      <div
        className="absolute z-20 transition-all duration-75 hidden sm:block"
        style={{
          left: `max(12px, calc(${(lerpFace.x / 880) * 100}% - 15px))`,
          top: `min(76%, calc(${(lerpFace.y / 495) * 100}% + 54%))`,
        }}
      >
        <InVideoLipHUD />
      </div>

      {/* Mobile fallback for Lip HUD (docks bottom) */}
      <div className="absolute bottom-2 inset-x-2 z-20 sm:hidden flex justify-center">
        <InVideoLipHUD />
      </div>

      {/* 7. Bottom-Left Inset: Valence/Arousal Circumplex Plot (100px square) */}
      <div className="absolute bottom-3 left-3 z-20 hidden sm:block">
        <CircumplexPlot />
      </div>

      {/* 8. Bottom-Right Inset: Magnified Mouth-ROI Crop */}
      <div className="absolute bottom-3 right-3 z-20 hidden sm:block">
        <MouthCropInset />
      </div>

      {/* Camera Mode Toggle Button (Top-Right HUD) */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={() => setCameraMode(cameraMode === 'real' ? 'simulated' : 'real')}
          className="btn-control px-2.5 py-1 text-xs flex items-center gap-1.5 opacity-80 hover:opacity-100"
          title="Switch between physical webcam and simulated camera"
        >
          <Camera className="w-3.5 h-3.5 text-indigo-400" />
          <span>{cameraMode === 'real' ? 'Simulate Feed' : 'Use Webcam'}</span>
        </button>
      </div>
    </div>
  );
};
