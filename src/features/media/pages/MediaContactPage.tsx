import { Link } from 'react-router-dom'
import {
  Camera,
  FileText,
  Mail,
  Megaphone,
  Mic,
  Newspaper,
  Send,
  Users,
} from 'lucide-react'

const PRESS_EMAIL = "dailyneeditem@gmail.com";

const MEDIA_TOPICS = [
  {
    icon: Newspaper,
    title: 'Press & news coverage',
    description:
      'Stories about Ecommerce, marketplace trends, and product features for your publication.',
  },
  {
    icon: Mic,
    title: 'Interviews & comments',
    description:
      'Speak with our team for expert commentary, founder stories, and category insights.',
  },
  {
    icon: Camera,
    title: 'Photo & branding assets',
    description:
      'Request official logos, product imagery, and brand guidelines for your article.',
  },
  {
    icon: Megaphone,
    title: 'Partnerships & campaigns',
    description:
      'Explore co-marketing opportunities, campaign updates, and sponsored content ideas.',
  },
]

const PRESS_RELEASES = [
  {
    date: '10 Sep 2026',
    title: 'Ecommerce launches new Seller Mentors programme',
    summary:
      'The programme pairs new shops with experienced sellers to help them grow with practical, step-by-step guidance.',
  },
  {
    date: '28 Aug 2026',
    title: 'Ecommerce expands Flash Deals to hourly sessions',
    summary:
      'Shoppers can now catch fresh discounted offers every hour with live countdown timers for limited windows.',
  },
  {
    date: '15 Jul 2026',
    title: 'Ecommerce Mall welcomes new official brand partners',
    summary:
      'Verified brand owners and authorised distributors join the Mall to offer shoppers authentic products.',
  },
]

const PRESS_KIT = [
  {
    icon: FileText,
    title: 'Brand fact sheet',
    detail: 'Company overview, key numbers, and milestone highlights.',
  },
  {
    icon: Camera,
    title: 'Logo kit',
    detail: 'Official logo files for web and print in multiple formats.',
  },
  {
    icon: Users,
    title: 'Spokesperson directory',
    detail: 'Team contacts and topic areas for interview requests.',
  },
]

const MediaContactPage = () => {
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
                Media Contact
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Talk to the Ecommerce press team
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                For journalists, analysts, and creators: we&apos;re happy to share
                news, data, imagery, or arrange interviews. Reach us directly by
                email and we&apos;ll get back to you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${PRESS_EMAIL}?subject=${encodeURIComponent('Media enquiry')}`}
                  className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Mail size={18} />
                  Email the press team
                </a>
                <a
                  href="#press-releases"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Latest press releases
                </a>
              </div>
            </div>

            {/* Contact card */}
            <div className="rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 text-emerald-600">
                <Send size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Media & press contact
                </p>
              </div>
              <a
                href={`mailto:${PRESS_EMAIL}`}
                className="mt-5 inline-flex items-center gap-3 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-100"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-600 text-white">
                  <Mail size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-emerald-700">
                    {PRESS_EMAIL}
                  </span>
                  <span className="block text-xs text-gray-500">
                    Email us anytime — responses within 2–3 business days
                  </span>
                </span>
              </a>
              <p className="mt-5 text-sm text-gray-600 leading-relaxed">
                Please include your publication or organisation, the topic of your
                request, and your deadline. It helps us route your enquiry to the
                right person faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Media topics */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            What can we help you with?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Common ways the press team can assist your story.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MEDIA_TOPICS.map(({ icon: Icon, title, description }) => (
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

      {/* Press releases */}
      <section
        id="press-releases"
        className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 scroll-mt-28"
      >
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="border-b border-[var(--dni-cart-border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Latest press releases
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Recent announcements from the Ecommerce team.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {PRESS_RELEASES.map((release) => (
              <li key={release.title} className="px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded-sm bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    {release.date}
                  </span>
                </div>
                <a
                  href={`mailto:${PRESS_EMAIL}?subject=${encodeURIComponent(`Press: ${release.title}`)}`}
                  className="mt-2 block text-sm sm:text-base font-semibold text-gray-900 hover:text-emerald-700 transition-colors"
                >
                  {release.title}
                </a>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {release.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Press kit */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Press kit
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Background material to help you cover Ecommerce accurately.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PRESS_KIT.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="rounded-sm border border-[var(--dni-cart-border)] bg-[#fafafa] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                  <Icon size={20} strokeWidth={1.75} />
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
          <p className="mt-5 text-sm text-gray-600">
            Request any part of the press kit by emailing{' '}
            <a
              href={`mailto:${PRESS_EMAIL}`}
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              {PRESS_EMAIL}
            </a>
            . Please confirm the deadline and intended use.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Mail size={22} />
          </div>
          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">
            Let&apos;s tell your story together
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Whether it&apos;s a product update, a data point, or a deep-dive on how
            Ecommerce works — the press team is here to help.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${PRESS_EMAIL}?subject=${encodeURIComponent('Media enquiry')}`}
              className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Mail size={18} />
              Contact media
            </a>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              About Ecommerce
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MediaContactPage