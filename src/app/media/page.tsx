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
  const [items] = useState<MediaItem[]>([]);

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Media library
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            {items.length} items stored in private media vault · SHA-256 verified
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('Select a project episode to upload or generate assets.')}
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors btn-press shadow-sm"
          >
            Upload raw asset
          </button>
        </div>
      </div>

      {/* Storage Quota Card */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5 mb-6 cut-in">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-white font-medium">Supabase Private Storage Bucket</span>
          <span className="text-[#9CA3AF]">
            {items.length > 0 ? '0.0 GB of 50 GB (0%)' : '0 GB of 50 GB (0%)'}
          </span>
        </div>
        <div className="w-full h-2 bg-[#0B0C0E] rounded-full overflow-hidden">
          <div className="h-full bg-[#E5A93C] rounded-full w-0" />
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 cut-in">
        <div className="flex items-center gap-2 border-b border-[#1B1E24] sm:border-0 pb-2 sm:pb-0 w-full sm:w-auto">
          {(['all', 'video', 'audio', 'image'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`capitalize text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors btn-press ${
                filter === tab
                  ? 'bg-[#181B20] text-white border border-[#2E333D]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-3.5 py-1.5 text-xs text-white placeholder-[#6B7280] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Media Items Table / Grid */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028] cut-in">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#1A1D23] border border-[#22262E] flex items-center justify-center text-xl text-[#9CA3AF] mx-auto mb-4">
              📁
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Media library is empty</h3>
            <p className="text-xs text-[#9CA3AF] mb-6 leading-relaxed">
              Rendered scenes, audio stems, and thumbnails will appear here automatically with verified SHA-256 integrity checksums.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#15181D] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">
                  {item.type === 'video' ? '🎬' : item.type === 'audio' ? '🎵' : '🖼️'}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                    {item.project} · {item.size} · SHA-256: {item.sha256}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <span className="text-xs font-mono text-[#6B7280]">
                  {item.createdAt}
                </span>
                <button
                  type="button"
                  className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-mono text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </StudioLayout>
  );
}
