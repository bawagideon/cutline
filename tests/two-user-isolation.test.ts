import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateRequest,
  ForbiddenError,
  UnauthorizedError,
  clerkIdToUuid,
} from '../src/lib/auth/session.ts';

describe('Two-User Tenant Isolation & RPC Security Boundaries', () => {
  const userA_id = clerkIdToUuid('user_creator_alpha_001');
  const userB_id = clerkIdToUuid('user_creator_beta_002');
  const workspaceB_id = '22222222-2222-2222-2222-222222222222';

  it('prohibits User A from requesting or accessing User B workspace', async () => {
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

  it('ensures User A and User B generate distinct non-colliding UUIDs', () => {
    assert.notEqual(userA_id, userB_id, 'User A and User B must have different UUIDs');
    assert.match(userA_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.match(userB_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
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

  it('verifies SQL security migration contains explicit privilege revocation for worker RPC', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const migrationV4 = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20261019000000_cutline_v4_security_hardening.sql'),
      'utf-8'
    );

    // Verify REVOKE statements for claim_next_production_job
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM PUBLIC;'),
      'Must explicitly revoke execute from PUBLIC'
    );
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM anon;'),
      'Must explicitly revoke execute from anon'
    );
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM authenticated;'),
      'Must explicitly revoke execute from authenticated'
    );
    assert.ok(
      migrationV4.includes('GRANT EXECUTE ON FUNCTION public.claim_next_production_job(TEXT, INT) TO service_role;'),
      'Must grant execute only to service_role'
    );

    // Verify REVOKE statements for provision_workspace_for_user
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) FROM authenticated;'),
      'Must revoke provision_workspace_for_user from authenticated'
    );
    assert.ok(
      migrationV4.includes('GRANT EXECUTE ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) TO service_role;'),
      'Must grant provision_workspace_for_user strictly to service_role'
    );
  });

  it('verifies elimination of the vulnerable self-join workspace membership policy and RLS recursion', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const migrationV4 = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20261019000000_cutline_v4_security_hardening.sql'),
      'utf-8'
    );

    // Verify dropping of flawed policy
    assert.ok(
      migrationV4.includes('DROP POLICY IF EXISTS workspace_members_self_insert ON public.workspace_members;'),
      'Must drop vulnerable workspace_members_self_insert'
    );

    // Verify SECURITY DEFINER non-recursive helper
    assert.ok(
      migrationV4.includes('FUNCTION public.is_workspace_admin_or_owner('),
      'Must create is_workspace_admin_or_owner helper to bypass RLS recursion'
    );
    assert.ok(
      migrationV4.includes('SET search_path = public, pg_temp;'),
      'Helper must fix search_path for SECURITY DEFINER safety'
    );

    // Verify strict replacement policy
    assert.ok(
      migrationV4.includes('CREATE POLICY workspace_members_authorized_insert ON public.workspace_members'),
      'Must create workspace_members_authorized_insert'
    );
    assert.ok(
      migrationV4.includes('public.is_workspace_admin_or_owner(workspace_id, auth.uid())'),
      'Must use non-recursive helper in policy WITH CHECK'
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
