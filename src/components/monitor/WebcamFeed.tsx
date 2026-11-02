'use client';

import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { VIEWPORT_ASPECT } from '../../monitor/layout';
import { MonitorHud } from './MonitorHud';
import { useVideoTap } from './useVideoTap';

type CameraState = 'off' | 'starting' | 'on';

function cameraErrorMessage(error: unknown): string {
  switch (error instanceof DOMException ? error.name : '') {
    case 'NotAllowedError':
      return 'Camera access is blocked. Allow it in your browser settings and try again.';
    case 'NotFoundError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
      return 'The camera is being used by another app.';
    default:
      return 'The camera could not be started.';
  }
}

function SubjectPlaceholder() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 size-full text-slate-800"
      fill="currentColor"
    >
      <ellipse cx="80" cy="35" rx="15" ry="20" />
      <path d="M46 90c0-17 12-26 25-27l9 5 9-5c13 1 25 10 25 27z" />
    </svg>
  );
}

export function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Changes whenever the camera is stopped, so a slow permission prompt that
  // resolves afterwards can tell it is out of date and release the camera.
  const requestRef = useRef(0);

  const [camera, setCamera] = useState<CameraState>('off');
  const [videoAspect, setVideoAspect] = useState(VIEWPORT_ASPECT);
  const [error, setError] = useState<string | null>(null);

  useVideoTap(videoRef, camera === 'on');

  const releaseCamera = () => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => releaseCamera, []);

  const stopCamera = () => {
    releaseCamera();
    setCamera('off');
    setVideoAspect(VIEWPORT_ASPECT);
  };

  const startCamera = async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access needs a secure page (HTTPS or localhost).');
      return;
    }

    setCamera('starting');
    const request = ++requestRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopCamera();
        setError('The camera was disconnected.');
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera('on');
    } catch (caught) {
      if (request !== requestRef.current) return;
      setCamera('off');
      setError(cameraErrorMessage(caught));
    }
  };

  const isOn = camera === 'on';

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-700 bg-black">
      {!isOn && <SubjectPlaceholder />}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={(event) => {
          const { videoWidth, videoHeight } = event.currentTarget;
          if (videoWidth && videoHeight) setVideoAspect(videoWidth / videoHeight);
        }}
        className={`size-full object-contain ${isOn ? '' : 'hidden'}`}
      />

      <MonitorHud videoAspect={videoAspect} />

      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
        <span className="rounded bg-slate-950/80 px-2 py-1 text-xs font-semibold text-slate-200">
          Live Cam 01
          {!isOn && <span className="hidden sm:inline"> · Camera off</span>}
        </span>
        <button
          type="button"
          onClick={isOn ? stopCamera : startCamera}
          disabled={camera === 'starting'}
          className="flex shrink-0 items-center gap-2 rounded-md bg-slate-100 p-1.5 text-sm sm:px-3 font-semibold text-slate-950 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-60"
        >
          {isOn ? (
            <VideoOff aria-hidden className="size-4" />
          ) : (
            <Video aria-hidden className="size-4" />
          )}
          <span className="sr-only sm:not-sr-only">
            {isOn ? 'Stop Camera' : camera === 'starting' ? 'Starting…' : 'Start Camera'}
          </span>
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="absolute left-3 top-14 max-w-sm rounded bg-red-950/90 px-3 py-2 text-sm text-red-100"
        >
          {error}
        </p>
      )}
    </div>
  );
}
