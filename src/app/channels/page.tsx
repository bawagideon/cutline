'use client';

import React, { useState } from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function YouTubeChannelsPage() {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            YouTube channels
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Connected publishing endpoints · Google OAuth 2.0
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Connect channel
          </button>
        </div>
      </div>

      {/* Quota Tracking Card (Screen 16) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-white font-medium">Daily YouTube API v3 Quota</span>
          <span className="text-[#9CA3AF]">3,200 / 10,000 units (32%)</span>
        </div>
        <div className="w-full h-2 bg-[#0B0C0E] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-[#E5A93C] rounded-full w-[32%]" />
        </div>
        <div className="text-xs text-[#9CA3AF] font-mono flex items-center justify-between">
          <span>Uploads: 2 completed today (1,600 units each)</span>
          <span>Quota resets at 00:00 PST</span>
        </div>
      </div>

      {/* Channels List */}
      <div className="space-y-4">
        {/* Channel 1: Healthy & Active */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#181B20] border border-[#2E333D] flex items-center justify-center text-sm font-bold text-[#E5A93C]">
              LU
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-white">
                  Lagos Underground
                </span>
                <StatusPill label="Active" variant="green" />
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                @lagosunderground · ID: UC_9a0x... · Default: Unlisted
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Channel 2: Honest Revoked Access State (Screen 16) */}
        <div className="bg-[#121417] border border-[#EF4444]/40 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2E1419] border border-[#52222B] flex items-center justify-center text-sm font-bold text-[#EF4444] shrink-0">
              LS
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-white">
                  Lagos Shorts Lab
                </span>
                <StatusPill label="Revoked" variant="red" />
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                @lagosshortslab · ID: UC_3b11...
              </div>
              <div className="text-xs text-[#EF4444] mt-2 font-mono">
                Error: YouTube returned invalid_grant. Refresh token was revoked or expired.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReconnect}
              disabled={reconnecting}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
            >
              {reconnecting ? 'Redirecting to Google...' : 'Reconnect channel'}
            </button>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
