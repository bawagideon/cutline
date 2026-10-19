'use client';

import React, { useState, useEffect } from 'react';
import { SignIn } from '@clerk/nextjs';

const SAMPLE_LOGS = [
  '09:14:02 stage=render provider=pixverse attempt=1 outcome=submitted',
  '09:14:41 stage=download bytes=48.2MB sha256=verified',
  '09:15:10 stage=gate status=awaiting_review locked_until=null',
];

export default function SignInPage() {
  const [typedLogs, setTypedLogs] = useState<string[]>([]);

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
            Your studio identity is secured with Clerk authentication and isolated multi-tenant PostgreSQL RLS.
          </p>
        </div>

        {/* Log Ticker */}
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

      {/* Right Clerk SignIn Column */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="cutline-logo" />
            <span className="text-white font-medium text-base">Cutline</span>
          </div>

          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/overview"
          />
        </div>
      </div>
    </div>
  );
}
