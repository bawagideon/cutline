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
 * Atomically provisions or retrieves an isolated personal workspace for a user.
 * In live environments with Supabase credentials, invokes the atomic RPC provision_workspace_for_user.
 * Fails closed on database errors to prevent non-atomic partial states or tenant pollution.
 */
export async function provisionPersonalWorkspace(
  userId: string,
  workspaceName = 'Personal Studio'
): Promise<string> {
  const serviceDb = getSupabaseServiceClient();
  const hasLiveSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (hasLiveSupabase) {
    const { data: rpcWsId, error: rpcError } = await serviceDb.rpc('provision_workspace_for_user', {
      p_user_id: userId,
      p_workspace_name: workspaceName,
    });

    if (rpcError || !rpcWsId) {
      throw new ForbiddenError(
        `Failed to provision isolated personal workspace: ${rpcError?.message || 'Unknown database error'}`
      );
    }

    return rpcWsId as string;
  }

  // Fallback for offline / test mock environments without live Postgres RPC
  const { data: existing, error: lookupError } = await serviceDb
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new ForbiddenError(`Failed to check existing workspace: ${lookupError.message}`);
  }

  if (existing?.workspace_id) {
    return existing.workspace_id;
  }

  const { data: newWs, error: wsError } = await serviceDb
    .from('workspaces')
    .insert({
      name: workspaceName,
      owner_id: userId,
    })
    .select('id')
    .single();

  if (wsError || !newWs) {
    throw new ForbiddenError(`Failed to provision isolated personal workspace: ${wsError?.message || 'DB error'}`);
  }

  const { error: memberError } = await serviceDb
    .from('workspace_members')
    .insert({
      workspace_id: newWs.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) {
    throw new ForbiddenError(`Failed to assign workspace ownership: ${memberError.message}`);
  }

  return newWs.id;
}

/**
 * Validates request authorization and workspace access.
 * Strictly enforces per-user tenant isolation:
 * - Supports Clerk server authentication and token/cookie sessions.
 * - Does NOT silently fall through to token authentication if Clerk verification fails.
 * - Automatically provisions an isolated personal workspace if a valid user has none.
 */
export async function authenticateRequest(
  req: NextRequest,
  requiredWorkspaceId?: string
): Promise<AuthSession> {
  const hasClerkCookie = Boolean(
    req.cookies.get('__session')?.value || req.cookies.get('__clerk_db_jwt')?.value
  );
  const isClerkConfigured = Boolean(
    process.env.CLERK_SECRET_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );

  // 1. Inspect Clerk session when Clerk cookies are present or Clerk is configured
  if (hasClerkCookie || isClerkConfigured) {
    try {
      const clerkModule = await import('@clerk/nextjs/server');
      if (clerkModule && typeof clerkModule.auth === 'function') {
        const clerkAuth = await clerkModule.auth();
        if (clerkAuth && clerkAuth.userId) {
          const userId = clerkIdToUuid(clerkAuth.userId);
          let userEmail = '';
          try {
            if (typeof clerkModule.currentUser === 'function') {
              const u = await clerkModule.currentUser();
              if (u?.emailAddresses && u.emailAddresses.length > 0) {
                const primary = u.emailAddresses.find((e: { id: string }) => e.id === u.primaryEmailAddressId);
                userEmail = primary?.emailAddress || u.emailAddresses[0].emailAddress || '';
              }
            }
          } catch {
            // Ignore email metadata failure; identity is pinned to Clerk userId
          }

          const serviceDb = getSupabaseServiceClient();

          if (requiredWorkspaceId) {
            const { data: membership, error: memberError } = await serviceDb
              .from('workspace_members')
              .select('role')
              .eq('workspace_id', requiredWorkspaceId)
              .eq('user_id', userId)
              .maybeSingle();

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

          const { data: existingMembership, error: memberLookupError } = await serviceDb
            .from('workspace_members')
            .select('workspace_id, role')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (memberLookupError) {
            throw new ForbiddenError(`Failed to verify workspace membership: ${memberLookupError.message}`);
          }

          if (existingMembership) {
            return {
              userId,
              email: userEmail,
              workspaceId: existingMembership.workspace_id,
              role: existingMembership.role as AuthSession['role'],
            };
          }

          // Auto-provision personal workspace atomically for Clerk user
          const workspaceId = await provisionPersonalWorkspace(userId, 'Personal Studio');
          return {
            userId,
            email: userEmail,
            workspaceId,
            role: 'owner',
          };
        } else if (hasClerkCookie) {
          // A Clerk cookie was explicitly sent, but Clerk auth returned no valid user
          throw new UnauthorizedError('Invalid or expired Clerk session.');
        }
      }
    } catch (err: unknown) {
      if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
        throw err;
      }
      if (hasClerkCookie) {
        // Fail closed if Clerk cookie validation threw an unexpected error
        throw new UnauthorizedError('Clerk authentication failed.');
      }
      // If no Clerk cookie was present and Clerk was just configured in env, allow falling through to Bearer token
    }
  }

  const token = extractToken(req);

  // Check if live Supabase credentials exist
  const hasLiveSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // In offline dev/test mode without credentials, allow explicit mock only if ALLOW_DEV_MOCK_AUTH is set
  if (!hasLiveSupabase && process.env.ALLOW_DEV_MOCK_AUTH === 'true' && !token && process.env.NODE_ENV !== 'production') {
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
      .maybeSingle();

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
  const { data: existingMembership, error: membershipLookupError } = await serviceDb
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipLookupError) {
    throw new ForbiddenError(`Failed to verify workspace membership: ${membershipLookupError.message}`);
  }

  if (existingMembership) {
    return {
      userId: user.id,
      email: user.email || '',
      workspaceId: existingMembership.workspace_id,
      role: existingMembership.role as AuthSession['role'],
    };
  }

  // User has no workspace yet -> Provision an isolated personal workspace atomically
  const workspaceId = await provisionPersonalWorkspace(user.id, 'Personal Studio');
  return {
    userId: user.id,
    email: user.email || '',
    workspaceId,
    role: 'owner',
  };
}
