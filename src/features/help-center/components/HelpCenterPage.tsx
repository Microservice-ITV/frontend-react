import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import HelpHeader from './common/HelpHeader'
import { helpCenterContents } from '../data/helpCenterData'

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const content = helpCenterContents['help-centre']

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return content.categories

    return content.categories.filter(({ id, label, items }) => {
      const rawText = [id, label, ...(items ?? [])].join(' ').toLowerCase()
      return rawText.includes(normalizedQuery)
    })
  }, [content.categories, normalizedQuery])

  const filteredQuestions = useMemo(() => {
    if (!normalizedQuery) return content.questions

    return content.questions.filter(({ id, label }) => {
      const rawText = `${id} ${label}`.toLowerCase()
      return rawText.includes(normalizedQuery)
    })
  }, [content.questions, normalizedQuery])

  return (
    <div className="min-h-screen bg-white">
      <HelpHeader title="Help Centre" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="border border-yellow-200 bg-[#fff8e7] px-4 py-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-base">⚠</span>
            <p>
              Beware of scams: Never share your personal information, including your account password, One-Time Password (OTP), or Daily Need Items Pay PIN, with anyone. This includes individuals claiming to be Daily Need Items staff. We will never ask for these details. <span className="font-semibold text-emerald-600">Read More</span>
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <h2 className="mb-4 text-base font-semibold uppercase text-gray-500">Categories</h2>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(({ id, label, icon: Icon, accent }) => (
                <Link
                  key={id}
                  to={`/help-centre/article/${id}/0`}
                  className="flex items-center gap-3 border border-[#efefef] bg-white px-4 py-4 transition hover:border-emerald-600 hover:shadow-sm"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-base font-medium text-gray-700">{label}</span>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-sm border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                No matches found for "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <h3 className="mb-5 text-xl font-semibold text-gray-800">Hot Questions</h3>

          <div className="overflow-hidden border border-[#efefef] bg-white">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => (
                <Link
                  key={question.id}
                  to="/help-centre"
                  className="flex w-full items-center justify-between border-b border-[#efefef] px-5 py-4 text-base font-medium text-gray-700 last:border-b-0 hover:bg-gray-50"
                >
                  <span>{question.label}</span>
                </Link>
              ))
            ) : (
              <div className="px-5 py-4 text-sm text-gray-500">
                No help questions match "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpCenterPage