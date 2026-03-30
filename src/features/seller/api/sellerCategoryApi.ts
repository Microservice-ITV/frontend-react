import { AxiosResponse } from 'axios'
import { productClient } from '@/lib/api/productClient'

export type CategoryReadItem = {
  id?: string
  _id?: string
  categoryId?: string
  name?: string
  title?: string
  description?: string
  slug?: string
  parentId?: string | null
  parent_id?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  image?: string
  imageUrl?: string
  images?: string[]
  imageUrls?: string[]
}

type CategoriesApiResponse = {
  success?: boolean
  data?: CategoryReadItem[]
  items?: CategoryReadItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  page?: number
  limit?: number
  total?: number
}

type CategoryCreatePayload = {
  name: string
  slug: string
  description?: string
  parentId?: string
  isActive: boolean
  imageFile?: File
  existingImageUrl?: string | null
}

type CategoryUpdatePayload = Partial<{
  name: string
  slug: string
  description: string
  parentId: string
  isActive: boolean
  imageFile: File
  existingImageUrl: string | null
}>

const appendCategoryPayloadFields = (
  formData: FormData,
  payload: CategoryCreatePayload | CategoryUpdatePayload,
) => {
  if (payload.name !== undefined) formData.append('name', payload.name)
  if (payload.slug !== undefined) formData.append('slug', payload.slug)
  if (payload.description !== undefined) formData.append('description', payload.description)
  if (payload.parentId !== undefined) formData.append('parentId', payload.parentId)
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive))
}

const appendExistingFallbackImage = (
  formData: FormData,
  payload: CategoryCreatePayload | CategoryUpdatePayload,
) => {
  if (payload.existingImageUrl) {
    // Keep an existing image reference when no new file is provided.
    formData.append('image', payload.existingImageUrl)
  }
}

export const sellerCategoryApi = {
  listCategories(
    params: { page?: number; limit?: number } = {},
  ): Promise<AxiosResponse<CategoriesApiResponse>> {
    return productClient.get('/categories', { params })
  },

  createCategory(
    payload: CategoryCreatePayload,
  ): Promise<AxiosResponse<{ success?: boolean; data?: CategoryReadItem }>> {
    const formData = new FormData()
    appendCategoryPayloadFields(formData, payload)

    if (payload.imageFile) {
      formData.append('image', payload.imageFile)
    } else {
      appendExistingFallbackImage(formData, payload)
    }

    return productClient.post('/categories', formData)
  },

  getCategoryById(
    id: string,
  ): Promise<AxiosResponse<{ success?: boolean; data?: CategoryReadItem }>> {
    return productClient.get(`/categories/${id}`)
  },

  updateCategory(
    id: string,
    payload: CategoryUpdatePayload,
  ): Promise<AxiosResponse<{ success?: boolean; data?: CategoryReadItem }>> {
    const formData = new FormData()
    appendCategoryPayloadFields(formData, payload)
    if (payload.imageFile) {
      formData.append('image', payload.imageFile)
    } else {
      appendExistingFallbackImage(formData, payload)
    }

    return productClient.patch(`/categories/${id}`, formData)
  },

  deleteCategory(id: string): Promise<AxiosResponse<{ success?: boolean; message?: string }>> {
    return productClient.delete(`/categories/${id}`)
  },
}