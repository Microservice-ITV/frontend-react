import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const NewCategoryPage = () => {
  const navigate = useNavigate()
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
    imageFiles,
    existingImageUrls,
  }: {
    values: CategoryFormValues
    imageFiles: File[]
    existingImageUrls: string[]
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
        imageFiles,
        existingImageUrls,
      })
      navigate('/seller/categories')
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
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/categories" className="hover:text-slate-700">
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
        existingImageUrls={[]}
        parentCategories={parentCategories}
        parentCategoriesLoading={parentCategoriesLoading}
        onSubmit={onSubmit}
        submitLabel="Create Category"
        cancelTo="/seller/categories"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewCategoryPage