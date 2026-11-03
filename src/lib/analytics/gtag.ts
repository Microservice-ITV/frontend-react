declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Production GA4 ID (was hardcoded in index.html). Override with VITE_GA_MEASUREMENT_ID. */
const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || "G-W4XPSNY7B1";

let loadPromise: Promise<void> | null = null;

export function isGaEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

/**
 * Inject gtag after first paint / idle so it stays off the critical path
 * (PageSpeed "unused JavaScript" / LCP).
 */
export function ensureGtagLoaded(): Promise<void> {
  if (!isGaEnabled()) return Promise.resolve();
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof window.gtag === "function" && loadPromise) return loadPromise;

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const start = () => {
      window.dataLayer = window.dataLayer || [];
      if (typeof window.gtag !== "function") {
        // GA expects the Arguments object, not a rest array.
        window.gtag = function gtag() {
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer.push(arguments);
        };
      }

      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false,
      });

      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-ga-loader="gtag"]',
      );
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.dataset.gaLoader = "gtag";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    };

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      ric(() => start(), { timeout: 4000 });
    } else {
      window.setTimeout(start, 2000);
    }
  });

  return loadPromise;
}

export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>,
): void {
  if (!isGaEnabled()) return;
  if (typeof window === "undefined") return;

  void ensureGtagLoaded().then(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, parameters ?? {});
  });
}

export function trackPageView(path: string, title?: string): void {
  trackEvent("page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}
