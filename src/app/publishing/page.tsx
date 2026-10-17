'use client';

import React, { useState } from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function PublishingCalendarPage() {
  const [hasInterruptedUpload, setHasInterruptedUpload] = useState(true);
  const [isResuming, setIsResuming] = useState(false);
  const [resumedSuccess, setResumedSuccess] = useState(false);

  const handleResume = () => {
    setIsResuming(true);
    setTimeout(() => {
      setIsResuming(false);
      setResumedSuccess(true);
      setTimeout(() => setHasInterruptedUpload(false), 2000);
    }, 1200);
  };

  const scheduledSlots = [
    {
      date: 'Thursday, Oct 22',
      time: '18:00 WAT (UTC+1)',
      episode: 'EP 07 · The Last Danfo',
      project: 'Lagos After Dark',
      channel: 'Lagos Underground (Verified)',
      status: 'Ready',
      quotaUnits: '1,600 units',
    },
    {
      date: 'Sunday, Oct 25',
      time: '20:00 WAT (UTC+1)',
      episode: 'EP 08 · Floating Slums of Makoko',
      project: 'Lagos After Dark',
      channel: 'Lagos Underground (Verified)',
      status: 'Draft',
      quotaUnits: '1,600 units est.',
    },
  ];

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Publishing calendar
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Timezone: Africa/Lagos (WAT, UTC+1) · 2 slots planned
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121417] border border-[#22262E] px-3 py-1.5 rounded-lg text-xs font-mono text-white">
            UTC+01:00 (Lagos)
          </div>
          <button
            type="button"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Schedule release
          </button>
        </div>
      </div>

      {/* Screen 15: Interrupted Upload Recovery Card */}
      {hasInterruptedUpload && (
        <div className="bg-[#121417] border border-[#E5A93C]/40 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] animate-ping" />
                <span className="text-sm font-semibold text-white">
                  Resume interrupted YouTube upload
                </span>
                <span className="text-xs font-mono text-[#E5A93C] bg-[#2D220E] border border-[#543F15] px-2 py-0.5 rounded-full">
                  68% chunk saved
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] max-w-2xl leading-relaxed">
                EP 06 (&ldquo;The Midnight Market&rdquo;) disconnected at byte offset 184MB of 270MB.
                Cutline preserved the YouTube resumable upload session URI (valid for another 18 hours).
                You can resume without re-uploading from 0%.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleResume}
                disabled={isResuming || resumedSuccess}
                className="flex-1 md:flex-none bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isResuming ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#0B0C0E] border-t-transparent rounded-full animate-spin" />
                    Querying HTTP 308 resume range...
                  </>
                ) : resumedSuccess ? (
                  '✓ Upload resumed!'
                ) : (
                  'Resume upload (HTTP 308)'
                )}
              </button>

              <button
                type="button"
                onClick={() => setHasInterruptedUpload(false)}
                className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-2.5 rounded-lg transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Releases Table */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028]">
        {scheduledSlots.map((slot, idx) => (
          <div
            key={idx}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#15181D] transition-colors"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  {slot.date}
                </span>
                <span className="text-xs font-mono text-[#E5A93C]">
                  {slot.time}
                </span>
                <StatusPill
                  label={slot.status}
                  variant={slot.status === 'Ready' ? 'green' : 'gray'}
                />
              </div>

              <div className="text-base font-medium text-white mt-1">
                {slot.episode}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                Channel: {slot.channel} · Project: {slot.project}
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-center">
              <span className="text-xs font-mono text-[#9CA3AF]">
                Quota: {slot.quotaUnits}
              </span>
              <button
                type="button"
                className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Edit slot
              </button>
            </div>
          </div>
        ))}
      </div>
    </StudioLayout>
  );
}
