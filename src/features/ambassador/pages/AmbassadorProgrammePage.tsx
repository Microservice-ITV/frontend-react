import { Link } from 'react-router-dom'
import {
  BadgePercent,
  BarChart3,
  CheckCircle2,
  Gift,
  HeartHandshake,
  Link2,
  Megaphone,
  Rocket,
  Share2,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react'

const PROGRAM_EMAIL = 'mimikhainglin70@gmail.com'

const STEPS = [
  {
    icon: Users,
    title: 'Register as an ambassador',
    detail:
      'Sign up and tell us where you plan to share links — social media, messaging apps, or your blog. No shop and no follower minimum required.',
  },
  {
    icon: Link2,
    title: 'Share your unique links',
    detail:
      'Pick from millions of products and copy your personalised Ecommerce links. Every link you share is tracked back to you automatically.',
  },
  {
    icon: Wallet,
    title: 'Earn on every qualified purchase',
    detail:
      'When someone clicks your link and completes a purchase within the attribution window, the commission is credited to your account.',
  },
  {
    icon: Rocket,
    title: 'Get paid and grow',
    detail:
      'Commissions are settled to your bank account on a regular schedule, and you can track performance in the Ambassador dashboard.',
  },
]

const COMMISSION_RATES = [
  { category: 'Fashion & Apparel', rate: 'Up to 10%' },
  { category: 'Beauty & Personal Care', rate: 'Up to 12%' },
  { category: 'Electronics', rate: 'Up to 6%' },
  { category: 'Home & Living', rate: 'Up to 8%' },
  { category: 'Sports & Outdoors', rate: 'Up to 7%' },
  { category: 'Baby & Maternity', rate: 'Up to 9%' },
]

const BENEFITS = [
  {
    icon: Wallet,
    title: 'Steady commissions',
    description:
      'Earn on qualified purchases through your links — most rates fall in single digits, with boosted campaigns paying much more.',
  },
  {
    icon: Sparkles,
    title: 'Commission Xtra campaigns',
    description:
      'Promote featured products marked with a higher rate set by sellers. Commission Xtra items can pay up to 40% on a single order.',
  },
  {
    icon: Target,
    title: '7-day attribution window',
    description:
      'Shoppers have seven days to check out after clicking your link, so commissions stay with you even when purchases are made later.',
  },
  {
    icon: BarChart3,
    title: 'Performance dashboard',
    description:
      'See clicks, conversions, and earnings in real time. Use Sub-IDs to compare which channel drives your best results.',
  },
]

const REQUIREMENTS = [
  'An Ecommerce account',
  'A phone number registered to your country',
  'A bank account to receive your earnings',
  'At least one place to share links, such as Instagram, TikTok, WhatsApp, or a blog',
]

const FAQS = [
  {
    question: 'Do I need a shop or many followers to join?',
    answer:
      'No. The Ambassador Programme is open to anyone with an Ecommerce account and a way to share links. You do not need to be a seller or have a large audience.',
  },
  {
    question: 'How is my commission calculated?',
    answer:
      'Commission is a percentage of the net completed purchase value, calculated using Ecommerce base rates plus any Commission Xtra bonuses active at the time of purchase.',
  },
  {
    question: 'When will I receive my earnings?',
    answer:
      'Earnings are settled to your bank account on a regular payout schedule. You can track the amounts, status, and payout history in the Ambassador dashboard.',
  },
  {
    question: 'What is Commission Xtra?',
    answer:
      'Commission Xtra is a higher-than-average rate set by individual sellers on featured products. Promoting these items can significantly increase the commission you earn per order.',
  },
  {
    question: 'Are there products I cannot promote?',
    answer:
      'A small set of categories and items is excluded from commission eligibility, such as vouchers and certain regulated goods. The full list is available in the programme terms.',
  },
]

const AmbassadorProgrammePage = () => {
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
                <HeartHandshake size={16} />
                Ambassador Programme
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Earn commissions by sharing products you love
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                The Ecommerce Ambassador Programme rewards you with cash whenever
                someone buys through your unique link. Share products across
                social media and messaging apps — get paid for every qualified
                purchase.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${PROGRAM_EMAIL}?subject=${encodeURIComponent('Ambassador application')}`}
                  className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Rocket size={18} />
                  Become an ambassador
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  How it works
                </a>
              </div>
            </div>

            {/* Earnings card */}
            <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 text-emerald-600">
                <Gift size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  What ambassadors can earn
                </p>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-emerald-600">
                  up to 40%
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                commission on Commission Xtra items, plus category base rates of
                up to 12% on qualified orders.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { value: '7 days', label: 'Attribution window' },
                  { value: 'Weekly', label: 'Scheduled payouts' },
                  { value: '$0', label: 'Cost to join' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-sm border border-[var(--dni-cart-border)] bg-[#fafafa] px-3 py-3 text-center"
                  >
                    <p className="text-base font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 scroll-mt-28"
      >
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            How the programme works
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            From sign-up to your first payout in four simple steps.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, detail }, index) => (
            <div
              key={title}
              className="rounded-sm border border-[var(--dni-cart-border)] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <span className="text-3xl font-bold text-gray-100">
                  {index + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">
                {title}
              </p>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Commission rates */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Commission by category
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sample base rates for qualified purchases. Sellers may offer
                higher Commission Xtra rates on featured items at any time.
              </p>
              <ul className="mt-6 divide-y divide-gray-100 border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
                {COMMISSION_RATES.map((row) => (
                  <li
                    key={row.category}
                    className="flex items-center justify-between px-4 py-3 sm:px-5"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {row.category}
                    </span>
                    <span className="rounded-sm bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                      {row.rate}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-sm border border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 sm:p-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Sparkles size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Commission Xtra
                </p>
              </div>
              <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                Boost your income by promoting Commission Xtra products — sellers
                raise the rate themselves, and orders can pay up to 40%.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  'Same-shop and different-shop orders both qualify',
                  'Commissions can stack across base and Xtra rates',
                  'Rates are visible on every product before you share',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Why become an ambassador?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            A flexible way to turn your content into income.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-sm border border-[var(--dni-cart-border)] bg-white p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <BadgePercent size={20} strokeWidth={1.75} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              What you need to join
            </h2>
          </div>
          <ul className="mt-5 space-y-3">
            {REQUIREMENTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-gray-600">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="border-b border-[var(--dni-cart-border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Answers to common questions about the programme.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {FAQS.map((faq) => (
              <li key={faq.question} className="px-5 py-4 sm:px-6">
                <p className="text-sm sm:text-base font-medium text-gray-900">
                  {faq.question}
                </p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Ready to start earning?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Register now and your next shared link could already be earning
            commission.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${PROGRAM_EMAIL}?subject=${encodeURIComponent('Ambassador application')}`}
              className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Share2 size={18} />
              Apply to join
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Start shopping
            </Link>
            <Link
              to="/become-a-seller"
              className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sell on Ecommerce
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AmbassadorProgrammePage