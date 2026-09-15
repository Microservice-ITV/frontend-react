import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import type { ReactNode } from 'react'
import type { Resolver } from 'react-hook-form'

export const announcementTypeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Use UPPER_SNAKE_CASE, e.g. FREE_SHIPPING'),
  description: z.string(),
  isActive: z.enum(['true', 'false']),
})

export type AnnouncementTypeFormValues = z.infer<typeof announcementTypeFormSchema>

export interface AnnouncementTypeFormSubmitPayload {
  values: AnnouncementTypeFormValues
}

interface AnnouncementTypeFormProps {
  mode: 'create' | 'edit'
  resolver: Resolver<AnnouncementTypeFormValues>
  initialValues: AnnouncementTypeFormValues
  onSubmit: (payload: AnnouncementTypeFormSubmitPayload) => Promise<void> | void
  submitLabel: string
  cancelTo: string
  isSubmitting?: boolean
  submitError?: string
  children?: ReactNode
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500'

export function AnnouncementTypeForm({
  mode,
  resolver,
  initialValues,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting = false,
  submitError,
  children,
}: AnnouncementTypeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementTypeFormValues>({
    resolver,
    defaultValues: initialValues,
    mode: 'onSubmit',
  })

  const present = async (values: AnnouncementTypeFormValues) => {
    await onSubmit({ values })
  }

  return (
    <form onSubmit={handleSubmit(present)} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Free Shipping"
              {...register('name')}
              className={inputClassName}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
              Code
            </label>
            <input
              id="code"
              type="text"
              placeholder="FREE_SHIPPING"
              {...register('code')}
              className={`${inputClassName} uppercase`}
            />
            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Optional description of this announcement type"
              {...register('description')}
              className={inputClassName}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="isActive" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select id="isActive" {...register('isActive')} className={inputClassName}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {errors.isActive && (
              <p className="mt-1 text-xs text-red-600">{errors.isActive.message}</p>
            )}
          </div>
        </div>
      </div>

      {children}

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {submitError}
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