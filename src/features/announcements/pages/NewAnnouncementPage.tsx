import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchAnnouncementTypes } from '../store/announcementTypeThunks'
import { selectAnnouncementTypes, selectAnnouncementTypesLoading } from '../store/announcementTypeSelectors'
import { createAnnouncement } from '../store/announcementThunks'
import {
  AnnouncementForm,
  announcementFormSchema,
  type AnnouncementFormSubmitPayload,
} from '../components/AnnouncementForm'

import type { AnnouncementElementInput } from '../types/announcementTypes'

const NewAnnouncementPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const availableTypes = useAppSelector(selectAnnouncementTypes)
  const typesLoading = useAppSelector(selectAnnouncementTypesLoading)

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (availableTypes.length === 0) {
      dispatch(fetchAnnouncementTypes())
    }
  }, [dispatch, availableTypes.length])

  const onSubmit = async ({ values, elements }: AnnouncementFormSubmitPayload) => {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      await dispatch(
        createAnnouncement({
          name: values.name.trim(),
          announcementTypeId: values.announcementTypeId,
          status: values.status,
          startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
          endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
          priority: Number(values.priority),
          elements: elements as AnnouncementElementInput[],
        })
      ).unwrap()
      navigate('/super-admin/announcements')
    } catch (error: any) {
      const fallback = 'Failed to create announcement. Please try again.'
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
        <Link to="/super-admin/announcements" className="hover:text-slate-700">
          Announcements
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">New Announcement</span>
      </nav>

      <AnnouncementForm
        mode="create"
        resolver={zodResolver(announcementFormSchema)}
        initialValues={{
          name: '',
          announcementTypeId: '',
          status: 'DRAFT',
          startAt: '',
          endAt: '',
          priority: '0',
        }}
        availableTypes={availableTypes}
        typesLoading={typesLoading}
        onSubmit={onSubmit}
        submitLabel="Create Announcement"
        cancelTo="/super-admin/announcements"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewAnnouncementPage