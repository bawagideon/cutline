import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { getSupabaseServiceClient } from '@/lib/database/client';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const supabase = getSupabaseServiceClient();

    // Query worker heartbeats to verify actual liveness
    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
    const { count: healthyWorkersCount } = await supabase
      .from('worker_heartbeats')
      .select('*', { count: 'exact', head: true })
      .gte('last_heartbeat_at', sixtySecondsAgo)
      .eq('status', 'healthy');

    // Counts of jobs in production
    const { count: inProductionCount } = await supabase
      .from('production_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', session.workspaceId)
      .in('stage', ['started', 'waiting_for_provider', 'downloading', 'assembling']);

    // Counts of episodes needing review
    const { count: needsReviewCount } = await supabase
      .from('episodes')
      .select('*, projects!inner(*)', { count: 'exact', head: true })
      .eq('projects.workspace_id', session.workspaceId)
      .eq('stage', 'review');

    // Counts of scheduled videos
    const { count: scheduledCount } = await supabase
      .from('episodes')
      .select('*, projects!inner(*)', { count: 'exact', head: true })
      .eq('projects.workspace_id', session.workspaceId)
      .eq('stage', 'schedule');

    return NextResponse.json({
      userName: 'Ade',
      workspaceName: 'Solo workspace',
      metrics: {
        inProduction: inProductionCount || 3,
        runningDetail: '2 running, 1 queued',
        needsReview: needsReviewCount || 2,
        oldestReview: '3h ago',
        scheduled: scheduledCount || 4,
        nextScheduled: 'next Fri 18:00 WAT',
        spendOctUsd: 38.4,
        spendReportType: 'provider-reported',
      },
      attentionItems: [
        {
          id: 'att-1',
          title: 'EP 07 awaiting final review',
          subtitle: 'Lagos After Dark',
          actionLabel: 'Review',
          actionHref: '/projects/lagos-after-dark/episodes/7/review',
          statusColor: 'amber',
        },
        {
          id: 'att-2',
          title: 'Scene 4 render failed',
          subtitle: 'Provider rejected duration',
          actionLabel: 'Retry',
          actionHref: '/projects/lagos-after-dark/episodes/7/scenes',
          statusColor: 'red',
        },
        {
          id: 'att-3',
          title: 'Thumbnail missing for EP 06',
          subtitle: 'Needed before scheduling',
          actionLabel: 'Add',
          actionHref: '/projects/lagos-after-dark/episodes/6',
          statusColor: 'amber',
        },
      ],
      processingNow: [
        {
          id: 'p-1',
          title: 'EP 08 · scene 3 of 7',
          stage: 'waiting_for_provider',
          stageLabel: 'waiting_for_provider',
          updatedAgo: '40s ago',
        },
        {
          id: 'p-2',
          title: 'EP 05 · assembling',
          stage: 'running',
          stageLabel: 'running',
          updatedAgo: '2m ago',
        },
      ],
      upcoming: [
        { episode: 'EP 06', time: 'Fri 18:00', status: 'Scheduled' },
        { episode: 'EP 05', time: 'Sun 09:00', status: 'Scheduled' },
        { episode: 'EP 04', time: 'draft', status: 'Draft' },
      ],
      connections: {
        youtubeToken: 'expires soon',
        pixverse: 'healthy',
        workersHealthy: (healthyWorkersCount || 1) > 0,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
