import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { sellerCategoryApi, type CategoryReadItem } from '@/features/seller/api/sellerCategoryApi'
import CategoryForm, {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/seller/components/CategoryForm'

const normalizeCategoryId = (item: CategoryReadItem): string =>
  item.id ?? item.categoryId ?? item._id ?? ''

const normalizeCategoryName = (item: CategoryReadItem): string =>
  item.name ?? item.title ?? 'Untitled Category'

const normalizeImageUrls = (item: CategoryReadItem): string[] => {
  const candidates = [
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
    item.image,
    item.imageUrl,
  ]
  return candidates
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .filter((value, index, arr) => arr.indexOf(value) === index)
}

const EditCategoryPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [parentCategories, setParentCategories] = useState<Array<{ id: string; name: string }>>([])
  const [parentCategoriesLoading, setParentCategoriesLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadingCategory, setLoadingCategory] = useState(true)
  const [initialValues, setInitialValues] = useState<CategoryFormValues | null>(null)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid category id.')
      setLoadingCategory(false)
      return
    }

    let isCancelled = false

    const fetchCategory = async () => {
      setLoadingCategory(true)
      setLoadError('')
      try {
        const response = await sellerCategoryApi.getCategoryById(id)
        const item = response.data?.data
        if (!item) {
          if (!isCancelled) {
            setLoadError('Category not found.')
          }
          return
        }

        if (!isCancelled) {
          setExistingImageUrls(normalizeImageUrls(item))
          setInitialValues({
            name: (item.name ?? item.title ?? '').trim(),
            description: (item.description ?? '').trim(),
            slug: (item.slug ?? '').trim(),
            parentId: item.parentId ?? item.parent_id ?? '',
            isActive: item.isActive ? 'true' : 'false',
            image: item.image ?? item.imageUrl ?? '',
          })
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(error?.response?.data?.message ?? 'Failed to load category.')
        }
      } finally {
        if (!isCancelled) {
          setLoadingCategory(false)
        }
      }
    }

    void fetchCategory()

    return () => {
      isCancelled = true
    }
  }, [id])

  useEffect(() => {
    let isCancelled = false

    const fetchParentCategories = async () => {
      setParentCategoriesLoading(true)
      try {
        const rows: Array<{ id: string; name: string }> = []
        let page = 1
        let totalPages = 1

        do {
          const response = await sellerCategoryApi.listCategories({ page, limit: 100 })
          const body = response.data
          const items = body.data ?? body.items ?? []

          rows.push(
            ...items
              .map((item) => ({
                id: normalizeCategoryId(item),
                name: normalizeCategoryName(item),
              }))
              .filter((item) => item.id),
          )

          totalPages = body.pagination?.totalPages ?? 1
          page += 1
        } while (page <= totalPages)

        const deduped = rows.filter(
          (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
        )

        if (!isCancelled) {
          setParentCategories(id ? deduped.filter((row) => row.id !== id) : deduped)
        }
      } catch {
        if (!isCancelled) {
          setParentCategories([])
        }
      } finally {
        if (!isCancelled) {
          setParentCategoriesLoading(false)
        }
      }
    }

    void fetchParentCategories()

    return () => {
      isCancelled = true
    }
  }, [id])

  const onSubmit = async ({
    values,
    imageFiles,
    existingImageUrls,
  }: {
    values: CategoryFormValues
    imageFiles: File[]
    existingImageUrls: string[]
  }) => {
    if (!id) return

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await sellerCategoryApi.updateCategory(id, {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description.trim(),
        parentId: values.parentId?.trim() || undefined,
        isActive: values.isActive === 'true',
        imageFiles,
        existingImageUrls,
      })
      navigate('/seller/categories')
    } catch (error: any) {
      const fallback = 'Failed to update category. Please try again.'
      setSubmitError(error?.response?.data?.message ?? error?.message ?? fallback)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/categories" className="hover:text-slate-700">
          Categories
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Category</span>
      </nav>

      {loadingCategory && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading category details...
        </div>
      )}

      {!loadingCategory && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingCategory && !loadError && initialValues && (
        <CategoryForm
          mode="edit"
          resolver={zodResolver(categoryFormSchema)}
          initialValues={initialValues}
          existingImageUrls={existingImageUrls}
          parentCategories={parentCategories}
          parentCategoriesLoading={parentCategoriesLoading}
          onSubmit={onSubmit}
          submitLabel="Update Category"
          cancelTo="/seller/categories"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  )
}

export default EditCategoryPage