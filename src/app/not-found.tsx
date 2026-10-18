import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col justify-center items-center px-6">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="cutline-logo" />
        <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
      </Link>

      {/* Screen 38 Card */}
      <div className="bg-[#121417] border border-[#22262E] rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl space-y-6">
        <div className="text-6xl font-extrabold font-mono text-[#E5A93C] tracking-tight">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            This frame is not in the cut
          </h1>
          <p className="text-sm text-[#9CA3AF] font-mono leading-relaxed">
            The page moved or you do not have access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/overview"
            className="w-full sm:w-auto bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-6 py-3 rounded-xl transition-colors"
          >
            Go to overview
          </Link>
          <Link
            href="/status"
            className="w-full sm:w-auto border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-6 py-3 rounded-xl transition-colors"
          >
            Status
          </Link>
        </div>
      </div>
    </div>
  );
}
