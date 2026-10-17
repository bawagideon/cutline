'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function ScriptEditorPage() {
  const params = useParams();
  const id = params?.id || 'lagos-after-dark';
  const epId = params?.epId || '7';

  const [narration, setNarration] = useState(
    'The conductor still called out stops that no longer existed. Mile 12, Oshodi, Mile 2. Habit outlives the route.'
  );
  const [visualPrompt, setVisualPrompt] = useState(
    'Interior of a faded yellow danfo at dawn, 35mm, warm light, handheld.'
  );
  const [aiPrompt, setAiPrompt] = useState('Make the opening more mournful');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasProposedChange, setHasProposedChange] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const handleGenerateRevision = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasProposedChange(true);
    }, 600);
  };

  const handleAcceptChange = () => {
    setNarration(
      'The bus left Oshodi, and no one waved. Mile 12, Oshodi, Mile 2. Habit outlives the route.'
    );
    setHasProposedChange(false);
  };

  const handleRejectChange = () => {
    setHasProposedChange(false);
  };

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Script editor
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            EP {epId.toString().padStart(2, '0')} · version 6 · autosaved 12:41
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/episodes/${epId}`}
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors"
          >
            ← Episode
          </Link>
          <button
            type="button"
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors"
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setIsApproved(!isApproved)}
            className={`font-semibold text-xs px-4 py-2 rounded-lg transition-colors ${
              isApproved
                ? 'bg-[#10B981] text-[#0B0C0E] hover:bg-[#34D399]'
                : 'bg-[#E5A93C] text-[#0B0C0E] hover:bg-[#F0B84D]'
            }`}
          >
            {isApproved ? '✓ Script approved' : 'Approve script'}
          </button>
        </div>
      </div>

      {/* Main Grid: Editor on Left, AI Revision on Right (Screen 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Script Content Area (7 cols) */}
        <div className="lg:col-span-7 bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-3">
                SCENE 03 · NARRATION
              </div>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={4}
                className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl p-4 text-white text-base md:text-lg leading-relaxed resize-none focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-3">
                VISUAL PROMPT
              </div>
              <textarea
                value={visualPrompt}
                onChange={(e) => setVisualPrompt(e.target.value)}
                rows={3}
                className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl p-4 text-[#E6E8EB] text-sm md:text-base font-mono resize-none focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[#1C2028] flex items-center justify-between text-xs font-mono text-[#6B7280]">
            <span>1,420 words · est. 9m 28s · 7 scenes</span>
            <span className="text-[#34D399]">Encrypted sync active</span>
          </div>
        </div>

        {/* Right: Revise with AI Area (5 cols) */}
        <div className="lg:col-span-5 bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white">Revise with AI</h2>

            <div>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe desired revision or tone..."
                className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B7280] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateRevision}
              disabled={isGenerating}
              className="w-full bg-[#E5A93C] hover:bg-[#F0B84D] disabled:opacity-50 text-[#0B0C0E] font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0B0C0E] border-t-transparent rounded-full animate-spin" />
                  Generating revision...
                </>
              ) : (
                'Generate revision'
              )}
            </button>

            {hasProposedChange && (
              <div className="mt-6 pt-5 border-t border-[#1C2028] space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF]">
                  PROPOSED CHANGE
                </div>

                {/* Diff Viewer */}
                <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#22262E] text-sm leading-relaxed font-mono">
                  <span className="text-[#EF4444] line-through mr-2">
                    The bus left Oshodi.
                  </span>
                  <span className="text-[#10B981]">
                    The bus left Oshodi, and no one waved.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAcceptChange}
                    className="flex-1 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs py-2.5 rounded-lg transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectChange}
                    className="flex-1 border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white py-2.5 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#1C2028] text-xs text-[#9CA3AF]">
            Your text is never replaced without review.
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
