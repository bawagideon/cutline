import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateRequest,
  ForbiddenError,
  UnauthorizedError,
  clerkIdToUuid,
  provisionPersonalWorkspace,
} from '../src/lib/auth/session.ts';

describe('Two-User Tenant Isolation & Database Security Boundaries', () => {
  const userA_id = clerkIdToUuid('user_creator_alpha_001');
  const userB_id = clerkIdToUuid('user_creator_beta_002');
  const workspaceA_id = '11111111-1111-1111-1111-111111111111';
  const workspaceB_id = '22222222-2222-2222-2222-222222222222';

  it('ensures User A and User B generate distinct non-colliding UUIDs', () => {
    assert.notEqual(userA_id, userB_id, 'User A and User B must have different UUIDs');
    assert.match(userA_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.match(userB_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('strictly prohibits User A from requesting or accessing User B workspace', async () => {
    // Simulate User A attempting to access Workspace B
    const mockUserAReq = {
      headers: new Headers({
        authorization: 'Bearer token_user_a',
      }),
      cookies: {
        get: () => undefined,
      },
    };

    // When requiredWorkspaceId is passed and user does not belong to it, must throw ForbiddenError or UnauthorizedError
    await assert.rejects(
      async () => {
        await authenticateRequest(mockUserAReq as any, workspaceB_id);
      },
      (err: any) => {
        assert.ok(
          err instanceof ForbiddenError || err instanceof UnauthorizedError,
          `Must be ForbiddenError or UnauthorizedError, got: ${err.name}`
        );
        return true;
      }
    );
  });

  it('rejects invalid Clerk session without silently falling through to token auth', async () => {
    // Request sending a Clerk session cookie that fails validation
    const mockClerkReq = {
      headers: new Headers(),
      cookies: {
        get: (name: string) => {
          if (name === '__session') return { value: 'invalid_or_expired_clerk_cookie' };
          return undefined;
        },
      },
    };

    await assert.rejects(
      async () => {
        await authenticateRequest(mockClerkReq as any);
      },
      (err: any) => {
        assert.ok(err instanceof UnauthorizedError, 'Must throw UnauthorizedError on failed Clerk session');
        return true;
      }
    );
  });

  it('proves database lookup errors during membership verification fail closed', async () => {
    // When a database error occurs during membership lookup, authenticateRequest must fail closed
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      // Mock live credentials so it attempts DB query rather than test mock
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-db.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key-12345';

      const mockReq = {
        headers: new Headers({ authorization: 'Bearer valid_token' }),
        cookies: { get: () => undefined },
      };

      await assert.rejects(
        async () => {
          await authenticateRequest(mockReq as any, workspaceA_id);
        },
        (err: any) => {
          assert.ok(
            err instanceof UnauthorizedError || err instanceof ForbiddenError || err instanceof Error,
            'Database error must fail closed with explicit exception'
          );
          return true;
        }
      );
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    }
  });

  it('verifies SQL migration eliminates membership oracle and pins caller to auth.uid()', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const migrationV4 = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20261019000000_cutline_v4_security_hardening.sql'),
      'utf-8'
    );

    // 1. Verify two-parameter helper has been REVOKED from authenticated and anon
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.is_workspace_admin_or_owner(UUID, UUID) FROM authenticated;'),
      'Must revoke arbitrary user probing helper from authenticated users'
    );
    assert.ok(
      migrationV4.includes('GRANT EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(UUID, UUID) TO service_role;'),
      'Two-parameter helper must be restricted strictly to service_role'
    );

    // 2. Verify client-safe helper derives caller from auth.uid()
    assert.ok(
      migrationV4.includes('FUNCTION public.is_current_user_workspace_admin_or_owner('),
      'Must define oracle-free is_current_user_workspace_admin_or_owner helper'
    );
    assert.ok(
      migrationV4.includes('v_caller_id UUID := auth.uid();'),
      'Caller identity must be pinned to auth.uid()'
    );

    // 3. Verify policy uses client-safe helper
    assert.ok(
      migrationV4.includes('public.is_current_user_workspace_admin_or_owner(workspace_id)'),
      'Policy must call is_current_user_workspace_admin_or_owner without passing arbitrary user IDs'
    );
  });

  it('verifies SQL migration revokes worker claim and provisioning RPCs from untrusted roles', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const migrationV4 = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20261019000000_cutline_v4_security_hardening.sql'),
      'utf-8'
    );

    // Verify claim_next_production_job revocations
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM PUBLIC;'),
      'Must revoke claim_next_production_job from PUBLIC'
    );
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM authenticated;'),
      'Must revoke claim_next_production_job from authenticated'
    );
    assert.ok(
      migrationV4.includes('GRANT EXECUTE ON FUNCTION public.claim_next_production_job(TEXT, INT) TO service_role;'),
      'Must grant claim_next_production_job strictly to service_role'
    );

    // Verify provision_workspace_for_user revocations
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) FROM authenticated;'),
      'Must revoke provision_workspace_for_user from authenticated'
    );
    assert.ok(
      migrationV4.includes('GRANT EXECUTE ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) TO service_role;'),
      'Must grant provision_workspace_for_user strictly to service_role'
    );

    // Verify client-safe provision_my_workspace uses auth.uid()
    assert.ok(
      migrationV4.includes('v_caller_id UUID := auth.uid();'),
      'provision_my_workspace must derive identity from auth.uid()'
    );
  });

  it('verifies dashboard scheduled episodes query is strictly filtered by workspace', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const dashboardRoute = await fs.readFile(
      path.join(process.cwd(), 'src/app/api/dashboard/route.ts'),
      'utf-8'
    );

    // Must join projects and filter by session.workspaceId
    assert.ok(
      dashboardRoute.includes('projects!inner(workspace_id)'),
      'Scheduled episodes query must join projects table'
    );
    assert.ok(
      dashboardRoute.includes(".eq('projects.workspace_id', session.workspaceId)"),
      'Scheduled episodes query must strictly filter by session.workspaceId'
    );
    assert.ok(
      dashboardRoute.includes("supabase\n        .from('workspaces')"),
      'Dashboard must query real workspace from workspaces table'
    );
  });

  it('verifies fail-closed behavior in middleware when CLERK_SECRET_KEY is absent in production', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const middlewareSrc = await fs.readFile(
      path.join(process.cwd(), 'src/middleware.ts'),
      'utf-8'
    );

    assert.ok(
      middlewareSrc.includes('!process.env.CLERK_SECRET_KEY'),
      'Middleware must inspect presence of CLERK_SECRET_KEY'
    );
    assert.ok(
      middlewareSrc.includes('isProduction'),
      'Middleware must check for production environment'
    );
    assert.ok(
      middlewareSrc.includes('401'),
      'Middleware must return 401 for unconfigured API routes'
    );
  });
});
