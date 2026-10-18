'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChooseNewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasLength = password.length >= 12;
  const matches = password.length > 0 && password === confirmPassword;
  const isNotBreached = password.length > 0 && !password.toLowerCase().includes('password') && !password.toLowerCase().includes('123456');

  const canSubmit = hasLength && matches && isNotBreached;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Password updated successfully. Please sign in with your new password.');
      router.push('/sign-in');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col justify-center items-center px-4">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="cutline-logo" />
        <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
      </Link>

      {/* Screen 28: Choose New Password Card */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Choose a new password
        </h1>
        <p className="text-xs text-[#9CA3AF] leading-relaxed mb-6">
          Set a secure passphrase to protect your studio projects and API vault credentials.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B7280] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B7280] focus:outline-none transition-colors"
            />
          </div>

          {/* Screen 28 Security Checklist */}
          <div className="bg-[#0B0C0E] border border-[#1C2028] rounded-xl p-3.5 space-y-2 text-xs font-mono">
            <div className={`flex items-center gap-2 ${hasLength ? 'text-[#34D399]' : 'text-[#6B7280]'}`}>
              <span>{hasLength ? '✓' : '○'}</span>
              <span>12+ characters</span>
            </div>
            <div className={`flex items-center gap-2 ${isNotBreached ? 'text-[#34D399]' : 'text-[#6B7280]'}`}>
              <span>{isNotBreached ? '✓' : '○'}</span>
              <span>Not found in known breaches</span>
            </div>
            <div className={`flex items-center gap-2 ${matches ? 'text-[#34D399]' : 'text-[#6B7280]'}`}>
              <span>{matches ? '✓' : '○'}</span>
              <span>Matches confirmation</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full bg-[#E5A93C] hover:bg-[#F0B84D] disabled:opacity-40 text-[#0B0C0E] font-semibold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Updating password...' : 'Update password'}
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
