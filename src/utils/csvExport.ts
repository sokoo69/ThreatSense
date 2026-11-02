import { ThreatCalculationResult } from '../engine/types';

/**
 * Exports ThreatSense telemetry logs to CSV with UTF-8 BOM.
 * The UTF-8 BOM (\uFEFF) ensures Bengali script (বাংলা হরফ) displays cleanly in Excel and CSV viewers.
 */
export function exportLogsToCSV(
  logs: Array<{
    result: ThreatCalculationResult;
    transcript_bn: string;
    romanized: string;
  }>,
  filename = 'threatsense_telemetry_logs.csv'
) {
  if (typeof window === 'undefined') return;

  const headers = [
    'Timestamp',
    'ISO_Date',
    'Dominant_Emotion',
    'Dominant_Emotion_Prob',
    'Bengali_Transcript',
    'Romanized_Transcript',
    'Detected_Threat_Words',
    'Emotion_Risk_R_e',
    'Lip_Threat_T_lip',
    'Discrepancy_D_cross',
    'Masking_Detected',
    'Threat_Percent',
    'Threat_Band',
  ];

  const escapeCSV = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringVal = String(value).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = logs.map((log) => {
    const res = log.result;
    const wordsList = res.detectedThreatWords
      .map((w) => `${w.word} (${w.romanized}, θ_W=${w.weight})`)
      .join('; ');

    return [
      res.timestamp,
      new Date(res.timestamp).toISOString(),
      res.dominantEmotion,
      res.dominantEmotionProb,
      escapeCSV(log.transcript_bn),
      escapeCSV(log.romanized),
      escapeCSV(wordsList),
      res.R_e,
      res.T_lip,
      res.D_cross,
      res.isMaskingDetected ? 'YES' : 'NO',
      res.threatPercent,
      res.threatBand.toUpperCase(),
    ].join(',');
  });

  // Prepend UTF-8 Byte Order Mark (\uFEFF)
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
