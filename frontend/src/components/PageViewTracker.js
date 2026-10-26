"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const ANALYTICS_URL = (process.env.NEXT_PUBLIC_ANALYTICS_URL || "").replace(/\/$/, "");

/** Visitors who ask not to be tracked aren't counted at all. */
function trackingAllowed() {
  return navigator.globalPrivacyControl !== true && navigator.doNotTrack !== "1" && window.doNotTrack !== "1";
}

/**
 * Sends one anonymous page view to the FastAPI analytics service per page visited.
 * No cookies or storage: the service counts visitors with a daily-rotating hash.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const isFirstView = useRef(true);
  const lastTracked = useRef(null);

  useEffect(() => {
    if (!ANALYTICS_URL || !trackingAllowed()) return;
    // Never send the same page twice in a row (React runs effects twice in development).
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // The referring site only matters for the page someone landed on.
    const referrer = isFirstView.current ? document.referrer : "";
    isFirstView.current = false;

    fetch(`${ANALYTICS_URL}/api/v1/events/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true, // still sent if the visitor navigates away straight away
    }).catch(() => {
      // Analytics must never break the site.
    });
  }, [pathname]);

  return null;
}
