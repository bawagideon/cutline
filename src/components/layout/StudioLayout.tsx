'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';

export function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0B0C0E] text-[#E6E8EB]">
      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 overflow-y-auto">
        {/* Offline Banner */}
        <OfflineBanner />

        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B0C0E] border-b border-[#1B1E24]">
          <div className="flex items-center gap-2">
            <div className="cutline-logo" />
            <span className="text-white font-medium text-sm tracking-tight">Cutline</span>
          </div>
          <div className="text-xs text-[#9CA3AF] font-mono">Ade Okafor · Studio</div>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>

        {/* PWA Install Sheet */}
        <PWAInstallPrompt />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
