import { NextRequest, NextResponse } from 'next/server';
import { WorkerManager } from '@/lib/queue/worker-manager';

/**
 * Worker Trigger API
 * SECURITY FIX: Strictly enforces Bearer CRON_SECRET authorization.
 * Browser dashboard is NOT permitted to call this route unauthenticated.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET is strictly mandatory
  if (process.env.NODE_ENV === 'production' && !cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on server.' },
      { status: 500 }
    );
  }

  const expectedToken = `Bearer ${cronSecret || 'cutline_super_secret_cron_token_32chars_min'}`;
  if (!authHeader || authHeader !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized. Valid worker cron secret required.' },
      { status: 401 }
    );
  }

  const worker = new WorkerManager();

  try {
    // 1. Record worker heartbeat
    await worker.recordHeartbeat(1);

    // 2. Claim next available job using atomic lease
    const claimedJob = await worker.claimNextJob();

    if (!claimedJob) {
      await worker.recordHeartbeat(0);
      return NextResponse.json({
        success: true,
        message: 'No pending jobs in queue. Worker heartbeat recorded.',
      });
    }

    // 3. Process claimed job
    await worker.processJob(claimedJob);
    await worker.recordHeartbeat(0);

    return NextResponse.json({
      success: true,
      processedJobId: claimedJob.id,
      stage: claimedJob.stage,
      provider: claimedJob.provider,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Worker run failed';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
