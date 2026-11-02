'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatTime, STATUS_LABELS } from '../../monitor/incidents';
import { Incident } from '../../monitor/types';
import { DetectionOverlay } from './DetectionOverlay';
import { STATUS_BADGES } from './statusBadges';

export function SnapshotDialog({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Snapshot from ${formatTime(incident.timestamp)}`}
      className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100 backdrop:bg-slate-950/80"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_BADGES[incident.status]}`}
          >
            {STATUS_LABELS[incident.status]}
          </span>
          <span className="font-semibold tabular-nums">{incident.score}/100</span>
          <span className="text-sm tabular-nums text-slate-300">
            {formatTime(incident.timestamp)}
          </span>
          <span className="text-sm text-slate-300">{incident.source}</span>
        </div>
        <button
          type="button"
          aria-label="Close snapshot"
          onClick={() => dialogRef.current?.close()}
          className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      {incident.snapshot ? (
        <div className="relative overflow-hidden rounded-md">
          {/* A data URL held in memory, so next/image has nothing to optimize. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={incident.snapshot} alt="Video frame at the time of the event" className="w-full" />
          <DetectionOverlay faceBox={incident.faceBox} lipBox={incident.lipBox} />
        </div>
      ) : (
        <p className="rounded-md bg-slate-950 px-4 py-10 text-center text-sm text-slate-300">
          No picture was saved because no video was playing when this event was recorded.
        </p>
      )}

      <p className="mt-3 text-sm text-slate-200">{incident.reason}</p>
    </dialog>
  );
}
