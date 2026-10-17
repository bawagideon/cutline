import { NextRequest } from 'next/server';
import { getSupabaseClient, getSupabaseServiceClient } from '@/lib/database/client';

export interface AuthSession {
  userId: string;
  email: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

/**
 * Validates request authorization and workspace access.
 * Reads token from Authorization header (Bearer) or session cookies.
 * In local development mode without auth configured, returns a mock session for testing.
 */
export async function authenticateRequest(
  req: NextRequest,
  requiredWorkspaceId?: string
): Promise<AuthSession> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Check if running in development mode without live Supabase credentials
  const isDev = process.env.NODE_ENV !== 'production';
  const hasLiveSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (isDev && !hasLiveSupabase && !token) {
    // Return sample user session matching the design canvas (Ade Okafor / Lagos After Dark)
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'ade@lagosafterdark.com',
      workspaceId: requiredWorkspaceId || '00000000-0000-0000-0000-000000000002',
      role: 'owner',
    };
  }

  if (!token) {
    throw new UnauthorizedError('Authentication token is required.');
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new UnauthorizedError('Invalid or expired authentication session.');
  }

  // If a specific workspace is requested, verify the caller has access
  const serviceDb = getSupabaseServiceClient();
  const targetWorkspaceId = requiredWorkspaceId;

  if (targetWorkspaceId) {
    const { data: membership, error: memberError } = await serviceDb
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', targetWorkspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      throw new ForbiddenError('You do not have permission to access this workspace.');
    }

    return {
      userId: user.id,
      email: user.email || '',
      workspaceId: targetWorkspaceId,
      role: membership.role as AuthSession['role'],
    };
  }

  // Find user's default workspace
  const { data: defaultMembership } = await serviceDb
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return {
    userId: user.id,
    email: user.email || '',
    workspaceId: defaultMembership?.workspace_id || '00000000-0000-0000-0000-000000000002',
    role: (defaultMembership?.role as AuthSession['role']) || 'owner',
  };
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
