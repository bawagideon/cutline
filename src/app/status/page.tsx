'use client';

import React from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/StatusPill';

export default function StatusPage() {
  const systems = [
    { name: 'Web app', status: 'Operational', variant: 'green' as const, uptime: '99.98%' },
    { name: 'Production worker fleet', status: 'Operational', variant: 'green' as const, uptime: '99.95%' },
    { name: 'Supabase PostgreSQL database', status: 'Operational', variant: 'green' as const, uptime: '100.0%' },
    { name: 'YouTube publishing API', status: 'Operational', variant: 'green' as const, uptime: '99.90%' },
    { name: 'PixVerse rendering API', status: 'Degraded, upstream', variant: 'amber' as const, uptime: '97.40%' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-[#1B1E24] px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="cutline-logo" />
          <span className="text-white font-medium text-base tracking-tight">Cutline</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs text-[#9CA3AF]">
          <Link href="/" className="hover:text-white transition-colors">Product</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/status" className="text-white font-medium">Status</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16">
        {/* Status Headline (Screen 26) */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#E5A93C] animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              All core systems operational
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#9CA3AF] font-mono">
            One upstream provider is degraded. Updated 1 minute ago.
          </p>
        </div>

        {/* Systems List */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028] mb-10">
          {systems.map((s, idx) => (
            <div
              key={idx}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#15181D] transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-white">{s.name}</div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                  Uptime 30d: {s.uptime}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusPill label={s.status} variant={s.variant} />
              </div>
            </div>
          ))}
        </div>

        {/* 30-Day Timeline Visual */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF]">
              System Health · Last 30 Days
            </h2>
            <span className="text-xs font-mono text-[#34D399]">99.85% avg</span>
          </div>

          <div className="flex items-center gap-1.5 h-8">
            {Array.from({ length: 30 }).map((_, i) => {
              const isDegraded = i === 24; // recent upstream degraded day
              return (
                <div
                  key={i}
                  title={`Day ${30 - i} days ago: ${isDegraded ? 'Upstream degraded' : 'Operational'}`}
                  className={`flex-1 h-full rounded-sm transition-transform hover:scale-110 ${
                    isDegraded ? 'bg-[#E5A93C]' : 'bg-[#34D399]/80'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] font-mono text-[#6B7280] mt-3">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </main>
    </div>
  );
}
