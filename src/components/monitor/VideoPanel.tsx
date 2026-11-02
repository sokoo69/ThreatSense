'use client';

import { useEffect, useRef, useState } from 'react';
import { useMonitor } from '../../store/useMonitorStore';
import { UploadFeed } from './UploadFeed';
import { WebcamFeed } from './WebcamFeed';

export interface LoadedClip {
  name: string;
  url: string;
}

export function VideoPanel() {
  const ingestion = useMonitor((state) => state.ingestion);
  const setUploadName = useMonitor((state) => state.setUploadName);

  // The clip lives here so it survives switching to the live tab and back.
  const [clip, setClip] = useState<LoadedClip | null>(null);
  const clipUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (clipUrl.current) URL.revokeObjectURL(clipUrl.current);
    },
    []
  );

  const loadClip = (file: File | null) => {
    if (clipUrl.current) URL.revokeObjectURL(clipUrl.current);
    clipUrl.current = file ? URL.createObjectURL(file) : null;
    setClip(file && clipUrl.current ? { name: file.name, url: clipUrl.current } : null);
    setUploadName(file?.name ?? null);
  };

  return (
    <section aria-label="Video feed" className="min-w-0">
      {ingestion === 'live' ? <WebcamFeed /> : <UploadFeed clip={clip} onFile={loadClip} />}
    </section>
  );
}
