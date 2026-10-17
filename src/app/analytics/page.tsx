'use client';

import React from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';

export default function AnalyticsPage() {
  const episodesAnalytics = [
    {
      ep: 'EP 06 · The Midnight Market',
      project: 'Lagos After Dark',
      published: 'Oct 15',
      views: '42.8K',
      retention: '62%',
      likes: '3.1K',
    },
    {
      ep: 'EP 05 · Yellow Fever Traffic',
      project: 'Lagos After Dark',
      published: 'Oct 08',
      views: '38.1K',
      retention: '58%',
      likes: '2.8K',
    },
    {
      ep: 'EP 02 · Shibuya Rain',
      project: 'Tokyo Neon Stories',
      published: 'Oct 04',
      views: '34.9K',
      retention: '51%',
      likes: '2.4K',
    },
    {
      ep: 'EP 01 · Akihabara Memories',
      project: 'Tokyo Neon Stories',
      published: 'Sep 28',
      views: '32.4K',
      retention: '49%',
      likes: '2.1K',
    },
  ];

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Analytics
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Audience engagement & production throughput across all channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121417] border border-[#22262E] px-3.5 py-1.5 rounded-lg text-xs font-mono text-white">
            Last 30 days
          </div>
        </div>
      </div>

      {/* KPI Cards (Screen 20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Total Views
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">148.2K</div>
          <div className="text-xs font-mono text-[#34D399] mt-1">
            ↑ +18.4% vs last period
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Watch Time
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">6,120 hrs</div>
          <div className="text-xs font-mono text-[#34D399] mt-1">
            ↑ +12.1%
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Avg Duration
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">5m 12s</div>
          <div className="text-xs font-mono text-[#E5A93C] mt-1">
            54% completion rate
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Publish Lead Time
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">1.8 days</div>
          <div className="text-xs font-mono text-[#9CA3AF] mt-1">
            idea to publish
          </div>
        </div>
      </div>

      {/* Performance Chart Simulation */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">Views Velocity</h2>
          <span className="text-xs font-mono text-[#E5A93C]">Lagos After Dark (Leading)</span>
        </div>

        {/* Visual Waveform / Bar Representation */}
        <div className="h-44 flex items-end gap-2 pt-6">
          {[35, 42, 38, 55, 68, 74, 62, 85, 92, 80, 98, 110, 105, 124, 138, 148].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div
                style={{ height: `${(val / 150) * 100}%` }}
                className="w-full bg-[#1F242D] group-hover:bg-[#E5A93C] rounded-t-md transition-all duration-200"
              />
              <span className="text-[10px] font-mono text-[#6B7280] hidden sm:block">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Published Episodes List */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028]">
        {episodesAnalytics.map((ep, idx) => (
          <div
            key={idx}
            className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#15181D] transition-colors"
          >
            <div>
              <div className="text-sm font-semibold text-white">{ep.ep}</div>
              <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                {ep.project} · Published {ep.published}
              </div>
            </div>

            <div className="flex items-center gap-6 self-end md:self-center text-xs font-mono">
              <div>
                <span className="text-white font-semibold">{ep.views}</span>
                <span className="text-[#6B7280] ml-1">views</span>
              </div>
              <div>
                <span className="text-[#34D399] font-semibold">{ep.retention}</span>
                <span className="text-[#6B7280] ml-1">retention</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-semibold">{ep.likes}</span>
                <span className="text-[#6B7280] ml-1">likes</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </StudioLayout>
  );
}
