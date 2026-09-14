import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchAnnouncementTypes } from '../store/announcementTypeThunks'
import { selectAnnouncementTypes, selectAnnouncementTypesLoading } from '../store/announcementTypeSelectors'
import { fetchAnnouncementById, updateAnnouncement } from '../store/announcementThunks'
import {
  selectAnnouncementsLoading,
  selectSelectedAnnouncement,
} from '../store/announcementSelectors'
import {
  AnnouncementForm,
  announcementFormSchema,
  toDateTimeLocal,
  type AnnouncementFormSubmitPayload,
} from '../components/AnnouncementForm'

import type { AnnouncementElementInput } from '../types/announcementTypes'

const EditAnnouncementPage = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const announcement = useAppSelector(selectSelectedAnnouncement)
  const announcementLoading = useAppSelector(selectAnnouncementsLoading)

  const availableTypes = useAppSelector(selectAnnouncementTypes)
  const typesLoading = useAppSelector(selectAnnouncementTypesLoading)

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchAnnouncementById(id))
    }
  }, [id, dispatch])

  useEffect(() => {
    if (availableTypes.length === 0) {
      dispatch(fetchAnnouncementTypes())
    }
  }, [dispatch, availableTypes.length])

  const onSubmit = async ({ values, elements }: AnnouncementFormSubmitPayload) => {
    if (!announcement) return

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await dispatch(
        updateAnnouncement({
          id: announcement.id,
          payload: {
            name: values.name.trim(),
            status: values.status,
            startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
            endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
            priority: Number(values.priority),
            elements: elements as AnnouncementElementInput[],
          },
        })
      ).unwrap()
      navigate('/super-admin/announcements')
    } catch (error: any) {
      const fallback = 'Failed to update announcement. Please try again.'
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

  const isLoading = announcementLoading && !announcement

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/announcements" className="hover:text-slate-700">
          Announcements
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Announcement</span>
      </nav>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading announcement details...
        </div>
      )}

      {!isLoading && !announcement && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Announcement not found.
        </div>
      )}

      {!isLoading && announcement && (
        <AnnouncementForm
          mode="edit"
          resolver={zodResolver(announcementFormSchema)}
          initialValues={{
            name: announcement.name,
            announcementTypeId:
              announcement.announcementTypeId || announcement.announcementType?.id || '',
            status: announcement.status,
            startAt: toDateTimeLocal(announcement.startAt),
            endAt: toDateTimeLocal(announcement.endAt),
            priority: String(announcement.priority),
          }}
          initialElements={(announcement.elements ?? []).map((element) => ({
            announcementTypeElementId: element.announcementTypeElementId,
            text: element.text,
            textColor: element.textColor,
            backgroundColor: element.backgroundColor,
          }))}
          availableTypes={availableTypes}
          typesLoading={typesLoading}
          onSubmit={onSubmit}
          submitLabel="Update Announcement"
          cancelTo="/super-admin/announcements"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  )
}

export default EditAnnouncementPage