import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  Handshake,
  LineChart,
  Megaphone,
  MessageSquare,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import sellerMentorHero from '@/assets/seller-mentor/seller-mentor.png'

const MENTOR_BENEFITS = [
  {
    icon: GraduationCap,
    title: 'Learn from proven sellers',
    description:
      'Get practical guidance from sellers who have already built successful shops on Ecommerce.',
  },
  {
    icon: TrendingUp,
    title: 'Grow faster with less guesswork',
    description:
      'Skip common early mistakes by following playbooks that are known to work on real shops.',
  },
  {
    icon: Users,
    title: 'Join a seller community',
    description:
      'Connect with peers and mentors who share tips, answer questions, and keep you motivated.',
  },
  {
    icon: Award,
    title: 'Earn recognition',
    description:
      'Receive badges and endorsement opportunities as you complete milestones with your mentor.',
  },
  {
    icon: Compass,
    title: 'Clear milestones that matter',
    description:
      'Work through structured milestones covering listings, fulfilment, marketing, and finance.',
  },
  {
    icon: Handshake,
    title: 'One-to-one and group sessions',
    description:
      'Book personalised sessions alongside group workshops for a balanced learning experience.',
  },
]

const PROGRAM_STEPS = [
  {
    title: 'Share your seller profile',
    detail:
      'Tell us about your shop, experience level, and the goals you want to reach so we can match you well.',
  },
  {
    title: 'Get matched with a mentor',
    detail:
      'We pair you with an experienced seller whose strengths and niche fit what your shop needs most.',
  },
  {
    title: 'Follow a learning roadmap',
    detail:
      'Work through practical milestones together, covering products, orders, marketing, and insights.',
  },
  {
    title: 'Apply, review, and level up',
    detail:
      'Put your mentor’s advice into action, review the results, and keep growing as your shop scales.',
  },
]

const MENTOR_TOPICS = [
  {
    icon: Target,
    title: 'Why sellers mentor',
    description:
      'Experienced sellers give back by helping newer shops avoid common pitfalls and reach buyers sooner.',
  },
  {
    icon: BookOpen,
    title: 'What mentors share',
    description:
      'Listing quality, pricing, fulfilment habits, campaign strategy, and how to read business insights.',
  },
  {
    icon: LineChart,
    title: 'How mentorship stays relevant',
    description:
      'Mentors keep up with Ecommerce tools and marketplace trends so advice reflects how selling works today.',
  },
]

const SellerMentorsPage = () => {
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
                Seller Mentors
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Learn to sell from sellers who already do it
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                Your shop is unique — so is the guidance you need. Seller Mentors
                pairs new sellers with experienced sellers who share practical,
                step-by-step advice for growing a real business on Ecommerce.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/become-a-seller"
                  className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Start selling
                </Link>
                <Link
                  to="/seller-centre"
                  className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Visit Seller Centre
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm">
              <img
                src={sellerMentorHero}
                alt="Experienced seller mentoring a new seller inside Seller Mentors"
                className="h-full w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why mentors */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Why seller mentorship?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Build confidence and momentum with guidance tailored to your shop.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MENTOR_BENEFITS.map(({ icon: Icon, title, description }) => (
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

      {/* What is Seller Mentors */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                What is Seller Mentors?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                A guided path from first listing to lasting growth.
              </p>
              <p className="mt-6 text-sm text-gray-600 leading-relaxed">
                Seller Mentors connects new and growing shops with experienced
                sellers who know what it takes to succeed on Ecommerce. Instead
                of figuring everything out alone, you follow a structured
                roadmap with someone who has already done it.
              </p>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Whether you are opening your first shop or scaling a growing
                catalogue, your mentor helps you prioritise, avoid mistakes, and
                measure what is actually working.
              </p>
            </div>
            <div className="rounded-sm border border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 sm:p-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <Rocket size={22} strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Built with your growth in mind
                </p>
              </div>
              <p className="mt-3 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                Practical, friendly guidance that turns shop goals into everyday
                wins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            How the program works
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Four simple steps from matching to real growth.
          </p>
          <ul className="mt-6 space-y-4">
            {PROGRAM_STEPS.map((step, index) => (
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

      {/* Mentor topics */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {MENTOR_TOPICS.map(({ icon: Icon, title, description }) => (
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Ready to grow with a mentor?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Open your shop, meet your mentor, and start turning advice into
            sales.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
              Explore Seller Centre
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SellerMentorsPage