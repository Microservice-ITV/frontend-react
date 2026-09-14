import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch } from '@/app/hooks'
import { createAnnouncementType } from '../store/announcementTypeThunks'
import {
  AnnouncementTypeForm,
  announcementTypeFormSchema,
  type AnnouncementTypeFormValues,
} from '../components/AnnouncementTypeForm'
import { AnnouncementTypeElementsBuilder } from '../components/AnnouncementTypeElementsBuilder'

import type { AnnouncementTypeElementDraft } from '../types/announcementTypes'

const KEY_PATTERN = /^[a-z][a-zA-Z0-9_]*$/
const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

const NewAnnouncementTypePage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [elements, setElements] = useState<AnnouncementTypeElementDraft[]>([])
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async ({ values }: { values: AnnouncementTypeFormValues }) => {
    setSubmitError('')

    const errors: string[] = []

    const trimmedElements = elements
      .filter((element) => element.key.trim() !== '' || element.label.trim() !== '')
      .map((element, index) => {
        const key = element.key.trim()
        const label = element.label.trim()
        const elementNumber = index + 1

        if (!key) {
          errors.push(`Element ${elementNumber}: Key is required.`)
        } else if (!KEY_PATTERN.test(key)) {
          errors.push(
            `Element ${elementNumber}: Key "${key}" must start with a lowercase letter and use only letters, numbers and underscores.`
          )
        }

        if (!label) {
          errors.push(`Element ${elementNumber}: Label is required.`)
        }

        const defaultTextColor = element.defaultTextColor?.trim()
        if (defaultTextColor && !HEX_PATTERN.test(defaultTextColor)) {
          errors.push(`Element ${elementNumber}: Text color "${defaultTextColor}" must be a hex value like #FFFFFF.`)
        }

        const defaultBackgroundColor = element.defaultBackgroundColor?.trim()
        if (defaultBackgroundColor && !HEX_PATTERN.test(defaultBackgroundColor)) {
          errors.push(`Element ${elementNumber}: Background color "${defaultBackgroundColor}" must be a hex value like #FFFFFF.`)
        }

        return {
          elementType: element.elementType,
          key,
          label,
          position: elementNumber,
          required: Boolean(element.required),
          defaultText: element.defaultText?.trim() || null,
          defaultTextColor: defaultTextColor || null,
          defaultBackgroundColor: defaultBackgroundColor || null,
        }
      })

    if (errors.length > 0) {
      setSubmitError(errors.join(' '))
      return
    }

    setIsSubmitting(true)
    try {
      const result = await dispatch(
        createAnnouncementType({
          name: values.name.trim(),
          code: values.code.trim(),
          description: values.description.trim() || null,
          isActive: values.isActive === 'true',
          elements: trimmedElements,
        })
      ).unwrap()
      navigate(`/super-admin/announcement-types/${result.id}/edit`)
    } catch (error: any) {
      const fallback = 'Failed to create announcement type. Please try again.'
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
        <span className="text-slate-900">New Announcement Type</span>
      </nav>

      <AnnouncementTypeForm
        mode="create"
        resolver={zodResolver(announcementTypeFormSchema)}
        initialValues={{
          name: '',
          code: '',
          description: '',
          isActive: 'true',
        }}
        onSubmit={onSubmit}
        submitLabel="Create Announcement Type"
        cancelTo="/super-admin/announcement-types"
        isSubmitting={isSubmitting}
        submitError={submitError}
      >
        <AnnouncementTypeElementsBuilder elements={elements} onChange={setElements} />
      </AnnouncementTypeForm>
    </div>
  )
}

export default NewAnnouncementTypePage