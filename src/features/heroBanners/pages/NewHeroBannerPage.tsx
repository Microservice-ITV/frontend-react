import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { createHeroBanner } from '../store/heroBannerThunks'
import HeroBannerForm, {
  heroBannerFormSchema,
  type HeroBannerFormValues,
} from '../components/HeroBannerForm'

const NewHeroBannerPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async ({
    values,
    imageFile,
  }: {
    values: HeroBannerFormValues
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
        createHeroBanner({
          sortOrder: Number(values.sortOrder) || 0,
          isActive: values.isActive === 'true',
          imageFile,
        }),
      ).unwrap()
      navigate('/super-admin/hero-banners')
    } catch (error: any) {
      const fallback = 'Failed to create hero banner. Please try again.'
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
        <span className="text-slate-900">New Hero Banner</span>
      </nav>
      <HeroBannerForm
        mode="create"
        resolver={zodResolver(heroBannerFormSchema)}
        initialValues={{
          sortOrder: '0',
          isActive: 'true',
          image: '',
        }}
        existingImageUrl={null}
        onSubmit={onSubmit}
        submitLabel="Create Hero Banner"
        cancelTo="/super-admin/hero-banners"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewHeroBannerPage
