'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(`/reset-password/sent?email=${encodeURIComponent(email || 'ade@studio.com')}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col justify-center items-center px-4">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="cutline-logo" />
        <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
      </Link>

      {/* Screen 27: Reset Password Card */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Reset your password
        </h1>
        <p className="text-xs text-[#9CA3AF] leading-relaxed mb-6 font-mono">
          If an account exists, we will email a link. We say the same either way.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B7280] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <div className="pt-6 mt-6 border-t border-[#1C2028] text-center">
          <Link
            href="/sign-in"
            className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
