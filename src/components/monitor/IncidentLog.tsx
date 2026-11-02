'use client';

import { useState } from 'react';
import { Camera, Download } from 'lucide-react';
import { downloadCsv, formatTime, STATUS_LABELS } from '../../monitor/incidents';
import { Incident } from '../../monitor/types';
import { useMonitor } from '../../store/useMonitorStore';
import { SnapshotDialog } from './SnapshotDialog';
import { STATUS_BADGES } from './statusBadges';

const COLUMNS = [
  'Time',
  'Source',
  'Dominant Emotion',
  'Decoded Speech',
  'Discrepancy',
  'Threat Score',
  'Status',
  'Actions',
];

const ROW_BUTTON =
  'flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400';

export function IncidentLog() {
  const incidents = useMonitor((state) => state.incidents);
  const [viewing, setViewing] = useState<Incident | null>(null);

  return (
    <section
      aria-labelledby="incident-log-title"
      className="rounded-lg border border-slate-800 bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
        <h2 id="incident-log-title" className="font-semibold text-white">
          Threat Audit &amp; Incident Log
        </h2>
        {incidents.length > 0 && (
          <button
            type="button"
            onClick={() => downloadCsv(incidents, 'threatsense-incidents.csv')}
            className={ROW_BUTTON}
          >
            <Download aria-hidden className="size-3.5" />
            Export All
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-900 text-xs text-slate-400">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-t border-slate-800">
                <td className="whitespace-nowrap px-4 py-2 tabular-nums text-slate-300">
                  {formatTime(incident.timestamp)}
                </td>
                <td className="max-w-48 truncate px-4 py-2 text-slate-300" title={incident.source}>
                  {incident.source}
                </td>
                <td className="px-4 py-2 text-slate-100">{incident.emotion ?? '–'}</td>
                <td className="px-4 py-2 font-medium text-white">{incident.word ?? '–'}</td>
                <td className="px-4 py-2 tabular-nums text-slate-300">
                  {incident.discrepancy?.toFixed(2) ?? '–'}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-semibold tabular-nums text-white">
                  {incident.score}/100
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${STATUS_BADGES[incident.status]}`}
                  >
                    {STATUS_LABELS[incident.status]}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewing(incident)}
                      className={ROW_BUTTON}
                    >
                      <Camera aria-hidden className="size-3.5" />
                      <span className="whitespace-nowrap">View Snapshot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadCsv([incident], `threatsense-incident-${incident.id}.csv`)
                      }
                      className={ROW_BUTTON}
                    >
                      <Download aria-hidden className="size-3.5" />
                      <span className="whitespace-nowrap">Export CSV</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {incidents.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            No incidents yet. Alerts and demo presets are recorded here.
          </p>
        )}
      </div>

      {viewing && <SnapshotDialog incident={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
