/**
 * Server-side data access for the two backend services.
 *
 * CONTENT_API_URL   -> Django REST content API   (e.g. http://localhost:8000)
 * ANALYTICS_API_URL -> FastAPI analytics service (e.g. http://localhost:8001)
 *
 * Portfolio content is cached with `use cache` and refreshed every minute or so,
 * so pages are fast and still pick up edits made in the Django admin.
 */
import { cacheLife, cacheTag } from "next/cache";

export const CONTENT_API_URL = (process.env.CONTENT_API_URL || "http://localhost:8000").replace(/\/$/, "");
export const ANALYTICS_API_URL = (process.env.ANALYTICS_API_URL || "http://localhost:8001").replace(/\/$/, "");

const TIMEOUT_MS = 4000;

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
}

/** Everything the site shows. Returns null if the content API can't be reached. */
export async function getPortfolio() {
  "use cache";
  cacheLife("minutes");
  cacheTag("portfolio");
  try {
    return await getJson(`${CONTENT_API_URL}/api/v1/portfolio/`);
  } catch (error) {
    console.error("Content API unavailable:", error.message);
    return null;
  }
}

/** Visitor numbers for the live dashboard. Returns null if analytics is down. */
export async function getVisitorStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("stats");
  try {
    return await getJson(`${ANALYTICS_API_URL}/api/v1/stats`);
  } catch (error) {
    console.error("Analytics API unavailable:", error.message);
    return null;
  }
}

/**
 * Times real, uncached requests to both services for the homepage's live trace.
 * Called per request (after `connection()`), so every visitor sees fresh numbers.
 */
export async function traceBackends() {
  const calls = [
    { service: "Django REST", method: "GET", path: "/api/v1/portfolio/", url: `${CONTENT_API_URL}/api/v1/portfolio/` },
    { service: "FastAPI", method: "GET", path: "/api/v1/stats", url: `${ANALYTICS_API_URL}/api/v1/stats` },
    { service: "Django REST", method: "GET", path: "/api/v1/health/", url: `${CONTENT_API_URL}/api/v1/health/` },
    { service: "FastAPI", method: "GET", path: "/api/v1/health", url: `${ANALYTICS_API_URL}/api/v1/health` },
  ];

  const origin = performance.now();
  const spans = await Promise.all(
    calls.map(async ({ url, ...call }) => {
      const start = performance.now();
      try {
        const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
        const body = await response.arrayBuffer();
        return {
          ...call,
          status: response.status,
          ok: response.ok,
          bytes: body.byteLength,
          startMs: start - origin,
          durationMs: performance.now() - start,
        };
      } catch {
        return { ...call, status: 0, ok: false, bytes: 0, startMs: start - origin, durationMs: performance.now() - start };
      }
    }),
  );

  return { spans, totalMs: performance.now() - origin };
}
