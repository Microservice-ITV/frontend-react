import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, FileText, Scale, Shield } from 'lucide-react'

type PolicyArticle = {
  id: string
  title: string
  summary: string
  paragraphs: string[]
  bullets?: string[]
  relatedTo?: string
}

const POLICY_ARTICLES: PolicyArticle[] = [
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    summary: 'Rules for using Ecommerce as a buyer or seller.',
    paragraphs: [
      'By creating an account or using Ecommerce, you agree to these Terms of Service. They cover account registration, marketplace use, payments, listings, and acceptable conduct.',
      'You must provide accurate account information, keep your login secure, and not use the platform for unlawful, fraudulent, or abusive activity.',
      'Ecommerce may suspend or remove content or accounts that violate these terms, applicable law, or our other policies. Continued use after updates means you accept the revised terms.',
    ],
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    summary: 'How we collect, use, and protect your personal data.',
    paragraphs: [
      'We collect account details, order information, device data, and support communications needed to operate the marketplace.',
      'Payment card details are processed by our payment partners and are not stored in full on Ecommerce servers.',
      'You can update profile information in account settings and contact support for privacy-related requests. See our Privacy Policy page for the full statement.',
    ],
    relatedTo: '/privacy',
  },
  {
    id: 'prohibited-items',
    title: 'Prohibited and Restricted Items',
    summary: 'Products that cannot be listed or sold on Ecommerce.',
    paragraphs: [
      'Sellers must not list items that are illegal, unsafe, or restricted under local law. Ecommerce may remove listings and take action against shops that breach this policy.',
    ],
    bullets: [
      'Counterfeit, stolen, or fraudulently obtained goods',
      'Weapons, explosives, and hazardous materials',
      'Illegal drugs and drug paraphernalia',
      'Adult content and sexual services where prohibited',
      'Items that infringe intellectual property rights',
      'Products recalled for safety reasons',
      'Animals, animal parts, and wildlife products restricted by law',
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property Policy',
    summary: 'Protecting brands, creators, and rights owners on the marketplace.',
    paragraphs: [
      'Ecommerce does not allow listings that infringe trademarks, copyrights, patents, or design rights.',
      'Rights owners or authorised agents may report suspected infringement with supporting evidence (proof of ownership, listing URL, and a good-faith declaration).',
      'Confirmed infringing listings may be removed. Repeat or severe violations can lead to account limits or permanent suspension.',
    ],
  },
  {
    id: 'community-guidelines',
    title: 'Community Guidelines',
    summary: 'Expected behaviour for buyers, sellers, reviews, and chat.',
    paragraphs: [
      'Treat other users respectfully. Harassment, hate speech, threats, spam, and misleading content are not allowed.',
      'Reviews and ratings should reflect genuine purchase experiences. Fake reviews, review manipulation, and abusive messaging may result in content removal or account action.',
    ],
    bullets: [
      'No harassment, discrimination, or threats',
      'No spam, phishing, or scam attempts',
      'No fake orders, reviews, or ratings',
      'No sharing of another person’s private information',
    ],
  },
  {
    id: 'return-refund-policy',
    title: 'Return & Refund Policy',
    summary: 'When and how buyers can request returns or refunds.',
    paragraphs: [
      'Eligible orders may be returned or refunded if an item is not received, is defective, or differs materially from the listing, subject to category rules and time windows shown on the order.',
      'Buyers should submit requests via My Orders with clear evidence when required. Approved refunds are returned to the original payment method after review.',
    ],
    relatedTo: '/return-refund',
  },
  {
    id: 'seller-policies',
    title: 'Seller Policies',
    summary: 'Standards for listings, fulfilment, and shop performance.',
    paragraphs: [
      'Sellers must provide accurate titles, photos, prices, and stock. Orders should be packed and handed to logistics partners within the stated processing time.',
      'Poor fulfilment, high cancellation rates, prohibited listings, or buyer complaints may lead to listing removal, fee adjustments, or shop restrictions.',
    ],
  },
  {
    id: 'payment-shipping',
    title: 'Payment & Shipping Policies',
    summary: 'How payments are processed and how delivery expectations work.',
    paragraphs: [
      'Buyers pay through supported checkout methods. Sellers receive payouts according to Ecommerce settlement rules after successful order completion.',
      'Shipping timelines depend on the selected courier, destination, and seller handling time. Tracking updates should be kept accurate. Lost or delayed parcels may be handled under Guarantee or return flows where eligible.',
    ],
    relatedTo: '/payment-methods',
  },
  {
    id: 'enforcement',
    title: 'Policy Enforcement',
    summary: 'What happens when policies are breached.',
    paragraphs: [
      'Ecommerce may warn users, remove content, cancel orders, limit features, or suspend accounts depending on severity and history.',
      'We may update policies as laws and marketplace needs change. Material updates will be reflected on this page. Continued use of Ecommerce constitutes acceptance of the latest policies.',
    ],
  },
]

const PoliciesPage = () => {
  const [openId, setOpenId] = useState<string | null>(POLICY_ARTICLES[0]?.id ?? null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return POLICY_ARTICLES
    return POLICY_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.paragraphs.some((p) => p.toLowerCase().includes(q)),
    )
  }, [query])

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
            Help Centre · Policies
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
            Ecommerce Policies
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
            Marketplace rules that keep buying and selling fair, safe, and
            transparent — inspired by clear help-centre policy guides.
          </p>
          <div className="mt-8 max-w-xl">
            <label htmlFor="policy-search" className="sr-only">
              Search policies
            </label>
            <input
              id="policy-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policies…"
              className="w-full rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Scale size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Fair marketplace</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Clear rules for buyers and sellers.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Shield size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Trust & safety</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Protection against fraud and harmful listings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <FileText size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Transparent terms</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Easy-to-read policy articles in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Article list — Help Centre style */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="border-b border-[var(--dni-cart-border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Ecommerce Policies
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} article{filtered.length === 1 ? '' : 's'}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="px-5 py-8 sm:px-6 text-sm text-gray-500">
              No policies match your search. Try a different keyword.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((article) => {
                const isOpen = openId === article.id
                return (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : article.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 sm:px-6 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {article.title}
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 line-clamp-1">
                          {article.summary}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-50 bg-[#fafafa] px-5 py-5 sm:px-6 sm:py-6">
                        <div className="max-w-3xl space-y-3">
                          {article.paragraphs.map((p) => (
                            <p
                              key={p.slice(0, 48)}
                              className="text-sm text-gray-600 leading-relaxed"
                            >
                              {p}
                            </p>
                          ))}
                          {article.bullets && (
                            <ul className="space-y-2 pt-1">
                              {article.bullets.map((item) => (
                                <li
                                  key={item}
                                  className="flex gap-2 text-sm text-gray-600"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {article.relatedTo && (
                            <p className="pt-2">
                              <Link
                                to={article.relatedTo}
                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                              >
                                Read related page →
                              </Link>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Need more help?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Review related buyer protection pages or learn more about Ecommerce.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/privacy"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PoliciesPage
