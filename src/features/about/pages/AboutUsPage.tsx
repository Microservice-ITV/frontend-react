import { Link } from "react-router-dom";
import { Package, ShieldCheck, Store, Users } from "lucide-react";

const STATS = [
  { label: "Active buyers", value: "10M+" },
  { label: "Local sellers", value: "500K+" },
  { label: "Products listed", value: "50M+" },
  { label: "Cities covered", value: "100+" },
];

const VALUES = [
  {
    icon: Store,
    title: "Empower local sellers",
    description:
      "We give shops of every size the tools to reach customers nationwide — from first listing to first sale.",
  },
  {
    icon: Package,
    title: "Simple shopping",
    description:
      "Discover products, compare options, and checkout in a few taps with trusted payment and delivery partners.",
  },
  {
    icon: ShieldCheck,
    title: "Buyer protection",
    description:
      "Orders are backed by clear return policies and support so you can shop with confidence.",
  },
  {
    icon: Users,
    title: "Community first",
    description:
      "We grow with our buyers and sellers — listening, improving, and building features that matter day to day.",
  },
];

const MILESTONES = [
  {
    year: "2022",
    title: "Ecommerce launches",
    detail:
      "We started with a simple idea: make online shopping easy and accessible for everyone.",
  },
  {
    year: "2023",
    title: "Seller tools expand",
    detail:
      "Shops gained richer product management, order tracking, and faster payouts.",
  },
  {
    year: "2024",
    title: "Nationwide logistics",
    detail:
      "Partnerships with leading couriers brought reliable delivery to more cities and towns.",
  },
  {
    year: "2026",
    title: "Growing together",
    detail:
      "Millions of buyers and hundreds of thousands of sellers now connect on our marketplace every day.",
  },
];

const AboutUsPage = () => {
  return (
    <div className="bg-[#f5f5f5] pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.12) 0, transparent 42%), radial-gradient(circle at 85% 10%, rgba(5, 150, 105, 0.08) 0, transparent 38%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            About Ecommerce
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
            Connecting buyers and sellers across the country
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
            Ecommerce is a marketplace built for everyday shopping — affordable
            finds, trusted sellers, and delivery you can count on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Start shopping
            </Link>
            <Link
              to="/become-a-seller"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Become a seller
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm border border-[var(--dni-cart-border)] bg-white px-4 py-5 text-center shadow-sm"
            >
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {stat.value}
              </p>
              <p className="mt-1 text-sm sm:text-sm text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-6 lg:grid-cols-2 bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Our story
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
              Ecommerce began as a small team with a big goal: bring the
              convenience of online shopping to every home. We saw how hard it
              was for local shops to reach new customers, and how buyers
              struggled to find reliable products at fair prices.
            </p>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Today we power a thriving marketplace where anyone can buy or sell
              — backed by secure payments, flexible logistics, and customer
              support that puts people first.
            </p>
          </div>
          <div className="relative min-h-[220px] lg:min-h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-6 sm:p-10 flex items-center">
            <div className="w-full grid gap-4">
              <div className="rounded-sm border border-emerald-100 bg-white/80 backdrop-blur p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Our mission
                </p>
                <p className="mt-2 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                  Make commerce accessible, enjoyable, and trustworthy for every
                  buyer and seller.
                </p>
              </div>
              <div className="rounded-sm border border-emerald-100 bg-white/80 backdrop-blur p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Our vision
                </p>
                <p className="mt-2 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                  Become the most loved marketplace where local businesses
                  thrive and every shopper feels confident.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            What we stand for
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            These principles guide how we build products and support our
            community.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Our journey
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Key moments that shaped Ecommerce.
          </p>
          <ol className="mt-8 space-y-0">
            {MILESTONES.map((item, index) => (
              <li
                key={item.year}
                className="relative flex gap-4 sm:gap-6 pb-8 last:pb-0"
              >
                {index < MILESTONES.length - 1 && (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-emerald-100"
                    aria-hidden
                  />
                )}
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {item.year}
                  </p>
                  <h3 className="mt-1 text-sm sm:text-base font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Ready to explore Ecommerce?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Browse millions of products or open your own shop and start selling
            today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Shop now
            </Link>
            <Link
              to="/all_categories"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
