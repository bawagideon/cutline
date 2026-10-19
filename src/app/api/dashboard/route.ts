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

    interface EpisodeAttentionRecord {
      id: string;
      episode_number: number;
      project_id: string;
      projects?: { name?: string } | null;
    }

    interface ProductionJobRecord {
      id: string;
      stage: string;
    }

    interface ScheduledEpisodeRecord {
      episode_number: number;
      scheduled_publish_at?: string | null;
    }

    // Query real attention items
    const { data: reviewEpisodes } = await supabase
      .from('episodes')
      .select('id, episode_number, title, project_id, projects!inner(name, id)')
      .eq('projects.workspace_id', session.workspaceId)
      .eq('stage', 'review')
      .limit(5);

    const attentionItems = ((reviewEpisodes || []) as unknown as EpisodeAttentionRecord[]).map((ep) => ({
      id: ep.id,
      title: `EP ${String(ep.episode_number).padStart(2, '0')} awaiting final review`,
      subtitle: ep.projects?.name || 'Active Project',
      actionLabel: 'Review',
      actionHref: `/projects/${ep.project_id}/episodes/${ep.id}/review`,
      statusColor: 'amber',
    }));

    // Query real processing jobs
    const { data: activeJobs } = await supabase
      .from('production_jobs')
      .select('id, stage, updated_at, episode_id')
      .eq('workspace_id', session.workspaceId)
      .in('stage', ['started', 'waiting_for_provider', 'downloading', 'assembling'])
      .limit(5);

    const processingNow = ((activeJobs || []) as unknown as ProductionJobRecord[]).map((job) => ({
      id: job.id,
      title: `Job ${job.id.slice(0, 8)} · ${job.stage}`,
      stage: job.stage,
      stageLabel: job.stage,
      updatedAgo: 'recently',
    }));

    // Query real scheduled episodes
    const { data: scheduledEpisodes } = await supabase
      .from('episodes')
      .select('id, episode_number, stage, scheduled_publish_at')
      .eq('stage', 'schedule')
      .limit(5);

    const upcoming = ((scheduledEpisodes || []) as unknown as ScheduledEpisodeRecord[]).map((ep) => ({
      episode: `EP ${String(ep.episode_number).padStart(2, '0')}`,
      time: ep.scheduled_publish_at || 'Planned',
      status: 'Scheduled',
    }));

    return NextResponse.json({
      userName: session.email ? session.email.split('@')[0] : 'Creator',
      workspaceName: 'Personal Studio',
      metrics: {
        inProduction: inProductionCount || 0,
        runningDetail: inProductionCount ? `${inProductionCount} in progress` : '0 running',
        needsReview: needsReviewCount || 0,
        oldestReview: needsReviewCount ? 'Pending' : 'None',
        scheduled: scheduledCount || 0,
        nextScheduled: scheduledCount ? 'Scheduled' : 'None',
        spendOctUsd: 0.0,
        spendReportType: 'provider-reported',
      },
      attentionItems,
      processingNow,
      upcoming,
      connections: {
        youtubeToken: 'unconnected',
        pixverse: 'unconfigured',
        workersHealthy: (healthyWorkersCount || 0) > 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard data.' }, { status: 500 });
  }
}
