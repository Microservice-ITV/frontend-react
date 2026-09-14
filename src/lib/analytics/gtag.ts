declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function isGaEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>,
): void {
  if (!isGaEnabled()) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, parameters ?? {});
}

export function trackPageView(path: string, title?: string): void {
  trackEvent("page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}
