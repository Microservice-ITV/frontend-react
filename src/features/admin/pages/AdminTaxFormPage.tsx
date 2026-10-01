import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { categoryApi } from '@/features/categories/api/categoryApi'
import type { Category } from '@/features/categories/types/categoryTypes'
import { adminTaxApi, type TaxCharge } from '../api/adminTaxApi'

type TaxFormPageProps = {
  mode: 'create' | 'edit'
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const loadCatalogCategories = async () => {
  const rows: Category[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const response = await categoryApi.getPage(page)
    const body = response.data
    rows.push(...(body.data ?? body.items ?? []))
    totalPages = body.pagination?.totalPages ?? 1
    page += 1
  }
  return rows
    .filter((category) => category.isActive !== false && category.id && category.name)
    .sort((left, right) => left.name.localeCompare(right.name))
}

const AdminTaxFormPage = ({ mode }: TaxFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([])
  const [taxes, setTaxes] = useState<TaxCharge[]>([])
  const [rate, setRate] = useState('5')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [categories, existingTaxes] = await Promise.all([
          loadCatalogCategories(),
          adminTaxApi.listTaxes(),
        ])
        if (cancelled) return
        setCatalogCategories(categories)
        setTaxes(existingTaxes)
        if (mode === 'edit') {
          const tax = existingTaxes.find((item) => item.id === id)
          if (!tax) {
            setLoadError('Tax not found.')
            return
          }
          setRate(String(tax.rate))
          setSelectedCategoryIds(tax.categories.map((category) => category.categoryId))
        }
      } catch (error: unknown) {
        if (!cancelled) setLoadError(errorMessage(error, 'Failed to load tax form.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [mode, id])

  const ownerByCategory = useMemo(() => {
    const owners = new Map<string, string>()
    for (const tax of taxes) {
      if (tax.id === id) continue
      for (const category of tax.categories) {
        owners.set(category.categoryId, `${tax.rate}%`)
      }
    }
    return owners
  }, [taxes, id])

  const categoryOptions = catalogCategories.map((category) => {
    const owner = ownerByCategory.get(category.id)
    return {
      value: category.id,
      label: owner ? `${category.name} (${owner})` : category.name,
      disabled: selectedCategoryIds.includes(category.id),
    }
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError('')
    const parsedRate = Number(rate)
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setSubmitError('Rate must be a number from 0 to 100.')
      return
    }
    const categories = catalogCategories
      .filter((category) => selectedCategoryIds.includes(category.id))
      .map((category) => ({ categoryId: category.id, categoryName: category.name }))
    if (categories.length === 0) {
      setSubmitError('Select at least one category.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'edit') {
        if (!id) {
          setSubmitError('Invalid tax id.')
          return
        }
        await adminTaxApi.updateTax(id, {
          rate: parsedRate,
          isActive: true,
          categories,
        })
      } else {
        await adminTaxApi.createTax({
          rate: parsedRate,
          categories,
        })
      }
      navigate('/super-admin/tax')
    } catch (error: unknown) {
      setSubmitError(errorMessage(error, 'Could not save tax.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/tax" className="hover:text-slate-700">
          Tax
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{mode === 'create' ? 'New tax' : 'Edit tax'}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading tax...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link
            to="/super-admin/tax"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Back to list
          </Link>
        </div>
      )}

      {!loading && !loadError && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate('/super-admin/tax')}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to taxes
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === 'create' ? 'New tax' : 'Edit tax'}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Choose product categories for this rate. A category belongs to one tax.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/super-admin/tax')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create tax' : 'Save changes'}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tax-rate" className={labelClass}>
                  Rate (%)
                </label>
                <input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="tax-category" className={labelClass}>
                  Categories
                </label>
                <div className="mt-1">
                  <SearchableSelect
                    id="tax-category"
                    value=""
                    onChange={(categoryId) => {
                      if (!categoryId || selectedCategoryIds.includes(categoryId)) return
                      setSelectedCategoryIds((current) => [...current, categoryId])
                    }}
                    options={categoryOptions}
                    mode="search-and-scroll"
                    emptyLabel="Select category"
                    placeholder="Search categories…"
                  />
                </div>
                {selectedCategoryIds.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {selectedCategoryIds.map((categoryId) => {
                      const category = catalogCategories.find((item) => item.id === categoryId)
                      return (
                        <li
                          key={categoryId}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
                        >
                          {category?.name ?? categoryId}
                          <button
                            type="button"
                            className="text-slate-500"
                            onClick={() =>
                              setSelectedCategoryIds((current) => current.filter((item) => item !== categoryId))
                            }
                            aria-label={`Remove ${category?.name ?? 'category'}`}
                          >
                            ×
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/super-admin/tax')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create tax' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminTaxFormPage
