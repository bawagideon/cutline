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
  const [showSeal, setShowSeal] = useState(false);
  const [scrubPercent, setScrubPercent] = useState(34);
  const [thumbnailUploaded, setThumbnailUploaded] = useState(true);

  // Scene cut points for Scene Magnet scrub snapping (percentages)
  const sceneCutPoints = [0, 18, 34, 52, 70, 88, 100];

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rawPercent = pos * 100;

    // Scene Magnet: Snap within 3% of any scene boundary
    const snapped = sceneCutPoints.find((cp) => Math.abs(cp - rawPercent) < 3);
    setScrubPercent(snapped !== undefined ? snapped : Math.round(rawPercent));
  };

  const handleApprove = () => {
    setIsApproved(true);
    setShowSeal(true);

    // Haptic tick where supported (Android PWA)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 80, 40]);
      } catch {
        // Haptic unavailable
      }
    }

    // Record first approval for PWA install prompt trigger
    try {
      localStorage.setItem('cutline_first_approved', 'true');
    } catch {
      // Storage unavailable
    }

    // Delay redirect for user to witness the signature Golden Seal stamp
    setTimeout(() => {
      router.push('/publishing');
    }, 850);
  };

  const allChecksPass = thumbnailUploaded;

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Review and approve
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            EP {epId.toString().padStart(2, '0')} · rough cut v2 · 7 scenes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/episodes/${epId}`}
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors"
          >
            ← Episode
          </Link>
          <StatusPill
            label={isApproved ? 'Approved' : 'Awaiting you'}
            variant={isApproved ? 'green' : 'amber'}
          />
        </div>
      </div>

      {/* Main Review Grid (Screen 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 cut-in">
        {/* Left Column: Player & Scene Magnet Scrubbing (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0B0C0E] border border-[#22262E] rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center group shadow-2xl">
            {/* Play Button Overlay */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause video preview' : 'Play video preview'}
              className="w-16 h-16 rounded-full bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] flex items-center justify-center btn-press shadow-xl z-10"
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

            {/* Signature Seal Press Animation Overlay */}
            {showSeal && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none bg-black/40 backdrop-blur-xs">
                <div className="relative">
                  <div className="seal-ripple" />
                  <div className="seal-stamp w-32 h-32 rounded-full border-4 border-[#E5A93C] bg-[#121417]/90 text-[#E5A93C] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(229,169,60,0.5)]">
                    <span className="text-2xl font-bold font-mono">SEAL</span>
                    <span className="text-[10px] uppercase tracking-widest font-mono mt-0.5">APPROVED</span>
                    <span className="text-[9px] text-[#9CA3AF] font-mono mt-0.5">OCT 18</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scene Magnet Video Scrub Bar */}
            <div
              onClick={handleScrub}
              className="absolute bottom-0 inset-x-0 h-2 bg-[#1F242D] cursor-pointer group/scrub"
              title="Click or drag to scrub (magnetic scene snaps)"
            >
              <div
                className="h-full bg-[#E5A93C] relative transition-all duration-75"
                style={{ width: `${scrubPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/scrub:scale-100 transition-transform" />
              </div>
              {/* Scene Cut Magnet Ticks */}
              {sceneCutPoints.map((pt) => (
                <div
                  key={pt}
                  className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                  style={{ left: `${pt}%` }}
                />
              ))}
            </div>
          </div>

          {/* Player Metadata & SHA-256 Provenance */}
          <div className="flex items-center justify-between text-xs font-mono text-[#9CA3AF] px-1">
            <span>
              03:12 / 09:28 · <span className="text-white">Scene 3 (34%)</span>
            </span>
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
                {thumbnailUploaded ? (
                  <StatusPill label="ready" variant="green" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setThumbnailUploaded(true)}
                    className="text-xs text-[#E5A93C] hover:underline"
                  >
                    + Add thumbnail
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Publishing Gate Card with Gate Unlock Motif */}
          <div
            className={`bg-[#121417] border rounded-2xl p-6 space-y-4 transition-all duration-300 ${
              allChecksPass
                ? 'border-[#E5A93C]/50 shadow-[0_0_25px_rgba(229,169,60,0.1)]'
                : 'border-[#22262E]'
            }`}
          >
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Publishing gate</span>
                {allChecksPass && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2D220E] text-[#E5A93C] uppercase">
                    Unlocked
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Nothing goes public until you approve.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isApproved || !allChecksPass}
                onClick={handleApprove}
                className="flex-1 bg-[#E5A93C] hover:bg-[#F0B84D] disabled:opacity-50 text-[#0B0C0E] font-semibold text-xs py-3 rounded-xl transition-all btn-press text-center shadow-md relative overflow-hidden"
              >
                {isApproved ? 'Approved — Sealing...' : 'Approve and schedule'}
              </button>
              <button
                type="button"
                className="flex-1 border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white py-3 rounded-xl transition-colors btn-press text-center"
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
