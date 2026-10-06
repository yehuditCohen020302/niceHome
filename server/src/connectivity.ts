import { Resolver } from 'node:dns/promises';

const PROBE_HOSTS = ['cloudflare.com', 'google.com'];
const TIMEOUT_MS = 3000;
const CACHE_MS = 15_000;

let cached: { online: boolean; checkedAt: number } | null = null;

/**
 * Checks internet connectivity with a direct DNS query (bypassing the OS cache),
 * so a stale cached record does not report "online" while the network is down.
 */
export async function isOnline(): Promise<boolean> {
  if (cached && Date.now() - cached.checkedAt < CACHE_MS) {
    return cached.online;
  }

  const resolver = new Resolver({ timeout: TIMEOUT_MS, tries: 1 });
  let online = false;
  try {
    await Promise.any(PROBE_HOSTS.map((host) => resolver.resolve4(host)));
    online = true;
  } catch {
    online = false;
  }

  cached = { online, checkedAt: Date.now() };
  return online;
}
