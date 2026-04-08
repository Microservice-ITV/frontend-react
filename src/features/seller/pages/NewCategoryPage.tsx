import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCategoriesDashboardPaths } from '@/features/seller/utils/categoriesDashboardPaths'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppDispatch } from '@/app/hooks'
import { sellerCategoryApi, type CategoryReadItem } from '@/features/seller/api/sellerCategoryApi'
import CategoryForm, {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/features/seller/components/CategoryForm'
import { fetchSellerCategories } from '@/features/seller/store'

const normalizeCategoryId = (item: CategoryReadItem): string =>
  item.id ?? item.categoryId ?? item._id ?? ''

const normalizeCategoryName = (item: CategoryReadItem): string =>
  item.name ?? item.title ?? 'Untitled Category'

const NewCategoryPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const paths = getCategoriesDashboardPaths(location.pathname)
  const [parentCategories, setParentCategories] = useState<Array<{ id: string; name: string }>>([])
  const [parentCategoriesLoading, setParentCategoriesLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
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
        setParentCategories(deduped)
      } catch {
        setParentCategories([])
      } finally {
        setParentCategoriesLoading(false)
      }
    }

    void fetchParentCategories()
  }, [])

  const onSubmit = async ({
    values,
    imageFile,
    existingImageUrl,
  }: {
    values: CategoryFormValues
    imageFile: File | null
    existingImageUrl: string | null
  }) => {
    setSubmitError('')
    setIsSubmitting(true)

    try {
      await sellerCategoryApi.createCategory({
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description.trim() || undefined,
        parentId: values.parentId?.trim() || undefined,
        isActive: values.isActive === 'true',
        imageFile: imageFile ?? undefined,
        existingImageUrl,
      })
      try {
        await dispatch(fetchSellerCategories()).unwrap()
      } catch {
        // Category was created successfully; navigate even if list refresh fails.
      }
      navigate(paths.categoriesList)
    } catch (error: any) {
      const fallback = 'Failed to create category. Please try again.'
      setSubmitError(error?.response?.data?.message ?? error?.message ?? fallback)
    } finally {
      setIsSubmitting(false)
    }
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
        <span className="text-slate-900">New Category</span>
      </nav>
      <CategoryForm
        mode="create"
        resolver={zodResolver(categoryFormSchema)}
        initialValues={{
          name: '',
          description: '',
          slug: '',
          parentId: '',
          isActive: 'false',
          image: '',
        }}
        existingImageUrl={null}
        parentCategories={parentCategories}
        parentCategoriesLoading={parentCategoriesLoading}
        onSubmit={onSubmit}
        submitLabel="Create Category"
        cancelTo={paths.categoriesList}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewCategoryPage