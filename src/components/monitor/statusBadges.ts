import { Incident } from '../../monitor/types';

export const STATUS_BADGES: Record<Incident['status'], string> = {
  normal: 'bg-emerald-700 text-white',
  elevated: 'bg-amber-400 text-slate-950',
  critical: 'bg-red-700 text-white',
  deception: 'bg-purple-700 text-white',
};
