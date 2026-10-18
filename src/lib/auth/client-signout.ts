/**
 * Executes a complete, clean sign-out:
 * 1. Calls server endpoint to clear httpOnly cookies.
 * 2. Purges private service worker caches.
 * 3. Signals all other active browser tabs via BroadcastChannel.
 * 4. Clears local drafts and redirects to /sign-in?signed_out=1.
 */
export async function performClientSignOut(redirectPath = '/sign-in?signed_out=1'): Promise<void> {
  try {
    // 1. Invalidate server session and clear cookies
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});

    // 2. Instruct service worker to delete private cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_PRIVATE_CACHE' });
    }

    // 3. Signal other tabs to synchronize sign-out
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('cutline_auth');
      channel.postMessage({ type: 'SIGNED_OUT' });
      channel.close();
    }

    // 4. Clear client-side draft storage
    try {
      localStorage.removeItem('cutline_offline_drafts');
      sessionStorage.clear();
    } catch {
      // Storage access blocked or restricted
    }
  } finally {
    // 5. Hard redirect to sign-in
    window.location.href = redirectPath;
  }
}
