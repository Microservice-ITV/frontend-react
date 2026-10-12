import type { ReactNode } from 'react'

type OpenModalFn = (options: {
  title: string
  content: ReactNode
  primaryLabel?: string
  primaryVariant?: 'default' | 'success' | 'danger'
  secondaryLabel?: string
  onPrimary?: () => void | Promise<void>
}) => void

type ConfirmStatusToggleParams = {
  openModal: OpenModalFn
  /** Modal title subject, e.g. `“DHL”` or `this route rate`. */
  subject: string
  isActive: boolean
  deactivateContent: ReactNode
  activateContent: ReactNode
  onConfirm: () => Promise<void>
}

/** Shared Activate/Deactivate confirm using the existing GlobalModal. */
export function confirmStatusToggle({
  openModal,
  subject,
  isActive,
  deactivateContent,
  activateContent,
  onConfirm,
}: ConfirmStatusToggleParams) {
  const isDeactivate = isActive
  openModal({
    title: isDeactivate ? `Deactivate ${subject}?` : `Activate ${subject}?`,
    content: isDeactivate ? deactivateContent : activateContent,
    primaryLabel: isDeactivate ? 'Deactivate' : 'Activate',
    primaryVariant: isDeactivate ? 'danger' : 'default',
    secondaryLabel: 'Cancel',
    onPrimary: onConfirm,
  })
}
