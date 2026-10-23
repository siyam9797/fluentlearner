"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { PublicMetaConfig } from "@shared/meta";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

type PurchaseEvent = { value: number; eventId: string };
const pendingPurchases: PurchaseEvent[] = [];
let ready = false;

export function trackMetaPurchase(event: PurchaseEvent) {
  if (!ready || !window.fbq) {
    pendingPurchases.push(event);
    return;
  }
  window.fbq(
    "track",
    "Purchase",
    { currency: "BDT", value: event.value },
    { eventID: event.eventId }
  );
}

function startPixel(datasetId: string) {
  if (window.fbq) return;
  type FbqStub = ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    push: (...args: unknown[]) => void;
    loaded: boolean;
    version: string;
  };
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as FbqStub;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
  fbq("init", datasetId);
  loadOnFirstInteraction(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  });
}

/**
 * Facebook's script is heavy and sets third-party cookies, which slows the first
 * paint and costs Lighthouse points. Calls made before it loads wait in the fbq
 * queue and are sent once it does; the server-side PageView is sent right away.
 */
function loadOnFirstInteraction(load: () => void) {
  const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
  const run = () => {
    for (const event of events) window.removeEventListener(event, run);
    load();
  };
  for (const event of events)
    window.addEventListener(event, run, { once: true, passive: true });
}

export default function MetaPageView({ config }: { config: PublicMetaConfig }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!config.enabled || !/^\d{5,30}$/.test(config.datasetId)) return;
    startPixel(config.datasetId);
    ready = true;
    for (const event of pendingPurchases.splice(0)) trackMetaPurchase(event);
  }, [config.enabled, config.datasetId]);

  useEffect(() => {
    if (
      (!config.enabled && !config.capiEnabled) ||
      !pathname ||
      pathname === lastPath.current
    )
      return;
    lastPath.current = pathname;
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/student")) {
      const eventId = crypto.randomUUID();
      if (config.enabled) {
        window.fbq?.("track", "PageView", {}, { eventID: eventId });
      }
      if (config.capiEnabled) {
        void fetch("/api/meta/pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, path: pathname }),
          keepalive: true,
        }).catch(() => {});
      }
    }
  }, [config.enabled, config.capiEnabled, pathname]);

  return null;
}
