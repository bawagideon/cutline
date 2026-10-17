'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface AssetFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'captions';
  format: string;
  size: string;
  resolution?: string;
  visibility: 'private' | 'public';
}

export default function EpisodeAssetsPage() {
  const params = useParams();
  const id = params?.id || 'lagos-after-dark';
  const epId = params?.epId || '7';

  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'audio' | 'image' | 'captions'>('all');

  const assets: AssetFile[] = [
    { id: '1', name: 'Scene 01', type: 'video', format: 'mp4', size: '48 MB', resolution: '1080p', visibility: 'private' },
    { id: '2', name: 'Scene 02', type: 'video', format: 'mp4', size: '61 MB', resolution: '1080p', visibility: 'private' },
    { id: '3', name: 'Scene 03', type: 'video', format: 'mp4', size: '52 MB', resolution: '1080p', visibility: 'private' },
    { id: '4', name: 'Narration', type: 'audio', format: 'wav', size: '88 MB', visibility: 'private' },
    { id: '5', name: 'Score', type: 'audio', format: 'mp3', size: '9 MB', visibility: 'private' },
    { id: '6', name: 'Thumbnail', type: 'image', format: 'png', size: '2 MB', resolution: '1280x720', visibility: 'private' },
    { id: '7', name: 'Captions', type: 'captions', format: 'srt', size: '12 KB', visibility: 'private' },
    { id: '8', name: 'Rough cut', type: 'video', format: 'mp4', size: '290 MB', resolution: '1080p', visibility: 'private' },
  ];

  const filteredAssets = activeFilter === 'all'
    ? assets
    : assets.filter((a) => a.type === activeFilter);

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Episode assets
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            EP {epId.toString().padStart(2, '0')} · 14 files · 612 MB
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/episodes/${epId}`}
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors"
          >
            ← Episode
          </Link>
          <button
            type="button"
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors"
          >
            Upload
          </button>
          <button
            type="button"
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors"
          >
            Download all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#1B1E24] pb-3">
        {(['all', 'video', 'audio', 'image', 'captions'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`capitalize text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
              activeFilter === tab
                ? 'bg-[#181B20] text-white border border-[#2E333D]'
                : 'text-[#9CA3AF] hover:text-[#E6E8EB] hover:bg-[#121417]'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Assets Grid (Screen 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-[#121417] border border-[#22262E] hover:border-[#2E333D] rounded-2xl overflow-hidden flex flex-col justify-between transition-all group"
          >
            {/* Visual Thumbnail Placeholder */}
            <div className="h-36 bg-[#0B0C0E] border-b border-[#1C2028] relative flex items-center justify-center p-4">
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[#181B20] text-[#9CA3AF] border border-[#2E333D]">
                {asset.format}
              </span>
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#6B7280]">
                {asset.resolution ? `${asset.resolution}` : ''}
              </div>
            </div>

            {/* Meta Row */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-[#E5A93C] transition-colors">
                  {asset.name}
                </div>
                <div className="text-xs font-mono text-[#9CA3AF] mt-0.5">
                  {asset.size}
                </div>
              </div>

              <StatusPill label={asset.visibility} variant="green" />
            </div>
          </div>
        ))}
      </div>
    </StudioLayout>
  );
}
