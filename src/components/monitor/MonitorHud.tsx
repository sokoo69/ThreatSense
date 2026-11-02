'use client';

import { useMonitor } from '../../store/useMonitorStore';
import { DetectionOverlay } from './DetectionOverlay';
import { SubtitleBar } from './SubtitleBar';

/** Detection frames and the subtitle, drawn over whichever video is on screen. */
export function MonitorHud({ videoAspect }: { videoAspect: number }) {
  const faceBox = useMonitor((state) => (state.streams.face ? state.frame?.face?.box : null));
  const lipBox = useMonitor((state) => (state.streams.lip ? state.frame?.lip?.box : null));

  return (
    <>
      <DetectionOverlay
        faceBox={faceBox ?? null}
        lipBox={lipBox ?? null}
        videoAspect={videoAspect}
      />
      <SubtitleBar />
    </>
  );
}
