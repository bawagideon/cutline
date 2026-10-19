import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseClient, getSupabaseServiceClient } from '../database/client.ts';

export interface AuthSession {
  userId: string;
  email: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
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

/**
 * Maps Clerk user ID string into a deterministic UUID for PostgreSQL foreign keys.
 */
export function clerkIdToUuid(clerkId: string): string {
  const hash = crypto.createHash('sha256').update(`clerk:${clerkId}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Extracts authentication token from Bearer header or session cookies.
 */
export function extractToken(req: {
  headers: { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
}): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookies for Supabase / Cutline session tokens
  const tokenFromCookie =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('cutline_session')?.value ||
    req.cookies.get('supabase-auth-token')?.value;

  return tokenFromCookie || null;
}

/**
 * Validates request authorization and workspace access.
 * Strictly enforces per-user tenant isolation:
 * - Supports Clerk server authentication and token/cookie sessions.
 * - Automatically provisions an isolated personal workspace if a valid user has none.
 */
export async function authenticateRequest(
  req: NextRequest,
  requiredWorkspaceId?: string
): Promise<AuthSession> {
  // 1. Inspect Clerk session in Next.js runtime context
  try {
    const clerkModule = await import('@clerk/nextjs/server');
    if (clerkModule && typeof clerkModule.auth === 'function') {
      const clerkAuth = await clerkModule.auth();
      if (clerkAuth && clerkAuth.userId) {
        const userId = clerkIdToUuid(clerkAuth.userId);
        let userEmail = 'creator@cutline.studio';
        try {
          if (typeof clerkModule.currentUser === 'function') {
            const u = await clerkModule.currentUser();
            if (u?.emailAddresses?.[0]?.emailAddress) {
              userEmail = u.emailAddresses[0].emailAddress;
            }
          }
        } catch {
          // ignore currentUser lookup error
        }

        const serviceDb = getSupabaseServiceClient();

        if (requiredWorkspaceId) {
          const { data: membership, error: memberError } = await serviceDb
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', requiredWorkspaceId)
            .eq('user_id', userId)
            .single();

          if (memberError || !membership) {
            throw new ForbiddenError('You do not have permission to access this workspace.');
          }

          return {
            userId,
            email: userEmail,
            workspaceId: requiredWorkspaceId,
            role: membership.role as AuthSession['role'],
          };
        }

        const { data: existingMembership } = await serviceDb
          .from('workspace_members')
          .select('workspace_id, role')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (existingMembership) {
          return {
            userId,
            email: userEmail,
            workspaceId: existingMembership.workspace_id,
            role: existingMembership.role as AuthSession['role'],
          };
        }

        // Auto-provision personal workspace for Clerk user
        const { data: newWorkspace } = await serviceDb
          .from('workspaces')
          .insert({
            name: 'Personal Studio',
            owner_id: userId,
          })
          .select()
          .single();

        if (newWorkspace) {
          await serviceDb.from('workspace_members').insert({
            workspace_id: newWorkspace.id,
            user_id: userId,
            role: 'owner',
          });

          return {
            userId,
            email: userEmail,
            workspaceId: newWorkspace.id,
            role: 'owner',
          };
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      throw err;
    }
    // Fall through to token check
  }

  const token = extractToken(req);

  // Check if live Supabase credentials exist
  const hasLiveSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // In offline dev/test mode without credentials, allow explicit mock only if ALLOW_DEV_MOCK_AUTH is set
  if (!hasLiveSupabase && process.env.ALLOW_DEV_MOCK_AUTH === 'true' && !token) {
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'ade@lagosafterdark.com',
      workspaceId: requiredWorkspaceId || '00000000-0000-0000-0000-000000000002',
      role: 'owner',
    };
  }

  if (!token) {
    throw new UnauthorizedError('Authentication token or session cookie is required.');
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new UnauthorizedError('Invalid or expired authentication session.');
  }

  const serviceDb = getSupabaseServiceClient();

  // If a specific workspace is requested, strictly verify membership
  if (requiredWorkspaceId) {
    const { data: membership, error: memberError } = await serviceDb
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', requiredWorkspaceId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      throw new ForbiddenError('You do not have permission to access this workspace.');
    }

    return {
      userId: user.id,
      email: user.email || '',
      workspaceId: requiredWorkspaceId,
      role: membership.role as AuthSession['role'],
    };
  }

  // Look up existing workspace membership for this user
  const { data: existingMembership } = await serviceDb
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (existingMembership) {
    return {
      userId: user.id,
      email: user.email || '',
      workspaceId: existingMembership.workspace_id,
      role: existingMembership.role as AuthSession['role'],
    };
  }

  // User has no workspace yet -> Provision an isolated personal workspace transactionally
  const { data: newWorkspace, error: wsError } = await serviceDb
    .from('workspaces')
    .insert({
      name: 'Personal Studio',
      owner_id: user.id,
    })
    .select()
    .single();

  if (wsError || !newWorkspace) {
    throw new ForbiddenError('Failed to provision isolated personal workspace.');
  }

  const { error: memberInsertError } = await serviceDb
    .from('workspace_members')
    .insert({
      workspace_id: newWorkspace.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberInsertError) {
    throw new ForbiddenError('Failed to assign workspace ownership.');
  }

  return {
    userId: user.id,
    email: user.email || '',
    workspaceId: newWorkspace.id,
    role: 'owner',
  };
}
