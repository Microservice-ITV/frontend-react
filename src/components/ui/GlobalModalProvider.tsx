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
  /**
   * If true, hide the primary button entirely.
   * Useful when the modal body renders its own footer actions.
   */
  hidePrimary?: boolean
}

type GlobalModalState = GlobalModalOptions & {
  isOpen: boolean
  loading: boolean
  error: string | null
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

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return 'Action failed. Please try again.'
  }

  const closeModal = useCallback(() => {
    setModalState((prev) => (prev ? { ...prev, isOpen: false } : prev))
    // Give exit animation a moment if we add one later
    setTimeout(() => setModalState(null), 150)
  }, [])

  const openModal = useCallback((options: GlobalModalOptions) => {
    setModalState({
      isOpen: true,
      loading: false,
      error: null,
      primaryLabel: 'Submit',
      secondaryLabel: 'Cancel',
      hidePrimary: false,
      ...options,
    })
  }, [])

  const handlePrimaryClick = async () => {
    if (!modalState || !modalState.onPrimary) {
      closeModal()
      return
    }

    try {
      setModalState((prev) => (prev ? { ...prev, loading: true, error: null } : prev))
      const result = modalState.onPrimary()
      if (result instanceof Promise) {
        await result
      }
      closeModal()
    } catch (error) {
      // Keep the modal open and surface the error so users can retry confidently.
      setModalState((prev) => (prev ? { ...prev, error: getErrorMessage(error) } : prev))
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

              {modalState.error && (
                <div className="px-8 pb-1 text-sm text-red-600">{modalState.error}</div>
              )}

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
                {!modalState.hidePrimary && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-orange-500 rounded-sm hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed cursor-pointer"
                    onClick={handlePrimaryClick}
                    disabled={modalState.loading}
                  >
                    {modalState.loading ? 'Processing...' : modalState.primaryLabel ?? 'Submit'}
                  </button>
                )}
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

