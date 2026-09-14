import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { heroBannerApi } from '../api/heroBannerApi'
import { updateHeroBanner } from '../store/heroBannerThunks'
import HeroBannerForm, {
  heroBannerFormSchema,
  type HeroBannerFormValues,
} from '../components/HeroBannerForm'

const EditHeroBannerPage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadingBanner, setLoadingBanner] = useState(true)
  const [initialValues, setInitialValues] = useState<HeroBannerFormValues | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid hero banner id.')
      setLoadingBanner(false)
      return
    }

    let isCancelled = false

    const fetchBanner = async () => {
      setLoadingBanner(true)
      setLoadError('')
      try {
        const response = await heroBannerApi.getById(id)
        const banner = response.data
        if (!banner) {
          if (!isCancelled) {
            setLoadError('Hero banner not found.')
          }
          return
        }

        if (!isCancelled) {
          setExistingImageUrl(banner.imageUrl ?? null)
          setInitialValues({
            sortOrder: String(banner.sortOrder),
            isActive: banner.isActive ? 'true' : 'false',
            image: banner.imageUrl ?? '',
          })
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(error?.response?.data?.message ?? 'Failed to load hero banner.')
        }
      } finally {
        if (!isCancelled) {
          setLoadingBanner(false)
        }
      }
    }

    void fetchBanner()

    return () => {
      isCancelled = true
    }
  }, [id])

  const onSubmit = async ({
    values,
    imageFile,
  }: {
    values: HeroBannerFormValues
    imageFile: File | null
  }) => {
    if (!id) return

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await dispatch(
        updateHeroBanner({
          id,
          payload: {
            sortOrder: Number(values.sortOrder) || 0,
            isActive: values.isActive === 'true',
            ...(imageFile ? { imageFile } : {}),
          },
        }),
      ).unwrap()
      navigate('/super-admin/hero-banners')
    } catch (error: any) {
      const fallback = 'Failed to update hero banner. Please try again.'
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
        <Link to="/super-admin/hero-banners" className="hover:text-slate-700">
          Hero Banners
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Hero Banner</span>
      </nav>

      {loadingBanner && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading hero banner details...
        </div>
      )}

      {!loadingBanner && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingBanner && !loadError && initialValues && (
        <HeroBannerForm
          mode="edit"
          resolver={zodResolver(heroBannerFormSchema)}
          initialValues={initialValues}
          existingImageUrl={existingImageUrl}
          onSubmit={onSubmit}
          submitLabel="Update Hero Banner"
          cancelTo="/super-admin/hero-banners"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  )
}

export default EditHeroBannerPage
