import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  fetchAnnouncementTypeById,
  updateAnnouncementType,
} from '../store/announcementTypeThunks'
import {
  selectAnnouncementTypesLoading,
  selectSelectedAnnouncementType,
} from '../store/announcementTypeSelectors'
import {
  AnnouncementTypeForm,
  announcementTypeFormSchema,
  type AnnouncementTypeFormValues,
} from '../components/AnnouncementTypeForm'
import { AnnouncementTypeElementsManager } from '../components/AnnouncementTypeElementsManager'

const EditAnnouncementTypePage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()

  const type = useAppSelector(selectSelectedAnnouncementType)
  const loading = useAppSelector(selectAnnouncementTypesLoading)

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchAnnouncementTypeById(id))
    }
  }, [id, dispatch])

  const onSubmit = async ({ values }: { values: AnnouncementTypeFormValues }) => {
    if (!type) return

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await dispatch(
        updateAnnouncementType({
          id: type.id,
          payload: {
            name: values.name.trim(),
            code: values.code.trim(),
            description: values.description.trim() || null,
            isActive: values.isActive === 'true',
          },
        })
      ).unwrap()
    } catch (error: any) {
      const fallback = 'Failed to update announcement type. Please try again.'
      setSubmitError(
        typeof error === 'string'
          ? error
          : error?.response?.data?.message ??
              error?.response?.data?.error?.message ??
              error?.message ??
              fallback
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
        <Link to="/super-admin/announcement-types" className="hover:text-slate-700">
          Announcement Types
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Announcement Type</span>
      </nav>

      {loading && !type && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading announcement type details...
        </div>
      )}

      {!loading && !type && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Announcement type not found.
        </div>
      )}

      {!loading && type && (
        <AnnouncementTypeForm
          mode="edit"
          resolver={zodResolver(announcementTypeFormSchema)}
          initialValues={{
            name: type.name,
            code: type.code,
            description: type.description ?? '',
            isActive: type.isActive ? 'true' : 'false',
          }}
          onSubmit={onSubmit}
          submitLabel="Update Announcement Type"
          cancelTo="/super-admin/announcement-types"
          isSubmitting={isSubmitting}
          submitError={submitError}
        >
          <AnnouncementTypeElementsManager typeId={type.id} elements={type.elements} />
        </AnnouncementTypeForm>
      )}
    </div>
  )
}

export default EditAnnouncementTypePage