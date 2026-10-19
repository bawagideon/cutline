'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/StatusPill';

export default function LandingPage() {
  const [ignite, setIgnite] = useState(false);
  const [timelineStep, setTimelineStep] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => setIgnite(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const pipelineStages = [
    { label: 'Brief', status: 'done' },
    { label: 'Script', status: 'done' },
    { label: 'Scenes', status: 'done' },
    { label: 'Render', status: 'done' },
    { label: 'Assemble', status: 'done' },
    { label: 'Review', status: 'active' },
    { label: 'Schedule', status: 'pending' },
    { label: 'Publish', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col justify-between p-6 md:p-12 cut-in">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="cutline-logo" />
          <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#9CA3AF]">
          <Link href="/overview" className="hover:text-white transition-colors">Product</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/status" className="hover:text-white transition-colors">Status</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[#E6E8EB] px-4 py-2 rounded-lg hover:bg-[#181B20] transition-colors border border-[#22262E] btn-press"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold bg-[#E5A93C] text-[#0B0C0E] px-4 py-2 rounded-lg hover:bg-[#F0B84D] transition-colors btn-press shadow-md"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl w-full mx-auto my-auto py-12 md:py-20 text-left">
        <div className="inline-block text-xs font-mono uppercase tracking-widest text-[#E5A93C] mb-6">
          APPROVAL-FIRST VIDEO PRODUCTION
        </div>

        {/* Cut Headline Motif */}
        <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]">
          Idea in. Published out. <br />
          Nothing ships without your{' '}
          <span className="relative inline-block text-[#E5A93C]">
            sign-off
            <span className="absolute left-0 bottom-0.5 w-full h-1 bg-[#E5A93C] cut-wipe rounded-full" />
          </span>
          .
        </h1>

        <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mb-10 leading-relaxed">
          Script, scene, render, review and publish to YouTube from one workspace, run by a durable worker you can actually watch.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-16">
          <Link
            href="/projects/new"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-6 py-3 rounded-lg transition-colors btn-press shadow-lg"
          >
            Start a project
          </Link>
          <Link
            href="/docs"
            className="border border-[#2A2F3A] hover:bg-[#181B20] text-[#E6E8EB] font-medium text-sm px-6 py-3 rounded-lg transition-colors btn-press"
          >
            Read the docs
          </Link>
        </div>

        {/* Real Production Preview Card (Screen 1 Scroll-Scrubbed Timeline) */}
        <div className="rounded-2xl bg-[#121417] border border-[#22262E] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="text-sm font-mono text-[#9CA3AF]">
              EP 07 · Lagos After Dark <span className="text-[#6B7280]">job_8f29d</span>
            </div>
            <StatusPill label="Awaiting your review" variant="amber" />
          </div>

          {/* Pipeline Ignite: 8 Stage Chips with 80ms Stagger & Breathing Review Chip */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {pipelineStages.map((stage, idx) => {
              const isIgnited = ignite;
              const isReview = stage.label === 'Review';
              return (
                <div
                  key={stage.label}
                  style={{
                    transitionDelay: `${idx * 80}ms`,
                  }}
                  className={`text-xs font-mono px-3 py-1 rounded-full transition-all duration-300 ${
                    stage.status === 'done'
                      ? 'text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36]'
                      : isReview
                      ? 'text-[#E5A93C] bg-[#2D220E] border-2 border-[#E5A93C] font-semibold breathe-live shadow-[0_0_15px_rgba(229,169,60,0.3)]'
                      : 'text-[#6B7280] bg-[#181B20]/60 border border-[#22262E]'
                  } ${isIgnited ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                >
                  {stage.status === 'done' ? `✓ ${stage.label}` : stage.label}
                </div>
              );
            })}
          </div>

          {/* Interactive Scrub Timeline Bar */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs font-mono text-[#9CA3AF]">
              <span>Pipeline scrub</span>
              <span>Stage {timelineStep} of 8: {pipelineStages[timelineStep - 1]?.label}</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={timelineStep}
              onChange={(e) => setTimelineStep(parseInt(e.target.value, 10))}
              className="w-full accent-[#E5A93C] cursor-pointer"
            />
          </div>

          {/* Footer Perks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-[#1C2028] text-xs font-mono text-[#9CA3AF]">
            <div>Encrypted integration vault</div>
            <div>Durable worker with leases</div>
            <div>No mock output in production</div>
            <div>Real stage, never a fake percentage</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-xs text-[#6B7280] flex justify-between pt-6 border-t border-[#16191E]">
        <div>© 2026 Cutline Studio. All rights reserved.</div>
        <div className="flex gap-4 font-mono">
          <span>AES-256-GCM Vault</span>
          <span>·</span>
          <span>Durable Queue</span>
        </div>
      </footer>
    </div>
  );
}
