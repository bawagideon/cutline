import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, UnauthorizedError, ForbiddenError } from '@/lib/auth/session';
import { getSupabaseServiceClient } from '@/lib/database/client';

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return 'recently';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const supabase = getSupabaseServiceClient();

    const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();

    // Execute queries in parallel with strict session.workspaceId scoping
    const [
      workersRes,
      inProdRes,
      needsReviewRes,
      scheduledCountRes,
      reviewEpisodesRes,
      activeJobsRes,
      scheduledEpisodesRes,
      costRes,
      vaultRes,
      workspaceRes,
    ] = await Promise.all([
      // 1. Worker heartbeats (infrastructure liveness across cluster)
      supabase
        .from('worker_heartbeats')
        .select('*', { count: 'exact', head: true })
        .gte('last_heartbeat_at', sixtySecondsAgo)
        .eq('status', 'healthy'),

      // 2. In-production jobs scoped to session.workspaceId
      supabase
        .from('production_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', session.workspaceId)
        .in('stage', ['started', 'waiting_for_provider', 'downloading', 'assembling']),

      // 3. Needs review episodes scoped to session.workspaceId
      supabase
        .from('episodes')
        .select('*, projects!inner(*)', { count: 'exact', head: true })
        .eq('projects.workspace_id', session.workspaceId)
        .eq('stage', 'review'),

      // 4. Scheduled episodes count scoped to session.workspaceId
      supabase
        .from('episodes')
        .select('*, projects!inner(*)', { count: 'exact', head: true })
        .eq('projects.workspace_id', session.workspaceId)
        .eq('stage', 'schedule'),

      // 5. Review episodes list scoped to session.workspaceId
      supabase
        .from('episodes')
        .select('id, episode_number, title, project_id, projects!inner(name, id, workspace_id)')
        .eq('projects.workspace_id', session.workspaceId)
        .eq('stage', 'review')
        .limit(5),

      // 6. Active production jobs scoped to session.workspaceId
      supabase
        .from('production_jobs')
        .select('id, stage, updated_at, episode_id')
        .eq('workspace_id', session.workspaceId)
        .in('stage', ['started', 'waiting_for_provider', 'downloading', 'assembling'])
        .limit(5),

      // 7. Scheduled episodes list STRICTLY SCOPED to session.workspaceId via projects join
      supabase
        .from('episodes')
        .select('id, episode_number, stage, scheduled_publish_at, projects!inner(workspace_id)')
        .eq('projects.workspace_id', session.workspaceId)
        .eq('stage', 'schedule')
        .limit(5),

      // 8. Production costs scoped to session.workspaceId
      supabase
        .from('production_jobs')
        .select('cost_usd, cost_type')
        .eq('workspace_id', session.workspaceId),

      // 9. Integration vault records scoped to session.workspaceId
      supabase
        .from('integration_vault')
        .select('provider, status')
        .eq('workspace_id', session.workspaceId),

      // 10. Real workspace name
      supabase
        .from('workspaces')
        .select('name')
        .eq('id', session.workspaceId)
        .maybeSingle(),
    ]);

    // Check for all database query errors — fail explicitly rather than masking outages
    const queryErrors = [
      workersRes.error,
      inProdRes.error,
      needsReviewRes.error,
      scheduledCountRes.error,
      reviewEpisodesRes.error,
      activeJobsRes.error,
      scheduledEpisodesRes.error,
      costRes.error,
      vaultRes.error,
      workspaceRes.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Database query failed.',
          details: queryErrors.map((e) => e?.message).join('; '),
        },
        { status: 500 }
      );
    }

    interface EpisodeAttentionRecord {
      id: string;
      episode_number: number;
      project_id: string;
      projects?: { name?: string } | null;
    }

    interface ActiveProductionJobRecord {
      id: string;
      stage: string;
      updated_at?: string | null;
    }

    interface ScheduledEpisodeRecord {
      episode_number: number;
      scheduled_publish_at?: string | null;
    }

    const inProductionCount = inProdRes.count || 0;
    const needsReviewCount = needsReviewRes.count || 0;
    const scheduledCount = scheduledCountRes.count || 0;

    const attentionItems = ((reviewEpisodesRes.data || []) as unknown as EpisodeAttentionRecord[]).map((ep) => ({
      id: ep.id,
      title: `EP ${String(ep.episode_number).padStart(2, '0')} awaiting final review`,
      subtitle: ep.projects?.name || 'Active Project',
      actionLabel: 'Review',
      actionHref: `/projects/${ep.project_id}/episodes/${ep.id}/review`,
      statusColor: 'amber' as const,
    }));

    const processingNow = ((activeJobsRes.data || []) as unknown as ActiveProductionJobRecord[]).map((job) => ({
      id: job.id,
      title: `Job ${job.id.slice(0, 8)} · ${job.stage}`,
      stage: job.stage,
      stageLabel: job.stage,
      updatedAgo: formatTimeAgo(job.updated_at),
    }));

    const upcoming = ((scheduledEpisodesRes.data || []) as unknown as ScheduledEpisodeRecord[]).map((ep) => ({
      episode: `EP ${String(ep.episode_number).padStart(2, '0')}`,
      time: ep.scheduled_publish_at ? new Date(ep.scheduled_publish_at).toLocaleDateString() : 'Planned',
      status: 'Scheduled',
    }));

    // Calculate real workspace spend with provenance tracking
    let totalSpend = 0.0;
    let hasEstimated = false;
    let hasReported = false;

    if (costRes.data && costRes.data.length > 0) {
      for (const row of costRes.data) {
        const val = parseFloat(row.cost_usd);
        if (!isNaN(val) && val > 0) {
          totalSpend += val;
          if (row.cost_type === 'provider-reported') {
            hasReported = true;
          } else {
            hasEstimated = true;
          }
        }
      }
    }

    let spendReportType: 'provider-reported' | 'estimated' | 'mixed' | 'none' = 'none';
    if (hasReported && hasEstimated) {
      spendReportType = 'mixed';
    } else if (hasReported) {
      spendReportType = 'provider-reported';
    } else if (hasEstimated) {
      spendReportType = 'estimated';
    }

    // Vault statuses
    const vaultMap = new Map<string, string>();
    if (vaultRes.data) {
      for (const v of vaultRes.data) {
        vaultMap.set(v.provider, v.status);
      }
    }

    const realWorkspaceName = workspaceRes.data?.name || 'Personal Studio';

    return NextResponse.json({
      userName: session.email ? session.email.split('@')[0] : 'Creator',
      workspaceName: realWorkspaceName,
      workspaceId: session.workspaceId,
      metrics: {
        inProduction: inProductionCount,
        runningDetail: inProductionCount > 0 ? `${inProductionCount} in progress` : '0 running',
        needsReview: needsReviewCount,
        oldestReview: needsReviewCount > 0 ? 'Pending' : 'None',
        scheduled: scheduledCount,
        nextScheduled: scheduledCount > 0 ? 'Scheduled' : 'None',
        spendOctUsd: Number(totalSpend.toFixed(2)),
        spendReportType,
      },
      attentionItems,
      processingNow,
      upcoming,
      connections: {
        youtubeToken: vaultMap.get('youtube') || 'unconnected',
        pixverse: vaultMap.get('pixverse') || 'unconfigured',
        gemini: vaultMap.get('gemini') || 'unconfigured',
        // Worker heartbeats are cluster-wide infrastructure liveness, not per-workspace isolated workers
        workersHealthy: (workersRes.count || 0) > 0,
        workerClusterScope: 'infrastructure',
      },
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    const message = err instanceof Error ? err.message : 'Failed to load dashboard data.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
