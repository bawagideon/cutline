'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';

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
  const [ghostText, setGhostText] = useState('The bus left Oshodi, and no one waved.');
  const [isMerging, setIsMerging] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Dynamic Odometer metrics
  const wordCount = narration.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round(wordCount * 0.45);
  const estMins = Math.floor(estimatedSeconds / 60);
  const estSecs = (estimatedSeconds % 60).toString().padStart(2, '0');

  // Ghost Type Diff Simulation
  const handleGenerateRevision = () => {
    setIsGenerating(true);
    setHasProposedChange(false);
    setGhostText('');

    setTimeout(() => {
      setIsGenerating(false);
      setHasProposedChange(true);

      const fullText = 'The bus left Oshodi, and no one waved. The dust refused to settle.';
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex <= fullText.length) {
          setGhostText(fullText.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 25);
    }, 450);
  };

  const handleAcceptChange = () => {
    setIsMerging(true);
    setTimeout(() => {
      setNarration(`${ghostText} Habit outlives the route.`);
      setHasProposedChange(false);
      setIsMerging(false);
    }, 200);
  };

  const handleRejectChange = () => {
    setHasProposedChange(false);
  };

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
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
          <Link
            href={`/projects/${id}/episodes/${epId}/script/history`}
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors btn-press"
          >
            History (6)
          </Link>
          <button
            type="button"
            onClick={() => setIsApproved(!isApproved)}
            className={`font-semibold text-xs px-4 py-2 rounded-lg transition-all btn-press shadow-sm ${
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 cut-in">
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

          {/* Odometer Count Bar */}
          <div className="pt-6 border-t border-[#1C2028] flex items-center justify-between text-xs font-mono text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium transition-all duration-150">
                {wordCount} words
              </span>
              <span>·</span>
              <span className="text-white transition-all duration-150">
                est. {estMins}m {estSecs}s
              </span>
              <span>·</span>
              <span>7 scenes</span>
            </div>
            <span className="text-[#34D399] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              Encrypted sync active
            </span>
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
              className="w-full bg-[#E5A93C] hover:bg-[#F0B84D] disabled:opacity-50 text-[#0B0C0E] font-semibold text-xs py-2.5 rounded-lg transition-all btn-press flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0B0C0E] border-t-transparent rounded-full animate-spin" />
                  Streaming ghost type...
                </>
              ) : (
                'Generate revision'
              )}
            </button>

            {hasProposedChange && (
              <div
                className={`mt-6 pt-5 border-t border-[#1C2028] space-y-4 transition-all duration-200 ${
                  isMerging ? 'opacity-50 scale-98' : 'opacity-100 scale-100'
                }`}
              >
                <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF]">
                  PROPOSED CHANGE (GHOST TYPE DIFF)
                </div>

                {/* Ghost Type Diff Viewer */}
                <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#22262E] text-sm leading-relaxed font-mono">
                  <div className="text-[#F87171] line-through opacity-70 mb-2">
                    The conductor still called out stops that no longer existed.
                  </div>
                  <div className="text-[#34D399] flex items-center gap-1 font-medium">
                    <span>{ghostText}</span>
                    <span className="w-1.5 h-4 bg-[#34D399] breathe-live inline-block" />
                  </div>
                </div>

                {/* Merge Settle Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAcceptChange}
                    className="flex-1 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs py-2.5 rounded-lg transition-all btn-press shadow-sm"
                  >
                    Accept (Merge)
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectChange}
                    className="flex-1 border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white py-2.5 rounded-lg transition-colors btn-press"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#1C2028] text-xs text-[#9CA3AF] font-mono">
            Your text is never replaced without explicit user review.
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
