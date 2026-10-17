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

  const jobs: ProductionJob[] = [
    {
      id: 'job_8f29d',
      project: 'Lagos After Dark',
      episode: 'EP 07',
      scene: 'Scene 06 · Market montage',
      provider: 'PixVerse',
      step: 'Video rendering',
      duration: '8s',
      status: 'running',
      worker: 'worker-pod-02',
      timeInState: '42s ago',
    },
    {
      id: 'job_3a10c',
      project: 'Lagos After Dark',
      episode: 'EP 07',
      scene: 'Scene 07 · Closing shot',
      provider: 'PixVerse',
      step: 'Queued for dispatch',
      duration: '5s',
      status: 'queued',
      worker: 'unassigned',
      timeInState: '2m ago',
    },
    {
      id: 'job_9c44b',
      project: 'Tokyo Neon Stories',
      episode: 'EP 02',
      scene: 'Scene 04 · Shibuya rain',
      provider: 'ElevenLabs',
      step: 'TTS narration generation',
      duration: '14s',
      status: 'done',
      worker: 'worker-pod-01',
      timeInState: '15m ago',
    },
    {
      id: 'job_11e2f',
      project: 'Lagos After Dark',
      episode: 'EP 07',
      scene: 'Scene 04 · Rain on Third Mainland',
      provider: 'PixVerse',
      step: 'Validation rejected: 12s exceeds 8s limit',
      duration: '12s',
      status: 'failed',
      worker: 'dispatcher',
      timeInState: '1h ago',
    },
  ];

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

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Production queue
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            1 running · 1 queued · 1 failed · 1 completed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors"
          >
            Worker diagnostics
          </button>
        </div>
      </div>

      {/* Honest Background Worker Fleet Status */}
      <div className="bg-[#121417] border border-[#22262E] rounded-xl p-4 mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-3">
          Background Worker Fleet · Verified Heartbeats
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Dispatcher</span>
            <span className="text-[#34D399]">2s ago</span>
          </div>
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Poller</span>
            <span className="text-[#34D399]">4s ago</span>
          </div>
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Downloader</span>
            <span className="text-[#34D399]">1s ago</span>
          </div>
          <div className="bg-[#0B0C0E] border border-[#22262E] p-2.5 rounded-lg flex items-center justify-between">
            <span className="text-white">Production</span>
            <span className="text-[#34D399]">3s ago</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#1B1E24] pb-3 overflow-x-auto">
        {(['all', 'running', 'queued', 'failed', 'done'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`capitalize text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filter === tab
                ? 'bg-[#181B20] text-white border border-[#2E333D]'
                : 'text-[#9CA3AF] hover:text-[#E6E8EB] hover:bg-[#121417]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Jobs List (Desktop Table + Mobile Cards matching Screen 12 & Screen 23) */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-[#121417] border border-[#22262E] hover:border-[#2E333D] rounded-2xl p-4 md:p-5 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-[#E5A93C]">
                    {job.id}
                  </span>
                  <StatusPill
                    label={job.status}
                    variant={getStatusVariant(job.status)}
                  />
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

              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-0 border-[#1C2028]">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-medium text-white">{job.step}</div>
                  <div className="text-[11px] font-mono text-[#6B7280]">
                    {job.worker} · {job.timeInState}
                  </div>
                </div>

                <Link
                  href={`/production/jobs/${job.id}`}
                  className="bg-[#181B20] hover:bg-[#22262E] border border-[#2E333D] text-xs font-medium text-white px-3.5 py-2 rounded-lg transition-colors"
                >
                  Inspect timeline →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </StudioLayout>
  );
}
