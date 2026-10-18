'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';

interface ScriptVersion {
  version: string;
  label: string;
  timestamp: string;
  author: string;
  narrationSnippet: string;
}

export default function ScriptVersionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id || 'lagos-after-dark';
  const epId = params?.epId || '7';

  const [selectedVersion, setSelectedVersion] = useState('v5');
  const [restoring, setRestoring] = useState(false);

  const versions: ScriptVersion[] = [
    {
      version: 'v6',
      label: 'Autosave',
      timestamp: 'Today 12:41',
      author: 'Ade Okafor',
      narrationSnippet: 'The bus left Oshodi, and no one waved. The conductor still called out stops that no longer existed. Mile 12, Oshodi, Mile 2. Habit outlives the route.',
    },
    {
      version: 'v5',
      label: 'AI revision accepted',
      timestamp: 'Today 11:20',
      author: 'Gemini 2.5 Pro',
      narrationSnippet: 'The bus left Oshodi, and no one waved. Habit outlives the route.',
    },
    {
      version: 'v4',
      label: 'Manual edit',
      timestamp: 'Yesterday',
      author: 'Ade Okafor',
      narrationSnippet: 'The bus left Oshodi. The conductor still called out stops that no longer existed. Mile 12, Oshodi, Mile 2. Habit outlives the route.',
    },
    {
      version: 'v3',
      label: 'AI draft',
      timestamp: 'Oct 14',
      author: 'Gemini 2.5 Pro',
      narrationSnippet: 'The yellow danfo bus rumbled through the dusty streets of Oshodi at the break of dawn.',
    },
    {
      version: 'v2',
      label: 'Manual edit',
      timestamp: 'Oct 13',
      author: 'Ade Okafor',
      narrationSnippet: 'Drafting scene breakdown for the last danfo bus in mainland Lagos.',
    },
    {
      version: 'v1',
      label: 'Created',
      timestamp: 'Oct 12',
      author: 'Ade Okafor',
      narrationSnippet: 'Initial episode creation from prompt.',
    },
  ];

  const handleRestore = (ver: string) => {
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      alert(`Version ${ver} restored as new version v7. Nothing is deleted.`);
      router.push(`/projects/${id}/episodes/${epId}/script`);
    }, 600);
  };

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Version history
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            EP {epId.toString().padStart(2, '0')} · {versions.length} versions kept
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/episodes/${epId}/script`}
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-2 rounded-lg transition-colors"
          >
            ← Back to script
          </Link>
        </div>
      </div>

      {/* Screen 30 Grid: Version List on Left, Diff & Restore on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Version Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-[#121417] border border-[#22262E] rounded-2xl p-4 divide-y divide-[#1C2028]">
          {versions.map((ver) => {
            const isSelected = selectedVersion === ver.version;
            return (
              <button
                key={ver.version}
                type="button"
                onClick={() => setSelectedVersion(ver.version)}
                className={`w-full text-left p-3.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#181B20] border border-[#2E333D]'
                    : 'hover:bg-[#15181D]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#E5A93C]">
                      {ver.version}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {ver.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280]">
                    {ver.timestamp}
                  </span>
                </div>
                <div className="text-xs text-[#9CA3AF] truncate font-mono">
                  {ver.narrationSnippet}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Diff Comparison & Restore Box (7 cols) */}
        <div className="lg:col-span-7 bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1C2028]">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Compare {selectedVersion} to v6 (current)
                </h2>
                <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                  Showing additions and deletions
                </p>
              </div>

              {selectedVersion !== 'v6' && (
                <button
                  type="button"
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={restoring}
                  className="bg-[#E5A93C] hover:bg-[#F0B84D] disabled:opacity-50 text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  {restoring ? 'Restoring...' : `Restore ${selectedVersion}`}
                </button>
              )}
            </div>

            {/* Visual Diff Display (Screen 30) */}
            <div className="p-5 bg-[#0B0C0E] border border-[#22262E] rounded-xl font-mono text-xs md:text-sm leading-relaxed space-y-3">
              <div>
                <span className="text-[#EF4444] line-through bg-[#2E1419] px-1 py-0.5 rounded mr-2">
                  The bus left Oshodi.
                </span>
                <span className="text-[#10B981] bg-[#0E2A1E] px-1 py-0.5 rounded">
                  The bus left Oshodi, and no one waved. The conductor still called out stops that no longer existed.
                </span>
              </div>
              <div className="text-[#9CA3AF]">
                Mile 12, Oshodi, Mile 2. Habit outlives the route.
              </div>
            </div>
          </div>

          {/* Honest Versioning Footnote */}
          <div className="pt-6 border-t border-[#1C2028] text-xs font-mono text-[#9CA3AF]">
            Restoring creates a new version (v7). Nothing is deleted.
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
