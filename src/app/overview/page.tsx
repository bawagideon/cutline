'use client';

import React from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function OverviewPage() {
  return (
    <StudioLayout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Good evening, Ade</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Three things need you. Two jobs are running.</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors self-start md:self-auto"
        >
          New project
        </Link>
      </div>

      {/* Top 4 Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">IN PRODUCTION</div>
          <div className="text-3xl font-bold text-white mb-2">3</div>
          <div className="text-xs text-[#9CA3AF] font-mono">2 running, 1 queued</div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">NEEDS REVIEW</div>
          <div className="text-3xl font-bold text-white mb-2">2</div>
          <div className="text-xs text-[#9CA3AF] font-mono">oldest 3h ago</div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">SCHEDULED</div>
          <div className="text-3xl font-bold text-white mb-2">4</div>
          <div className="text-xs text-[#9CA3AF] font-mono">next Fri 18:00 WAT</div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">SPEND, OCT</div>
          <div className="text-3xl font-bold text-white mb-2">$38.40</div>
          <div className="text-xs text-[#34D399] font-mono">provider-reported</div>
        </div>
      </div>

      {/* Main Grid: Needs Attention vs Upcoming & Connections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Attention & Processing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Attention */}
          <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Needs your attention</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E]">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#F87171] mt-1.5" />
                  <div>
                    <div className="text-sm font-medium text-white">EP 07 awaiting final review</div>
                    <div className="text-xs text-[#9CA3AF]">Lagos After Dark</div>
                  </div>
                </div>
                <Link
                  href="/projects/lagos-after-dark/episodes/7/review"
                  className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors"
                >
                  Review
                </Link>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E]">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#F87171] mt-1.5" />
                  <div>
                    <div className="text-sm font-medium text-white">Scene 4 render failed</div>
                    <div className="text-xs text-[#9CA3AF]">Provider rejected duration</div>
                  </div>
                </div>
                <Link
                  href="/projects/lagos-after-dark/episodes/7/scenes"
                  className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors"
                >
                  Retry
                </Link>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E]">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#FBBF24] mt-1.5" />
                  <div>
                    <div className="text-sm font-medium text-white">Thumbnail missing for EP 06</div>
                    <div className="text-xs text-[#9CA3AF]">Needed before scheduling</div>
                  </div>
                </div>
                <Link
                  href="/projects/lagos-after-dark/episodes/7/assets"
                  className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors"
                >
                  Add
                </Link>
              </div>
            </div>

            {/* Processing Now */}
            <h3 className="text-sm font-semibold text-white mt-8 mb-4">Processing now</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                <span className="text-sm text-white">EP 08 · scene 3 of 7</span>
                <div className="flex items-center gap-3">
                  <StatusPill label="waiting_for_provider" variant="blue" />
                  <span className="text-xs text-[#9CA3AF] font-mono">updated 40s ago</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white">EP 05 · assembling</span>
                <div className="flex items-center gap-3">
                  <StatusPill label="running" variant="blue" />
                  <span className="text-xs text-[#9CA3AF] font-mono">updated 2m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Upcoming & Connections */}
        <div className="space-y-6">
          {/* Upcoming Card */}
          <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Upcoming</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                <span className="text-sm text-white">EP 06 · Fri 18:00</span>
                <StatusPill label="Scheduled" variant="green" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                <span className="text-sm text-white">EP 05 · Sun 09:00</span>
                <StatusPill label="Scheduled" variant="green" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white">EP 04 · draft</span>
                <StatusPill label="Draft" variant="gray" />
              </div>
            </div>

            {/* Connections Health */}
            <h3 className="text-sm font-semibold text-white mt-8 mb-4">Connections</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                <span className="text-sm text-white">YouTube token</span>
                <StatusPill label="expires soon" variant="amber" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white">PixVerse</span>
                <StatusPill label="healthy" variant="green" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
