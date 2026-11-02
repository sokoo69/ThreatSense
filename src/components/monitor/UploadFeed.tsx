'use client';

import { ChangeEvent, DragEvent, useId, useRef, useState } from 'react';
import { Pause, Play, Replace, UploadCloud } from 'lucide-react';
import { formatDuration, VIEWPORT_ASPECT } from '../../monitor/layout';
import { MonitorHud } from './MonitorHud';
import type { LoadedClip } from './VideoPanel';
import { useVideoTap } from './useVideoTap';

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|avi)$/i.test(file.name);
}

export function UploadFeed({
  clip,
  onFile,
}: {
  clip: LoadedClip | null;
  onFile: (file: File | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputId = useId();

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoAspect, setVideoAspect] = useState(VIEWPORT_ASPECT);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useVideoTap(videoRef, Boolean(clip));

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    if (!isVideoFile(file)) {
      setMessage(`“${file.name}” is not a video. Choose an MP4 or AVI file.`);
      return;
    }
    setMessage(null);
    setPlaying(false);
    setTime(0);
    setDuration(0);
    setVideoAspect(VIEWPORT_ASPECT);
    onFile(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    takeFile(event.dataTransfer.files[0]);
  };

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    takeFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleUnplayable = () => {
    const isAvi = clip && /\.avi$/i.test(clip.name);
    setMessage(
      isAvi
        ? 'Most browsers cannot play AVI video. Convert this file to MP4 and upload it again.'
        : 'This video could not be played. Try an MP4 file.'
    );
    onFile(null);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const seek = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (videoRef.current) videoRef.current.currentTime = next;
    setTime(next);
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative aspect-video overflow-hidden rounded-lg border bg-black transition-colors ${
          dragging ? 'border-cyan-400' : 'border-slate-700'
        }`}
      >
        {clip ? (
          <video
            ref={videoRef}
            src={clip.url}
            muted
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => {
              const { duration: length, videoWidth, videoHeight } = event.currentTarget;
              setDuration(Number.isFinite(length) ? length : 0);
              if (videoWidth && videoHeight) setVideoAspect(videoWidth / videoHeight);
            }}
            onError={handleUnplayable}
            className="size-full object-contain"
          />
        ) : (
          <label
            htmlFor={inputId}
            className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center hover:bg-slate-900/60"
          >
            <UploadCloud aria-hidden className="size-9 text-slate-400" />
            <span className="text-lg font-semibold text-white">Drop video footage here</span>
            <span className="text-sm text-slate-400">or click to choose an MP4 or AVI file</span>
          </label>
        )}

        {clip && <MonitorHud videoAspect={videoAspect} />}
      </div>

      <input
        id={inputId}
        type="file"
        accept="video/mp4,.mp4,video/x-msvideo,.avi"
        onChange={handlePick}
        className="sr-only"
      />

      {message && (
        <p role="alert" className="mt-2 text-sm font-medium text-amber-300">
          {message}
        </p>
      )}

      {clip && (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="rounded-md bg-slate-100 p-1.5 text-slate-950 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {playing ? (
              <Pause aria-hidden className="size-4" />
            ) : (
              <Play aria-hidden className="size-4" />
            )}
          </button>
          <span className="text-sm tabular-nums text-slate-300">{formatDuration(time)}</span>
          <input
            type="range"
            aria-label="Video position"
            min={0}
            max={duration}
            step="any"
            value={Math.min(time, duration)}
            onChange={seek}
            disabled={!duration}
            className="min-w-0 flex-1 accent-cyan-400"
          />
          <span className="text-sm tabular-nums text-slate-300">{formatDuration(duration)}</span>
          <label
            htmlFor={inputId}
            title={clip.name}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-sm font-medium text-slate-200 hover:border-slate-500 has-focus-visible:outline-2"
          >
            <Replace aria-hidden className="size-4" />
            Replace
          </label>
        </div>
      )}
    </div>
  );
}
