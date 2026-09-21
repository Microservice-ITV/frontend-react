import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
    children: ReactNode
    fallback?: ReactNode
}

type State = { hasError: boolean }

/**
 * Keeps a broken tile layer / renderer from unmounting the entire app (white screen).
 * If the map throws, the address form stays usable and the user can still save.
 */
export class MapErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Map failed to render:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="flex h-[220px] w-full items-center justify-center rounded-sm border border-gray-200 bg-gray-50 px-4 text-center text-xs text-gray-500">
                        The map couldn&apos;t load right now, but you can still save this address.
                    </div>
                )
            )
        }
        return this.props.children
    }
}
