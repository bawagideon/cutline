/**
 * Executes a complete, coordinated sign-out:
 * 1. Invokes Clerk's client SDK signOut to terminate Clerk auth state.
 * 2. Calls server endpoint to clear Supabase & session cookies.
 * 3. Purges private service worker caches.
 * 4. Signals all other active browser tabs via BroadcastChannel.
 * 5. Clears local drafts and redirects to /sign-in?signed_out=1.
 */
export async function performClientSignOut(redirectPath = '/sign-in?signed_out=1'): Promise<void> {
  try {
    // 1. Terminate Clerk session if Clerk SDK is mounted on window
    if (typeof window !== 'undefined') {
      const clerk = (window as unknown as { Clerk?: { signOut: () => Promise<void> } }).Clerk;
      if (clerk && typeof clerk.signOut === 'function') {
        await clerk.signOut().catch(() => {});
      }
    }

    // 2. Invalidate server session and clear cookies
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});

    // 3. Instruct service worker to delete private cache
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_PRIVATE_CACHE' });
    }

    // 4. Signal other tabs to synchronize sign-out
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('cutline_auth');
      channel.postMessage({ type: 'SIGNED_OUT' });
      channel.close();
    }

    // 5. Clear client-side draft storage
    try {
      localStorage.removeItem('cutline_offline_drafts');
      sessionStorage.clear();
    } catch {
      // Storage access blocked or restricted
    }
  } finally {
    // 6. Hard redirect to sign-in
    if (typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  }
}
