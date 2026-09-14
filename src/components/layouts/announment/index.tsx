import { useEffect, useState } from "react";
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

export const announcementItems = [
  {
    id: "freeShipping",
    title: "Free Shipping",
    summary: "Free shipping on orders over $50.",
    description:
      "Enjoy free delivery on eligible orders, plus faster access to seasonal promotions and bundle deals across Daily Need Items.",
    bannerCtaLabel: "Read More",
    bannerCtaTo: "/announcements/freeShipping",
    detailCtaLabel: "Shop Now",
    detailCtaTo: "/shop",
    component: AnnouncementBanner,
    componentProps: {
      ctaLabel: "Read More",
      ctaTo: "/announcements/freeShipping",
    },
  },
  {
    id: "nextDay",
    title: "Next-Day Delivery",
    summary: "Order today and get it tomorrow.",
    description:
      "Take advantage of next-day delivery coverage for eligible products so your essentials arrive faster and with more confidence.",
    bannerCtaLabel: "Read More",
    bannerCtaTo: "/announcements/nextDay",
    detailCtaLabel: "Explore Deals",
    detailCtaTo: "/products",
    component: AnnouncementNextDay,
    componentProps: {
      ctaLabel: "Read More",
      ctaTo: "/announcements/nextDay",
    },
  },
  {
    id: "newUser",
    title: "New User Voucher",
    summary: "$12 off your first order.",
    description:
      "Welcome voucher for new buyers to try Daily Need Items with an instant discount on their first purchase.",
    bannerCtaLabel: "Read More",
    bannerCtaTo: "/announcements/newUser",
    detailCtaLabel: "Create Account",
    detailCtaTo: "/register",
    component: AnnouncementNewUser,
    componentProps: {
      ctaLabel: "Read More",
      ctaTo: "/announcements/newUser",
    },
  },
  {
    id: "buyTwo",
    title: "Buy 2, Get 10% Off",
    summary: "Buy 2 items and save 10%.",
    description:
      "Mix and match selected products to unlock a 10% discount at checkout and make your basket go further.",
    bannerCtaLabel: "Read More",
    bannerCtaTo: "/announcements/buyTwo",
    detailCtaLabel: "Shop Collection",
    detailCtaTo: "/shop",
    component: AnnouncementBuyTwo,
    componentProps: {
      buyQty: 2,
      percentOff: 10,
      ctaLabel: "Read More",
      ctaTo: "/announcements/buyTwo",
    },
  },
];

export const announcementCatalog = Object.fromEntries(
  announcementItems.map((item) => [item.id, item]),
) as Record<string, (typeof announcementItems)[number]>;

export const getAnnouncementById = (announcementId?: string) =>
  announcementItems.find((item) => item.id === announcementId);

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
  const { freeShippingVisible, nextDayVisible, newUserVisible, buyTwoVisible } =
    useAnnouncementVisibility();

  const visibleAnnouncements = announcementItems.filter(({ id }) => {
    if (id === "freeShipping") return freeShippingVisible;
    if (id === "nextDay") return nextDayVisible;
    if (id === "newUser") return newUserVisible;
    if (id === "buyTwo") return buyTwoVisible;
    return true;
  });

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
    activeAnnouncement;

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
        <AnnouncementComponent {...componentProps} />
      </div>
    </>
  );
};
