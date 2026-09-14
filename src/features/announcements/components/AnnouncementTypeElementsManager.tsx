import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, X } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'

import {
  createAnnouncementTypeElement,
  deleteAnnouncementTypeElement,
  reorderAnnouncementTypeElements,
  updateAnnouncementTypeElement,
} from '../store/announcementTypeThunks'

import { ANNOUNCEMENT_ELEMENT_TYPES } from '../types/announcementTypes'

import type { AnnouncementElementType, AnnouncementTypeElement } from '../types/announcementTypes'

const ELEMENT_TYPE_LABELS: Record<AnnouncementElementType, string> = {
  TEXT: 'Text',
  LABEL: 'Label',
  BUTTON: 'Button',
  ICON: 'Icon',
  IMAGE: 'Image',
  DIVIDER: 'Divider',
}

const KEY_PATTERN = /^[a-z][a-zA-Z0-9_]*$/
const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

interface Draft {
  elementType: AnnouncementElementType
  key: string
  label: string
  required: boolean
  defaultText: string
  defaultTextColor: string
  defaultBackgroundColor: string
}

const emptyDraft = (): Draft => ({
  elementType: 'TEXT',
  key: '',
  label: '',
  required: false,
  defaultText: '',
  defaultTextColor: '',
  defaultBackgroundColor: '',
})

interface AnnouncementTypeElementsManagerProps {
  typeId: string
  elements: AnnouncementTypeElement[]
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500'

function ElementDraftFields({
  draft,
  onChange,
}: {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
}) {
  const isDivider = draft.elementType === 'DIVIDER'

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
        <select
          value={draft.elementType}
          onChange={(event) =>
            onChange({ elementType: event.target.value as AnnouncementElementType })
          }
          className={inputClassName}
        >
          {ANNOUNCEMENT_ELEMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {ELEMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Key</label>
        <input
          type="text"
          placeholder="e.g. shipping_amount"
          value={draft.key}
          onChange={(event) => onChange({ key: event.target.value })}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
        <input
          type="text"
          placeholder="e.g. Shipping Amount"
          value={draft.label}
          onChange={(event) => onChange({ label: event.target.value })}
          className={inputClassName}
        />
      </div>

      <div className="flex items-end pb-1.5">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={draft.required}
            onChange={(event) => onChange({ required: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
          />
          Required
        </label>
      </div>

      {!isDivider && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Default text</label>
          <input
            type="text"
            placeholder={draft.elementType === 'IMAGE' ? 'Image reference' : 'Optional default text'}
            value={draft.defaultText}
            onChange={(event) => onChange({ defaultText: event.target.value })}
            className={inputClassName}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Default text color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={draft.defaultTextColor || '#0F172A'}
            onChange={(event) => onChange({ defaultTextColor: event.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
          />
          <input
            type="text"
            placeholder="#0F172A"
            value={draft.defaultTextColor}
            onChange={(event) => onChange({ defaultTextColor: event.target.value })}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Default background color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={draft.defaultBackgroundColor || '#FFFFFF'}
            onChange={(event) => onChange({ defaultBackgroundColor: event.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
          />
          <input
            type="text"
            placeholder="#FFFFFF"
            value={draft.defaultBackgroundColor}
            onChange={(event) => onChange({ defaultBackgroundColor: event.target.value })}
            className={inputClassName}
          />
        </div>
      </div>
    </div>
  )
}

export function AnnouncementTypeElementsManager({
  typeId,
  elements,
}: AnnouncementTypeElementsManagerProps) {
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()

  const [showAdd, setShowAdd] = useState(false)
  const [addDraft, setAddDraft] = useState<Draft>(emptyDraft())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft())
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const sortedElements = [...elements].sort((a, b) => a.position - b.position)

  const startEdit = (element: AnnouncementTypeElement) => {
    setActionError(null)
    setEditingId(element.id)
    setEditDraft({
      elementType: element.elementType,
      key: element.key,
      label: element.label,
      required: element.required,
      defaultText: element.defaultText ?? '',
      defaultTextColor: element.defaultTextColor ?? '',
      defaultBackgroundColor: element.defaultBackgroundColor ?? '',
    })
  }

  const addElement = async () => {
    const key = addDraft.key.trim()
    const label = addDraft.label.trim()
    const textColor = addDraft.defaultTextColor.trim()
    const backgroundColor = addDraft.defaultBackgroundColor.trim()

    setActionError(null)
    if (!key) {
      setActionError('Key is required.')
      return
    }
    if (!KEY_PATTERN.test(key)) {
      setActionError('Key must start with a lowercase letter and use only letters, numbers and underscores.')
      return
    }
    if (!label) {
      setActionError('Label is required.')
      return
    }
    if (textColor && !HEX_PATTERN.test(textColor)) {
      setActionError(`Text color "${textColor}" must be a hex value like #FFFFFF.`)
      return
    }
    if (backgroundColor && !HEX_PATTERN.test(backgroundColor)) {
      setActionError(`Background color "${backgroundColor}" must be a hex value like #FFFFFF.`)
      return
    }

    const position = sortedElements.length > 0 ? sortedElements[sortedElements.length - 1].position + 1 : 1
    setBusy(true)
    try {
      await dispatch(
        createAnnouncementTypeElement({
          announcementTypeId: typeId,
          payload: {
            elementType: addDraft.elementType,
            key,
            label,
            position,
            required: addDraft.required,
            defaultText: addDraft.defaultText.trim() || null,
            defaultTextColor: textColor || null,
            defaultBackgroundColor: backgroundColor || null,
          },
        })
      ).unwrap()
      setAddDraft(emptyDraft())
      setShowAdd(false)
    } catch (error: any) {
      const fallback = 'Failed to add element.'
      setActionError(
        typeof error === 'string'
          ? error
          : error?.response?.data?.message ??
              error?.response?.data?.error?.message ??
              error?.message ??
              fallback
      )
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async () => {
    if (!editingId) return

    const key = editDraft.key.trim()
    const label = editDraft.label.trim()
    const textColor = editDraft.defaultTextColor.trim()
    const backgroundColor = editDraft.defaultBackgroundColor.trim()

    setActionError(null)
    if (!key) {
      setActionError('Key is required.')
      return
    }
    if (!KEY_PATTERN.test(key)) {
      setActionError('Key must start with a lowercase letter and use only letters, numbers and underscores.')
      return
    }
    if (!label) {
      setActionError('Label is required.')
      return
    }
    if (textColor && !HEX_PATTERN.test(textColor)) {
      setActionError(`Text color "${textColor}" must be a hex value like #FFFFFF.`)
      return
    }
    if (backgroundColor && !HEX_PATTERN.test(backgroundColor)) {
      setActionError(`Background color "${backgroundColor}" must be a hex value like #FFFFFF.`)
      return
    }

    setBusy(true)
    try {
      await dispatch(
        updateAnnouncementTypeElement({
          announcementTypeId: typeId,
          elementId: editingId,
          payload: {
            elementType: editDraft.elementType,
            key,
            label,
            required: editDraft.required,
            defaultText: editDraft.defaultText.trim() || null,
            defaultTextColor: textColor || null,
            defaultBackgroundColor: backgroundColor || null,
          },
        })
      ).unwrap()
      setEditingId(null)
    } catch (error: any) {
      const fallback = 'Failed to save element.'
      setActionError(
        typeof error === 'string'
          ? error
          : error?.response?.data?.message ??
              error?.response?.data?.error?.message ??
              error?.message ??
              fallback
      )
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (element: AnnouncementTypeElement) => {
    openModal({
      title: 'Delete element?',
      content: (
        <p>
          Are you sure you want to delete <strong>{element.key}</strong>? Announcements already
          using this element will prevent deletion.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(
          deleteAnnouncementTypeElement({ announcementTypeId: typeId, elementId: element.id })
        ).unwrap()
        if (editingId === element.id) {
          setEditingId(null)
        }
      },
    })
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sortedElements.length) return

    const ids = sortedElements.map((element) => element.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(target, 0, moved)

    setBusy(true)
    try {
      await dispatch(
        reorderAnnouncementTypeElements({ announcementTypeId: typeId, elementIds: ids })
      ).unwrap()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Elements</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The building blocks this type supports. Changes save immediately.
          </p>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={() => {
              setActionError(null)
              setShowAdd(true)
            }}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
          >
            <Plus size={14} />
            Add Element
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {showAdd && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              New element
            </h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="cursor-pointer text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          </div>
          <ElementDraftFields draft={addDraft} onChange={(patch) => setAddDraft((prev) => ({ ...prev, ...patch }))} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={addElement}
              className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? 'Saving...' : 'Add Element'}
            </button>
          </div>
        </div>
      )}

      {sortedElements.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-400">
          No elements yet. Add a Text element to get started.
        </p>
      )}

      <div className="space-y-2">
        {sortedElements.map((element, index) => (
          <div key={element.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {element.position}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {ELEMENT_TYPE_LABELS[element.elementType]}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{element.label}</p>
                <p className="truncate text-xs text-slate-500">
                  {element.key}
                  {element.required ? ' · Required' : ''}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || busy}
                  title="Move up"
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sortedElements.length - 1 || busy}
                  title="Move down"
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(element)}
                  title="Edit"
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(element)}
                  title="Delete"
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {editingId === element.id && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Edit element — {element.key}
                  </h3>
                </div>
                <ElementDraftFields
                  draft={editDraft}
                  onChange={(patch) => setEditDraft((prev) => ({ ...prev, ...patch }))}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveEdit}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}