import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import noMoreAnnouncementsIcon from "@/assets/announcement/no_more_announcements_icon.png";
import { announcementApi } from "@/features/announcements/api/announcementApi";
import type { Announcement } from "@/features/announcements/types/announcementTypes";

const accentClasses: Record<string, string> = {
  FREE_SHIPPING: "from-emerald-600 via-emerald-500 to-green-400",
  NEXT_DAY: "from-emerald-100 via-white to-yellow-50",
  NEW_USER: "from-emerald-700 via-emerald-600 to-emerald-500",
  BUY_TWO: "from-emerald-800 via-emerald-700 to-green-500",
};

const highlightClasses: Record<string, string> = {
  FREE_SHIPPING: "text-white",
  NEXT_DAY: "text-emerald-700",
  NEW_USER: "text-yellow-300",
  BUY_TWO: "text-white",
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

const getSecondText = (announcement: Announcement): string | null => {
  const textElements = announcement.elements
    .filter((element) => element.text?.trim())
    .sort((a, b) => a.position - b.position);

  return textElements[1]?.text?.trim() ?? null;
};

const getAnnouncementSummary = (announcement: Announcement): string =>
  getElementText(announcement, [
    "description",
    "supportingtext",
    "subtitle",
  ]) ??
  getElementText(announcement, ["summary", "message"]) ??
  getSecondText(announcement) ??
  announcement.name ??
  announcement.announcementType?.name ??
  "Explore this offer";

const getDetailCta = (announcement: Announcement) => {
  switch (getAnnouncementTypeCode(announcement)) {
    case "NEXT_DAY":
      return { label: "Explore Deals", to: "/products" };
    case "NEW_USER":
      return { label: "Create Account", to: "/register" };
    default:
      return { label: "Shop Now", to: "/shop" };
  }
};

const AnnouncementDetailPage = () => {
  const { announcementId } = useParams();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [otherAnnouncements, setOtherAnnouncements] = useState<Announcement[]>(
    [],
  );
  const [activeAnnouncementCount, setActiveAnnouncementCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadAnnouncement = async () => {
      if (!announcementId) {
        setAnnouncement(null);
        setOtherAnnouncements([]);
        setActiveAnnouncementCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [announcementResponse, activeResponse] = await Promise.all([
          announcementApi.getById(announcementId),
          announcementApi.getActive(),
        ]);

        if (ignore) {
          return;
        }

        const activeAnnouncements = activeResponse.data ?? [];
        setAnnouncement(announcementResponse.data ?? null);
        setActiveAnnouncementCount(activeAnnouncements.length);
        setOtherAnnouncements(
          activeAnnouncements.filter((item) => item.id !== announcementId),
        );
      } catch {
        if (!ignore) {
          setAnnouncement(null);
          setOtherAnnouncements([]);
          setActiveAnnouncementCount(0);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAnnouncement();

    return () => {
      ignore = true;
    };
  }, [announcementId]);

  const announcementTypeCode = announcement
    ? getAnnouncementTypeCode(announcement)
    : "";

  const title = useMemo(() => {
    if (!announcement) {
      return "";
    }

    return announcement.title ?? announcement.name ?? "Announcement";
  }, [announcement]);

  const summary = useMemo(() => {
    if (!announcement) {
      return "";
    }

    return getAnnouncementSummary(announcement);
  }, [announcement]);

  const extraText = useMemo(() => {
    if (!announcement) {
      return "";
    }

    return announcement.description ?? "";
  }, [announcement]);

  const detailCta = useMemo(
    () => (announcement ? getDetailCta(announcement) : null),
    [announcement],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Loading announcement
          </p>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Announcement not found
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            This announcement is no longer available.
          </h1>
          <Link
            to="/"
            className="mt-6 inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#f5f5f5]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.12) 0, transparent 42%), radial-gradient(circle at 85% 10%, rgba(5, 150, 105, 0.08) 0, transparent 38%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="transition-colors hover:text-emerald-600">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Announcements</span>
          <span>/</span>
          <span className="font-medium text-emerald-600">{announcement.announcementType?.name ?? title}</span>
        </div>

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60" />

          <div className="relative mx-auto">
            <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div className="flex flex-col justify-center">
                  <p className="mb-3 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">
                    {announcement.announcementType?.name ?? title}
                  </p>
                  <h1 className="text-2xl text-black font-semibold sm:text-3xl">
                    {title}
                  </h1>

                  {extraText && (
                    <p className="mt-2 max-w-xl text-sm font-medium text-emerald-700 sm:text-base">
                      {extraText}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    {detailCta && (
                      <Link
                        to={detailCta.to}
                        className="inline-flex items-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        {detailCta.label}
                        <span aria-hidden="true" className="ml-2">
                          →
                        </span>
                      </Link>
                    )}
                    <Link
                      to="/"
                      className="inline-flex items-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                    >
                      Continue shopping
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative w-full overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-[#fafafa] p-5 shadow-sm">
                    <div className="relative flex items-center justify-between text-sm">
                      <span className="text-base font-black text-gray-900">
                        Offer details
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
                        Active
                      </span>
                    </div>

                    <div className="relative mt-6 space-y-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500">
                          Campaign
                        </p>
                        <p className="mt-2 text-2xl text-black font-semibold">
                          {title}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500">
                          Why it matters
                        </p>
                        <p className="mt-2 text-black font-medium">
                          {summary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {otherAnnouncements.length > 0 ? (
        <section className="mt-5 border-t border-[var(--dni-cart-border)] bg-[#f5f5f5]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  More announcements
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Explore more deals
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {otherAnnouncements.map((item) => {
                const itemCode = getAnnouncementTypeCode(item);
                const itemTitle =
                  item.title ??
                  getElementText(item, ["title", "headline", "heading"]) ??
                  item.name ??
                  item.announcementType?.name ??
                  "Announcement";
                const itemSummary = getAnnouncementSummary(item);

                return (
                  <Link
                    key={item.id}
                    to={`/announcements/${item.id}`}
                    className="group rounded-sm border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div
                      className={`rounded-sm bg-gradient-to-r ${accentClasses[itemCode] ?? "from-emerald-600 via-emerald-500 to-green-400"} p-3`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-[0.2em] ${highlightClasses[itemCode] ?? "text-white"}`}
                      >
                        {item.announcementType?.name ?? itemTitle}
                      </p>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      {itemTitle}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{itemSummary}</p>

                    <div className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700">
                      Read more
                      <span aria-hidden="true" className="ml-2">
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : activeAnnouncementCount === 0 ? (
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img
              src={noMoreAnnouncementsIcon}
              alt="No more announcements"
              className="mx-auto h-auto w-full max-w-[200px]"
            />
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              No more announcements right now
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Check back soon for more deals, new arrivals, and exclusive
              savings.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AnnouncementDetailPage;
