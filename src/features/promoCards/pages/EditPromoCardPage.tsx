import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { promoCardApi } from '../api/promoCardApi'
import { updatePromoCard } from '../store/promoCardThunks'
import PromoCardForm, {
  promoCardFormSchema,
  type PromoCardFormValues,
} from '../components/PromoCardForm'

const EditPromoCardPage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadingCard, setLoadingCard] = useState(true)
  const [initialValues, setInitialValues] = useState<PromoCardFormValues | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid promo banner id.')
      setLoadingCard(false)
      return
    }

    let isCancelled = false

    const fetchCard = async () => {
      setLoadingCard(true)
      setLoadError('')
      try {
        const response = await promoCardApi.getById(id)
        const card = response.data
        if (!card) {
          if (!isCancelled) {
            setLoadError('Promo banner not found.')
          }
          return
        }

        if (!isCancelled) {
          setExistingImageUrl(card.imageUrl ?? null)
          setInitialValues({
            position: card.position as 'TOP' | 'BOTTOM',
            isActive: card.isActive ? 'true' : 'false',
            image: card.imageUrl ?? '',
          })
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(error?.response?.data?.error?.message ?? error?.response?.data?.message ?? 'Failed to load promo banner.')
        }
      } finally {
        if (!isCancelled) {
          setLoadingCard(false)
        }
      }
    }

    void fetchCard()

    return () => {
      isCancelled = true
    }
  }, [id])

  const onSubmit = async ({
    values,
    imageFile,
  }: {
    values: PromoCardFormValues
    imageFile: File | null
  }) => {
    if (!id) return

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await dispatch(
        updatePromoCard({
          id,
          payload: {
            position: values.position,
            isActive: values.isActive === 'true',
            imageFile: imageFile ?? undefined,
          },
        }),
      ).unwrap()
      navigate('/super-admin/promo-banners')
    } catch (error: any) {
      const fallback = 'Failed to update promo banner. Please try again.'
      setSubmitError(
        typeof error === 'string'
          ? error
          : error?.response?.data?.error?.message ??
              error?.response?.data?.message ??
              error?.message ??
              fallback,
      )
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
        <Link to="/super-admin/promo-banners" className="hover:text-slate-700">
          Promo Banners
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Promo Banner</span>
      </nav>

      {loadingCard && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading promo banner details...
        </div>
      )}

      {!loadingCard && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingCard && !loadError && initialValues && (
        <PromoCardForm
          mode="edit"
          resolver={zodResolver(promoCardFormSchema)}
          initialValues={initialValues}
          existingImageUrl={existingImageUrl}
          onSubmit={onSubmit}
          submitLabel="Update Promo Banner"
          cancelTo="/super-admin/promo-banners"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  )
}

export default EditPromoCardPage
