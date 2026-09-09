import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: '100% authentic',
    description:
      'Mall shops are brand owners or authorised distributors. Products must be genuine — counterfeits are not allowed.',
  },
  {
    icon: PackageCheck,
    title: 'Easy returns',
    description:
      'Eligible Mall orders support a clearer return window so you can shop brands with more peace of mind. Terms apply by category.',
  },
  {
    icon: Truck,
    title: 'Shipping perks',
    description:
      'Look for free shipping vouchers and shop promotions on Mall listings. Offers may require a minimum spend.',
  },
]

const HOW_TO_SPOT = [
  'Open the Ecommerce Mall tab or browse brands in the directory below',
  'Look for the Mall badge on shop pages and product listings',
  'On search results, filter to Mall sellers when you only want official brands',
  'Check the shop profile for brand verification and official store details',
]

const BRAND_CATEGORIES = [
  {
    name: 'Fashion & Beauty',
    brands: ['Aura Wear', 'Lumina Cosmetics', 'North Thread', 'Velvet Lane'],
  },
  {
    name: 'Home & Living',
    brands: ['Nest & Co', 'BrightNest', 'Forma Home', 'Daily Atelier'],
  },
  {
    name: 'Electronics',
    brands: ['Pulse Tech', 'Nova Gadgets', 'ClearSound', 'Volt Home'],
  },
  {
    name: 'Mom & Baby',
    brands: ['Little Grove', 'SoftStart', 'CareBloom', 'Tiny Trail'],
  },
]

const SELLER_PERKS = [
  {
    title: 'More visibility',
    detail:
      'Dedicated Mall entry points, brand directory placement, and stronger discovery for verified brand shops.',
  },
  {
    title: 'Greater trust',
    detail:
      'Mall badge signals authenticity to buyers who prefer shopping from official or authorised stores.',
  },
  {
    title: 'Brand tools',
    detail:
      'Access brand-focused campaigns, insights, and promotional opportunities reserved for Mall partners.',
  },
]

const MallPage = () => {
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
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            Ecommerce Mall
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
            Official brands. Authentic products.
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
            Ecommerce Mall is a dedicated space for brand owners and authorised
            distributors — so you can shop trusted labels with clearer buyer
            protection.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#brand-directory"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Browse brands
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Start shopping
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
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

      {/* What is Mall */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-6 lg:grid-cols-2 bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              What is Ecommerce Mall?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
              Mall is our official retail space for renowned local and
              international brands. Sellers go through verification before they
              receive the Mall badge on their shop and product listings.
            </p>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              That means stronger authenticity standards, clearer service
              expectations, and a shopping experience designed for buyers who
              want brand confidence first.
            </p>
          </div>
          <div className="relative min-h-[220px] lg:min-h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-6 sm:p-10 flex items-center">
            <div className="w-full rounded-sm border border-emerald-100 bg-white/80 backdrop-blur p-5 sm:p-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <BadgeCheck size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Mall badge
                </p>
              </div>
              <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                Spot official brand shops by the Mall label on search, product,
                and shop pages.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-sm bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                <Sparkles size={14} />
                Mall
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to shop Mall */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Store size={20} strokeWidth={1.75} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              How to find Mall sellers
            </h2>
          </div>
          <ul className="mt-5 space-y-3">
            {HOW_TO_SPOT.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-gray-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                  {index + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Brand directory */}
      <section
        id="brand-directory"
        className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 scroll-mt-28"
      >
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Brand directory
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sample Mall categories and featured brand names on Ecommerce.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {BRAND_CATEGORIES.map((group) => (
            <div
              key={group.name}
              className="rounded-sm border border-[var(--dni-cart-border)] bg-white p-5 sm:p-6"
            >
              <p className="text-sm font-semibold text-gray-900">{group.name}</p>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {group.brands.map((brand) => (
                  <li key={brand}>
                    <Link
                      to="/"
                      className="flex items-center gap-2 rounded-sm border border-gray-100 bg-[#fafafa] px-3 py-2.5 text-sm text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-emerald-100 text-[10px] font-bold text-emerald-700">
                        {brand.slice(0, 1)}
                      </span>
                      <span className="truncate">{brand}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* For brands */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="border-b border-[var(--dni-cart-border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              For brands & authorised sellers
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Why partners join Ecommerce Mall.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {SELLER_PERKS.map((perk) => (
              <li key={perk.title} className="px-5 py-4 sm:px-6">
                <p className="text-sm sm:text-base font-medium text-gray-900">
                  {perk.title}
                </p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {perk.detail}
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
            Shop Mall with confidence
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Explore authentic brands, or apply to sell as an official Mall
            partner on Ecommerce.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Explore Mall deals
            </Link>
            <Link
              to="/become-a-seller"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Become a Mall seller
            </Link>
            <Link
              to="/policies"
              className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Policies
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MallPage
