'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ade@lagosafterdark.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/overview');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] grid grid-cols-1 md:grid-cols-2">
      {/* Left Brand & Assurance Column */}
      <div className="hidden md:flex flex-col justify-between p-12 lg:p-16 border-r border-[#1B1E24] bg-[#0E1013]">
        <div className="flex items-center gap-3">
          <div className="cutline-logo" />
          <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
        </div>

        <div className="max-w-md my-auto">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            Every stage persisted. <br />
            Every release approved.
          </h1>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Your session lives in an httpOnly cookie, never localStorage.
          </p>
        </div>

        {/* Real Production Audit Stamp */}
        <div className="font-mono text-xs text-[#6B7280] space-y-1 bg-[#121417] p-4 rounded-xl border border-[#22262E]">
          <div>09:14:02 stage=render provider=pixverse attempt=1 outcome=submitted</div>
          <div>09:14:41 stage=download bytes=48.2MB sha256=verified</div>
        </div>
      </div>

      {/* Right Sign-in Form Column */}
      <div className="flex flex-col justify-center items-center p-6 md:p-16">
        <div className="max-w-sm w-full">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="cutline-logo" />
            <span className="text-white font-medium text-base">Cutline</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-sm text-[#9CA3AF] mb-8">Sign in to your studio.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-[#9CA3AF] mt-6">
            <button
              type="button"
              onClick={() => alert('Password reset instructions sent to registered email.')}
              className="hover:text-white transition-colors"
            >
              Forgot password
            </button>
            <Link href="/onboarding" className="hover:text-white transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
