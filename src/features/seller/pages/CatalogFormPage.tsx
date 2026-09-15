import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { CatalogEntityConfig } from '../config/catalogEntityConfig'
import CatalogReferenceForm from '../components/CatalogReferenceForm'

type CatalogFormPageProps = {
  config: CatalogEntityConfig
  mode: 'create' | 'edit'
}

const cloneFormValues = (initial?: {
  name?: string
  code?: string
  slug?: string
}) => ({
  name: initial?.name ?? '',
  code: initial?.code ?? '',
  slug: initial?.slug ?? '',
})

const CatalogFormPage = ({ config, mode }: CatalogFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [initialValues, setInitialValues] = useState<{
    name: string
    code: string
    slug: string
  }>(cloneFormValues())
  const [loadingItem, setLoadingItem] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (mode !== 'edit' || !id) {
      setLoadingItem(false)
      return
    }

    let isCancelled = false
    const loadItem = async () => {
      setLoadingItem(true)
      setLoadError('')
      try {
        const response = await config.api.getById(id)
        const item = response.data?.data
        if (isCancelled) return
        if (!item) {
          setLoadError(`${config.labelSingular} not found.`)
          return
        }
        setInitialValues(
          cloneFormValues({
            name: item.name,
            code: item.code,
            slug: item.slug,
          }),
        )
      } catch (err: any) {
        if (isCancelled) return
        setLoadError(
          err?.response?.data?.error?.message ??
            err?.response?.data?.message ??
            `Failed to load ${config.labelSingular.toLowerCase()}.`,
        )
      } finally {
        if (!isCancelled) {
          setLoadingItem(false)
        }
      }
    }

    void loadItem()
    return () => {
      isCancelled = true
    }
  }, [config, mode, id])

  const onSubmit = async (payload: { name: string; code: string; slug?: string }) => {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      if (mode === 'edit') {
        if (!id) return
        await config.api.update(id, payload)
      } else {
        await config.api.create(payload)
      }
      navigate(config.listPath)
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          `Failed to ${mode === 'create' ? 'create' : 'update'} ${config.labelSingular.toLowerCase()}. Please try again.`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to={config.listPath} className="hover:text-slate-700">
          {config.labelPlural}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">
          {mode === 'create' ? `New ${config.labelSingular}` : `Edit ${config.labelSingular}`}
        </span>
      </nav>

      {loadingItem && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading {config.labelSingular.toLowerCase()} details...
        </div>
      )}

      {!loadingItem && loadError && mode === 'edit' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingItem && !loadError && (
        <CatalogReferenceForm
          config={config}
          mode={mode}
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitLabel={mode === 'create' ? `Create ${config.labelSingular}` : `Update ${config.labelSingular}`}
          cancelTo={config.listPath}
          onSubmit={onSubmit}
        />
      )}
    </div>
  )
}

export default CatalogFormPage