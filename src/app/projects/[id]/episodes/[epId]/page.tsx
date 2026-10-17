'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function EpisodeWorkspacePage() {
  const params = useParams();
  const id = params?.id || 'lagos-after-dark';
  const epId = params?.epId || '7';

  const scenes = [
    { num: '01', title: 'Oshodi dawn', status: 'done' },
    { num: '02', title: 'Conductor interview', status: 'done' },
    { num: '03', title: 'Bus interior', status: 'done' },
    { num: '04', title: 'Rain on Third Mainland', status: 'failed' },
    { num: '05', title: 'Archive footage', status: 'queued' },
  ];

  return (
    <StudioLayout>
      {/* Mobile Top Context */}
      <div className="md:hidden text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
        LAGOS AFTER DARK
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            EP 07 · The Last Danfo
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Lagos After Dark · 11:42 runtime est.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill label="Saved 12:41" variant="green" />
          <Link
            href={`/projects/${id}/episodes/${epId}/script`}
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-2 rounded-lg transition-colors"
          >
            Open script
          </Link>
          <Link
            href={`/projects/${id}/episodes/${epId}/review`}
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Send to production
          </Link>
        </div>
      </div>

      {/* Pipeline Stage Bar */}
      <div className="bg-[#121417] border border-[#22262E] rounded-xl p-3 mb-8 overflow-x-auto flex items-center gap-2">
        <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full whitespace-nowrap">✓ Brief</span>
        <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full whitespace-nowrap">✓ Script</span>
        <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full whitespace-nowrap">✓ Scenes</span>
        <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full whitespace-nowrap">✓ Render</span>
        <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-3 py-1 rounded-full whitespace-nowrap">✓ Assemble</span>
        <span className="text-xs font-mono text-[#60A5FA] bg-[#0F2236] border border-[#1E3A5F] px-3 py-1 rounded-full whitespace-nowrap font-semibold">Review</span>
        <span className="text-xs font-mono text-[#6B7280] px-3 py-1 whitespace-nowrap">Schedule</span>
        <span className="text-xs font-mono text-[#6B7280] px-3 py-1 whitespace-nowrap">Publish</span>
      </div>

      {/* 3 Columns Layout (Responsive Stack on Mobile matching Screen 22) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Script Preview */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Script</h2>
              <Link
                href={`/projects/${id}/episodes/${epId}/script`}
                className="text-xs text-[#E5A93C] hover:underline"
              >
                Edit
              </Link>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-relaxed mb-4">
              &ldquo;The yellow bus rolled past Oshodi one last time. Nobody on board knew the route would be retired by morning...&rdquo;
            </p>
          </div>
          <div className="pt-4 border-t border-[#1C2028] text-xs font-mono text-[#6B7280]">
            1,420 words · 9m 28s · v6
          </div>
        </div>

        {/* Column 2: Scenes List */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Scenes</h2>
            <Link
              href={`/projects/${id}/episodes/${epId}/scenes`}
              className="text-xs text-[#E5A93C] hover:underline"
            >
              Planner
            </Link>
          </div>
          <div className="space-y-3">
            {scenes.map((scene) => (
              <div key={scene.num} className="flex items-center justify-between text-xs py-1.5 border-b border-[#1C2028] last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[#6B7280]">{scene.num}</span>
                  <span className="text-white">{scene.title}</span>
                </div>
                <StatusPill label={scene.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Publishing Readiness */}
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Publishing readiness</h2>
            <Link
              href={`/projects/${id}/episodes/${epId}/review`}
              className="text-xs text-[#E5A93C] hover:underline"
            >
              Review
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-2 border-b border-[#1C2028]">
              <span className="text-[#9CA3AF]">Script approved</span>
              <StatusPill label="yes" variant="green" />
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-[#1C2028]">
              <span className="text-[#9CA3AF]">All scenes verified</span>
              <StatusPill label="4 of 5" variant="amber" />
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b border-[#1C2028]">
              <span className="text-[#9CA3AF]">Thumbnail</span>
              <StatusPill label="missing" variant="red" />
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-[#9CA3AF]">Metadata</span>
              <StatusPill label="done" variant="green" />
            </div>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
