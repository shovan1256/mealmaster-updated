/**
 * Cache and Emergency Recovery Manager for MealMaster Mobile & Web
 */

export async function clearAppCacheAndReload(): Promise<void> {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. Clear CacheStorage API caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    // 3. Clear temporary session state while preserving permanent members if any
    try {
      sessionStorage.clear();
      // Remove any lingering error state
      localStorage.removeItem('mealmaster_auth_temp_error');
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Error clearing caches:', err);
  } finally {
    // 4. Force a hard reload from the server (bypassing browser cache)
    window.location.reload();
  }
}
