'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function OverviewPage() {
  const [viewMode, setViewMode] = useState<'active' | 'welcome'>('active');
  const [counts, setCounts] = useState({
    inProduction: 0,
    needsReview: 0,
    scheduled: 0,
    spend: '0.00',
  });
  const [secondsAgo, setSecondsAgo] = useState(40);

  // Number Roll Motif: smoothly animate from cached previous value in 600ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setCounts({
        inProduction: 3,
        needsReview: 2,
        scheduled: 4,
        spend: '38.40',
      });
    }, 100);

    const tickInterval = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 59 ? 1 : prev + 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(tickInterval);
    };
  }, []);

  return (
    <StudioLayout>
      {/* View Switcher for Audit & Inspection (Screen 4 vs Screen 32) */}
      <div className="flex items-center justify-end gap-2 mb-4 text-xs font-mono cut-in">
        <span className="text-[#6B7280]">View:</span>
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-2.5 py-1 rounded-lg transition-colors btn-press ${
            viewMode === 'active'
              ? 'bg-[#1F242D] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Screen 04: Active Command
        </button>
        <button
          type="button"
          onClick={() => setViewMode('welcome')}
          className={`px-2.5 py-1 rounded-lg transition-colors btn-press ${
            viewMode === 'welcome'
              ? 'bg-[#1F242D] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Screen 32: Welcome State
        </button>
      </div>

      {viewMode === 'welcome' ? (
        /* Screen 32: Welcome / Empty State */
        <div className="max-w-4xl mx-auto py-8 cut-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome to Cutline</h1>
            <p className="text-sm text-[#9CA3AF]">
              Four steps to your first published video. You can take them in any order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card 1: New Project (Storyboard Draw) */}
            <div className="bg-[#121417] border border-dashed border-[#E5A93C]/40 hover:border-[#E5A93C] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🎬</span>
                  <h2 className="text-base font-semibold text-white">New project</h2>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Start a project. Blank or from a sample documentary template.
                </p>
              </div>
              <Link
                href="/projects/new"
                className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press shadow-sm"
              >
                Create first project
              </Link>
            </div>

            {/* Action Card 2: Readiness Ring */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    {/* SVG Readiness Ring */}
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#22262E]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#E5A93C]"
                        strokeDasharray="17, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span>Readiness</span>
                  </h2>
                  <span className="text-xs font-mono text-[#E5A93C]">1 of 6 complete</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Finish setting up your workspace checklist to unlock automated publishing.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="border border-[#2E333D] hover:bg-[#181B20] text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press"
              >
                Continue setup →
              </Link>
            </div>

            {/* Action Card 3: Connect Gemini */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connect Gemini</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Needed for AI script generation, beat outlines, and revision diffs.
                </p>
              </div>
              <Link
                href="/integrations"
                className="bg-[#181B20] hover:bg-[#22262E] border border-[#2E333D] text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press"
              >
                Connect in Vault
              </Link>
            </div>

            {/* Action Card 4: Connect YouTube */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connect YouTube</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Only when you want to publish. Can be completed at any time.
                </p>
              </div>
              <Link
                href="/channels"
                className="border border-[#2E333D] hover:bg-[#181B20] text-[#9CA3AF] hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press"
              >
                Connect Channel
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 4: Active Command Overview */
        <div className="cut-in">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Good evening, Ade</h1>
              <p className="text-sm text-[#9CA3AF] mt-1 font-mono">Three things need you. Two jobs are running.</p>
            </div>
            <Link
              href="/projects/new"
              className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors self-start md:self-auto btn-press shadow-md"
            >
              New project
            </Link>
          </div>

          {/* Top 4 Metrics Row with Number Roll & Card Lift */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">IN PRODUCTION</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                {counts.inProduction}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">2 running, 1 queued</div>
            </div>

            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">NEEDS REVIEW</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                {counts.needsReview}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">oldest 3h ago</div>
            </div>

            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">SCHEDULED</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                {counts.scheduled}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">next Fri 18:00 WAT</div>
            </div>

            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">SPEND, OCT</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                ${counts.spend}
              </div>
              <div className="text-xs text-[#34D399] font-mono">provider-reported</div>
            </div>
          </div>

          {/* Main Grid: Needs Attention vs Upcoming & Connections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Attention & Processing */}
            <div className="lg:col-span-2 space-y-6">
              {/* Needs Attention with Attention Breathe Motif */}
              <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Needs your attention</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E] hover:border-[#383E4C] transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] mt-1.5 breathe-live shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
                      <div>
                        <div className="text-sm font-medium text-white">EP 07 awaiting final review</div>
                        <div className="text-xs text-[#9CA3AF] font-mono">Lagos After Dark</div>
                      </div>
                    </div>
                    <Link
                      href="/projects/lagos-after-dark/episodes/7/review"
                      className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors btn-press"
                    >
                      Review
                    </Link>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E] hover:border-[#383E4C] transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F87171] mt-1.5 breathe-live shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
                      <div>
                        <div className="text-sm font-medium text-white">Scene 4 render failed</div>
                        <div className="text-xs text-[#9CA3AF] font-mono">Provider rejected duration</div>
                      </div>
                    </div>
                    <Link
                      href="/projects/lagos-after-dark/episodes/7/scenes"
                      className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors btn-press"
                    >
                      Retry
                    </Link>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E] hover:border-[#383E4C] transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] mt-1.5 breathe-live shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      <div>
                        <div className="text-sm font-medium text-white">Thumbnail missing for EP 06</div>
                        <div className="text-xs text-[#9CA3AF] font-mono">Needed before scheduling</div>
                      </div>
                    </div>
                    <Link
                      href="/projects/lagos-after-dark/episodes/7/assets"
                      className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors btn-press"
                    >
                      Add
                    </Link>
                  </div>
                </div>

                {/* Processing Now (Live Row Swap) */}
                <h3 className="text-sm font-semibold text-white mt-8 mb-4">Processing now</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                    <span className="text-sm text-white">EP 08 · scene 3 of 7</span>
                    <div className="flex items-center gap-3">
                      <StatusPill label="waiting_for_provider" variant="blue" />
                      <span className="text-xs text-[#9CA3AF] font-mono">updated {secondsAgo}s ago</span>
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
              <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
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
        </div>
      )}
    </StudioLayout>
  );
}
