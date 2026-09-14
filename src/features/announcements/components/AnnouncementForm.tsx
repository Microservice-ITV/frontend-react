import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { AnnouncementRenderer } from './AnnouncementRenderer'

import { ANNOUNCEMENT_STATUSES } from '../types/announcementTypes'

import type { AnnouncementElementType, AnnouncementType } from '../types/announcementTypes'
import type { Resolver } from 'react-hook-form'

export const announcementFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  announcementTypeId: z.string().min(1, 'Select an announcement type'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  startAt: z.string(),
  endAt: z.string(),
  priority: z
    .string()
    .refine(
      (value) => {
        const num = Number(value)
        return value.trim() !== '' && Number.isInteger(num) && num >= 0
      },
      'Priority must be 0 or greater'
    ),
})

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

export interface AnnouncementElementDraft {
  announcementTypeElementId: string
  type: AnnouncementElementType
  key: string
  label: string
  required: boolean
  included: boolean
  position: number
  text: string
  textColor: string
  backgroundColor: string
}

export interface AnnouncementFormSubmitPayload {
  values: AnnouncementFormValues
  elements: {
    announcementTypeElementId: string
    text: string | null
    textColor: string | null
    backgroundColor: string | null
    position: number
  }[]
}

interface AnnouncementFormProps {
  mode: 'create' | 'edit'
  resolver: Resolver<AnnouncementFormValues>
  initialValues: AnnouncementFormValues
  availableTypes: AnnouncementType[]
  initialElements?: Pick<AnnouncementElementDraft, 'announcementTypeElementId' | 'text' | 'textColor' | 'backgroundColor'>[]
  typesLoading?: boolean
  onSubmit: (payload: AnnouncementFormSubmitPayload) => Promise<void> | void
  submitLabel: string
  cancelTo: string
  isSubmitting?: boolean
  submitError?: string
}

export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500'

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

const buildDrafts = (
  type: AnnouncementType,
  initialElements?: Pick<AnnouncementElementDraft, 'announcementTypeElementId' | 'text' | 'textColor' | 'backgroundColor'>[]
): AnnouncementElementDraft[] => {
  const initialById = new Map((initialElements ?? []).map((element) => [element.announcementTypeElementId, element]))
  const isEdit = initialElements !== undefined

  return [...type.elements]
    .sort((a, b) => a.position - b.position)
    .map((element) => {
      const existing = initialById.get(element.id)
      return {
        announcementTypeElementId: element.id,
        type: element.elementType,
        key: element.key,
        label: element.label,
        required: element.required,
        included: element.required || !isEdit || Boolean(existing),
        position: element.position,
        text: existing ? (existing.text ?? '') : (element.defaultText ?? ''),
        textColor: existing ? (existing.textColor ?? '') : (element.defaultTextColor ?? ''),
        backgroundColor: existing
          ? (existing.backgroundColor ?? '')
          : (element.defaultBackgroundColor ?? ''),
      }
    })
}

export function AnnouncementForm({
  mode,
  resolver,
  initialValues,
  availableTypes,
  initialElements,
  typesLoading = false,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError,
}: AnnouncementFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver,
    defaultValues: initialValues,
    mode: 'onSubmit',
  })

  const typeId = watch('announcementTypeId')
  const selectedType = availableTypes.find((type) => type.id === typeId) ?? null

  const [drafts, setDrafts] = useState<AnnouncementElementDraft[]>([])
  const builtForRef = useRef<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedType) {
      setDrafts([])
      builtForRef.current = null
      return
    }
    // Rebuild when selected type changes, or when edit data arrives after the type options load.
    const buildKey = `${selectedType.id}:${mode}:${initialElements?.length ?? 0}`
    if (builtForRef.current === buildKey) return
    builtForRef.current = buildKey
    setDrafts(buildDrafts(selectedType, mode === 'edit' ? initialElements : undefined))
  }, [selectedType, mode, initialElements])

  const updateDraft = (
    index: number,
    patch: Partial<Pick<AnnouncementElementDraft, 'included' | 'text' | 'textColor' | 'backgroundColor'>>
  ) => {
    setDrafts((prev) => prev.map((draft, current) => (current === index ? { ...draft, ...patch } : draft)))
  }

  const selectedTypeName = selectedType ? selectedType.name : null

  const previewElements = drafts
    .filter((draft) => draft.included)
    .map((draft) => ({
      key: draft.key,
      elementType: draft.type,
      text: draft.type === 'DIVIDER' ? null : draft.text,
      textColor: draft.textColor.trim() ? draft.textColor : null,
      backgroundColor: draft.backgroundColor.trim() ? draft.backgroundColor : null,
    }))

  const present = async (values: AnnouncementFormValues) => {
    setValidationError(null)

    if (values.startAt && values.endAt && new Date(values.startAt) > new Date(values.endAt)) {
      setValidationError('Start time must be before end time')
      return
    }

    const requiredMissing = drafts.find(
      (draft) => draft.included && draft.required && !draft.text.trim()
    )
    if (requiredMissing) {
      setValidationError(`Required element "${requiredMissing.label}" cannot be left empty`)
      return
    }

    for (const draft of drafts) {
      const textColor = draft.textColor.trim()
      const backgroundColor = draft.backgroundColor.trim()
      if (draft.included && textColor && !HEX_PATTERN.test(textColor)) {
        setValidationError(`Element "${draft.label}": text color must be a hex value like #FFFFFF.`)
        return
      }
      if (draft.included && backgroundColor && !HEX_PATTERN.test(backgroundColor)) {
        setValidationError(
          `Element "${draft.label}": background color must be a hex value like #FFFFFF.`
        )
        return
      }
    }

    const elements = drafts
      .filter((draft) => draft.included && (draft.type === 'DIVIDER' || draft.text.trim()))
      .map((draft) => ({
        announcementTypeElementId: draft.announcementTypeElementId,
        text: draft.type === 'DIVIDER' ? null : draft.text.trim(),
        textColor: draft.textColor.trim() ? draft.textColor.trim() : null,
        backgroundColor: draft.backgroundColor.trim() ? draft.backgroundColor.trim() : null,
        position: draft.position,
      }))

    await onSubmit({ values, elements })
  }

  const shownError = submitError ?? validationError

  return (
    <form onSubmit={handleSubmit(present)} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Free Shipping Campaign"
              {...register('name')}
              className={inputClassName}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label
              htmlFor="announcementTypeId"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Announcement Type
            </label>
            <select id="announcementTypeId" {...register('announcementTypeId')} className={inputClassName}>
              <option value="">Select announcement type...</option>
              {availableTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
            {errors.announcementTypeId && (
              <p className="mt-1 text-xs text-red-600">{errors.announcementTypeId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select id="status" {...register('status')} className={inputClassName}>
              {ANNOUNCEMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select id="priority" {...register('priority')} className={inputClassName}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="startAt" className="mb-1 block text-sm font-medium text-slate-700">
              Start At
            </label>
            <input id="startAt" type="datetime-local" {...register('startAt')} className={inputClassName} />
            {errors.startAt && <p className="mt-1 text-xs text-red-600">{errors.startAt.message}</p>}
          </div>

          <div>
            <label htmlFor="endAt" className="mb-1 block text-sm font-medium text-slate-700">
              End At
            </label>
            <input id="endAt" type="datetime-local" {...register('endAt')} className={inputClassName} />
            {errors.endAt && <p className="mt-1 text-xs text-red-600">{errors.endAt.message}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Content</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Fields are determined by the selected announcement type. Each element can carry its own
          colors.
        </p>

        {typesLoading && (
          <p className="mt-4 text-sm text-slate-500">Loading announcement types...</p>
        )}

        {!typesLoading && availableTypes.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
            No announcement types available. Create an announcement type first.
          </p>
        )}

        {!typesLoading && availableTypes.length > 0 && !selectedType && (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
            Select an announcement type to configure its content.
          </p>
        )}

        {selectedType && (
          <div className="mt-4 space-y-3">
            {drafts.length === 0 && (
              <p className="text-sm text-slate-400">This announcement type has no elements.</p>
            )}
            {drafts.map((draft, index) => (
              <div key={draft.announcementTypeElementId} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {draft.position}
                    </span>
                    <p className="text-sm font-medium text-slate-900">
                      {draft.label}
                      {draft.required && <span className="ml-1 text-red-500">*</span>}
                    </p>
                  </div>
                  {!draft.required && (
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={draft.included}
                        onChange={(event) => updateDraft(index, { included: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                      />
                      Show
                    </label>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {draft.type !== 'DIVIDER' && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        {draft.type === 'IMAGE' ? 'Image reference' : 'Text'}
                      </label>
                      <input
                        type="text"
                        placeholder={draft.type === 'IMAGE' ? 'Image URL or reference' : `e.g. ${draft.label}`}
                        value={draft.text}
                        onChange={(event) => updateDraft(index, { text: event.target.value })}
                        disabled={!draft.included}
                        className={inputClassName}
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Text color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.textColor || '#0F172A'}
                        onChange={(event) => updateDraft(index, { textColor: event.target.value })}
                        disabled={!draft.included}
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#0F172A"
                        value={draft.textColor}
                        onChange={(event) => updateDraft(index, { textColor: event.target.value })}
                        disabled={!draft.included}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Background color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.backgroundColor || '#FFFFFF'}
                        onChange={(event) =>
                          updateDraft(index, { backgroundColor: event.target.value })
                        }
                        disabled={!draft.included}
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#FFFFFF"
                        value={draft.backgroundColor}
                        onChange={(event) =>
                          updateDraft(index, { backgroundColor: event.target.value })
                        }
                        disabled={!draft.included}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Live Preview</h2>
        <AnnouncementRenderer typeName={selectedTypeName} elements={previewElements} size="md" />
      </div>

      {shownError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {shownError}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Processing...' : submitLabel}
        </button>
        <Link
          to={cancelTo}
          className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

export { zodResolver }