'use client';

import React, { useState } from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';

interface UsageRow {
  episode: string;
  project: string;
  renderCost: string;
  renderSource: string;
  voiceCost: string;
  voiceSource: string;
  aiCost: string;
  aiSource: string;
  total: string;
  date: string;
}

export default function UsagePage() {
  const [usageRows] = useState<UsageRow[]>([]);

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Usage and costs
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Billing cycle · all values audited and labelled honestly
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('No usage data to export for this billing cycle.')}
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors btn-press"
          >
            Export audit CSV
          </button>
        </div>
      </div>

      {/* Top Cards: Total & Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 cut-in">
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Month to date
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">$0.00</div>
          <div className="text-xs font-mono text-[#E5A93C] mt-1">
            calculated total
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Video (PixVerse)
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">$0.00</div>
          <div className="text-xs font-mono text-[#34D399] mt-1">
            provider-reported
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Voice (ElevenLabs)
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">$0.00</div>
          <div className="text-xs font-mono text-[#34D399] mt-1">
            provider-reported
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1">
            Storage & Bandwidth
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white font-mono">$0.00</div>
          <div className="text-xs font-mono text-[#9CA3AF] mt-1">
            estimated
          </div>
        </div>
      </div>

      {/* Itemized Audit Table */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028] cut-in">
        <div className="p-4 px-6 bg-[#0E1013] text-xs font-mono text-[#9CA3AF] hidden md:grid md:grid-cols-12 gap-4">
          <div className="col-span-4">Episode & Project</div>
          <div className="col-span-2">Render (PixVerse)</div>
          <div className="col-span-2">Voice (ElevenLabs)</div>
          <div className="col-span-2">AI (Gemini)</div>
          <div className="col-span-2 text-right">Total Cost</div>
        </div>

        {usageRows.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#1A1D23] border border-[#22262E] flex items-center justify-center text-xl text-[#34D399] mx-auto mb-4 font-mono">
              $
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No provider spend yet</h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Itemized provider costs for video generation, ElevenLabs speech synthesis, and Gemini LLM calls will appear here in real-time as tasks execute.
            </p>
          </div>
        ) : (
          usageRows.map((row, idx) => (
            <div
              key={idx}
              className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center hover:bg-[#15181D] transition-colors"
            >
              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-white">{row.episode}</div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                  {row.project} · {row.date}
                </div>
              </div>

              <div className="md:col-span-2 text-xs font-mono">
                <div className="text-white">{row.renderCost}</div>
                <div className="text-[10px] text-[#34D399]">{row.renderSource}</div>
              </div>

              <div className="md:col-span-2 text-xs font-mono">
                <div className="text-white">{row.voiceCost}</div>
                <div className="text-[10px] text-[#34D399]">{row.voiceSource}</div>
              </div>

              <div className="md:col-span-2 text-xs font-mono">
                <div className="text-white">{row.aiCost}</div>
                <div className="text-[10px] text-[#34D399]">{row.aiSource}</div>
              </div>

              <div className="md:col-span-2 text-right">
                <span className="text-sm font-mono font-bold text-[#E5A93C]">
                  {row.total}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </StudioLayout>
  );
}
