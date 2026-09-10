import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgePercent,
  Clock,
  Flame,
  Megaphone,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from 'lucide-react'

const DEAL_CATEGORIES = [
  'All',
  'Fashion',
  'Home & Living',
  'Electronics',
  'Beauty',
  'Mom & Baby',
]

const DEALS = [
  {
    name: 'Wireless Earbuds Pro',
    image: '🎧',
    tag: 'Electronics',
    dealPrice: 19.9,
    originalPrice: 59.9,
    discount: 67,
    sold: '2.4k',
    gradient: 'from-sky-100 to-indigo-50',
  },
  {
    name: 'Premium Ceramic Cookware Set',
    image: '🍳',
    tag: 'Home & Living',
    dealPrice: 45.5,
    originalPrice: 129.0,
    discount: 65,
    sold: '1.8k',
    gradient: 'from-emerald-100 to-teal-50',
  },
  {
    name: 'Hydrating Lip Tint Trio',
    image: '💄',
    tag: 'Beauty',
    dealPrice: 12.9,
    originalPrice: 32.9,
    discount: 61,
    sold: '3.1k',
    gradient: 'from-rose-100 to-pink-50',
  },
  {
    name: 'Mini Robot Vacuum',
    image: '🤖',
    tag: 'Electronics',
    dealPrice: 89.0,
    originalPrice: 199.0,
    discount: 55,
    sold: '962',
    gradient: 'from-violet-100 to-purple-50',
  },
  {
    name: 'Organic Baby Skincare Kit',
    image: '🧴',
    tag: 'Mom & Baby',
    dealPrice: 24.9,
    originalPrice: 54.9,
    discount: 55,
    sold: '1.2k',
    gradient: 'from-emerald-100 to-teal-50',
  },
  {
    name: 'Athletic Running Shoes',
    image: '👟',
    tag: 'Fashion',
    dealPrice: 36.0,
    originalPrice: 79.9,
    discount: 55,
    sold: '2.7k',
    gradient: 'from-lime-100 to-green-50',
  },
  {
    name: 'Portable Power Bank 20K',
    image: '🔋',
    tag: 'Electronics',
    dealPrice: 27.9,
    originalPrice: 59.9,
    discount: 53,
    sold: '4.5k',
    gradient: 'from-cyan-100 to-blue-50',
  },
  {
    name: 'Memory Foam Pillow Pair',
    image: '🛏️',
    tag: 'Home & Living',
    dealPrice: 32.5,
    originalPrice: 68.0,
    discount: 52,
    sold: '1.6k',
    gradient: 'from-slate-100 to-gray-50',
  },
]

const HOW_IT_WORKS = [
  {
    icon: Clock,
    title: 'Limited time only',
    description:
      'Each flash deal session runs for a short window — when the timer hits zero, prices change.',
  },
  {
    icon: BadgePercent,
    title: 'Real discounts, up front',
    description:
      'Deal prices are shown clearly next to the original price, so the savings are easy to see.',
  },
  {
    icon: PackageCheck,
    title: 'Act fast, stock is limited',
    description:
      'Popular deals can sell out during a session, so add to cart while the offer is live.',
  },
]

const SESSION_TIMES = [
  { time: '8:00 AM', label: 'Morning drop' },
  { time: '12:00 PM', label: 'Lunchtime drop' },
  { time: '6:00 PM', label: 'Evening drop' },
  { time: '10:00 PM', label: 'Late-night drop' },
]

const getNextSessionEnd = () => {
  const end = new Date()
  end.setMinutes(0, 0, 0)
  end.setHours(end.getHours() + 1)
  return end
}

const pad = (value: number) => String(value).padStart(2, '0')

const FlashDealsPage = () => {
  const [activeCategory, setActiveCategory] = useState('All')
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = getNextSessionEnd()
    return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return Math.max(0, Math.floor((getNextSessionEnd().getTime() - Date.now()) / 1000))
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const filteredDeals =
    activeCategory === 'All'
      ? DEALS
      : DEALS.filter((deal) => deal.tag === activeCategory)

  return (
    <div className="bg-[#f5f5f5] pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.12) 0, transparent 42%), radial-gradient(circle at 85% 10%, rgba(5, 150, 105, 0.08) 0, transparent 38%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-emerald-600">
                <Zap size={16} fill="currentColor" />
                Flash Deals
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Big savings, limited time. Grab them before they are gone.
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                Every hour brings fresh deals across fashion, home, beauty,
                electronics, and more. Prices drop for a short window — watch the
                countdown and check out before the session ends.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#ongoing-deals"
                  className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Flame size={18} />
                  Shop the deals
                </a>
                <Link
                  to="/seller-centre"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Join as a seller
                </Link>
              </div>
            </div>

            {/* Countdown */}
            <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 text-emerald-600">
                <Zap size={22} fill="currentColor" strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Session ends in
                </p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                {[
                  { value: pad(hours), label: 'Hours' },
                  { value: pad(minutes), label: 'Minutes' },
                  { value: pad(seconds), label: 'Seconds' },
                ].map((block, index) => (
                  <div key={block.label} className="flex items-center gap-3">
                    {index > 0 && (
                      <span className="text-2xl font-bold text-gray-300">:</span>
                    )}
                    <div className="text-center">
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-sm bg-gradient-to-br from-emerald-600 to-emerald-700 text-2xl sm:text-3xl font-bold text-white tabular-nums shadow-sm">
                        {block.value}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{block.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-sm text-gray-600">
                New deals drop every hour. Set your reminder so you never miss a
                session.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                {SESSION_TIMES.map((session) => (
                  <div
                    key={session.label}
                    className="flex items-center gap-2 rounded-sm border border-gray-100 bg-[#fafafa] px-3 py-2.5"
                  >
                    <Clock size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {session.time}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {session.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ongoing deals */}
      <section
        id="ongoing-deals"
        className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 scroll-mt-28"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Ongoing flash deals
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Prices shown are active for this session only.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View all deals
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Category filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {DEAL_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-emerald-600 text-white'
                  : 'border border-[var(--dni-cart-border)] bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredDeals.map((deal) => (
            <Link
              key={deal.name}
              to="/"
              className="group rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 transition-all hover:shadow-md hover:-translate-y-[1px]"
            >
              <div className="relative">
                <div
                  className={`flex aspect-[4/3] items-center justify-center rounded-sm bg-gradient-to-br ${deal.gradient}`}
                >
                  <span className="text-5xl" aria-hidden>
                    {deal.image}
                  </span>
                </div>
                <div className="absolute left-2 top-2 rounded-sm bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow-sm">
                  -{deal.discount}%
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">
                  <Zap size={11} fill="currentColor" />
                  Flash Deal
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-gray-700 min-h-[2.5rem]">
                {deal.name}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-600">
                  ${deal.dealPrice.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ${deal.originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{deal.sold} sold</span>
                <span className="rounded-sm border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                  {deal.tag}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why shop flash deals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Why shop Ecommerce Flash Deals?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Serious savings, clear prices, and a reason to check in every hour.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BadgePercent,
                title: 'Genuine price drops',
                description:
                  'Deal prices are compared against the regular price, so you always know what you are saving.',
              },
              {
                icon: ShieldCheck,
                title: 'Shop with confidence',
                description:
                  'Ecommerce buyer protection and easy checkout apply to flash deal purchases like any order.',
              },
              {
                icon: Truck,
                title: 'Shipping you can count on',
                description:
                  'Track your order from the moment it leaves the seller until it reaches your door.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-[#fafafa] p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For sellers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-6 lg:grid-cols-2 bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Are you a seller? Get your products featured
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
              Flash Deals give selected products a big visibility boost for a
              limited time. Shoppers who land on a flash deal are shopping with
              intent — and many end up browsing your shop while they are there.
            </p>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Ecommerce recommends top-performing products for upcoming
              sessions. Keep healthy stock and strong ratings to improve your
              chances of being featured.
            </p>
          </div>
          <div className="rounded-sm border border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 sm:p-6 flex items-center">
            <div className="w-full">
              <div className="flex items-center gap-3 text-emerald-600">
                <Megaphone size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Built for sellers
                </p>
              </div>
              <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                Stand a chance to be featured in hourly flash deal sessions and
                turn limited-time offers into lasting customers.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/become-a-seller"
                  className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Become a seller
                </Link>
                <Link
                  to="/seller-centre"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Open Seller Centre
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
            <ShoppingBag size={22} />
          </div>
          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">
            Your next great deal is ticking
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Browse hourly sessions, add to cart before the timer runs out, and
            save on products you love.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#ongoing-deals"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Shop flash deals
            </a>
            <Link
              to="/mall"
              className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ecommerce Mall
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FlashDealsPage