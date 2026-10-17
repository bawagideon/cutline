'use client';

import React from 'react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/StatusPill';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col justify-between p-6 md:p-12">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="cutline-logo" />
          <span className="text-white font-medium text-lg tracking-tight">Cutline</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#9CA3AF]">
          <Link href="/overview" className="hover:text-white transition-colors">Product</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/overview" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/usage" className="hover:text-white transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[#E6E8EB] px-4 py-2 rounded-lg hover:bg-[#181B20] transition-colors border border-[#22262E]"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="text-sm font-semibold bg-[#E5A93C] text-[#0B0C0E] px-4 py-2 rounded-lg hover:bg-[#F0B84D] transition-colors"
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

        <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]">
          Idea in. Published out. <br />
          Nothing ships without your sign-off.
        </h1>

        <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mb-10 leading-relaxed">
          Script, scene, render, review and publish to YouTube from one workspace, run by a durable worker you can actually watch.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-16">
          <Link
            href="/projects/new"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            Start a project
          </Link>
          <Link
            href="/overview"
            className="border border-[#2A2F3A] hover:bg-[#181B20] text-[#E6E8EB] font-medium text-sm px-6 py-3 rounded-lg transition-colors"
          >
            Read the docs
          </Link>
        </div>

        {/* Real Production Preview Card */}
        <div className="rounded-2xl bg-[#121417] border border-[#22262E] p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="text-sm font-mono text-[#9CA3AF]">
              EP 07 · The Last Danfo <span className="text-[#6B7280]">job 9f3a...c1</span>
            </div>
            <StatusPill label="Awaiting your review" variant="amber" />
          </div>

          {/* Stepper Pipeline */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full">✓ Brief</span>
            <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full">✓ Script</span>
            <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full">✓ Scenes</span>
            <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full">✓ Render</span>
            <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full">✓ Assemble</span>
            <span className="text-xs font-mono text-[#60A5FA] bg-[#0F2236] border border-[#1E3A5F] px-3 py-1 rounded-full font-semibold">Review</span>
            <span className="text-xs font-mono text-[#6B7280] px-3 py-1">Schedule</span>
            <span className="text-xs font-mono text-[#6B7280] px-3 py-1">Publish</span>
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
