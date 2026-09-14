import { BarChart3, ChevronDown, PackagePlus, Store, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import HelpHeader from './common/HelpHeader'
import { getHelpArticle, helpArticles, helpCenterContents, paymentMethods } from '../data/helpCenterData'

const renderRichText = (text: string) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
  if (part.startsWith('**') && part.endsWith('**')) {
    return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
  }

  return part
})

const paymentMethodIcons: Record<string, string> = {
  KPay: '/payment-kpay.svg',
  'AYA Pay': '/payment-ayapay.svg',
  WavePay: '/payment-wavepay.svg',
  'CB Pay': '/payment-cbpay.svg',
}

type HelpNavigationItem = {
  label: string
}

type HelpNavigationGroup = {
  id: string
  label: string
  items: HelpNavigationItem[]
}

const sellerNavigation: HelpNavigationGroup[] = [
  {
    id: 'announcement',
    label: 'Announcement',
    items: [
      { label: 'All' },
      { label: 'Logistics Updates' },
      { label: 'Seller FAQs' },
      { label: 'Policy Updates' },
    ],
  },
  {
    id: 'misconduct',
    label: 'Misconduct',
    items: [{ label: 'Report fraud/corruption' }],
  },
  {
    id: 'general',
    label: 'General',
    items: [
      { label: 'Advisories/Resources' },
      { label: 'Penalties and Appeals' },
      { label: 'Account Safety' },
      { label: 'Sell on DNI Shop' },
      { label: 'Shop/Account Settings' },
    ],
  },
  {
    id: 'fulfilment',
    label: 'Fulfilment',
    items: [
      { label: 'Fulfilment Policy' },
      { label: 'Orders' },
      { label: 'Shipping costs' },
      { label: 'Shipment' },
      { label: 'Logistics Overview' },
      { label: 'DNI Shop Supported Logistics' },
    ],
  },
  {
    id: 'returns',
    label: 'Returns and refunds',
    items: [
      { label: 'Return/Refund Overview' },
      { label: 'Disputes' },
      { label: 'Return to sellers' },
    ],
  },
  {
    id: 'product',
    label: 'Product',
    items: [
      { label: 'Listing Policy Overview' },
      { label: 'Prohibited Listings Policy' },
      { label: 'IP Enforcement Policy' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { label: 'Campaign Exclusives' },
      { label: 'Promotional Tools' },
      { label: 'Engagement Tools' },
      { label: 'Advertising Tools' },
      { label: 'Other Marketing Tools' },
      { label: 'Participating in Campaigns' },
      { label: 'Offering Buyer Perks' },
      { label: 'Marketing Tips' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { label: 'Finance Tools' },
      { label: 'Seller Fees' },
      { label: 'Income Management' },
      { label: 'Payment Methods' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [
      { label: 'Account Health' },
      { label: 'Business Insights' },
      { label: 'Selling Coach' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth and Expansion',
    items: [
      { label: 'DNI Shop Seller Programmes' },
      { label: 'External Services' },
      { label: 'DNI Shop Mall' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    items: [
      { label: 'Customer Service Policy' },
      { label: 'DNI Shop Seller Chat' },
      { label: 'Ratings and Reviews' },
    ],
  },
  {
    id: 'shop',
    label: 'Shop',
    items: [
      { label: 'Shop Set-up' },
      { label: 'Shop Decoration' },
      { label: 'Media Management' },
    ],
  },
]

const sellerGuideCards = [
  { id: 'shop', number: 'Guide 1', title: 'Set up your shop', description: 'Create your shop profile, add your shop information, and get ready to welcome customers.', icon: Store, accent: 'bg-emerald-100 text-emerald-700' },
  { id: 'product', number: 'Guide 2', title: 'Add your products', description: 'Create clear listings with product images, descriptions, prices, stock, and delivery details.', icon: PackagePlus, accent: 'bg-blue-100 text-blue-700' },
  { id: 'orders', number: 'Guide 3', title: 'Fulfil your orders', description: 'Review new orders, pack products carefully, arrange delivery, and update order status.', icon: Truck, accent: 'bg-orange-100 text-orange-700' },
  { id: 'growth', number: 'Guide 4', title: 'Grow your shop', description: 'Use promotions and accurate product information to build trust and reach more customers.', icon: BarChart3, accent: 'bg-violet-100 text-violet-700' },
]

const HelpArticlePage = () => {
  const { categoryId, itemIndex } = useParams()
  const { pathname } = useLocation()

  const routeArticleKey = ['how-to-sell', 'payment-methods', 'ecommerce-coins', 'ecommerce-guarantee', 'mall-return-refund', 'return-refund', 'contact-us']
    .find((key) => pathname.includes(key) && !(pathname.includes('mall-return-refund') && key === 'return-refund')) ?? 'how-to-buy'

  const isSellingArticle = routeArticleKey === 'how-to-sell' && !categoryId
  const [expandedSellerGroups, setExpandedSellerGroups] = useState<Set<string>>(new Set(['announcement']))
  const [searchQuery, setSearchQuery] = useState('')
  const article = categoryId && itemIndex
    ? getHelpArticle(categoryId, itemIndex)
    : helpArticles[routeArticleKey]
  const categories = helpCenterContents['help-centre'].categories
  const sidebarGroups: HelpNavigationGroup[] = isSellingArticle
    ? sellerNavigation
    : categories.map((category) => ({
        id: category.id,
        label: category.label,
        items: category.items?.map(({ label: itemLabel }) => ({ label: itemLabel })) ?? [],
      }))
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const articleSearchText = useMemo(() => {
    if (!article) return ''

    const articleText = [
      article.title,
      article.category,
      ...(article.sections.flatMap(({ title, paragraphs = [], steps = [] }) => [title, ...paragraphs, ...steps])),
    ].join(' ')

    return articleText.toLowerCase()
  }, [article])

  const hasSearchMatch = !normalizedQuery || articleSearchText.includes(normalizedQuery)

  if (!article) return null

  const pageTitle = routeArticleKey === 'how-to-sell' ? 'How To Sell' : routeArticleKey === 'how-to-buy' ? 'How To Buy' : 'Help Centre'

  return (
    <div className="min-h-screen bg-white">
      <HelpHeader title={pageTitle} />

      <main className="mx-auto flex max-w-6xl gap-12 bg-white px-5 py-7 sm:px-8">
        <aside className="hidden w-64 shrink-0 md:block">
          <nav aria-label="Help categories" className="space-y-1">
            {sidebarGroups.map(({ id, label, items }) => {
              const isActive = label === article.category
              const isExpanded = isSellingArticle ? expandedSellerGroups.has(id) : isActive

              return (
                <div key={id}>
                  {isSellingArticle ? (
                    <button
                      type="button"
                      onClick={() => setExpandedSellerGroups((current) => {
                        const next = new Set(current)
                        if (next.has(id)) next.delete(id)
                        else next.add(id)
                        return next
                      })}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold ${isExpanded ? 'text-emerald-700' : 'text-gray-800'} hover:text-emerald-700`}
                    >
                      <span>{label}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link to={`/help-centre/article/${id}/0`} className={`flex items-center justify-between px-3 py-3 text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-800'} hover:text-emerald-700`}>
                      <span>{label}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Link>
                  )}
                  {isExpanded && items && (
                    <div className="space-y-2 px-3 pb-3">
                      {items.map((item, itemIndex) => (
                        <Link
                          key={`${id}-${item.label}`}
                          to={`/help-centre/article/${id}/${itemIndex}`}
                          className={`block rounded-sm border border-transparent px-2 py-2 text-sm transition hover:border-emerald-200 hover:bg-emerald-50 ${itemIndex === 2 ? 'text-emerald-700' : 'text-gray-600'} hover:text-emerald-700`}
                        >
                          <span className="block font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl flex-1 text-sm leading-6 text-gray-800">
          {!hasSearchMatch ? (
            <div className="rounded-sm border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              No matching help article found for “{searchQuery}”.
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-2xl font-semibold leading-tight text-gray-900">{article.title}</h2>
              {isSellingArticle ? (
                <>
                  <p className="mb-7">Selling on DNI Shop can seem daunting with the wide range of tools available. Here are four practical guides to take you through the key steps of starting and growing your shop.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sellerGuideCards.map(({ id, number, title, description, icon: Icon, accent }) => (
                      <section key={id} className="border border-gray-200 bg-white p-5 transition hover:border-emerald-600">
                        <div className="mb-4 flex items-center justify-between">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-sm ${accent}`}><Icon className="h-6 w-6" /></div>
                          <span className="text-xs font-semibold uppercase text-gray-500">{number}</span>
                        </div>
                        <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600">{description}</p>
                        <Link to="/help-centre/how-to-sell" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline">Learn more</Link>
                      </section>
                    ))}
                  </div>
                  <p className="mt-8 border-t border-gray-200 pt-6">To learn more after completing these guides, continue with the other DNI Shop seller lessons or contact Customer Service for support.</p>
                </>
              ) : article.sections.map((section, sectionIndex) => (
                <section key={`${section.title ?? 'section'}-${sectionIndex}`} className={`mb-6 ${section.warning ? 'rounded-sm border border-yellow-200 bg-[#fff8e7] px-4 py-3' : ''}`}>
                  {section.title && <h3 className="mb-1 font-semibold text-gray-900">{section.warning ? '⚠️ Note' : section.title}</h3>}
                  {section.paragraphs?.map((paragraph, paragraphIndex) => (
                    <p key={`${section.title ?? 'section'}-${paragraphIndex}`} className="mb-4">{renderRichText(paragraph)}</p>
                  ))}
                  {section.steps && (
                    section.steps.every((step) => paymentMethods.includes(step)) ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {section.steps.map((method) => (
                          <div key={`${method}-icon`} className="flex flex-col items-center gap-2 rounded-sm border border-gray-200 bg-white p-3 text-center">
                            <img src={paymentMethodIcons[method]} alt={`${method} payment`} className="h-16 w-16 object-contain" />
                            <span className="text-sm font-medium text-gray-700">{method}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ol className="list-decimal space-y-4 pl-5">
                        {section.steps.map((step, stepIndex) => <li key={`${section.title ?? 'section'}-${stepIndex}`}>{renderRichText(step)}</li>)}
                      </ol>
                    )
                  )}
                </section>
              ))}

              <section className="mt-10 border-t border-gray-200 pt-7">
                <h3 className="mb-3 text-xl font-semibold text-gray-900">Related Articles</h3>
                <div className="divide-y divide-gray-200 border-y border-gray-200">
                  {article.relatedArticles.map((relatedArticle) => <Link key={relatedArticle} to="/help-centre" className="block px-2 py-4 hover:text-emerald-700">{relatedArticle}</Link>)}
                </div>
              </section>
            </>
          )}
        </article>
      </main>
    </div>
  )
}

export default HelpArticlePage
