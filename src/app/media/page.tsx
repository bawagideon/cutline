'use client';

import React, { useState } from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';

interface MediaItem {
  id: string;
  name: string;
  project: string;
  type: 'video' | 'audio' | 'image';
  size: string;
  sha256: string;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [search, setSearch] = useState('');

  const items: MediaItem[] = [
    {
      id: 'm-1',
      name: 'ep07_scene01_oshodi_dawn.mp4',
      project: 'Lagos After Dark',
      type: 'video',
      size: '48.2 MB',
      sha256: '9f83...b41e',
      createdAt: 'Today, 12:41',
    },
    {
      id: 'm-2',
      name: 'ep07_scene02_conductor_interview.mp4',
      project: 'Lagos After Dark',
      type: 'video',
      size: '61.0 MB',
      sha256: '4a1b...29ef',
      createdAt: 'Today, 12:35',
    },
    {
      id: 'm-3',
      name: 'ep07_voiceover_master_narration.wav',
      project: 'Lagos After Dark',
      type: 'audio',
      size: '88.4 MB',
      sha256: '3e7d...991a',
      createdAt: 'Today, 11:20',
    },
    {
      id: 'm-4',
      name: 'ep07_thumbnail_danfo_sunset_v2.png',
      project: 'Lagos After Dark',
      type: 'image',
      size: '2.4 MB',
      sha256: '7c22...880d',
      createdAt: 'Yesterday',
    },
    {
      id: 'm-5',
      name: 'ep01_tokyo_shibuya_intro.mp4',
      project: 'Tokyo Neon Stories',
      type: 'video',
      size: '54.1 MB',
      sha256: '1a90...ef42',
      createdAt: 'Oct 14',
    },
  ];

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.project.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Media library
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            3.4 GB stored across all projects · 240 items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Upload raw asset
          </button>
        </div>
      </div>

      {/* Storage Quota Card */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-white font-medium">Supabase Private Storage Bucket</span>
          <span className="text-[#9CA3AF]">3.4 GB of 50 GB (6.8%)</span>
        </div>
        <div className="w-full h-2 bg-[#0B0C0E] rounded-full overflow-hidden">
          <div className="h-full bg-[#E5A93C] rounded-full w-[6.8%]" />
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 border-b border-[#1B1E24] sm:border-0 pb-2 sm:pb-0 w-full sm:w-auto">
          {(['all', 'video', 'audio', 'image'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`capitalize text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
                filter === tab
                  ? 'bg-[#181B20] text-white border border-[#2E333D]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets or project..."
            className="w-full bg-[#121417] border border-[#22262E] rounded-lg px-3.5 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#E5A93C]"
          />
        </div>
      </div>

      {/* Media Table (Screen 14) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028]">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#15181D] transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0B0C0E] border border-[#22262E] flex items-center justify-center font-mono text-xs uppercase text-[#E5A93C] shrink-0">
                {item.type.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate max-w-sm md:max-w-md">
                  {item.name}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                  {item.project} · {item.createdAt}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-center">
              <span className="text-xs font-mono text-[#9CA3AF]">
                {item.size}
              </span>
              <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-2.5 py-0.5 rounded-full hidden sm:inline">
                sha256:{item.sha256}
              </span>
              <button
                type="button"
                className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </StudioLayout>
  );
}
