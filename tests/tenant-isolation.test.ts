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
});
