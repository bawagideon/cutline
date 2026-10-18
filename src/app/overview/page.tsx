'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function OverviewPage() {
  const [viewMode, setViewMode] = useState<'active' | 'welcome'>('active');

  return (
    <StudioLayout>
      {/* View Switcher for Audit & Inspection (Screen 4 vs Screen 32) */}
      <div className="flex items-center justify-end gap-2 mb-4 text-xs font-mono">
        <span className="text-[#6B7280]">View:</span>
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-2.5 py-1 rounded-lg ${
            viewMode === 'active'
              ? 'bg-[#181B20] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Active Studio (Screen 4)
        </button>
        <button
          type="button"
          onClick={() => setViewMode('welcome')}
          className={`px-2.5 py-1 rounded-lg ${
            viewMode === 'welcome'
              ? 'bg-[#181B20] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Welcome / Empty (Screen 32)
        </button>
      </div>

      {viewMode === 'welcome' ? (
        /* Screen 32: First-Time User Welcome Dashboard */
        <div className="max-w-4xl space-y-8 py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome, Ade
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1 font-mono">
              Nothing here yet. Real numbers appear after your first job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card 1: New Project */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">New project</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Start a project. Blank or from a sample template.
                </p>
              </div>
              <Link
                href="/projects/new"
                className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2.5 rounded-xl text-center transition-colors"
              >
                Create
              </Link>
            </div>

            {/* Action Card 2: Readiness */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold text-white">Readiness</h2>
                  <span className="text-xs font-mono text-[#E5A93C]">1 of 6 complete</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Finish setting up your workspace checklist.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="border border-[#2E333D] hover:bg-[#181B20] text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors"
              >
                Continue setup →
              </Link>
            </div>

            {/* Action Card 3: Connect Gemini */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connect Gemini</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Needed for AI script generation, beat outlines, and revision diffs.
                </p>
              </div>
              <Link
                href="/integrations"
                className="bg-[#181B20] hover:bg-[#22262E] border border-[#2E333D] text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors"
              >
                Connect
              </Link>
            </div>

            {/* Action Card 4: Connect YouTube */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connect YouTube</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Only when you want to publish. Can be completed at any time.
                </p>
              </div>
              <Link
                href="/channels"
                className="border border-[#2E333D] hover:bg-[#181B20] text-[#9CA3AF] hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors"
              >
                Later
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 4: Active Command Overview */
        <>
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
    </>
  )}
</StudioLayout>
  );
}
