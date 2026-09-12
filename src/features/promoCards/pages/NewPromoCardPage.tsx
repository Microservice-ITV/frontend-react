import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { createPromoCard } from '../store/promoCardThunks'
import PromoCardForm, {
  promoCardFormSchema,
  type PromoCardFormValues,
} from '../components/PromoCardForm'

const NewPromoCardPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async ({
    values,
    imageFile,
  }: {
    values: PromoCardFormValues
    imageFile: File | null
  }) => {
    setSubmitError('')

    if (!imageFile) {
      setSubmitError('Please choose a banner image.')
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createPromoCard({
          position: values.position,
          isActive: values.isActive === 'true',
          imageFile,
        }),
      ).unwrap()
      navigate('/super-admin/promo-banners')
    } catch (error: any) {
      const fallback = 'Failed to create promo banner. Please try again.'
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
        <span className="text-slate-900">New Promo Banner</span>
      </nav>
      <PromoCardForm
        mode="create"
        resolver={zodResolver(promoCardFormSchema)}
        initialValues={{
          position: '' as any,
          isActive: 'true',
          image: '',
        }}
        existingImageUrl={null}
        onSubmit={onSubmit}
        submitLabel="Create Promo Banner"
        cancelTo="/super-admin/promo-banners"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewPromoCardPage
