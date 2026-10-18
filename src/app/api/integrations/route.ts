import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, UnauthorizedError } from '@/lib/auth/session';
import { encryptSecret, maskApiKey } from '@/lib/crypto/vault';
import { getSupabaseServiceClient } from '@/lib/database/client';

const SaveIntegrationSchema = z.object({
  provider: z.enum(['gemini', 'pixverse', 'youtube', 'elevenlabs', 'storage', 'sentry', 'dev_mock']),
  apiKey: z.string().min(1, 'API key or token is required'),
  modelName: z.string().optional(),
  dailySpendCap: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const supabase = getSupabaseServiceClient();

    const { data: integrations, error } = await supabase
      .from('integration_vault')
      .select('provider, key_mask, status, model_name, daily_spend_cap, last_tested_at, last_test_latency_ms')
      .eq('workspace_id', session.workspaceId);

    if (error) {
      return NextResponse.json({ error: 'Failed to retrieve integrations.' }, { status: 500 });
    }

    return NextResponse.json({ integrations: integrations || [] });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    if (session.role !== 'owner' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Only workspace owners can configure credentials.' }, { status: 403 });
    }

    const body = await req.json();
    const validated = SaveIntegrationSchema.parse(body);

    const encrypted = encryptSecret(validated.apiKey);
    const mask = maskApiKey(validated.apiKey);

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('integration_vault')
      .upsert({
        workspace_id: session.workspaceId,
        provider: validated.provider,
        encrypted_payload: encrypted,
        key_mask: mask,
        model_name: validated.modelName || null,
        daily_spend_cap: validated.dailySpendCap || null,
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .select('provider, key_mask, status, model_name, daily_spend_cap')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to persist credentials in vault.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      integration: data,
      note: 'Key has been encrypted with AES-256-GCM. The plaintext key is never shown again.',
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 });
    }
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
