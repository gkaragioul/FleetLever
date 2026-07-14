"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type TrackDetail = {
  event: string;
  label?: string;
  metadata?: Record<string, string | number | boolean>;
};

function send(detail: TrackDetail) {
  const body = JSON.stringify({
    ...detail,
    path: window.location.pathname,
    referrer: document.referrer || null,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/commercial/events", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/commercial/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export function CommercialAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    send({ event: "page_view", label: pathname });
  }, [pathname]);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-analytics]") : null;
      if (!target) return;
      send({ event: "cta_click", label: target.dataset.analytics });
    };

    const custom = (event: Event) => send((event as CustomEvent<TrackDetail>).detail);
    document.addEventListener("click", click);
    window.addEventListener("fleetlever:track", custom);
    return () => {
      document.removeEventListener("click", click);
      window.removeEventListener("fleetlever:track", custom);
    };
  }, []);

  return null;
}
