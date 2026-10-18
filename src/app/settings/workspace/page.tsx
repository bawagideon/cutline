'use client';

import React, { useState } from 'react';

export default function WorkspaceLimitsPage() {
  const [limits, setLimits] = useState({
    maxConcurrentJobs: 2,
    maxScenesPerEpisode: 12,
    maxFileSizeMb: 500,
    retriesPerStage: 3,
    monthlySpendCapUsd: 60,
  });

  const [safeguards, setSafeguards] = useState({
    requireApprovalBeforePublish: true,
    pauseJobsAtSpendCap: true,
    markAiGenerated: true,
  });

  const [logRetentionDays, setLogRetentionDays] = useState('30 days');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Limits (Screen 35) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Limits</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Resource ceilings and worker throttling for your workspace.
          </p>
        </div>

        <div className="divide-y divide-[#1C2028]">
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Max concurrent jobs</div>
              <div className="text-xs font-mono text-[#9CA3AF]">Parallel worker processes</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-white">{limits.maxConcurrentJobs}</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Enter max concurrent jobs:', String(limits.maxConcurrentJobs));
                  if (val) setLimits({ ...limits, maxConcurrentJobs: parseInt(val) || 2 });
                }}
                className="text-xs text-[#E5A93C] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Max scenes per episode</div>
              <div className="text-xs font-mono text-[#9CA3AF]">Planner duration boundary</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-white">{limits.maxScenesPerEpisode}</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Enter max scenes per episode:', String(limits.maxScenesPerEpisode));
                  if (val) setLimits({ ...limits, maxScenesPerEpisode: parseInt(val) || 12 });
                }}
                className="text-xs text-[#E5A93C] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Max file size</div>
              <div className="text-xs font-mono text-[#9CA3AF]">Downloader safety ceiling</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-white">{limits.maxFileSizeMb} MB</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Enter max file size in MB:', String(limits.maxFileSizeMb));
                  if (val) setLimits({ ...limits, maxFileSizeMb: parseInt(val) || 500 });
                }}
                className="text-xs text-[#E5A93C] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Retries per stage</div>
              <div className="text-xs font-mono text-[#9CA3AF]">Automatic failure recovery attempts</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-white">{limits.retriesPerStage}</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Enter retries per stage:', String(limits.retriesPerStage));
                  if (val) setLimits({ ...limits, retriesPerStage: parseInt(val) || 3 });
                }}
                className="text-xs text-[#E5A93C] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Monthly spend cap (USD)</div>
              <div className="text-xs font-mono text-[#9CA3AF]">Hard limit on billable provider API usage</div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-[#E5A93C]">${limits.monthlySpendCapUsd}</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Enter monthly spend cap in USD:', String(limits.monthlySpendCapUsd));
                  if (val) setLimits({ ...limits, monthlySpendCapUsd: parseInt(val) || 60 });
                }}
                className="text-xs text-[#E5A93C] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Safeguards (Screen 35) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Safeguards</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Operational gates to prevent unintended publishing or billing overages.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={safeguards.requireApprovalBeforePublish}
              onChange={(e) =>
                setSafeguards({ ...safeguards, requireApprovalBeforePublish: e.target.checked })
              }
              className="accent-[#E5A93C] w-4 h-4 rounded"
            />
            <span>Require approval before any public publish</span>
          </label>

          <label className="flex items-center gap-3 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={safeguards.pauseJobsAtSpendCap}
              onChange={(e) =>
                setSafeguards({ ...safeguards, pauseJobsAtSpendCap: e.target.checked })
              }
              className="accent-[#E5A93C] w-4 h-4 rounded"
            />
            <span>Pause jobs when spend cap is reached</span>
          </label>

          <label className="flex items-center gap-3 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={safeguards.markAiGenerated}
              onChange={(e) =>
                setSafeguards({ ...safeguards, markAiGenerated: e.target.checked })
              }
              className="accent-[#E5A93C] w-4 h-4 rounded"
            />
            <span>Mark AI-generated content when publishing to YouTube</span>
          </label>
        </div>

        {/* Section 3: Retention */}
        <div className="pt-6 border-t border-[#1C2028] flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Retention</div>
            <div className="text-xs font-mono text-[#9CA3AF]">Keep failed job logs</div>
          </div>
          <select
            value={logRetentionDays}
            onChange={(e) => setLogRetentionDays(e.target.value)}
            className="font-mono text-xs text-white bg-[#0B0C0E] px-3 py-1.5 rounded-lg border border-[#22262E] focus:outline-none focus:border-[#E5A93C]"
          >
            <option value="7 days">7 days</option>
            <option value="14 days">14 days</option>
            <option value="30 days">30 days</option>
            <option value="90 days">90 days</option>
          </select>
        </div>

        <div className="pt-4 border-t border-[#1C2028] flex items-center justify-between">
          <span className="text-xs font-mono text-[#34D399]">
            {saved ? '✓ Safeguards saved' : ''}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors"
          >
            Save limits
          </button>
        </div>
      </div>
    </div>
  );
}
