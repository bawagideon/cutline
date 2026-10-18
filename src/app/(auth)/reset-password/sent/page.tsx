'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function InboxCard() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || 'ade@studio.com';

  const [countdown, setCountdown] = useState(28);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
      <div className="w-12 h-12 rounded-full bg-[#181B20] border border-[#2E333D] flex items-center justify-center mx-auto mb-4 text-[#E5A93C] text-lg">
        ✉
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
        Check your inbox
      </h1>
      <p className="text-xs text-[#9CA3AF] leading-relaxed mb-6 font-mono">
        We sent a link to <span className="text-white font-medium">{email}</span>. It expires in 24 hours.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          disabled={countdown > 0}
          onClick={() => setCountdown(30)}
          className="w-full border border-[#2E333D] hover:bg-[#181B20] disabled:opacity-50 text-xs font-medium text-white py-2.5 rounded-xl transition-colors font-mono"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend email now'}
        </button>

        <Link
          href="/reset-password"
          className="block text-xs text-[#9CA3AF] hover:text-white transition-colors pt-2"
        >
          Use a different email
        </Link>
      </div>

      <div className="pt-6 mt-6 border-t border-[#1C2028]">
        <Link
          href="/reset-password/confirm"
          className="text-xs text-[#E5A93C] hover:underline"
        >
          Simulate opening reset link →
        </Link>
      </div>
    </div>
  );
}

export default function CheckInboxPage() {
  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col justify-center items-center px-4">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="cutline-logo" />
        <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
      </Link>

      <Suspense fallback={
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-8 max-w-md w-full text-center text-xs text-[#9CA3AF]">
          Loading...
        </div>
      }>
        <InboxCard />
      </Suspense>
    </div>
  );
}
