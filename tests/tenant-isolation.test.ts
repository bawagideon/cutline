import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractToken,
  authenticateRequest,
  UnauthorizedError,
  ForbiddenError,
} from '../src/lib/auth/session.ts';

describe('Multi-Tenant Session & Workspace Isolation', () => {
  it('extracts Bearer token from authorization header', () => {
    const mockReq = {
      headers: new Headers({ authorization: 'Bearer cutline_live_jwt_token_12345' }),
      cookies: {
        get: () => undefined,
      },
    };

    const token = extractToken(mockReq);
    assert.equal(token, 'cutline_live_jwt_token_12345');
  });

  it('extracts session token from cookie fallback (sb-access-token, cutline_session)', () => {
    const cookiesMap = new Map([['cutline_session', 'cookie_session_token_xyz']]);
    const mockReq = {
      headers: new Headers(),
      cookies: {
        get: (name: string) => {
          const val = cookiesMap.get(name);
          return val ? { value: val } : undefined;
        },
      },
    };

    const token = extractToken(mockReq);
    assert.equal(token, 'cookie_session_token_xyz');
  });

  it('returns null when no bearer header or session cookies exist', () => {
    const mockReq = {
      headers: new Headers(),
      cookies: {
        get: () => undefined,
      },
    };

    const token = extractToken(mockReq);
    assert.equal(token, null);
  });

  it('rejects unauthenticated requests with UnauthorizedError and prevents tenant bleed', async () => {
    const mockReq = {
      headers: new Headers(),
      cookies: {
        get: () => undefined,
      },
    };

    // Ensure mock auth is not enabled in test
    delete process.env.ALLOW_DEV_MOCK_AUTH;

    await assert.rejects(
      async () => {
        await authenticateRequest(mockReq as any);
      },
      (err: any) => {
        assert.ok(err instanceof UnauthorizedError, 'Must throw UnauthorizedError');
        assert.match(err.message, /Authentication token or session cookie is required/);
        return true;
      }
    );
  });

  it('verifies explicit error hierarchy (UnauthorizedError and ForbiddenError)', () => {
    const unauth = new UnauthorizedError('Custom unauth');
    assert.equal(unauth.name, 'UnauthorizedError');
    assert.equal(unauth.message, 'Custom unauth');

    const forbidden = new ForbiddenError('Tenant breach rejected');
    assert.equal(forbidden.name, 'ForbiddenError');
    assert.equal(forbidden.message, 'Tenant breach rejected');
  });

  it('deterministically maps Clerk user IDs to valid PostgreSQL UUID format', async () => {
    const { clerkIdToUuid } = await import('../src/lib/auth/session.ts');
    const clerkId = 'user_2tXyZ9AbCdEf123456';
    const uuid1 = clerkIdToUuid(clerkId);
    const uuid2 = clerkIdToUuid(clerkId);

    // Assert determinism
    assert.equal(uuid1, uuid2, 'Clerk ID mapping must be deterministic');

    // Assert UUID format: 8-4-4-4-12
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert.match(uuid1, uuidRegex, 'Result must match valid UUID format');

    // Assert different Clerk IDs generate distinct UUIDs (collision resistance)
    const otherUuid = clerkIdToUuid('user_99DifferentCreator');
    assert.notEqual(uuid1, otherUuid, 'Different users must yield distinct tenant UUIDs');
  });
});
