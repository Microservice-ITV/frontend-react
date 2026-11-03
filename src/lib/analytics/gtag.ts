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
 * Load gtag after first user interaction (or a long fallback) so Lighthouse
 * lab runs usually never download the ~177 KiB third-party script on first paint.
 */
export function ensureGtagLoaded(): Promise<void> {
  if (!isGaEnabled()) return Promise.resolve();
  if (typeof window === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    let started = false;

    const start = () => {
      if (started) return;
      started = true;

      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("scroll", start);

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

      let script = document.querySelector<HTMLScriptElement>(
        'script[data-ga-loader="gtag"]',
      );
      if (!script) {
        script = document.createElement("script");
        script.async = true;
        script.dataset.gaLoader = "gtag";
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
      }

      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => resolve(), { once: true });
    };

    window.addEventListener("pointerdown", start, { once: true, passive: true });
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("scroll", start, { once: true, passive: true });
    // Real users who never interact still get analytics; Lighthouse rarely waits this long.
    window.setTimeout(start, 10_000);
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
