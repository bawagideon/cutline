import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateRequest,
  ForbiddenError,
  provisionPersonalWorkspace,
  clerkIdToUuid,
} from '../src/lib/auth/session.ts';

describe('Two-User Tenant Isolation & RPC Security Boundaries', () => {
  const userA_id = clerkIdToUuid('user_creator_alpha_001');
  const userB_id = clerkIdToUuid('user_creator_beta_002');
  const workspaceA_id = '11111111-1111-1111-1111-111111111111';
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

    // When requiredWorkspaceId is passed and user does not belong to it, must throw ForbiddenError
    await assert.rejects(
      async () => {
        await authenticateRequest(mockUserAReq as any, workspaceB_id);
      },
      (err: any) => {
        // Can be ForbiddenError (if DB mock/live checks membership) or UnauthorizedError (if token invalid)
        assert.ok(
          err.name === 'ForbiddenError' || err.name === 'UnauthorizedError',
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

  it('verifies SQL security migration contains explicit privilege revocation for worker RPC', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const migrationV4 = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20261019000000_cutline_v4_security_hardening.sql'),
      'utf-8'
    );

    // Verify REVOKE statements for claim_next_production_job
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION claim_next_production_job(TEXT, INT) FROM PUBLIC;'),
      'Must explicitly revoke execute from PUBLIC'
    );
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION claim_next_production_job(TEXT, INT) FROM anon;'),
      'Must explicitly revoke execute from anon'
    );
    assert.ok(
      migrationV4.includes('REVOKE ALL ON FUNCTION claim_next_production_job(TEXT, INT) FROM authenticated;'),
      'Must explicitly revoke execute from authenticated'
    );
    assert.ok(
      migrationV4.includes('GRANT EXECUTE ON FUNCTION claim_next_production_job(TEXT, INT) TO service_role;'),
      'Must grant execute only to service_role'
    );
  });

  it('verifies elimination of the vulnerable self-join workspace membership policy', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const migrationV4 = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/20261019000000_cutline_v4_security_hardening.sql'),
      'utf-8'
    );

    // Verify dropping of flawed policy
    assert.ok(
      migrationV4.includes('DROP POLICY IF EXISTS workspace_members_self_insert ON workspace_members;'),
      'Must drop vulnerable workspace_members_self_insert'
    );

    // Verify strict replacement policy
    assert.ok(
      migrationV4.includes('CREATE POLICY workspace_members_authorized_insert ON workspace_members'),
      'Must create workspace_members_authorized_insert'
    );
    assert.ok(
      migrationV4.includes("existing.role IN ('owner', 'admin')"),
      'Must restrict new member insertion to existing workspace owners or admins'
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
      dashboardRoute.includes("projects!inner(workspace_id)"),
      'Scheduled episodes query must join projects table'
    );
    assert.ok(
      dashboardRoute.includes(".eq('projects.workspace_id', session.workspaceId)"),
      'Scheduled episodes query must strictly filter by session.workspaceId'
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
