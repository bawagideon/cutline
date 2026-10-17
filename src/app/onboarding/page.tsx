'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();

  const steps = [
    {
      title: 'Verify your email',
      subtitle: 'Done',
      status: 'done',
      buttonText: 'Done',
      disabled: true,
    },
    {
      title: 'Create your first project',
      subtitle: 'Start from a sample or blank',
      status: 'done',
      buttonText: 'Done',
      disabled: true,
    },
    {
      title: 'Connect an AI provider',
      subtitle: 'Gemini key goes into the encrypted vault',
      status: 'active',
      buttonText: 'Connect',
      href: '/integrations?provider=gemini',
      isPrimary: true,
    },
    {
      title: 'Connect a render provider',
      subtitle: 'Optional. Skip and draft only',
      status: 'pending',
      buttonText: 'Skip',
      href: '/integrations',
    },
    {
      title: 'Connect YouTube',
      subtitle: 'When you are ready to publish',
      status: 'pending',
      buttonText: 'Skip',
      href: '/channels',
    },
    {
      title: 'Worker heartbeat',
      subtitle: 'Production worker reachable',
      status: 'pending',
      buttonText: 'Skip',
      href: '/production',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex items-center justify-center p-6 md:p-12">
      <div className="max-w-2xl w-full">
        {/* Step Indicator */}
        <div className="text-xs font-mono uppercase tracking-widest text-[#E5A93C] mb-3">
          STEP 3 OF 6
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          Get to your first render
        </h1>

        <p className="text-sm text-[#9CA3AF] mb-8">
          Skip anything. Everything here is resumable from Settings.
        </p>

        {/* Progress Line */}
        <div className="w-full bg-[#181B20] h-1 rounded-full mb-8 overflow-hidden">
          <div className="bg-[#E5A93C] h-full w-1/2 rounded-full" />
        </div>

        {/* Checklist Container */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl divide-y divide-[#1C2028] overflow-hidden">
          {steps.map((step, idx) => (
            <div key={idx} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="mt-1">
                  {step.status === 'done' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]" />
                  ) : step.status === 'active' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] animate-pulse" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2A2F3A]" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{step.title}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">{step.subtitle}</div>
                </div>
              </div>

              <div>
                {step.isPrimary ? (
                  <Link
                    href={step.href || '/integrations'}
                    className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors inline-block"
                  >
                    {step.buttonText}
                  </Link>
                ) : (
                  <Link
                    href={step.href || '/overview'}
                    className={`text-xs px-4 py-2 rounded-lg border transition-colors inline-block ${
                      step.disabled
                        ? 'border-[#22262E] text-[#6B7280] pointer-events-none'
                        : 'border-[#2A2F3A] text-[#9CA3AF] hover:text-white hover:bg-[#181B20]'
                    }`}
                  >
                    {step.buttonText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-8 text-xs text-[#9CA3AF]">
          <Link href="/sign-in" className="hover:text-white transition-colors">
            ← Back to sign in
          </Link>
          <Link href="/overview" className="text-[#E5A93C] hover:underline">
            Enter Studio directly →
          </Link>
        </div>
      </div>
    </div>
  );
}
