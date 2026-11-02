'use client';

import React, { useEffect, useState } from 'react';
import { useThreatStore } from '../store/useThreatStore';
import '../i18n/config';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isStreaming, tickInference } = useThreatStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Continuous background inference tick loop
  useEffect(() => {
    if (!isMounted) return;

    // Run first inference tick immediately
    tickInference();

    // Loop interval (1.4 seconds per window)
    const interval = setInterval(() => {
      if (isStreaming) {
        tickInference();
      }
    }, 1400);

    return () => clearInterval(interval);
  }, [isMounted, isStreaming, tickInference]);

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#ededee]">
      {children}
    </div>
  );
};
