import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Building2, Pencil, Trash2 } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { adminShopApi, type ShopReadItem } from '../api/adminShopApi'
import { fetchAdminShops } from '../store/adminShopsThunks'

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusLabel = (shop: ShopReadItem): string => {
  const code = shop.shopStatus?.code?.toUpperCase()
  if (code === 'PENDING') return 'Pending approval'
  if (code === 'REJECTED') return 'Rejected'
  if (shop.isActive) return 'Live'
  return 'Inactive'
}

const AdminShopDetailPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [shop, setShop] = useState<ShopReadItem | null>(null)

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
        const data = res.data?.data ?? null
        if (!cancelled) {
          setShop(data)
          if (!data) setLoadError('Shop not found.')
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(adminShopApi.getApiErrorMessage(e, 'Failed to load shop.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [shopId])

  const displayName = shop?.name?.trim() || 'Shop'

  const confirmDelete = () => {
    if (!shopId || !shop) return
    openModal({
      title: 'Delete shop?',
      content: (
        <p>
          Are you sure you want to delete <strong>{displayName}</strong>? This cannot be undone. Shops with
          products cannot be deleted until products are removed.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await adminShopApi.deleteShop(shopId)
        try {
          await dispatch(fetchAdminShops()).unwrap()
        } catch {
          // list refresh best-effort
        }
        navigate('/super-admin/shops')
      },
    })
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
        <span className="text-slate-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading shop details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{loadError}</div>
      )}

      {!loading && !loadError && shop && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{displayName}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/super-admin/shops/${shopId}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Shop details</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{shop.name}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Description</p>
                  <p className="mt-1 text-xs text-slate-800">{shop.description?.trim() || '—'}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Slug</p>
                  <p className="mt-1 text-sm text-slate-900">{shop.slug}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <p className="mt-1 text-sm text-slate-900">{statusLabel(shop)}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Owner</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {shop.userName ?? '—'}
                    {shop.userId ? (
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">{shop.userId}</span>
                    ) : null}
                  </p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Seller contact</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {[shop.sellerContactEmail, shop.sellerContactPhone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Origin address</p>
                  <p className="mt-1 text-xs text-slate-800">{shop.originAddress?.trim() || '—'}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Created</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(shop.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Updated</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(shop.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Products in catalog</p>
                    <p className="text-lg font-semibold text-slate-900">{shop._count?.products ?? 0}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminShopDetailPage