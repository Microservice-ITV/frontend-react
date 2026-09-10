import { Facebook, Instagram, Music2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const socialLinks = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/dnitems2020',
    icon: Facebook,
    className: 'bg-[#1877f2] text-white',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://www.tiktok.com/@daily.need.items1',
    icon: Music2,
    className: 'bg-black text-white',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: '#instagram',
    icon: Instagram,
    className: 'bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white',
  },
]

const HelpFooter = () => (
  <footer className="border-t border-gray-200 bg-white px-4 py-5 text-xs text-gray-500 sm:px-6">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Link to="/" className="hover:text-emerald-600">Policies</Link>
          <span>|</span>
          <Link to="/" className="hover:text-emerald-600">DNI Shop Terms of Service</Link>
          <span>|</span>
          <Link to="/" className="hover:text-emerald-600">DNI Shop Privacy Policy</Link>
        </div>
        <p>© 2026 DNI Shop. All Rights Reserved.</p>
      </div>

      <div className="flex items-center gap-3">
        {socialLinks.map(({ id, label, href, icon: Icon, className }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className={`flex h-7 w-7 items-center justify-center rounded-full ${className}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  </footer>
)

export default HelpFooter
