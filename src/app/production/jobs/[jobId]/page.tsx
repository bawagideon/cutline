'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function JobTimelinePage() {
  const params = useParams();
  const jobId = params?.jobId || 'job_8f29d';

  const [activeTab, setActiveTab] = useState<'timeline' | 'logs'>('timeline');

  const timelineEvents = [
    { time: '12:40:02', title: 'Job enqueued', detail: 'Created via Scene Planner for Scene 06 (Market montage)', state: 'done' },
    { time: '12:40:04', title: 'Lease acquired', detail: 'Locked by dispatcher (worker-pod-02) for 300s', state: 'done' },
    { time: '12:40:06', title: 'Dispatched to provider', detail: 'PixVerse API accepted task ID: pv_891e4a3c', state: 'done' },
    { time: '12:40:20', title: 'Poller ping #1', detail: 'Status: PROCESSING · Provider progress: not reported', state: 'running' },
    { time: '12:40:45', title: 'Poller ping #2', detail: 'Status: PROCESSING · Provider progress: not reported', state: 'running' },
    { time: '12:41:05', title: 'Asset download & verification', detail: 'Safe downloader will stream to private storage and verify SHA-256', state: 'pending' },
  ];

  const redactedLogs = `[2026-10-17T12:40:02.102Z] INFO  [dispatcher] Job job_8f29d created for episode lagos-after-dark/07
[2026-10-17T12:40:04.218Z] INFO  [worker-pod-02] Acquired atomic lease on job_8f29d (lock_until: 12:45:04Z)
[2026-10-17T12:40:05.801Z] DEBUG [pixverse] Decrypting API key from AES-256-GCM integration vault...
[2026-10-17T12:40:06.120Z] DEBUG [pixverse] POST https://api.pixverse.ai/v2/video/generate
                         Headers: Authorization: Bearer ••••••••a91f
                         Payload: { prompt: "Fast paced cuts of market vendors...", duration: 8, resolution: "1080p" }
[2026-10-17T12:40:06.940Z] INFO  [pixverse] Task registered successfully. External task_id: pv_891e4a3c
[2026-10-17T12:40:20.312Z] INFO  [poller] Poll pv_891e4a3c -> Status: PROCESSING (no granular % reported by provider)
[2026-10-17T12:40:45.540Z] INFO  [poller] Poll pv_891e4a3c -> Status: PROCESSING (no granular % reported by provider)`;

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Job timeline</span>
            <span className="text-base font-mono font-normal text-[#E5A93C]">
              {jobId}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Lagos After Dark · EP 07 · Scene 06 · Market montage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/production"
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors"
          >
            ← Production queue
          </Link>
          <button
            type="button"
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel job
          </button>
        </div>
      </div>

      {/* Honest Provider Status Card (Screen 13) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
              Active Provider
            </div>
            <div className="text-base font-semibold text-white">PixVerse</div>
            <div className="text-xs font-mono text-[#34D399] mt-0.5">8s duration valid</div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
              Provider Progress
            </div>
            <div className="text-base font-semibold text-white">Not reported</div>
            <div className="text-xs font-mono text-[#6B7280] mt-0.5">
              Honest state: API returns PROCESSING
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
              Lease Holder
            </div>
            <div className="text-base font-semibold text-white">worker-pod-02</div>
            <div className="text-xs font-mono text-[#E5A93C] mt-0.5">Heartbeat renewed 5s ago</div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#1B1E24] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'timeline'
              ? 'bg-[#181B20] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Timeline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-[#181B20] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Redacted logs
        </button>
      </div>

      {/* Tab 1: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
          <div className="space-y-6">
            {timelineEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="font-mono text-xs text-[#6B7280] pt-0.5 w-16 shrink-0">
                  {event.time}
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 ${
                      event.state === 'done'
                        ? 'bg-[#34D399] border-[#34D399]'
                        : event.state === 'running'
                        ? 'bg-[#60A5FA] border-[#60A5FA] animate-pulse'
                        : 'bg-[#181B20] border-[#2E333D]'
                    }`}
                  />
                  {idx < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-10 bg-[#1C2028] mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {event.title}
                  </div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                    {event.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Redacted Logs */}
      {activeTab === 'logs' && (
        <div className="bg-[#0B0C0E] border border-[#22262E] rounded-2xl p-5 font-mono text-xs text-[#9CA3AF] leading-relaxed overflow-x-auto">
          <div className="text-[11px] text-[#E5A93C] mb-3 pb-2 border-b border-[#1C2028]">
            🔒 All bearer tokens and cryptographic secrets are redacted before rendering.
          </div>
          <pre>{redactedLogs}</pre>
        </div>
      )}
    </StudioLayout>
  );
}
