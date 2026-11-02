import { Assessment, Box, Incident } from './types';

export const MAX_INCIDENTS = 200;

/** While a situation continues, repeat its log row at this interval instead of every frame. */
export const REPEAT_AFTER_MS = 30_000;

/**
 * Decides whether this assessment gets a log row. Frames arrive every second or faster,
 * so each status and word pair is logged once, then again only if it is still happening
 * after REPEAT_AFTER_MS. A preset click passes `force` so it always adds a row.
 */
export function shouldLog(
  assessment: Assessment,
  now: number,
  lastLogged: Map<string, number>,
  force = false
): boolean {
  const { status, speech } = assessment;
  if (status === 'standby') return false;
  if (status === 'normal' && !force) return false;

  const key = `${status}|${speech?.word ?? ''}`;
  const previous = lastLogged.get(key);
  if (!force && previous !== undefined && now - previous < REPEAT_AFTER_MS) return false;

  lastLogged.set(key, now);
  return true;
}

export function buildIncident(
  id: number,
  assessment: Assessment,
  details: {
    timestamp: number;
    source: string;
    snapshot: string | null;
    faceBox: Box | null;
    lipBox: Box | null;
  }
): Incident | null {
  const { status, score } = assessment;
  if (status === 'standby' || score === null) return null;

  return {
    id,
    ...details,
    emotion: assessment.emotion?.label ?? null,
    word: assessment.speech?.word ?? null,
    romanized: assessment.speech?.romanized ?? null,
    translation: assessment.speech?.translation ?? null,
    discrepancy: assessment.discrepancy,
    score,
    status,
    reason: assessment.reason,
  };
}

export const STATUS_LABELS: Record<Incident['status'], string> = {
  normal: 'Normal',
  elevated: 'Elevated',
  critical: 'Critical',
  deception: 'Deception Alert',
};

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US');
}

/**
 * Spreadsheets run any text cell starting with these characters as a formula, and
 * file names come from outside the system, so such cells are neutralized with a quote.
 */
function csvCell(value: string | number | null): string {
  if (value === null) return '';
  if (typeof value === 'number') return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function incidentsToCsv(incidents: Incident[]): string {
  const header = [
    'Date',
    'Time',
    'Source',
    'Dominant Emotion',
    'Decoded Speech',
    'Romanized',
    'Translation',
    'Discrepancy',
    'Threat Score',
    'Status',
    'Reason',
  ];

  const rows = incidents.map((incident) =>
    [
      new Date(incident.timestamp).toISOString().slice(0, 10),
      formatTime(incident.timestamp),
      incident.source,
      incident.emotion,
      incident.word,
      incident.romanized,
      incident.translation,
      incident.discrepancy,
      incident.score,
      STATUS_LABELS[incident.status],
      incident.reason,
    ]
      .map(csvCell)
      .join(',')
  );

  // The byte order mark makes Excel read the Bengali text as UTF-8.
  return `﻿${[header.map(csvCell).join(','), ...rows].join('\r\n')}\r\n`;
}

export function downloadCsv(incidents: Incident[], filename: string): void {
  const url = URL.createObjectURL(
    new Blob([incidentsToCsv(incidents)], { type: 'text/csv;charset=utf-8;' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
