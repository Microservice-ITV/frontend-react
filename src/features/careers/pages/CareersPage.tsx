import { Link } from 'react-router-dom'
import {
  BookOpen,
  Code2,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Megaphone,
  Rocket,
  Smile,
  Store,
  Users,
} from 'lucide-react'
import careersHero from '@/assets/careers/careers.png'

const CULTURE = [
  {
    icon: Lightbulb,
    title: 'Simple',
    description:
      'We keep products clear and decisions practical — so buyers, sellers, and teammates can move fast without the noise.',
  },
  {
    icon: Smile,
    title: 'Happy',
    description:
      'A supportive workplace where people celebrate wins, learn together, and enjoy building something people use every day.',
  },
  {
    icon: HeartHandshake,
    title: 'Together',
    description:
      'Cross-functional teams collaborate closely. Great ideas can come from anyone, and we ship as one team.',
  },
]

const TEAMS = [
  {
    icon: Code2,
    title: 'Engineering & Product',
    description:
      'Build marketplace search, checkout, seller tools, and reliable microservices used by millions.',
  },
  {
    icon: Store,
    title: 'Operations & Seller Success',
    description:
      'Help shops grow — from onboarding and fulfilment to quality, trust, and day-to-day support.',
  },
  {
    icon: Megaphone,
    title: 'Marketing & Growth',
    description:
      'Craft campaigns, flash deals, and brand moments that connect shoppers with great finds.',
  },
  {
    icon: Users,
    title: 'People & Experience',
    description:
      'Shape hiring, learning, and culture so every teammate can do their best work.',
  },
]

const BENEFITS = [
  'Meaningful work on a real marketplace used by buyers and sellers nationwide',
  'Learning culture with mentorship, stretch projects, and skill growth',
  'Collaborative teams across product, design, engineering, and operations',
  'Flexible ways of working and a people-first environment',
  'Clear impact — ship features and see them live for customers quickly',
]

const OPEN_ROLES = [
  {
    title: 'Frontend Engineer',
    team: 'Engineering',
    location: 'Remote / Hybrid',
    type: 'Full-time',
  },
  {
    title: 'Backend Engineer',
    team: 'Engineering',
    location: 'Remote / Hybrid',
    type: 'Full-time',
  },
  {
    title: 'Product Designer',
    team: 'Product',
    location: 'Hybrid',
    type: 'Full-time',
  },
  {
    title: 'Seller Operations Specialist',
    team: 'Operations',
    location: 'On-site',
    type: 'Full-time',
  },
  {
    title: 'Growth Marketing Associate',
    team: 'Marketing',
    location: 'Hybrid',
    type: 'Full-time',
  },
  {
    title: 'Customer Support Lead',
    team: 'Support',
    location: 'On-site',
    type: 'Full-time',
  },
]

const CareersPage = () => {
  return (
    <div className="bg-[#f5f5f5] pb-10">
      {/* Hero — same language as About */}
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
                Ecommerce Careers
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Create impact that lasts
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                Join the team building a marketplace that helps local businesses grow
                and makes everyday shopping simpler for everyone.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#open-roles"
                  className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  View open roles
                </a>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  About Ecommerce
                </Link>
              </div>
            </div>
            <div className="relative hidden overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm lg:block">
              <img
                src={careersHero}
                alt="Life and culture at Ecommerce — teammates collaborating on the marketplace"
                className="h-full w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-6 lg:grid-cols-2 bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Life at Ecommerce
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
              We are builders, operators, and storytellers solving real commerce
              problems. Whether you write code, support sellers, or shape our
              brand, your work helps people buy and sell with confidence.
            </p>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Inspired by how leading marketplaces grow talent, we invest in
              learning, collaboration, and a culture where people feel they
              belong — simple, happy, and together.
            </p>
          </div>
          <div className="relative min-h-[220px] lg:min-h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-6 sm:p-10 flex items-center">
            <div className="w-full rounded-sm border border-emerald-100 bg-white/80 backdrop-blur p-5 sm:p-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Rocket size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Our promise
                </p>
              </div>
              <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                Grow your career while building products that millions of buyers
                and sellers rely on every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            How we work
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            Three attributes guide how we treat customers — and each other.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {CULTURE.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-sm border border-[var(--dni-cart-border)] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-sm sm:text-base font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Teams you can join
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            Explore roles across the functions that power our marketplace.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {TEAMS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 p-1">
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

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <BookOpen size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Why you&apos;ll thrive here
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                What we offer beyond the job title.
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map((item) => (
              <li key={item} className="flex gap-3 text-sm sm:text-base text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Open roles */}
      <section id="open-roles" className="mx-auto max-w-7xl px-4 sm:px-6 mt-8 scroll-mt-28">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Open roles
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sample openings — apply via Media Contact and mention the role title.
          </p>
          <div className="mt-6 divide-y divide-gray-100 border border-[var(--dni-cart-border)] rounded-sm">
            {OPEN_ROLES.map((role) => (
              <div
                key={role.title}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 sm:px-5"
              >
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    {role.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {role.team}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-600" />
                    {role.location}
                  </span>
                  <span className="rounded-sm bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                    {role.type}
                  </span>
                  <a
                    href={`mailto:careers@ecommerce.example?subject=${encodeURIComponent(`Application - ${role.title}`)}`}
                    className="font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Apply
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Don&apos;t see the right role?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Send your CV and a short note about how you&apos;d like to contribute.
            We&apos;d love to hear from you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:careers@ecommerce.example?subject=General%20careers%20enquiry"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Contact careers
            </a>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Learn about us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CareersPage
