import {
  ANNOUNCEMENT_BANNER_HEIGHT,
  NEXT_DAY_ANNOUNCEMENT_HEIGHT,
  NEW_USER_ANNOUNCEMENT_HEIGHT,
  BUY_TWO_ANNOUNCEMENT_HEIGHT,
  useAnnouncementVisibility,
} from "./announment";

const BASE_HEADER_HEIGHT = 112;

const HeaderSpacer = () => {
  const { freeShippingVisible, nextDayVisible, newUserVisible, buyTwoVisible } =
    useAnnouncementVisibility();

  const hasVisibleAnnouncements =
    freeShippingVisible || nextDayVisible || newUserVisible || buyTwoVisible;

  const height =
    BASE_HEADER_HEIGHT +
    (hasVisibleAnnouncements ? ANNOUNCEMENT_BANNER_HEIGHT : 0);

  return <div style={{ height }} aria-hidden />;
};

export default HeaderSpacer;
