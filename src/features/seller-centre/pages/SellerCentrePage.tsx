import { Link } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Package,
  Rocket,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react'
import sellerCentreHero from '@/assets/seller-centre/seller-centre-hero.png'

const TOOLS = [
  {
    icon: Package,
    title: 'My Products',
    description:
      'Create listings, manage stock and variations, and use mass upload or mass update when your catalogue grows.',
  },
  {
    icon: ClipboardList,
    title: 'Orders',
    description:
      'Track new orders, arrange shipment, print labels, and keep fulfilment on time for better shop health.',
  },
  {
    icon: Megaphone,
    title: 'Marketing Centre',
    description:
      'Run vouchers, discounts, and campaign tools to attract buyers and boost conversion on key products.',
  },
  {
    icon: BarChart3,
    title: 'Business Insights',
    description:
      'Review sales trends, product performance, traffic sources, and chat metrics to improve what you sell.',
  },
  {
    icon: MessageSquare,
    title: 'Chat & Support',
    description:
      'Reply to buyers quickly, resolve enquiries, and keep your response rate strong for better trust.',
  },
  {
    icon: Wallet,
    title: 'Finance',
    description:
      'Check income, payouts, and transaction history so you always know when money is settling to your account.',
  },
]

const START_STEPS = [
  {
    title: 'Register your shop',
    detail:
      'Create a seller account, verify your details, and set up your shop profile for buyers to find you.',
  },
  {
    title: 'List your products',
    detail:
      'Add clear photos, accurate titles, prices, and stock. Use product tools when you need to upload in bulk.',
  },
  {
    title: 'Fulfil and grow',
    detail:
      'Ship on time, chat with buyers, join campaigns, and use insights to improve your bestsellers.',
  },
]

const WHY_SELL = [
  {
    icon: Store,
    title: 'Reach more buyers',
    description:
      'Put your products in front of shoppers already browsing Ecommerce every day.',
  },
  {
    icon: Boxes,
    title: 'Operate in one place',
    description:
      'Products, orders, marketing, and finance tools live together in Seller Centre.',
  },
  {
    icon: ShieldCheck,
    title: 'Build shop trust',
    description:
      'Strong ratings, fast replies, and reliable fulfilment help your shop stand out.',
  },
]

const SellerCentrePage = () => {
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
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
                Seller Centre
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Run your shop from one dashboard
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                Ecommerce Seller Centre helps you manage products, orders,
                marketing, and insights — so you can sell more with less busywork.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/become-a-seller"
                  className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Start selling
                </Link>
                <Link
                  to="/seller"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Go to Seller Centre
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm">
              <img
                src={sellerCentreHero}
                alt="Seller managing products, orders, and shipments from Seller Centre"
                className="h-full w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why sell */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {WHY_SELL.map(({ icon: Icon, title, description }) => (
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

      {/* What is Seller Centre */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                What is Seller Centre?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your home base for running a shop on Ecommerce.
              </p>
              <p className="mt-6 text-sm text-gray-600 leading-relaxed">
                Seller Centre is your home base for selling on Ecommerce. From
                listing your first product to joining campaigns and checking
                payouts, everything you need to operate your shop sits in one
                place.
              </p>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Whether you are a new seller or scaling a growing catalogue, the
                tools are built to keep daily operations clear and campaign-ready.
              </p>
            </div>
            <div className="rounded-sm border border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 sm:p-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Rocket size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Built for sellers
                </p>
              </div>
              <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                List faster, fulfil on time, promote smarter, and understand
                what is driving your sales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Tools inside Seller Centre
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Core features inspired by modern marketplace seller hubs.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(({ icon: Icon, title, description }) => (
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

      {/* Getting started */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Getting started
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Three simple steps to open and grow your shop.
          </p>
          <ul className="mt-6 space-y-4">
            {START_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Ready to sell on Ecommerce?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Open your shop, list products, and manage everything from Seller
            Centre.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/become-a-seller"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Become a seller
            </Link>
            <Link
              to="/seller"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Open Seller Centre
            </Link>
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

export default SellerCentrePage
