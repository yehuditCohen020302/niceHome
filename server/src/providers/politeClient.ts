/**
 * HTTP client for reading a store's public data without burdening it:
 * - honors robots.txt (Allow/Disallow with wildcards, and Crawl-delay),
 * - sends one request at a time per site, with a minimum pause between requests,
 * - backs off on 429/503 (Retry-After when given) instead of retrying immediately,
 * - identifies itself honestly.
 */

const USER_AGENT_TOKEN = 'NiceHome';
const USER_AGENT = `${USER_AGENT_TOKEN}/0.1 (local personal shopping assistant; reads public product catalogs)`;
const REQUEST_TIMEOUT_MS = 30_000;
const BACKOFF_MS = [30_000, 90_000, 180_000];

export class RobotsDisallowedError extends Error {
  constructor(url: string) {
    super(`robots.txt disallows ${url}`);
  }
}

export class SourceHttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

interface RobotsRules {
  rules: { allow: boolean; pattern: RegExp; length: number }[];
  crawlDelayMs: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class PoliteClient {
  private robots: Promise<RobotsRules> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(
    private readonly origin: string,
    private readonly minIntervalMs: number,
  ) {}

  /** GETs a same-site path and parses JSON. Queued behind this site's other requests. */
  getJson<T>(pathAndQuery: string): Promise<T> {
    const task = this.queue.then(() => this.fetchJson<T>(pathAndQuery));
    // Keep the queue alive after a failure; the caller still receives the error.
    this.queue = task.catch(() => undefined);
    return task;
  }

  private async fetchJson<T>(pathAndQuery: string): Promise<T> {
    const url = `${this.origin}${pathAndQuery}`;
    const robots = await this.loadRobots();
    if (!isAllowed(robots, new URL(url).pathname + new URL(url).search)) {
      throw new RobotsDisallowedError(url);
    }
    const interval = Math.max(this.minIntervalMs, robots.crawlDelayMs);

    for (let attempt = 0; ; attempt++) {
      const wait = this.lastRequestAt + interval - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();

      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if ((response.status === 429 || response.status === 503) && attempt < BACKOFF_MS.length) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : BACKOFF_MS[attempt]!;
        console.warn(`[sources] ${this.origin} asked us to slow down (${response.status}); waiting ${Math.round(backoff / 1000)}s`);
        await response.body?.cancel();
        await sleep(backoff);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new SourceHttpError(response.status, url);
      }
      return (await response.json()) as T;
    }
  }

  private loadRobots(): Promise<RobotsRules> {
    this.robots ??= (async () => {
      try {
        const response = await fetch(`${this.origin}/robots.txt`, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        this.lastRequestAt = Date.now();
        // No robots.txt means no restrictions.
        return response.ok ? parseRobots(await response.text()) : { rules: [], crawlDelayMs: 0 };
      } catch {
        // Could not read the rules: retry next time rather than assume anything is allowed.
        this.robots = null;
        throw new Error(`Could not read robots.txt for ${this.origin}`);
      }
    })();
    return this.robots;
  }
}

/** Parses the group for our user agent if present, otherwise the `*` group. */
export function parseRobots(text: string): RobotsRules {
  const groups: { agents: string[]; lines: [string, string][] }[] = [];
  let current: { agents: string[]; lines: [string, string][] } | null = null;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], lines: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (current) {
      current.lines.push([key, value]);
      lastWasAgent = false;
    }
  }

  const ours = groups.filter((group) => group.agents.some((agent) => agent !== '*' && USER_AGENT_TOKEN.toLowerCase().includes(agent)));
  const selected = ours.length > 0 ? ours : groups.filter((group) => group.agents.includes('*'));
  const lines = selected.flatMap((group) => group.lines);

  const rules = lines
    .filter(([key, value]) => (key === 'allow' || key === 'disallow') && value !== '')
    .map(([key, value]) => ({ allow: key === 'allow', pattern: toPattern(value), length: value.length }));
  const delay = lines.find(([key]) => key === 'crawl-delay');
  const seconds = delay ? Number(delay[1]) : 0;
  return { rules, crawlDelayMs: Number.isFinite(seconds) ? seconds * 1000 : 0 };
}

function toPattern(value: string): RegExp {
  const anchored = value.endsWith('$');
  const body = (anchored ? value.slice(0, -1) : value)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/** Longest matching rule wins; on a tie, Allow wins (Google's interpretation). */
export function isAllowed(robots: RobotsRules, path: string): boolean {
  let best: { allow: boolean; length: number } | null = null;
  for (const rule of robots.rules) {
    if (!rule.pattern.test(path)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && rule.allow)) best = rule;
  }
  return best ? best.allow : true;
}
