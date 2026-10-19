'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface ChannelItem {
  id: string;
  name: string;
  handle: string;
  channelId: string;
  status: 'Active' | 'Revoked' | 'Expires soon';
  defaultVisibility: string;
  errorMessage?: string;
}

export default function YouTubeChannelsPage() {
  const [channels] = useState<ChannelItem[]>([]);
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnect = () => {
    setReconnecting(true);
    setTimeout(() => {
      setReconnecting(false);
      alert('OAuth consent screen redirected. Token restored.');
    }, 1000);
  };

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            YouTube channels
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            {channels.length} connected publishing endpoints · Google OAuth 2.0
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/integrations"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors btn-press shadow-sm"
          >
            Connect channel
          </Link>
        </div>
      </div>

      {/* Quota Tracking Card */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-8 cut-in">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-white font-medium">Daily YouTube API v3 Quota</span>
          <span className="text-[#9CA3AF]">
            {channels.length > 0 ? '0 / 10,000 units (0%)' : '0 / 10,000 units'}
          </span>
        </div>
        <div className="w-full h-2 bg-[#0B0C0E] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-[#E5A93C] rounded-full w-0" />
        </div>
        <div className="text-xs text-[#9CA3AF] font-mono flex items-center justify-between">
          <span>Uploads: 0 completed today</span>
          <span>Quota resets at 00:00 PST</span>
        </div>
      </div>

      {/* Channels List */}
      <div className="space-y-4 cut-in">
        {channels.length === 0 ? (
          <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-12 text-center max-w-xl mx-auto my-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1D23] border border-[#22262E] flex items-center justify-center text-xl text-[#F87171] mx-auto mb-4">
              ▶
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No YouTube channels connected</h3>
            <p className="text-xs md:text-sm text-[#9CA3AF] mb-6 leading-relaxed">
              Link your YouTube channel via Google OAuth 2.0 to publish videos, upload custom thumbnails, and schedule episodic drops.
            </p>
            <Link
              href="/integrations"
              className="inline-flex items-center gap-2 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors btn-press shadow-md"
            >
              Configure in Integrations
            </Link>
          </div>
        ) : (
          channels.map((ch) => (
            <div
              key={ch.id}
              className={`bg-[#121417] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
                ch.status === 'Revoked' ? 'border-[#EF4444]/40' : 'border-[#22262E]'
              }`}
            >
              <div className="flex items-start md:items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    ch.status === 'Revoked'
                      ? 'bg-[#2E1419] border border-[#52222B] text-[#EF4444]'
                      : 'bg-[#181B20] border border-[#2E333D] text-[#E5A93C]'
                  }`}
                >
                  {ch.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-white">{ch.name}</span>
                    <StatusPill
                      label={ch.status}
                      variant={ch.status === 'Active' ? 'green' : ch.status === 'Revoked' ? 'red' : 'amber'}
                    />
                  </div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                    {ch.handle} · ID: {ch.channelId} · Default: {ch.defaultVisibility}
                  </div>
                  {ch.errorMessage && (
                    <div className="text-xs text-[#EF4444] mt-2 font-mono">{ch.errorMessage}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {ch.status === 'Revoked' ? (
                  <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                  >
                    {reconnecting ? 'Reconnecting...' : 'Reconnect account'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-2 rounded-lg transition-colors"
                    >
                      Test permissions
                    </button>
                    <button
                      type="button"
                      className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-2 rounded-lg transition-colors"
                    >
                      Settings
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </StudioLayout>
  );
}
