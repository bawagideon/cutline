'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';

interface EpisodeAnalytic {
  ep: string;
  project: string;
  published: string;
  views: string;
  retention: string;
  likes: string;
}

export default function AnalyticsPage() {
  const [episodesAnalytics] = useState<EpisodeAnalytic[]>([]);

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 cut-in">
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Total Views
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">0</div>
          <div className="text-xs font-mono text-[#9CA3AF] mt-1">
            0 vs last period
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Watch Time
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">0.0 hrs</div>
          <div className="text-xs font-mono text-[#9CA3AF] mt-1">
            awaiting first release
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Avg Duration
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">0m 00s</div>
          <div className="text-xs font-mono text-[#9CA3AF] mt-1">
            0% completion rate
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Publish Lead Time
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">0.0 days</div>
          <div className="text-xs font-mono text-[#9CA3AF] mt-1">
            idea to publish
          </div>
        </div>
      </div>

      {/* Performance Chart / Empty State */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-8 cut-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">Views Velocity</h2>
          <span className="text-xs font-mono text-[#9CA3AF]">Awaiting published releases</span>
        </div>

        <div className="h-32 flex items-center justify-center text-center p-6 border border-dashed border-[#22262E] rounded-xl text-xs text-[#9CA3AF] font-mono">
          Connect your YouTube channel in Integrations to stream live video views and retention data.
        </div>
      </div>

      {/* Episodes Table */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028] cut-in">
        <div className="p-4 px-6 bg-[#0E1013] text-xs font-mono text-[#9CA3AF] hidden md:grid md:grid-cols-12 gap-4">
          <div className="col-span-5">Episode & Series</div>
          <div className="col-span-2">Published</div>
          <div className="col-span-2">Views</div>
          <div className="col-span-3">Retention / Likes</div>
        </div>

        {episodesAnalytics.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#1A1D23] border border-[#22262E] flex items-center justify-center text-xl text-[#60A5FA] mx-auto mb-4 font-mono">
              📈
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No publishing analytics yet</h3>
            <p className="text-xs text-[#9CA3AF] mb-6 leading-relaxed">
              Once videos are approved through the review gate and published to YouTube, detailed viewer demographics and completion retention will appear here.
            </p>
            <Link
              href="/channels"
              className="inline-flex items-center gap-2 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors btn-press shadow-md"
            >
              Connect YouTube Channel
            </Link>
          </div>
        ) : (
          episodesAnalytics.map((item, idx) => (
            <div
              key={idx}
              className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center hover:bg-[#15181D] transition-colors"
            >
              <div className="md:col-span-5">
                <div className="text-sm font-semibold text-white">{item.ep}</div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">{item.project}</div>
              </div>

              <div className="md:col-span-2 text-xs font-mono text-[#9CA3AF]">
                {item.published}
              </div>

              <div className="md:col-span-2 text-sm font-mono font-bold text-white">
                {item.views}
              </div>

              <div className="md:col-span-3 text-xs font-mono flex items-center gap-4">
                <span className="text-[#34D399]">{item.retention} retention</span>
                <span className="text-[#9CA3AF]">♥ {item.likes}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </StudioLayout>
  );
}
