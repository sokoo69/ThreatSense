'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';

export const RollingTimelineChart: React.FC = () => {
  const { t } = useTranslation();
  const { timelineData } = useThreatStore();

  // Prepare normalized data for chart: threatPercent is 0-100, while R_e, T_lip, D_cross are scaled to 0-100 for easy visual alignment
  const chartPoints = timelineData.map((d) => ({
    time: d.time,
    threatPercent: d.threatPercent,
    R_e: Math.round(d.R_e * 100),
    T_lip: Math.round(d.T_lip * 100),
    D_cross: Math.round(d.D_cross * 100),
    isMasking: d.isMasking,
  }));

  return (
    <div className="soc-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">{t('timeline.title')}</h3>
            <p className="text-[11px] text-slate-400 font-mono">{t('timeline.subtitle')}</p>
          </div>
        </div>

        <div className="text-right text-[11px] font-mono text-slate-400">
          WINDOW: <span className="text-cyan-400">LAST 35 TICKS</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="dcrossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={[0, 100]}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
                      <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1">
                        Time: {label}
                      </div>
                      <div className="flex justify-between gap-4 text-rose-400 font-bold">
                        <span>Threat Score:</span>
                        <span>{data.threatPercent}%</span>
                      </div>
                      <div className="flex justify-between gap-4 text-cyan-400">
                        <span>Emotion Risk (R_e):</span>
                        <span>{(data.R_e / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-teal-400">
                        <span>Lip Threat (T_lip):</span>
                        <span>{(data.T_lip / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-fuchsia-400 font-semibold">
                        <span>Discrepancy (D_cross):</span>
                        <span>{(data.D_cross / 100).toFixed(2)}</span>
                      </div>
                      {data.isMasking && (
                        <div className="pt-1 mt-1 border-t border-fuchsia-900 text-fuchsia-300 font-bold">
                          [!] MASKING DETECTED
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />

            {/* Composite Threat Score Area */}
            <Area
              type="monotone"
              dataKey="threatPercent"
              name="Threat %"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#threatGradient)"
            />

            {/* Cross-Modal Discrepancy */}
            <Area
              type="monotone"
              dataKey="D_cross"
              name="D_cross % (Masking)"
              stroke="#d946ef"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#dcrossGradient)"
            />

            {/* Stream A Emotion Risk (Scaled 0-100) */}
            <Line
              type="monotone"
              dataKey="R_e"
              name="R_e (Face %)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              dot={false}
            />

            {/* Stream B Lip Threat (Scaled 0-100) */}
            <Line
              type="monotone"
              dataKey="T_lip"
              name="T_lip (Lips %)"
              stroke="#2dd4bf"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
