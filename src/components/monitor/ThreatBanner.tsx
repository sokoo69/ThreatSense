'use client';

import { CirclePause, ScanFace, ShieldAlert, ShieldCheck, Siren } from 'lucide-react';
import { StandbyReason, ThreatStatus } from '../../monitor/types';
import { useMonitor } from '../../store/useMonitorStore';

const BANNERS: Record<ThreatStatus, { title: string; style: string; Icon: typeof Siren }> = {
  standby: { title: '', style: 'bg-slate-800 text-slate-100', Icon: CirclePause },
  normal: {
    title: 'STATUS: NORMAL / SAFE',
    style: 'bg-emerald-700 text-white',
    Icon: ShieldCheck,
  },
  elevated: {
    title: 'STATUS: ELEVATED / REVIEW',
    style: 'bg-amber-400 text-slate-950',
    Icon: ShieldAlert,
  },
  critical: {
    title: 'STATUS: CRITICAL IMMINENT THREAT',
    style: 'bg-red-700 text-white',
    Icon: Siren,
  },
  deception: {
    title: 'ALERT: DECEPTION DETECTED',
    style: 'threat-flash bg-purple-700 text-white',
    Icon: ScanFace,
  },
};

const STANDBY_TITLES: Record<StandbyReason, string> = {
  streams_off: 'MONITORING PAUSED',
  no_signal: 'NO SIGNAL',
  no_subject: 'NO SUBJECT',
};

export function ThreatBanner() {
  const assessment = useMonitor((state) => state.assessment);
  const { status, score, reason, note, standbyReason } = assessment;
  const { title, style, Icon } = BANNERS[status];

  return (
    <div className={`rounded-lg p-4 lg:p-5 ${style}`}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden className="mt-0.5 size-6 shrink-0" />
        <div className="min-w-0">
          <p role="status" className="text-lg font-bold leading-tight tracking-wide lg:text-xl">
            {standbyReason ? STANDBY_TITLES[standbyReason] : title}
          </p>
          <p className="mt-1 text-sm">{reason}</p>
        </div>
      </div>

      <p className="mt-3 flex items-baseline gap-2 tabular-nums">
        <span className="sr-only">Threat score</span>
        <span className="text-6xl font-black leading-none tracking-tight">{score ?? '—'}</span>
        <span className="text-2xl font-semibold opacity-80">/ 100</span>
      </p>

      {note && <p className="mt-3 text-sm font-medium">{note}</p>}
    </div>
  );
}
