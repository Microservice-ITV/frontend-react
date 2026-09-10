import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

type HelpHeaderProps = {
  title: string
}

const HelpHeader = ({ title }: HelpHeaderProps) => (
  <header className="mx-auto flex h-16 max-w-6xl items-center justify-between border-b border-gray-100 px-5 sm:px-8">
    <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-600">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <span className="text-base font-medium text-emerald-600">{title}</span>
    </Link>

    <Link to="/" className="text-sm text-gray-800 hover:text-emerald-700">
      Policies
    </Link>
  </header>
)

export default HelpHeader
