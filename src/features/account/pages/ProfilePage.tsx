import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/hooks'

const maskEmail = (email: string): string => {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0] ?? ''}********@${domain}`
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(Math.max(8, local.length - 2))
  return `${visible}${masked}@${domain}`
}

const maskPhone = (phone: string): string => {
  if (!phone) return ''
  const clean = phone.replace(/\s+/g, '')
  if (clean.length <= 2) return clean
  const last2 = clean.slice(-2)
  // Always show N-2 masked characters followed by the last 2 digits
  return `${'*'.repeat(clean.length - 2)}${last2}`
}

// Fallback raw phone used only for display mask when real phone is not yet available.
// Last 2 digits are \"22\" so the mask renders as \"********22\".
const DEFAULT_PHONE_RAW = '0000000022'

const ProfilePage = () => {
  const { user } = useAppSelector((s) => s.auth)

  const [name, setName] = useState('')
  const [phone] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [dob, setDob] = useState({ day: '', month: '', year: '' })

  const username = user?.name ?? ''
  const email = user?.email ?? ''
  const maskedEmail = useMemo(() => maskEmail(email), [email])
  const maskedPhone = useMemo(() => maskPhone(phone || DEFAULT_PHONE_RAW), [phone])

  // Keep name in sync with the loaded user, especially after page refresh / auth bootstrap.
  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user?.name])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Placeholder: wiring to backend will be added later.
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-500">
            Manage and protect your account information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          {/* Username (read-only) */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 lg:col-span-3 text-right text-sm text-gray-600 pr-2">
              Username
            </label>
            <div className="col-span-8 lg:col-span-5">
              <input
                type="text"
                value={username}
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Username can only be changed once.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 lg:col-span-3 text-right text-sm text-gray-600 pr-2">
              Name
            </label>
            <div className="col-span-8 lg:col-span-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Email (display + Change link) */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 lg:col-span-3 text-right text-sm text-gray-600 pr-2">
              Email
            </label>
            <div className="col-span-8 lg:col-span-5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">{maskedEmail}</span>
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Phone (display + Change link) */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 lg:col-span-3 text-right text-sm text-gray-600 pr-2">
              Phone Number
            </label>
            <div className="col-span-8 lg:col-span-5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 whitespace-nowrap font-mono">
                  {maskedPhone}
                </span>
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 lg:col-span-3 text-right text-sm text-gray-600 pr-2">
              Gender
            </label>
            <div className="col-span-8 lg:col-span-5 flex items-center gap-4 text-sm text-gray-700">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                  className="accent-emerald-600"
                />
                <span>Male</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                  className="accent-emerald-600"
                />
                <span>Female</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={gender === 'other'}
                  onChange={() => setGender('other')}
                  className="accent-emerald-600"
                />
                <span>Other</span>
              </label>
            </div>
          </div>

          {/* Date of birth */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-4 lg:col-span-3 text-right text-sm text-gray-600 pr-2">
              Date of birth
            </label>
            <div className="col-span-8 lg:col-span-5 flex gap-2">
              <select
                className="w-1/3 px-2 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-emerald-600"
                value={dob.day}
                onChange={(e) => setDob((d) => ({ ...d, day: e.target.value }))}
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                className="w-1/3 px-2 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-emerald-600"
                value={dob.month}
                onChange={(e) => setDob((d) => ({ ...d, month: e.target.value }))}
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <select
                className="w-1/3 px-2 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-emerald-600"
                value={dob.year}
                onChange={(e) => setDob((d) => ({ ...d, year: e.target.value }))}
              >
                <option value="">Year</option>
                {Array.from({ length: 60 }).map((_, idx) => {
                  const year = 1965 + idx
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Save button */}
          <div className="grid grid-cols-12">
            <div className="col-span-4 lg:col-span-3" />
            <div className="col-span-8 lg:col-span-5">
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </form>

        {/* Avatar upload placeholder */}
        <div className="mt-8 lg:mt-0 lg:ml-auto pr-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              Select Image
            </div>
            <div className="text-[11px] text-gray-400 text-center">
              File size: maximum 1 MB
              <br />
              File extension: .JPEG, .PNG
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

