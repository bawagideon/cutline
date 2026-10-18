'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only prompt after first approved review has demonstrated real value
    const hasApproved = localStorage.getItem('cutline_first_approved') === 'true';
    const dismissedUntil = localStorage.getItem('cutline_pwa_dismissed');

    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (hasApproved) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: If on standalone mode already, don't show
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Dismiss for 30 days as specified
    localStorage.setItem(
      'cutline_pwa_dismissed',
      String(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md bg-[#121417] border border-[#E5A93C]/40 rounded-2xl p-5 shadow-2xl z-50 cut-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="cutline-logo" />
          <h3 className="text-sm font-bold text-white">Install Cutline Studio</h3>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-[#9CA3AF] hover:text-white p-1"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">
        Install as a desktop or mobile application for instant queue notifications, offline drafting, and faster review approvals.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleInstall}
          className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors btn-press shadow-sm"
        >
          Install application
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors font-mono"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
