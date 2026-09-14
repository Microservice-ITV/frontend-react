import { Link, useParams } from "react-router-dom";
import {
  announcementItems,
  getAnnouncementById,
} from "@/components/layouts/announment";

const accentClasses: Record<string, string> = {
  freeShipping: "from-emerald-600 via-emerald-500 to-green-400",
  nextDay: "from-emerald-100 via-white to-yellow-50",
  newUser: "from-emerald-700 via-emerald-600 to-emerald-500",
  buyTwo: "from-emerald-800 via-emerald-700 to-green-500",
};

const highlightClasses: Record<string, string> = {
  freeShipping: "text-white",
  nextDay: "text-emerald-700",
  newUser: "text-yellow-300",
  buyTwo: "text-white",
};

const AnnouncementDetailPage = () => {
  const { announcementId } = useParams();
  const announcement = getAnnouncementById(announcementId);
  const isNextDayAnnouncement = announcement?.id === "nextDay";

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

  const otherAnnouncements = announcementItems.filter(
    (item) => item.id !== announcement.id,
  );

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
          <span className="font-medium text-emerald-600">
            {announcement.title}
          </span>
        </div>

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60" />

          <div className="relative mx-auto">
            <div className="rounded-[28px] border border-[var(--dni-cart-border)] bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div className="flex flex-col justify-center">
                  <p className="mb-3 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">
                    {announcement.title}
                  </p>
                  <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
                    {announcement.summary}
                  </h1>
                  <p className="mt-4 max-w-xl text-sm text-gray-600 sm:text-base">
                    {announcement.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={announcement.detailCtaTo}
                      className="inline-flex items-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      {announcement.detailCtaLabel}
                      <span aria-hidden="true" className="ml-2">
                        →
                      </span>
                    </Link>
                    <Link
                      to="/"
                      className="inline-flex items-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                    >
                      Continue shopping
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative w-full overflow-hidden rounded-[24px] border border-[var(--dni-cart-border)] bg-[#fafafa] p-5 shadow-sm">
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
                        <p className="mt-2 text-2xl font-black text-gray-900">
                          {announcement.title}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500">
                          Why it matters
                        </p>
                        <p className="mt-2 text-base text-gray-600">
                          {announcement.summary}
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
            {otherAnnouncements.map((item) => (
              <Link
                key={item.id}
                to={`/announcements/${item.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div
                  className={`rounded-xl bg-gradient-to-r ${accentClasses[item.id] ?? "from-emerald-600 via-emerald-500 to-green-400"} p-3`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.2em] ${highlightClasses[item.id] ?? "text-white"}`}
                  >
                    {item.title}
                  </p>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {item.summary}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>

                <div className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700">
                  Read more
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnnouncementDetailPage;
