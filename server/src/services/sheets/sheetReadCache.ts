import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped + short process-scoped Google Sheets read reuse.
 * - Same range within one HTTP request → one Google call (in-flight coalesced).
 * - Short process TTL collapses SPA boot fan-out across parallel routes.
 * - Writes must call invalidateSheetReadsForRange / invalidateSheetReadsForTab.
 */

const PROCESS_CACHE_TTL_MS = 3_000;
const MAX_CONCURRENT_SHEET_READS = 4;

interface SheetReadCacheStore {
  ranges: Map<string, Promise<string[][]>>;
}

interface ProcessCacheEntry {
  expiresAt: number;
  value: Promise<string[][]>;
}

const als = new AsyncLocalStorage<SheetReadCacheStore>();
const processCache = new Map<string, ProcessCacheEntry>();

let activeReads = 0;
const readWaitQueue: Array<() => void> = [];

const acquireReadSlot = async (): Promise<void> => {
  if (activeReads < MAX_CONCURRENT_SHEET_READS) {
    activeReads += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    readWaitQueue.push(resolve);
  });
  activeReads += 1;
};

const releaseReadSlot = (): void => {
  activeReads = Math.max(0, activeReads - 1);
  const next = readWaitQueue.shift();
  if (next) next();
};

/** Extract tab name from ranges like `'Customers'!A:AX` or `Customers!A1:B2`. */
export const extractSheetTabName = (range: string): string | null => {
  const trimmed = range.trim();
  if (!trimmed) return null;

  const quoted = trimmed.match(/^'([^']+)'!/);
  if (quoted?.[1]) return quoted[1];

  const bare = trimmed.match(/^([^'!]+)!/);
  if (bare?.[1]) return bare[1].trim();

  return null;
};

const normalizeRangeKey = (range: string): string => range.trim();

const matchesTab = (rangeKey: string, tabName: string): boolean => {
  const extracted = extractSheetTabName(rangeKey);
  return extracted === tabName;
};

/** Run `fn` inside a fresh request-scoped sheet read cache (keeps ALS for returned promises). */
export const runWithSheetReadCache = <T>(fn: () => T): T =>
  als.run({ ranges: new Map() }, fn);

/**
 * Bind a request-scoped cache for the remainder of the current Express request.
 * Uses enterWith so async route handlers retain the store after middleware returns.
 */
export const enterSheetReadCache = (): void => {
  als.enterWith({ ranges: new Map() });
};

export const invalidateSheetReadsForRange = (range: string): void => {
  const key = normalizeRangeKey(range);
  const store = als.getStore();
  store?.ranges.delete(key);
  processCache.delete(key);

  const tabName = extractSheetTabName(key);
  if (tabName) {
    invalidateSheetReadsForTab(tabName);
  }
};

export const invalidateSheetReadsForTab = (tabName: string): void => {
  const store = als.getStore();
  if (store) {
    for (const key of [...store.ranges.keys()]) {
      if (matchesTab(key, tabName)) {
        store.ranges.delete(key);
      }
    }
  }

  for (const key of [...processCache.keys()]) {
    if (matchesTab(key, tabName)) {
      processCache.delete(key);
    }
  }
};

export const clearAllSheetReadCaches = (): void => {
  als.getStore()?.ranges.clear();
  processCache.clear();
};

/**
 * Deduped sheet range read. Concurrent identical ranges share one in-flight promise.
 */
export const getCachedSheetRead = (
  range: string,
  loader: () => Promise<string[][]>,
): Promise<string[][]> => {
  const key = normalizeRangeKey(range);
  const store = als.getStore();

  const existingRequest = store?.ranges.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const existingProcess = processCache.get(key);
  if (existingProcess && existingProcess.expiresAt > Date.now()) {
    store?.ranges.set(key, existingProcess.value);
    return existingProcess.value;
  }

  const promise = (async (): Promise<string[][]> => {
    await acquireReadSlot();
    try {
      return await loader();
    } catch (error) {
      store?.ranges.delete(key);
      processCache.delete(key);
      throw error;
    } finally {
      releaseReadSlot();
    }
  })();

  store?.ranges.set(key, promise);
  processCache.set(key, {
    expiresAt: Date.now() + PROCESS_CACHE_TTL_MS,
    value: promise,
  });

  return promise;
};
