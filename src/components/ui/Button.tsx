import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: ReactNode;
}

export const Button = ({ loading = false,disabled, children, className, ...props }: Props) => {
    const isDisabled = loading || disabled
    return (
        <button
            {...props}
            disabled={isDisabled}
            className={clsx(
                'w-full bg-emerald-600 text-white py-2 rounded transition',
                isDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-emerald-700',
                className
            )}
        >
            {loading ? "Loading..." : children}
        </button>
    )
}