import { Plus, Trash2, X } from 'lucide-react'

import { ANNOUNCEMENT_ELEMENT_TYPES } from '../types/announcementTypes'

import type {
  AnnouncementElementType,
  AnnouncementTypeElementDraft,
} from '../types/announcementTypes'

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

const newClientId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

interface AnnouncementTypeElementsBuilderProps {
  elements: AnnouncementTypeElementDraft[]
  onChange: (elements: AnnouncementTypeElementDraft[]) => void
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500'

const invalidClassName = (invalid: boolean) =>
  invalid ? 'border-red-400 focus:border-red-500' : 'focus:border-emerald-500'

function keyHint(value: string): string | null {
  if (value && !KEY_PATTERN.test(value)) {
    return 'Start lowercase: letters, numbers and underscores only (no spaces)'
  }
  return null
}

function colorHint(value: string): string | null {
  if (value && !HEX_PATTERN.test(value.trim())) {
    return 'Use a hex color like #FFFFFF'
  }
  return null
}

export function AnnouncementTypeElementsBuilder({
  elements,
  onChange,
}: AnnouncementTypeElementsBuilderProps) {
  const addElement = () => {
    onChange([
      ...elements,
      {
        _clientId: newClientId(),
        elementType: 'TEXT',
        key: '',
        label: '',
        position: elements.length + 1,
        required: false,
        defaultText: '',
        defaultTextColor: '',
        defaultBackgroundColor: '',
      },
    ])
  }

  const removeElement = (clientId: string) => {
    onChange(
      elements
        .filter((element) => element._clientId !== clientId)
        .map((element, index) => ({ ...element, position: index + 1 }))
    )
  }

  const updateElement = (
    clientId: string,
    patch: Partial<AnnouncementTypeElementDraft>
  ) => {
    onChange(
      elements.map((element) =>
        element._clientId === clientId ? { ...element, ...patch } : element
      )
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Elements</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Define the building blocks this announcement type supports. Each element can carry its
            own colors.
          </p>
        </div>
        <button
          type="button"
          onClick={addElement}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
        >
          <Plus size={14} />
          Add Element
        </button>
      </div>

      {elements.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-400">
          No elements yet. Add a Text element to get started.
        </p>
      )}

      <div className="space-y-3">
        {elements.map((element, index) => {
          const isDivider = element.elementType === 'DIVIDER'
          const badKey = keyHint(element.key)
          const badTextColor = colorHint(element.defaultTextColor ?? '')
          const badBackgroundColor = colorHint(element.defaultBackgroundColor ?? '')

          return (
            <div key={element._clientId} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {index + 1}
                </span>
                <div className="flex-1 grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                    <select
                      value={element.elementType}
                      onChange={(event) =>
                        updateElement(element._clientId, {
                          elementType: event.target.value as AnnouncementElementType,
                        })
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
                      value={element.key}
                      onChange={(event) => updateElement(element._clientId, { key: event.target.value })}
                      className={`${inputClassName} ${invalidClassName(Boolean(badKey))}`}
                    />
                    {badKey && <p className="mt-1 text-xs text-red-600">{badKey}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Shipping Amount"
                      value={element.label}
                      onChange={(event) => updateElement(element._clientId, { label: event.target.value })}
                      className={inputClassName}
                    />
                  </div>

                  <div className="flex items-end gap-4 pb-0.5">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(element.required)}
                        onChange={(event) =>
                          updateElement(element._clientId, { required: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                      />
                      Required
                    </label>
                  </div>

                  {!isDivider && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Default text
                      </label>
                      <input
                        type="text"
                        placeholder={element.elementType === 'IMAGE' ? 'Image reference' : 'Optional default text'}
                        value={element.defaultText ?? ''}
                        onChange={(event) =>
                          updateElement(element._clientId, { defaultText: event.target.value })
                        }
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
                        value={element.defaultTextColor || '#0F172A'}
                        onChange={(event) =>
                          updateElement(element._clientId, { defaultTextColor: event.target.value })
                        }
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#0F172A"
                        value={element.defaultTextColor ?? ''}
                        onChange={(event) =>
                          updateElement(element._clientId, { defaultTextColor: event.target.value })
                        }
                        className={`${inputClassName} ${invalidClassName(Boolean(badTextColor))}`}
                      />
                    </div>
                    {badTextColor && <p className="mt-1 text-xs text-red-600">{badTextColor}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Default background color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={element.defaultBackgroundColor || '#FFFFFF'}
                        onChange={(event) =>
                          updateElement(element._clientId, { defaultBackgroundColor: event.target.value })
                        }
                        className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#FFFFFF"
                        value={element.defaultBackgroundColor ?? ''}
                        onChange={(event) =>
                          updateElement(element._clientId, { defaultBackgroundColor: event.target.value })
                        }
                        className={`${inputClassName} ${invalidClassName(Boolean(badBackgroundColor))}`}
                      />
                    </div>
                    {badBackgroundColor && (
                      <p className="mt-1 text-xs text-red-600">{badBackgroundColor}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeElement(element._clientId)}
                  title="Remove element"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {elements.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Trash2 size={14} />
          Positions are assigned automatically; each key must be unique.
        </div>
      )}
    </div>
  )
}