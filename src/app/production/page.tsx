'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface ProductionJob {
  id: string;
  project: string;
  episode: string;
  scene: string;
  provider: string;
  step: string;
  duration: string;
  status: 'running' | 'queued' | 'done' | 'failed';
  worker: string;
  timeInState: string;
}

export default function ProductionQueuePage() {
  const [filter, setFilter] = useState<'all' | 'running' | 'queued' | 'failed' | 'done'>('all');
  const [swipedJobId, setSwipedJobId] = useState<string | null>(null);

  const [jobs, setJobs] = useState<ProductionJob[]>([]);

  const handleRetry = (jobId: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch {}
    }

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: 'queued', step: 'Requeued for dispatch' } : j
      )
    );
    setSwipedJobId(null);
  };

  const handleCancel = (jobId: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch {}
    }

    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setSwipedJobId(null);
  };

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === filter);

  const getStatusVariant = (status: ProductionJob['status']) => {
    switch (status) {
      case 'running':
        return 'blue';
      case 'done':
        return 'green';
      case 'failed':
        return 'red';
      case 'queued':
      default:
        return 'gray';
    }
  };

  const runningCount = jobs.filter((j) => j.status === 'running').length;
  const queuedCount = jobs.filter((j) => j.status === 'queued').length;

  return (
    <StudioLayout>
      {/* Header with Badge Bump */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Production queue</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#2D220E] text-[#E5A93C] border border-[#E5A93C]/40 animate-pulse">
              {jobs.length} jobs
            </span>
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            {runningCount} running · {queuedCount} queued · verified lease locks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/status"
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors btn-press"
          >
            Worker diagnostics
          </Link>
        </div>
      </div>

      {/* Background Worker Fleet Status with Heartbeat Dot Motif */}
      <div className="bg-[#121417] border border-[#22262E] rounded-xl p-4 mb-6 cut-in">
        <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-3 flex items-center justify-between">
          <span>Background Worker Fleet · Verified Heartbeats</span>
          <span className="text-[#34D399] flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#34D399] breathe-live shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Active Leases
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Dispatcher</span>
            <span className="text-[#34D399] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] breathe-live" />
              2s ago
            </span>
          </div>
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Poller</span>
            <span className="text-[#34D399] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] breathe-live" />
              4s ago
            </span>
          </div>
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Downloader</span>
            <span className="text-[#34D399] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] breathe-live" />
              1s ago
            </span>
          </div>
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Production</span>
            <span className="text-[#34D399] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] breathe-live" />
              3s ago
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#1B1E24] pb-3 overflow-x-auto cut-in">
        {(['all', 'running', 'queued', 'failed', 'done'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`capitalize text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all btn-press whitespace-nowrap ${
              filter === tab
                ? 'bg-[#181B20] text-white border border-[#2E333D]'
                : 'text-[#9CA3AF] hover:text-[#E6E8EB] hover:bg-[#121417]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Jobs List with Live Dot, Row Flip & Swipe Actions */}
      <div className="space-y-3 cut-in">
        {filteredJobs.length === 0 ? (
          <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-12 text-center max-w-lg mx-auto cut-in">
            <div className="w-12 h-12 rounded-xl bg-[#1A1D23] border border-[#22262E] flex items-center justify-center text-xl mx-auto mb-4 text-[#34D399]">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Queue is clear</h3>
            <p className="text-xs text-[#9CA3AF] mb-6 leading-relaxed">
              No rendering jobs, TTS generations, or video assembly tasks currently in progress. Dispatch a scene render from your Episode Scene Planner to begin.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors btn-press shadow-md"
            >
              Go to Projects
            </Link>
          </div>
        ) : (
          filteredJobs.map((job) => (
          <div
            key={job.id}
            className={`bg-[#121417] border border-[#22262E] hover:border-[#2E333D] rounded-2xl p-4 md:p-5 transition-all duration-200 relative overflow-hidden ${
              job.status === 'running' ? 'border-l-4 border-l-[#60A5FA]' : ''
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-[#E5A93C]">
                    {job.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {job.status === 'running' && (
                      <span className="w-2 h-2 rounded-full bg-[#60A5FA] breathe-live" />
                    )}
                    <StatusPill
                      label={job.status}
                      variant={getStatusVariant(job.status)}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#6B7280]">
                    {job.provider}
                  </span>
                </div>

                <div className="text-base font-semibold text-white mt-1.5">
                  {job.project} · {job.episode}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                  {job.scene} ({job.duration})
                </div>
              </div>

              {/* Action Controls & Mobile Swipe Trigger */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-0 border-[#1C2028]">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-medium text-white">{job.step}</div>
                  <div className="text-[11px] font-mono text-[#6B7280]">
                    {job.worker} · {job.timeInState}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {job.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => handleRetry(job.id)}
                      className="bg-[#2D220E] text-[#E5A93C] hover:bg-[#3D2D12] text-xs font-medium px-3 py-2 rounded-lg border border-[#543F15] transition-colors btn-press"
                    >
                      Retry
                    </button>
                  )}

                  {/* Swipe / Action Toggle for Mobile */}
                  <button
                    type="button"
                    onClick={() => setSwipedJobId(swipedJobId === job.id ? null : job.id)}
                    className="md:hidden text-xs text-[#9CA3AF] p-2 hover:text-white"
                  >
                    ⚙
                  </button>

                  <Link
                    href={`/production/jobs/${job.id}`}
                    className="bg-[#181B20] hover:bg-[#22262E] border border-[#2E333D] text-xs font-medium text-white px-3.5 py-2 rounded-lg transition-colors btn-press"
                  >
                    Inspect timeline →
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile Revealed Swipe Action Sheet */}
            {swipedJobId === job.id && (
              <div className="mt-3 pt-3 border-t border-[#1C2028] flex items-center justify-end gap-2 cut-in">
                <button
                  type="button"
                  onClick={() => handleRetry(job.id)}
                  className="bg-[#181B20] text-xs text-[#E5A93C] px-3 py-1.5 rounded-lg border border-[#2E333D] btn-press"
                >
                  Retry job
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(job.id)}
                  className="bg-[#2A1215] text-xs text-[#F87171] px-3 py-1.5 rounded-lg border border-[#52222B] btn-press"
                >
                  Cancel job
                </button>
              </div>
            )}
          </div>
        )))}
      </div>
    </StudioLayout>
  );
}
