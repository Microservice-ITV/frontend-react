import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { homeFeatureApi } from '../api/homeFeatureApi'
import { updateHomeFeature } from '../store/homeFeatureThunks'
import HomeFeatureForm, {
  homeFeatureFormSchema,
  type HomeFeatureFormValues,
} from '../components/HomeFeatureForm'

const toDateTimeLocal = (value: string | null | undefined): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

const EditHomeFeaturePage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadingFeature, setLoadingFeature] = useState(true)
  const [initialValues, setInitialValues] = useState<HomeFeatureFormValues | null>(null)
  const [existingIconUrl, setExistingIconUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid home feature id.')
      setLoadingFeature(false)
      return
    }

    let isCancelled = false

    const fetchFeature = async () => {
      setLoadingFeature(true)
      setLoadError('')
      try {
        const response = await homeFeatureApi.getById(id)
        const feature = response.data
        if (!feature) {
          if (!isCancelled) {
            setLoadError('Home feature not found.')
          }
          return
        }

        if (!isCancelled) {
          setExistingIconUrl(feature.iconUrl ?? null)
          setInitialValues({
            name: feature.name,
            slug: feature.slug,
            sortOrder: String(feature.sortOrder),
            isActive: feature.isActive ? 'true' : 'false',
            startAt: toDateTimeLocal(feature.startAt),
            endAt: toDateTimeLocal(feature.endAt),
            icon: feature.iconUrl ?? '',
          })
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(error?.response?.data?.message ?? 'Failed to load home feature.')
        }
      } finally {
        if (!isCancelled) {
          setLoadingFeature(false)
        }
      }
    }

    void fetchFeature()

    return () => {
      isCancelled = true
    }
  }, [id])

  const onSubmit = async ({
    values,
    iconFile,
    existingIconUrl,
  }: {
    values: HomeFeatureFormValues
    iconFile: File | null
    existingIconUrl: string | null
  }) => {
    if (!id) return

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await dispatch(
        updateHomeFeature({
          id,
          payload: {
name: values.name.trim(),
            slug: values.slug.trim(),
            sortOrder: Number(values.sortOrder) || 1,
            isActive: values.isActive === 'true',
            startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
            endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
            iconFile: iconFile ?? undefined,
            existingIconUrl,
          },
        }),
      ).unwrap()
      navigate('/super-admin/home-features')
    } catch (error: any) {
      const fallback = 'Failed to update home feature. Please try again.'
      setSubmitError(error?.response?.data?.message ?? error?.message ?? fallback)
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
        <Link to="/super-admin/home-features" className="hover:text-slate-700">
          Home Features
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Home Feature</span>
      </nav>

      {loadingFeature && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading home feature details...
        </div>
      )}

      {!loadingFeature && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingFeature && !loadError && initialValues && (
        <HomeFeatureForm
          mode="edit"
          resolver={zodResolver(homeFeatureFormSchema)}
          initialValues={initialValues}
          existingIconUrl={existingIconUrl}
          onSubmit={onSubmit}
          submitLabel="Update Home Feature"
          cancelTo="/super-admin/home-features"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  )
}

export default EditHomeFeaturePage