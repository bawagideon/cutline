import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Validates and returns Supabase public client configuration.
 */
function getPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CONFIGURATION ERROR] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in production.');
    }
  }

  return {
    url: url || 'http://127.0.0.1:54321',
    anonKey: anonKey || 'placeholder-anon-key-for-local-dev-only',
  };
}

/**
 * Validates and returns Supabase server service-role configuration.
 * Strictly prevents falling back to the anonymous key!
 */
function getServiceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[CONFIGURATION ERROR] SUPABASE_SERVICE_ROLE_KEY is missing in production environment. Refusing to start with anonymous credentials.');
    }
  }

  return {
    url: url || 'http://127.0.0.1:54321',
    serviceKey: serviceKey || 'placeholder-service-key-for-local-dev-only',
  };
}

let publicClientInstance: SupabaseClient | null = null;
let serviceClientInstance: SupabaseClient | null = null;

/**
 * Allows overriding service client for testing and dependency injection.
 */
export function setSupabaseServiceClient(client: SupabaseClient | null): void {
  serviceClientInstance = client;
}

/**
 * Standard client for user sessions and browser interactions (enforces RLS).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!publicClientInstance) {
    const { url, anonKey } = getPublicConfig();
    publicClientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return publicClientInstance;
}

/**
 * Elevated server-only client for background workers and queue processing.
 * NEVER exposed to client bundles or browser endpoints without explicit authorization!
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!serviceClientInstance) {
    const { url, serviceKey } = getServiceConfig();
    serviceClientInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serviceClientInstance;
}
