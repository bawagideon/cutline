'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface DashboardMetrics {
  inProduction: number;
  runningDetail: string;
  needsReview: number;
  oldestReview: string;
  scheduled: number;
  nextScheduled: string;
  spendOctUsd: number;
  spendReportType: string;
}

interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
  statusColor: 'amber' | 'red';
}

interface ProcessingJob {
  id: string;
  title: string;
  stage: string;
  stageLabel: string;
  updatedAgo: string;
}

interface UpcomingEpisode {
  episode: string;
  time: string;
  status: string;
}

export default function OverviewPage() {
  const { user, isLoaded } = useUser();
  const firstName = isLoaded && user ? user.firstName || (user.fullName ? user.fullName.split(' ')[0] : 'Creator') : 'Creator';

  const [viewMode, setViewMode] = useState<'welcome' | 'active'>('welcome');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    inProduction: 0,
    runningDetail: '0 running',
    needsReview: 0,
    oldestReview: 'None',
    scheduled: 0,
    nextScheduled: 'None',
    spendOctUsd: 0.0,
    spendReportType: 'provider-reported',
  });
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [processingNow, setProcessingNow] = useState<ProcessingJob[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingEpisode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProjects, setHasProjects] = useState(false);
  const [workspaceProvisioned, setWorkspaceProvisioned] = useState(false);
  const [connections, setConnections] = useState<{
    youtubeToken: string;
    pixverse: string;
    gemini?: string;
    workersHealthy?: boolean;
  }>({
    youtubeToken: 'unconnected',
    pixverse: 'unconfigured',
    gemini: 'unconfigured',
    workersHealthy: false,
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, projRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/projects').catch(() => null),
      ]);

      if (!dashRes.ok) {
        const errJson = await dashRes.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${dashRes.status}: Failed to load dashboard`);
      }

      const json = await dashRes.json();
      if (json.metrics) setMetrics(json.metrics);
      if (json.attentionItems) setAttentionItems(json.attentionItems);
      if (json.processingNow) setProcessingNow(json.processingNow);
      if (json.upcoming) setUpcoming(json.upcoming);
      if (json.connections) setConnections(json.connections);
      if (json.workspaceId) setWorkspaceProvisioned(true);

      if (projRes && projRes.ok) {
        const pJson = await projRes.json().catch(() => ({}));
        setHasProjects(Boolean(pJson.projects && pJson.projects.length > 0));
      }

      // Switch to active command view if there are active jobs or items needing review
      if (json.metrics?.inProduction > 0 || json.metrics?.needsReview > 0 || json.attentionItems?.length > 0) {
        setViewMode('active');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database connection error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Compute dynamic readiness score based on real database & connection state
  const readinessChecklist = [
    { id: 'workspace', label: 'Workspace provisioned', done: workspaceProvisioned },
    { id: 'project', label: 'First project created', done: hasProjects },
    { id: 'gemini', label: 'Gemini AI connected', done: connections.gemini === 'connected' },
    { id: 'pixverse', label: 'Video provider configured', done: connections.pixverse === 'connected' },
    { id: 'youtube', label: 'YouTube channel linked', done: connections.youtubeToken === 'connected' },
    { id: 'worker', label: 'Render worker healthy', done: Boolean(connections.workersHealthy) },
  ];
  const completedCount = readinessChecklist.filter((c) => c.done).length;
  const readinessPercent = Math.round((completedCount / readinessChecklist.length) * 100);

  return (
    <StudioLayout>
      {/* View Switcher for Audit & Inspection (Screen 32 Welcome vs Screen 04 Active Command) */}
      <div className="flex items-center justify-end gap-2 mb-4 text-xs font-mono cut-in">
        <span className="text-[#6B7280]">View:</span>
        <button
          type="button"
          onClick={() => setViewMode('welcome')}
          className={`px-2.5 py-1 rounded-lg transition-colors btn-press ${
            viewMode === 'welcome'
              ? 'bg-[#1F242D] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Screen 32: Welcome State
        </button>
        <button
          type="button"
          onClick={() => setViewMode('active')}
          className={`px-2.5 py-1 rounded-lg transition-colors btn-press ${
            viewMode === 'active'
              ? 'bg-[#1F242D] text-white border border-[#2E333D]'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Screen 04: Active Command
        </button>
      </div>

      {loading && !error && (
        <div className="mb-4 text-xs font-mono text-[#9CA3AF] flex items-center gap-2 cut-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
          <span>Verifying studio session and database state...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-4 font-mono cut-in">
          <div>
            <span className="font-semibold text-red-400">Database Connection Error:</span> {error}
          </div>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-lg text-white font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {viewMode === 'welcome' ? (
        /* Screen 32: Welcome / Genuine Zero State */
        <div className="max-w-4xl mx-auto py-8 cut-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Welcome to Cutline, {firstName}
            </h1>
            <p className="text-sm text-[#9CA3AF]">
              Four steps to your first published video. You can take them in any order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action Card 1: New Project */}
            <div className="bg-[#121417] border border-dashed border-[#E5A93C]/40 hover:border-[#E5A93C] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🎬</span>
                  <h2 className="text-base font-semibold text-white">New project</h2>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Start a project. Blank or from a documentary / episodic series template.
                </p>
              </div>
              <Link
                href="/projects/new"
                className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press shadow-sm"
              >
                Create first project
              </Link>
            </div>

            {/* Action Card 2: Readiness Ring */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#22262E]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#E5A93C]"
                        strokeDasharray={`${readinessPercent}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span>Readiness ({readinessPercent}%)</span>
                  </h2>
                  <span className="text-xs font-mono text-[#E5A93C]">{completedCount} of 6 complete</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  {completedCount === 6
                    ? 'All workspace requirements met. Ready for automated publishing.'
                    : 'Finish setting up your workspace checklist to unlock automated publishing.'}
                </p>
              </div>
              <Link
                href="/onboarding"
                className="border border-[#2E333D] hover:bg-[#181B20] text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press"
              >
                Continue setup →
              </Link>
            </div>

            {/* Action Card 3: Connect Gemini */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connect Gemini</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Needed for AI script generation, beat outlines, and revision diffs.
                </p>
              </div>
              <Link
                href="/integrations"
                className="bg-[#181B20] hover:bg-[#22262E] border border-[#2E333D] text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press"
              >
                Connect in Vault
              </Link>
            </div>

            {/* Action Card 4: Connect YouTube */}
            <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Connect YouTube</h2>
                <p className="text-xs text-[#9CA3AF] mb-6">
                  Only when you want to publish. Can be completed at any time.
                </p>
              </div>
              <Link
                href="/channels"
                className="border border-[#2E333D] hover:bg-[#181B20] text-[#9CA3AF] hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl text-center transition-colors btn-press"
              >
                Connect Channel
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 4: Active Command Overview */
        <div className="cut-in">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Good evening, {firstName}
              </h1>
              <p className="text-sm text-[#9CA3AF] mt-1 font-mono">
                {attentionItems.length > 0
                  ? `${attentionItems.length} items need your attention. ${metrics.inProduction} jobs running.`
                  : 'Workspace idle. 0 jobs running.'}
              </p>
            </div>
            <Link
              href="/projects/new"
              className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors self-start md:self-auto btn-press shadow-md"
            >
              New project
            </Link>
          </div>

          {/* Top 4 Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">IN PRODUCTION</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                {metrics.inProduction}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">{metrics.runningDetail}</div>
            </div>

            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">NEEDS REVIEW</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                {metrics.needsReview}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">oldest: {metrics.oldestReview}</div>
            </div>

            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">SCHEDULED</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                {metrics.scheduled}
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">{metrics.nextScheduled}</div>
            </div>

            <div className="bg-[#121417] border border-[#22262E] rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">SPEND, OCT</div>
              <div className="text-3xl font-bold text-white mb-2 transition-all duration-500 font-mono">
                ${metrics.spendOctUsd.toFixed(2)}
              </div>
              <div className="text-xs text-[#34D399] font-mono">{metrics.spendReportType}</div>
            </div>
          </div>

          {/* Main Grid: Needs Attention vs Upcoming & Connections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Attention & Processing */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Needs your attention</h2>
                {attentionItems.length > 0 ? (
                  <div className="space-y-4">
                    {attentionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B20]/60 border border-[#22262E] hover:border-[#383E4C] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full mt-1.5 breathe-live ${
                              item.statusColor === 'red'
                                ? 'bg-[#F87171] shadow-[0_0_8px_rgba(248,113,113,0.6)]'
                                : 'bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium text-white">{item.title}</div>
                            <div className="text-xs text-[#9CA3AF] font-mono">{item.subtitle}</div>
                          </div>
                        </div>
                        <Link
                          href={item.actionHref}
                          className="px-3.5 py-1.5 rounded-lg border border-[#2E333D] hover:bg-[#22262E] text-xs font-medium text-white transition-colors btn-press"
                        >
                          {item.actionLabel}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-[#181B20]/40 border border-[#22262E] text-xs text-[#9CA3AF]">
                    ✓ All clear. No releases awaiting gate approval or failed renders.
                  </div>
                )}

                {/* Processing Now */}
                <h3 className="text-sm font-semibold text-white mt-8 mb-4">Processing now</h3>
                {processingNow.length > 0 ? (
                  <div className="space-y-3">
                    {processingNow.map((job) => (
                      <div key={job.id} className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                        <span className="text-sm text-white">{job.title}</span>
                        <div className="flex items-center gap-3">
                          <StatusPill label={job.stageLabel} variant="blue" />
                          <span className="text-xs text-[#9CA3AF] font-mono">{job.updatedAgo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-[#181B20]/40 border border-[#22262E] text-xs text-[#9CA3AF]">
                    Queue idle. No rendering workers active.
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Column: Upcoming & Connections */}
            <div className="space-y-6">
              <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <h2 className="text-base font-semibold text-white mb-4">Upcoming</h2>
                {upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {upcoming.map((u, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                        <span className="text-sm text-white">{u.episode} · {u.time}</span>
                        <StatusPill label={u.status} variant="green" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-[#181B20]/40 border border-[#22262E] text-xs text-[#9CA3AF]">
                    No videos scheduled for publishing.
                  </div>
                )}

                {/* Connections Health */}
                <h3 className="text-sm font-semibold text-white mt-8 mb-4">Connections</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#1C2028]">
                    <span className="text-sm text-white">YouTube token</span>
                    <StatusPill
                      label={connections.youtubeToken}
                      variant={connections.youtubeToken === 'connected' ? 'green' : 'gray'}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-white">PixVerse</span>
                    <StatusPill
                      label={connections.pixverse}
                      variant={connections.pixverse === 'healthy' ? 'green' : 'gray'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
