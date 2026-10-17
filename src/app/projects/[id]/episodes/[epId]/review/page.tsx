'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function ReviewAndApprovePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id || 'lagos-after-dark';
  const epId = params?.epId || '7';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Review and approve
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            EP {epId.toString().padStart(2, '0')} · rough cut v2
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/episodes/${epId}`}
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors"
          >
            ← Episode
          </Link>
          <StatusPill label="Awaiting you" variant="amber" />
        </div>
      </div>

      {/* Main Review Grid (Screen 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Player & Integrity Checksum (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0B0C0E] border border-[#22262E] rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center group shadow-2xl">
            {/* Play Button Overlay */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause video preview' : 'Play video preview'}
              className="w-16 h-16 rounded-full bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] flex items-center justify-center transition-transform transform hover:scale-105 shadow-lg"
            >
              {isPlaying ? (
                <div className="flex gap-1.5">
                  <div className="w-2 h-6 bg-[#0B0C0E] rounded-xs" />
                  <div className="w-2 h-6 bg-[#0B0C0E] rounded-xs" />
                </div>
              ) : (
                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-14 border-l-[#0B0C0E] ml-1" />
              )}
            </button>

            {/* Video scrub indicator bar */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#1F242D]">
              <div className="h-full bg-[#E5A93C] w-1/3" />
            </div>
          </div>

          {/* Player Metadata & SHA-256 Provenance */}
          <div className="flex items-center justify-between text-xs font-mono text-[#9CA3AF] px-1">
            <span>03:12 / 09:28</span>
            <div className="flex items-center gap-2">
              <span className="text-[#34D399]">sha256 verified</span>
              <span>·</span>
              <span>stored privately</span>
            </div>
          </div>
        </div>

        {/* Right Column: Approval Checklist & Publishing Gate (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Readiness Checklist */}
          <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Checklist</h2>
            <div className="space-y-3.5 divide-y divide-[#1C2028]">
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-white">Script approved</span>
                <StatusPill label="yes" variant="green" />
              </div>
              <div className="flex items-center justify-between pt-3.5">
                <span className="text-sm text-white">Scenes verified</span>
                <StatusPill label="7 of 7" variant="green" />
              </div>
              <div className="flex items-center justify-between pt-3.5">
                <span className="text-sm text-white">Captions</span>
                <StatusPill label="yes" variant="green" />
              </div>
              <div className="flex items-center justify-between pt-3.5">
                <span className="text-sm text-white">Thumbnail</span>
                <StatusPill label="missing" variant="red" />
              </div>
            </div>
          </div>

          {/* Publishing Gate Card */}
          <div className="bg-[#121417] border border-[#E5A93C]/30 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Publishing gate</h3>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Nothing goes public until you approve.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsApproved(true);
                  router.push('/publishing');
                }}
                className="flex-1 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs py-3 rounded-xl transition-colors text-center"
              >
                Approve and schedule
              </button>
              <button
                type="button"
                className="flex-1 border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white py-3 rounded-xl transition-colors text-center"
              >
                Request changes
              </button>
            </div>
          </div>

          {/* Honest Cost Accounting Footnote */}
          <div className="text-xs font-mono text-[#6B7280] px-1">
            Render cost $4.82 · <span className="text-[#9CA3AF]">provider-reported</span>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
