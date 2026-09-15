import { useEffect, useMemo, useState } from "react";
import AnnouncementBanner, {
  ANNOUNCEMENT_BANNER_HEIGHT,
  ANNOUNCEMENT_DISMISS_EVENT,
} from "./announcementfreeshipping";
import AnnouncementNextDay, {
  NEXT_DAY_ANNOUNCEMENT_DISMISS_EVENT,
  NEXT_DAY_ANNOUNCEMENT_HEIGHT,
} from "./announmentNextDay";
import AnnouncementNewUser, {
  NEW_USER_ANNOUNCEMENT_DISMISS_EVENT,
  NEW_USER_ANNOUNCEMENT_HEIGHT,
} from "./announmentNewUser";
import AnnouncementBuyTwo, {
  BUY_TWO_ANNOUNCEMENT_DISMISS_EVENT,
  BUY_TWO_ANNOUNCEMENT_HEIGHT,
} from "./announmentBuyTwo";
import { announcementApi } from "@/features/announcements/api/announcementApi";
import type { Announcement } from "@/features/announcements/types/announcementTypes";

export {
  AnnouncementBanner,
  AnnouncementNextDay,
  AnnouncementNewUser,
  AnnouncementBuyTwo,
  ANNOUNCEMENT_BANNER_HEIGHT,
  ANNOUNCEMENT_DISMISS_EVENT,
  NEXT_DAY_ANNOUNCEMENT_DISMISS_EVENT,
  NEXT_DAY_ANNOUNCEMENT_HEIGHT,
  NEW_USER_ANNOUNCEMENT_DISMISS_EVENT,
  NEW_USER_ANNOUNCEMENT_HEIGHT,
  BUY_TWO_ANNOUNCEMENT_DISMISS_EVENT,
  BUY_TWO_ANNOUNCEMENT_HEIGHT,
};

const getAnnouncementTypeCode = (announcement: Announcement) =>
  announcement.announcementType?.code?.toUpperCase() ?? "";

const getElementText = (
  announcement: Announcement,
  preferredKeys: string[],
): string | null => {
  const match = announcement.elements.find((element) =>
    preferredKeys.includes(element.key?.toLowerCase?.() ?? ""),
  );

  return match?.text?.trim() || null;
};

const getPrimaryContentText = (announcement: Announcement): string | null => {
  const firstTextElement = announcement.elements.find((element) =>
    element.text?.trim(),
  );

  return firstTextElement?.text?.trim() || null;
};

const getOrderedTextElements = (announcement: Announcement) =>
  announcement.elements
    .filter((element) => element.text?.trim())
    .sort((a, b) => a.position - b.position);

const getExtraText = (announcement: Announcement): string | null => {
  const textElements = announcement.elements
    .filter((element) => element.text?.trim())
    .sort((a, b) => a.position - b.position);

  return textElements[1]?.text?.trim() ?? null;
};

const getFirstNumberFromText = (text: string | null): number | null => {
  if (!text) {
    return null;
  }

  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const resolveBannerText = (announcement: Announcement) => {
  const code = getAnnouncementTypeCode(announcement);
  const orderedTextElements = getOrderedTextElements(announcement);

  const titleText =
    announcement.name ??
    getElementText(announcement, ["title", "headline", "heading"]) ??
    announcement.announcementType?.name ??
    "Daily Need Items";

  const secondaryText =
    getElementText(announcement, [
      "description",
      "supportingtext",
      "subtitle",
    ]) ??
    getElementText(announcement, ["summary", "message"]) ??
    getPrimaryContentText(announcement) ??
    announcement.announcementType?.name ??
    "Explore this offer";

  const badgeText =
    getElementText(announcement, ["badge", "pill", "label"]) ??
    getExtraText(announcement) ??
    (code === "FREE_SHIPPING" ? "Shop more, save more!" : null);

  const actionText =
    getElementText(announcement, ["action", "cta", "button"]) ?? "Read More";

  return {
    code,
    titleText,
    secondaryText,
    badgeText,
    actionText,
  };
};

const buildAnnouncementComponent = (announcement: Announcement) => {
  const { code, titleText, secondaryText, badgeText, actionText } =
    resolveBannerText(announcement);

  const baseProps = {
    ctaLabel: actionText,
    ctaTo: `/announcements/${announcement.id}`,
  };

  switch (code) {
    case "FREE_SHIPPING":
      return {
        component: AnnouncementBanner,
        componentProps: {
          ...baseProps,
          headline: titleText,
          supportingText: secondaryText,
          extraText: badgeText ?? "Shop more, save more!",
        },
      };
    case "NEXT_DAY":
      return {
        component: AnnouncementNextDay,
        componentProps: {
          ...baseProps,
          headline: titleText,
          supportingText: secondaryText,
        },
      };
    case "NEW_USER":
      return {
        component: AnnouncementNewUser,
        componentProps: {
          ...baseProps,
          headline: titleText,
          supportingText: secondaryText,
        },
      };
    case "BUY_TWO": {
      const orderedTextElements = getOrderedTextElements(announcement);
      const buyQty =
        getFirstNumberFromText(orderedTextElements[0]?.text ?? null) ?? 2;
      const percentOff =
        getFirstNumberFromText(orderedTextElements[1]?.text ?? null) ?? 10;
      const headline = announcement.name ?? `${percentOff}% OFF`;
      const supportingText =
        orderedTextElements[2]?.text?.trim() ??
        "Mix and match. Discount applied at checkout.";

      return {
        component: AnnouncementBuyTwo,
        componentProps: {
          ...baseProps,
          buyQty,
          percentOff,
          headline,
          supportingText,
        },
      };
    }
    default:
      return {
        component: AnnouncementBanner,
        componentProps: {
          ...baseProps,
          headline: titleText,
          supportingText: secondaryText,
          extraText: badgeText ?? "Explore the latest offer",
        },
      };
  }
};

export const useAnnouncementVisibility = () => {
  const [freeShippingVisible, setFreeShippingVisible] = useState(true);
  const [nextDayVisible, setNextDayVisible] = useState(true);
  const [newUserVisible, setNewUserVisible] = useState(true);
  const [buyTwoVisible, setBuyTwoVisible] = useState(true);

  useEffect(() => {
    const hideFreeShipping = () => setFreeShippingVisible(false);
    const hideNextDay = () => setNextDayVisible(false);
    const hideNewUser = () => setNewUserVisible(false);
    const hideBuyTwo = () => setBuyTwoVisible(false);

    window.addEventListener(ANNOUNCEMENT_DISMISS_EVENT, hideFreeShipping);
    window.addEventListener(NEXT_DAY_ANNOUNCEMENT_DISMISS_EVENT, hideNextDay);
    window.addEventListener(NEW_USER_ANNOUNCEMENT_DISMISS_EVENT, hideNewUser);
    window.addEventListener(BUY_TWO_ANNOUNCEMENT_DISMISS_EVENT, hideBuyTwo);

    return () => {
      window.removeEventListener(ANNOUNCEMENT_DISMISS_EVENT, hideFreeShipping);
      window.removeEventListener(
        NEXT_DAY_ANNOUNCEMENT_DISMISS_EVENT,
        hideNextDay,
      );
      window.removeEventListener(
        NEW_USER_ANNOUNCEMENT_DISMISS_EVENT,
        hideNewUser,
      );
      window.removeEventListener(
        BUY_TWO_ANNOUNCEMENT_DISMISS_EVENT,
        hideBuyTwo,
      );
    };
  }, []);

  return {
    freeShippingVisible,
    nextDayVisible,
    newUserVisible,
    buyTwoVisible,
  };
};

export const Announcements = () => {
  const [apiAnnouncements, setApiAnnouncements] = useState<Announcement[]>([]);
  const [hiddenAnnouncementIds, setHiddenAnnouncementIds] = useState<string[]>(
    [],
  );

  useEffect(() => {
    let ignore = false;

    const loadAnnouncements = async () => {
      try {
        const response = await announcementApi.getActive();
        if (!ignore) {
          setApiAnnouncements(response.data ?? []);
        }
      } catch {
        if (!ignore) {
          setApiAnnouncements([]);
        }
      }
    };

    loadAnnouncements();

    return () => {
      ignore = true;
    };
  }, []);

  const visibleAnnouncements = useMemo(
    () =>
      apiAnnouncements.filter(
        (announcement) => !hiddenAnnouncementIds.includes(announcement.id),
      ),
    [apiAnnouncements, hiddenAnnouncementIds],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (visibleAnnouncements.length === 0) {
      return;
    }

    setActiveIndex(
      (currentIndex) => currentIndex % visibleAnnouncements.length,
    );
  }, [visibleAnnouncements.length]);

  useEffect(() => {
    if (visibleAnnouncements.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % visibleAnnouncements.length,
      );
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [visibleAnnouncements.length]);

  const activeAnnouncement = visibleAnnouncements[activeIndex];

  if (!activeAnnouncement) {
    return null;
  }

  const { component: AnnouncementComponent, componentProps } =
    buildAnnouncementComponent(activeAnnouncement);

  const handleDismiss = () => {
    setHiddenAnnouncementIds((current) => [...current, activeAnnouncement.id]);
  };

  return (
    <>
      <style>{`
        @keyframes announcementFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        key={activeAnnouncement.id}
        style={{ animation: "announcementFade 500ms ease-in-out" }}
      >
        <AnnouncementComponent {...componentProps} onDismiss={handleDismiss} />
      </div>
    </>
  );
};
