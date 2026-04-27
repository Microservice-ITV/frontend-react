import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { getCategoriesDashboardPaths } from '@/features/seller/utils/categoriesDashboardPaths'
import { CalendarDays, Pencil, Tag, Trash2 } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { fetchSellerCategories } from '@/features/seller/store'
import { sellerCategoryApi, type CategoryReadItem } from '@/features/seller/api/sellerCategoryApi'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const normalizeImageUrl = (item: CategoryReadItem): string => {
  const candidates = [
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
    item.image,
    item.imageUrl,
  ]
  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0) ?? ''
}

const normalizeCategoryId = (item: CategoryReadItem): string =>
  item.id ?? item.categoryId ?? item._id ?? ''

const normalizeCategoryName = (item: CategoryReadItem): string =>
  item.name ?? item.title ?? 'Untitled Category'

const SellerCategoryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const paths = getCategoriesDashboardPaths(location.pathname)
  const canManageCategories = useCan(CAPABILITIES.CATEGORIES_MANAGE)
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [item, setItem] = useState<CategoryReadItem | null>(null)
  const [allCategories, setAllCategories] = useState<CategoryReadItem[]>([])

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid category id.')
      setLoading(false)
      return
    }

    let isCancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const categoryResponse = await sellerCategoryApi.getCategoryById(id)
        const detail = categoryResponse.data?.data ?? null
        if (!isCancelled) {
          setItem(detail)
          if (!detail) {
            setLoadError('Category not found.')
          }
        }

        try {
          const listResponse = await sellerCategoryApi.listCategories({ page: 1, limit: 200 })
          const list = listResponse.data?.data ?? listResponse.data?.items ?? []
          if (!isCancelled) {
            setAllCategories(list)
          }
        } catch {
          if (!isCancelled) {
            setAllCategories([])
          }
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(error?.response?.data?.message ?? 'Failed to load category details.')
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      isCancelled = true
    }
  }, [id])

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    allCategories.forEach((category) => {
      const categoryId = normalizeCategoryId(category)
      if (!categoryId) return
      map.set(categoryId, normalizeCategoryName(category))
    })
    return map
  }, [allCategories])

  const displayName = normalizeCategoryName(item ?? {})
  const displaySlug = item?.slug ?? '—'
  const displayDescription = item?.description?.trim() || 'No description'
  const parentId = item?.parentId ?? item?.parent_id ?? null
  const displayParent =
    typeof parentId === 'string' && parentId.trim().length > 0
      ? categoryNameById.get(parentId) ?? parentId
      : 'None (Top-level category)'
  const displayCreated = formatDate(item?.createdAt)
  const imageUrl = item ? normalizeImageUrl(item) : ''

  const confirmDelete = () => {
    if (!id || !item) return
    openModal({
      title: 'Delete category?',
      content: (
        <p>
          Are you sure you want to delete <strong>{displayName}</strong>? This action cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await sellerCategoryApi.deleteCategory(id)
        try {
          await dispatch(fetchSellerCategories()).unwrap()
        } catch {
          // Keep delete flow successful even if list refresh fails.
        }
        navigate(paths.categoriesList)
      },
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to={paths.categoriesList} className="hover:text-slate-700">
          Categories
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading category details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loading && !loadError && item && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {displayName}
            </h1>
            {canManageCategories && id && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(paths.editCategory(id))}
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
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Category Details</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{displayName}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Slug</p>
                  <p className="mt-1 text-sm text-slate-800">{displaySlug}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Description</p>
                  <p className="mt-1 text-sm text-slate-800">{displayDescription}</p>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Status</p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Parent</p>
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {displayParent}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Created</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <CalendarDays size={16} className="text-slate-500" />
                      {displayCreated}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Image</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                {imageUrl ? (
                  <img
                    src={productServiceAssetUrl(imageUrl)}
                    alt={displayName}
                    className="h-[280px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[280px] items-center justify-center">
                    <Tag size={64} className="text-slate-500" />
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default SellerCategoryDetailPage