'use client';

import React, { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-[#2D220E] border-b border-[#E5A93C]/40 px-4 py-2 text-xs font-mono text-[#E5A93C] flex items-center justify-between z-50 sticky top-0 cut-in">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#E5A93C] breathe-live" />
        <span>Offline mode · Script drafts saved locally. Video generation, uploads, and publishing require an active connection.</span>
      </div>
      <span className="text-[10px] text-[#9CA3AF] uppercase">Cached Shell</span>
    </div>
  );
}
