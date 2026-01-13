import { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: ReactNode;
}

export const Button = ({ loading, children, ...props }: Props) => {
    return (
        <button
            {...props}
            disabled={loading}
            className="w-full bg-orange-500 text-white hover:bg-gray-800 py-2 rounded disabled:opacity-50"
        >
            {loading ? "Loading..." : children}
        </button>
    )
}