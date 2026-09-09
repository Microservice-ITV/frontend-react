import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, Store, Tag } from 'lucide-react'
import featuredSmartShopping from '@/assets/blog/blog-featured-smart-shopping.png'

type BlogCategory = 'All' | 'Shopping Tips' | 'Seller Guides' | 'Deals & Campaigns' | 'Company'

type BlogPost = {
  id: string
  title: string
  excerpt: string
  category: Exclude<BlogCategory, 'All'>
  date: string
  readTime: string
  featured?: boolean
  image?: string
  paragraphs: string[]
  tips?: string[]
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'smart-shopping-habits',
    title: '5 smart habits for shopping with confidence on Ecommerce',
    excerpt:
      'From checking seller ratings to saving favourites — simple habits that help you buy with peace of mind.',
    category: 'Shopping Tips',
    date: '1 Sep 2026',
    readTime: '4 min read',
    featured: true,
    image: featuredSmartShopping,
    paragraphs: [
      'Online shopping is easiest when you know what to look for. Whether you are browsing fashion, gadgets, or everyday essentials, a few habits go a long way toward better purchases and fewer surprises.',
      'Start by reviewing seller ratings, recent reviews, and shop response history. Reputable sellers tend to answer questions clearly and ship on time. If something looks off — unusually low prices, vague photos, or incomplete descriptions — pause and compare similar listings.',
      'Use favourites and your cart to shortlist items while you compare prices and delivery options. When you are ready, chat with the seller for sizing, stock, or bundle questions. After your order arrives, rate the experience so other buyers can shop smarter too.',
    ],
    tips: [
      'Check seller ratings and recent buyer reviews before you buy',
      'Save items to favourites or cart while you compare options',
      'Use chat to clarify product details before placing an order',
      'Inspect your parcel promptly and use return flows when eligible',
      'Leave honest ratings to help the community',
    ],
  },
  {
    id: 'list-your-first-product',
    title: 'Listing your first product: a clear checklist for new sellers',
    excerpt:
      'Strong photos, accurate titles, and complete details help shoppers decide faster — and reduce unnecessary enquiries.',
    category: 'Seller Guides',
    date: '28 Aug 2026',
    readTime: '5 min read',
    paragraphs: [
      'Your first listing sets the tone for your shop. Shoppers decide in seconds whether a product feels trustworthy, so clarity beats clutter every time.',
      'Use bright, honest cover photos and add extra angles or a short video when you can. Write a product name that matches what buyers search for, then use the description to highlight benefits, materials, sizing, and what’s in the box.',
      'Pick the right category, set accurate stock and variations, and double-check shipping options. When listings are complete, buyers ask fewer questions and convert more confidently.',
    ],
    tips: [
      'Upload a clear cover image plus supporting photos',
      'Write search-friendly titles and benefit-led descriptions',
      'Choose the correct category and fill required attributes',
      'Keep stock, price, and variations up to date',
    ],
  },
  {
    id: 'sell-better-with-vouchers',
    title: '7 practical ways to sell better and grow your shop',
    excerpt:
      'Vouchers, campaigns, and sharper listings can lift visibility and help turn visitors into orders.',
    category: 'Seller Guides',
    date: '20 Aug 2026',
    readTime: '6 min read',
    paragraphs: [
      'Getting traffic is only half the story — converting browsers into buyers is where shops grow. Small, consistent improvements often beat one-off bursts of effort.',
      'Refresh weak listings with better photos and clearer benefits. Join marketplace campaigns when they fit your margins. Create shop vouchers with sensible minimum spends to encourage larger baskets. Reply to chats quickly, fulfil on time, and watch which products actually convert so you can double down on winners.',
    ],
    tips: [
      'Improve photos and descriptions on underperforming listings',
      'Join relevant campaigns and flash deal slots when margins allow',
      'Offer shop or product vouchers with clear rules',
      'Track best sellers and promote them more often',
      'Keep chat response times and fulfilment strong',
    ],
  },
  {
    id: 'flash-deals-explained',
    title: 'How flash deals work for buyers and sellers',
    excerpt:
      'Limited-time offers create urgency for shoppers and a focused boost for shops ready to fulfil quickly.',
    category: 'Deals & Campaigns',
    date: '12 Aug 2026',
    readTime: '3 min read',
    paragraphs: [
      'Flash deals highlight selected products for a short window at promotional prices. Buyers get timed savings; sellers get a burst of visibility when stock and operations are ready.',
      'As a buyer, watch deal timers, compare the final price after vouchers, and check delivery estimates before you checkout. As a seller, prepare stock, packaging, and chat coverage before a campaign starts so a spike in orders stays smooth.',
    ],
  },
  {
    id: 'buyer-protection-basics',
    title: 'Buyer protection basics: returns, refunds, and what to do next',
    excerpt:
      'Know when you can request help if an item is missing, damaged, or not as described.',
    category: 'Shopping Tips',
    date: '5 Aug 2026',
    readTime: '4 min read',
    paragraphs: [
      'Most orders arrive without issues. When something goes wrong — late delivery, a damaged parcel, or a product that differs from the listing — Ecommerce provides return and refund flows through My Orders.',
      'Act within the stated window, upload clear evidence when asked, and keep communication on-platform. Approved refunds typically return to your original payment method after review. For full rules, see our Policies and related help pages.',
    ],
  },
  {
    id: 'inside-ecommerce-2026',
    title: 'Inside Ecommerce: building a marketplace people use every day',
    excerpt:
      'A quick look at how we think about simple shopping, seller tools, and trustworthy delivery.',
    category: 'Company',
    date: '1 Aug 2026',
    readTime: '3 min read',
    paragraphs: [
      'Ecommerce exists to make everyday buying and selling simpler — clear discovery, reliable checkout, and logistics partners you can track.',
      'We keep investing in seller tools, buyer protection, and a shopping experience that feels calm rather than crowded. Follow the blog for product updates, shopping tips, and stories from across our marketplace.',
    ],
  },
]

const CATEGORIES: BlogCategory[] = [
  'All',
  'Shopping Tips',
  'Seller Guides',
  'Deals & Campaigns',
  'Company',
]

const BlogPage = () => {
  const [category, setCategory] = useState<BlogCategory>('All')
  const [openId, setOpenId] = useState<string | null>(
    BLOG_POSTS.find((p) => p.featured)?.id ?? BLOG_POSTS[0]?.id ?? null,
  )
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BLOG_POSTS.filter((post) => {
      const matchesCategory = category === 'All' || post.category === category
      if (!matchesCategory) return false
      if (!q) return true
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.paragraphs.some((p) => p.toLowerCase().includes(q))
      )
    })
  }, [category, query])

  const featured = BLOG_POSTS.find((p) => p.featured)

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
            Ecommerce Blog
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
            Tips, guides, and marketplace stories
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
            Shopping advice, seller playbooks, and campaign updates — written
            for everyday buyers and growing shops.
          </p>
          <div className="mt-8 max-w-xl">
            <label htmlFor="blog-search" className="sr-only">
              Search blog
            </label>
            <input
              id="blog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
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
              <Lightbulb size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Shopping Tips</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Buy smarter with ratings, chat, and protection basics.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Store size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Seller Guides</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                List better, convert more, and grow your shop.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Tag size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Deals & Campaigns</p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                How flash deals and promotions work on Ecommerce.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
          <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white overflow-hidden">
            <div className="grid md:grid-cols-[1.1fr_1fr]">
              <div className="bg-gradient-to-br from-emerald-100 via-emerald-50 to-white px-6 py-10 sm:px-8 sm:py-12 flex flex-col justify-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Featured
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {featured.excerpt}
                </p>
                <p className="mt-4 text-xs text-gray-500">
                  {featured.date} · {featured.readTime} · {featured.category}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('All')
                    setOpenId(featured.id)
                    document.getElementById('blog-articles')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                  className="mt-6 inline-flex w-fit cursor-pointer items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Read article
                </button>
              </div>
              <div className="relative hidden md:block min-h-[260px] border-l border-[var(--dni-cart-border)] bg-[#fafafa]">
                {featured.image ? (
                  <img
                    src={featured.image}
                    alt="Person shopping online with phone, bag, and parcel"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category filters */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`cursor-pointer rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </section>

      {/* Article list */}
      <section
        id="blog-articles"
        className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 scroll-mt-28"
      >
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="border-b border-[var(--dni-cart-border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Latest articles
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} article{filtered.length === 1 ? '' : 's'}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="px-5 py-8 sm:px-6 text-sm text-gray-500">
              No articles match your filters. Try another category or keyword.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((post) => {
                const isOpen = openId === post.id
                return (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : post.id)}
                      className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 sm:px-6 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {post.date} · {post.readTime}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm sm:text-base font-medium text-gray-900">
                          {post.title}
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                      <span
                        className={`mt-1 shrink-0 text-xs font-semibold ${isOpen ? 'text-emerald-600' : 'text-gray-400'}`}
                      >
                        {isOpen ? 'Hide' : 'Read'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-50 bg-[#fafafa] px-5 py-5 sm:px-6 sm:py-6">
                        <div className="max-w-3xl space-y-3">
                          {post.paragraphs.map((p) => (
                            <p
                              key={p.slice(0, 48)}
                              className="text-sm text-gray-600 leading-relaxed"
                            >
                              {p}
                            </p>
                          ))}
                          {post.tips && (
                            <ul className="space-y-2 pt-1">
                              {post.tips.map((tip) => (
                                <li
                                  key={tip}
                                  className="flex gap-2 text-sm text-gray-600"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                                  <span className="leading-relaxed">{tip}</span>
                                </li>
                              ))}
                            </ul>
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
            Ready to put tips into action?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Start shopping, grow your shop, or browse marketplace policies.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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

export default BlogPage
