import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { createHomeFeature } from '../store/homeFeatureThunks'
import HomeFeatureForm, {
  homeFeatureFormSchema,
  type HomeFeatureFormValues,
} from '../components/HomeFeatureForm'

const NewHomeFeaturePage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async ({
    values,
    iconFile,
    existingIconUrl,
  }: {
    values: HomeFeatureFormValues
    iconFile: File | null
    existingIconUrl: string | null
  }) => {
    setSubmitError('')

    if (!iconFile) {
      setSubmitError('Please choose an icon image for the home feature.')
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createHomeFeature({
          name: values.name.trim(),
          slug: values.slug.trim(),
          sortOrder: Number(values.sortOrder) || 1,
          isActive: values.isActive === 'true',
          startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
          endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
          iconFile,
          existingIconUrl,
        }),
      ).unwrap()
      navigate('/super-admin/home-features')
    } catch (error: any) {
      const fallback = 'Failed to create home feature. Please try again.'
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
        <span className="text-slate-900">New Home Feature</span>
      </nav>
      <HomeFeatureForm
        mode="create"
        resolver={zodResolver(homeFeatureFormSchema)}
        initialValues={{
          name: '',
          slug: '',
          sortOrder: '1',
          isActive: 'true',
          startAt: '',
          endAt: '',
          icon: '',
        }}
        existingIconUrl={null}
        onSubmit={onSubmit}
        submitLabel="Create Home Feature"
        cancelTo="/super-admin/home-features"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewHomeFeaturePage