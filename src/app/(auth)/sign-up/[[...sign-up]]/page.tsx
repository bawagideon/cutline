'use client';

import React from 'react';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
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
            From idea to cut. <br />
            With human oversight.
          </h1>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Create your production studio. Every member receives an isolated personal workspace, encrypted API vault, and approval-first publishing pipeline.
          </p>
        </div>

        {/* Architecture Guarantees */}
        <div className="text-xs space-y-3 bg-[#121417] p-5 rounded-xl border border-[#22262E]">
          <div className="text-[10px] uppercase tracking-wider text-[#E5A93C] font-mono font-semibold">
            Cutline Architecture Guarantees
          </div>
          <div className="space-y-2 text-[#9CA3AF]">
            <div className="flex items-start gap-2">
              <span className="text-[#34D399] font-mono">✓</span>
              <span><strong className="text-white">Tenant Isolation:</strong> Dedicated workspace boundary scoped by PostgreSQL Row-Level Security.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#34D399] font-mono">✓</span>
              <span><strong className="text-white">Encrypted Vault:</strong> AES-256-GCM authenticated encryption for provider keys.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#34D399] font-mono">✓</span>
              <span><strong className="text-white">Approval Gate:</strong> Every rendering and publishing step requires explicit human sign-off.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Clerk SignUp Column */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="cutline-logo" />
            <span className="text-white font-medium text-base">Cutline</span>
          </div>

          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/overview"
          />
        </div>
      </div>
    </div>
  );
}
