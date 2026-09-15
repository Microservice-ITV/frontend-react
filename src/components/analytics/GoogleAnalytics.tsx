import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isGaEnabled, trackPageView } from "@/lib/analytics/gtag";

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (!isGaEnabled()) return;

    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
};

export default GoogleAnalytics;
