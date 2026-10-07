import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminShopApi, type ShopReadItem } from '../api/adminShopApi'
import ShopOriginFields, { emptyShopOrigin, type ShopOriginValue } from '../components/ShopOriginFields'
import { loadAllCities } from '../api/locationOptions'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const parseCoordinate = (value: unknown): number | null => {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

const AdminShopEditPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [userName, setUserName] = useState('')
  const [sellerContactEmail, setSellerContactEmail] = useState('')
  const [sellerContactPhone, setSellerContactPhone] = useState('')
  const [origin, setOrigin] = useState<ShopOriginValue>(emptyShopOrigin)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!shopId) {
      setLoadError('Invalid shop id.')
      setLoading(false)
      return
    }

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await adminShopApi.getShop(shopId)
        const s: ShopReadItem | null = res.data?.data ?? null
        if (!s) {
          if (!cancelled) setLoadError('Shop not found.')
          return
        }
        const cityId = s.cityId != null && String(s.cityId).trim() ? String(s.cityId) : ''
        const districtId = s.districtId != null && String(s.districtId).trim() ? String(s.districtId) : ''
        let stateId = ''
        if (cityId) {
          try {
            const cities = await loadAllCities()
            const match = cities.find((city) => city.id === cityId)
            if (match) stateId = String(match.stateId)
          } catch {
            stateId = ''
          }
        }
        if (cancelled) return
        setName(s.name ?? '')
        setDescription(s.description ?? '')
        setSlug(s.slug ?? '')
        setUserName(s.userName ?? '')
        setSellerContactEmail(s.sellerContactEmail ?? '')
        setSellerContactPhone(s.sellerContactPhone ?? '')
        setIsActive(Boolean(s.isActive))
        setOrigin({
          stateId,
          cityId,
          districtId,
          originAddress: '',
          originLat: parseCoordinate(s.originLat),
          originLng: parseCoordinate(s.originLng),
        })
      } catch (e: unknown) {
        if (!cancelled) setLoadError(adminShopApi.getApiErrorMessage(e, 'Failed to load shop.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [shopId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!shopId) return
    setSubmitError('')
    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()
    if (!trimmedName) {
      setSubmitError('Name is required.')
      return
    }
    if (!trimmedSlug || !SLUG_PATTERN.test(trimmedSlug)) {
      setSubmitError('Slug must be lowercase letters, numbers, and single hyphens only.')
      return
    }
    const uname = userName.trim()
    if (!uname) {
      setSubmitError('Display name (user name) is required.')
      return
    }
    if (!origin.stateId || !origin.cityId || !origin.districtId || !origin.wardId) {
      setSubmitError('Select the shop state, city, district, and ward.')
      return
    }
    const originAddress = origin.originAddress.trim()
    if (!originAddress) {
      setSubmitError('Select the shop state, city, district, and ward.')
      return
    }
    if (origin.originLat == null || origin.originLng == null) {
      setSubmitError('Drop a map pin for the shop origin.')
      return
    }

    setIsSubmitting(true)
    try {
      await adminShopApi.updateShop(shopId, {
        name: trimmedName,
        description: description.trim() || undefined,
        slug: trimmedSlug,
        userName: uname,
        sellerContactEmail: sellerContactEmail.trim() || null,
        sellerContactPhone: sellerContactPhone.trim() || null,
        cityId: origin.cityId,
        districtId: origin.districtId,
        originAddress,
        originLat: origin.originLat,
        originLng: origin.originLng,
        isActive,
      })
      navigate(`/super-admin/shops/${shopId}`)
    } catch (err: unknown) {
      setSubmitError(adminShopApi.getApiErrorMessage(err, 'Could not save changes.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/shops" className="hover:text-slate-700">
          Shops
        </Link>
        <span className="mx-1">/</span>
        <Link to={shopId ? `/super-admin/shops/${shopId}` : '/super-admin/shops'} className="hover:text-slate-700">
          {name || 'Shop'}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading...</div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{loadError}</div>
      )}

      {!loading && !loadError && shopId && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-slate-900">Edit shop</h1>
            <button
              type="button"
              onClick={() => navigate(`/super-admin/shops/${shopId}`)}
              className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          >
            {submitError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</p>
            )}

            <div>
              <label htmlFor="shop-name" className="block text-xs font-medium text-slate-600">
                Shop name
              </label>
              <input
                id="shop-name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="shop-desc" className="block text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                id="shop-desc"
                value={description}
                onChange={(ev) => setDescription(ev.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="shop-slug" className="block text-xs font-medium text-slate-600">
                Slug
              </label>
              <input
                id="shop-slug"
                value={slug}
                onChange={(ev) => setSlug(ev.target.value.toLowerCase())}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                required
              />
              <p className="mt-1 text-[11px] text-slate-500">Lowercase, numbers, hyphens only.</p>
            </div>

            <div>
              <label htmlFor="shop-user-name" className="block text-xs font-medium text-slate-600">
                Owner display name
              </label>
              <input
                id="shop-user-name"
                value={userName}
                onChange={(ev) => setUserName(ev.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="shop-email" className="block text-xs font-medium text-slate-600">
                  Seller email
                </label>
                <input
                  id="shop-email"
                  type="email"
                  value={sellerContactEmail}
                  onChange={(ev) => setSellerContactEmail(ev.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="shop-phone" className="block text-xs font-medium text-slate-600">
                  Seller phone
                </label>
                <input
                  id="shop-phone"
                  value={sellerContactPhone}
                  onChange={(ev) => setSellerContactPhone(ev.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <ShopOriginFields value={origin} onChange={setOrigin} />

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(ev) => setIsActive(ev.target.checked)}
                className="rounded border-slate-300"
              />
              Shop is active (visible when approved)
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default AdminShopEditPage