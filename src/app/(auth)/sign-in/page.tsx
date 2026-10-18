'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SAMPLE_LOGS = [
  '09:14:02 stage=render provider=pixverse attempt=1 outcome=submitted',
  '09:14:41 stage=download bytes=48.2MB sha256=verified',
  '09:15:10 stage=gate status=awaiting_review locked_until=null',
];

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ade@lagosafterdark.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [typedLogs, setTypedLogs] = useState<string[]>([]);

  // Log Ticker typing effect on mount
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < SAMPLE_LOGS.length) {
        setTypedLogs((prev) => [...prev, SAMPLE_LOGS[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Demonstrate neutral auth validation
    if (!email || !password || password.length < 4) {
      setIsShaking(true);
      setErrorMessage('Invalid credentials. Check your email and password.');
      setTimeout(() => setIsShaking(false), 260);
      return;
    }

    setLoading(true);

    // Simulate authenticating and Unlock Cut
    setTimeout(() => {
      setLoading(false);
      setIsUnlocked(true);

      setTimeout(() => {
        router.push('/overview');
      }, 400);
    }, 500);
  };

  return (
    <div className={`min-h-screen bg-[#0B0C0E] text-[#E6E8EB] grid grid-cols-1 md:grid-cols-2 ${isUnlocked ? 'cut-wipe' : ''}`}>
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
            Your session lives in an httpOnly cookie, never localStorage. Database authorization enforced by Postgres RLS.
          </p>
        </div>

        {/* Log Ticker (Mono log lines typing in, labelled as sample output) */}
        <div className="font-mono text-xs text-[#9CA3AF] space-y-1.5 bg-[#121417] p-4 rounded-xl border border-[#22262E]">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-1 font-mono">
            LIVE WORKER TELEMETRY (SAMPLE OUTPUT)
          </div>
          {typedLogs.map((log) => (
            <div key={log} className="text-[#34D399] font-mono cut-in">
              {log}
            </div>
          ))}
          {typedLogs.length < SAMPLE_LOGS.length && (
            <div className="text-[#E5A93C] breathe-live font-mono">_</div>
          )}
        </div>
      </div>

      {/* Right Sign-in Form Column */}
      <div className="flex flex-col justify-center items-center p-6 md:p-16">
        <div className={`max-w-sm w-full ${isShaking ? 'shake-nudge' : ''}`}>
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="cutline-logo" />
            <span className="text-white font-medium text-base">Cutline</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-sm text-[#9CA3AF] mb-8">Sign in to your studio workspace.</p>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-[#2A1215] border border-[#F87171]/40 text-xs text-[#F87171] font-mono cut-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Focus Rule Input 1 */}
            <div className="relative group">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all duration-150"
                placeholder="name@example.com"
              />
              <span className="absolute bottom-0 left-0 h-0.5 bg-[#E5A93C] w-0 group-focus-within:w-full transition-all duration-300 rounded-full" />
            </div>

            {/* Focus Rule Input 2 */}
            <div className="relative group">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-all duration-150"
                placeholder="••••••••"
              />
              <span className="absolute bottom-0 left-0 h-0.5 bg-[#E5A93C] w-0 group-focus-within:w-full transition-all duration-300 rounded-full" />
            </div>

            {/* Unlock Cut Button */}
            <button
              type="submit"
              disabled={loading || isUnlocked}
              className={`w-full text-[#0B0C0E] font-semibold text-sm py-3 rounded-lg transition-all duration-200 btn-press mt-2 ${
                isUnlocked
                  ? 'bg-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                  : 'bg-[#E5A93C] hover:bg-[#F0B84D]'
              }`}
            >
              {isUnlocked ? '✓ Unlocked' : loading ? 'Verifying session...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-[#9CA3AF] mt-6">
            <Link
              href="/reset-password"
              className="hover:text-white transition-colors"
            >
              Forgot password
            </Link>
            <Link href="/onboarding" className="hover:text-white transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
