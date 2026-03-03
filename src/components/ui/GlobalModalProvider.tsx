import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

type GlobalModalOptions = {
  title: string
  /**
   * Main body content of the modal.
   * This can be any JSX: form, text, buttons, etc.
   */
  content: ReactNode
  /**
   * Optional label for the primary (right) button.
   * Defaults to "Submit" to match the design.
   */
  primaryLabel?: string
  /**
   * Optional label for the secondary (left) button.
   * Defaults to "Cancel".
   */
  secondaryLabel?: string
  /**
   * Called when the primary button is clicked.
   * If this returns a promise, the modal will stay open until it settles.
   */
  onPrimary?: () => void | Promise<void>
  /**
   * Called when the secondary button or close icon is clicked.
   */
  onSecondary?: () => void
  /**
   * If true, hide the secondary button entirely.
   */
  hideSecondary?: boolean
}

type GlobalModalState = GlobalModalOptions & {
  isOpen: boolean
  loading: boolean
}

type GlobalModalContextValue = {
  openModal: (options: GlobalModalOptions) => void
  closeModal: () => void
}

const GlobalModalContext = createContext<GlobalModalContextValue | undefined>(undefined)

type GlobalModalProviderProps = {
  children: ReactNode
}

export const GlobalModalProvider = ({ children }: GlobalModalProviderProps) => {
  const [modalState, setModalState] = useState<GlobalModalState | null>(null)

  const closeModal = useCallback(() => {
    setModalState((prev) => (prev ? { ...prev, isOpen: false } : prev))
    // Give exit animation a moment if we add one later
    setTimeout(() => setModalState(null), 150)
  }, [])

  const openModal = useCallback((options: GlobalModalOptions) => {
    setModalState({
      isOpen: true,
      loading: false,
      primaryLabel: 'Submit',
      secondaryLabel: 'Cancel',
      ...options,
    })
  }, [])

  const handlePrimaryClick = async () => {
    if (!modalState || !modalState.onPrimary) {
      closeModal()
      return
    }

    try {
      setModalState((prev) => (prev ? { ...prev, loading: true } : prev))
      const result = modalState.onPrimary()
      if (result instanceof Promise) {
        await result
      }
      closeModal()
    } finally {
      setModalState((prev) => (prev ? { ...prev, loading: false } : prev))
    }
  }

  const handleSecondaryClick = () => {
    if (modalState?.onSecondary) {
      modalState.onSecondary()
    }
    closeModal()
  }

  return (
    <GlobalModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {modalState?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          {/* Click on backdrop closes modal */}
          <button
            type="button"
            aria-label="Close modal overlay"
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={handleSecondaryClick}
          />

          <div className="relative z-10 w-full max-w-2xl px-4">
            <div className="bg-white rounded-sm shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">{modalState.title}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={handleSecondaryClick}
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              {/* Body */}
              <div className="px-8 py-4 text-sm text-gray-800">{modalState.content}</div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-8 pb-6 pt-4 border-t border-gray-100">
                {!modalState.hideSecondary && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 cursor-pointer"
                    onClick={handleSecondaryClick}
                    disabled={modalState.loading}
                  >
                    {modalState.secondaryLabel ?? 'Cancel'}
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-orange-500 rounded-sm hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed cursor-pointer"
                  onClick={handlePrimaryClick}
                  disabled={modalState.loading}
                >
                  {modalState.loading ? 'Processing...' : modalState.primaryLabel ?? 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GlobalModalContext.Provider>
  )
}

export const useGlobalModal = () => {
  const ctx = useContext(GlobalModalContext)
  if (!ctx) {
    throw new Error('useGlobalModal must be used within a GlobalModalProvider')
  }
  return ctx
}

