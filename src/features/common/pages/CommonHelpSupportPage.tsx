import { useState } from 'react'
import { CheckCircle2, FileText, MessageSquare, ChevronDown } from 'lucide-react'
import type { DashboardArea } from '@/features/dashboard/types/dashboardTypes'

type FaqItem = {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I customize the theme colors?',
    answer: 'Go to Settings and choose your preferred primary and accent colors.',
  },
  {
    question: 'How do I add a new page to the dashboard?',
    answer: 'Create a page component, add it to routes, then update the dashboard menu config.',
  },
  {
    question: 'Can I use this template with a backend?',
    answer: 'Yes. You can connect the UI to any backend API using fetch or axios.',
  },
  {
    question: 'How do I deploy to production?',
    answer: 'Run a production build and deploy the generated static files to your hosting provider.',
  },
  {
    question: 'Is dark mode supported?',
    answer: 'Dark mode support can be added by extending your Tailwind theme tokens.',
  },
]

type CommonHelpSupportPageProps = {
  area: DashboardArea
}

const CommonHelpSupportPage = ({ area }: CommonHelpSupportPageProps) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const title = area === 'super_admin' ? 'Admin Help & Support' : 'Help & Support'
  const subtitle =
    area === 'super_admin'
      ? 'Get support for platform administration and operations.'
      : 'Get help and find answers to common questions.'

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">System Status</p>
            <p className="text-xs text-emerald-600">All systems operational.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
            <FileText size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Documentation</p>
            <p className="text-xs text-slate-600">Browse guides and API docs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg bg-cyan-100 p-2 text-cyan-600">
            <MessageSquare size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Live Chat</p>
            <p className="text-xs text-slate-600">Coming soon</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="mt-1 text-xs text-slate-600">Quick answers to common questions</p>
          <div className="mt-4 divide-y divide-slate-100">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div key={item.question} className="py-2">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 py-2 text-left"
                  >
                    <span className="text-sm font-medium text-slate-900">{item.question}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-2 pr-6 text-xs text-slate-600">{item.answer}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold text-slate-900">Contact Support</h2>
          <p className="mt-1 text-xs text-slate-600">Send us a message and we&apos;ll get back to you</p>
          <form className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Subject</label>
              <input
                type="text"
                placeholder="What&apos;s this about?"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your issue or question..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default CommonHelpSupportPage