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
  imageFiles?: File[]
  existingImageUrls?: string[]
}

type CategoryUpdatePayload = Partial<{
  name: string
  slug: string
  description: string
  parentId: string
  isActive: boolean
  imageFiles: File[]
  existingImageUrls: string[]
}>

const isUnexpectedUploadFieldError = (error: any): boolean => {
  const status = error?.response?.status
  const message = String(error?.response?.data?.message ?? error?.message ?? '')
  return status === 400 && /unexpected field/i.test(message)
}

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
  const firstExisting = payload.existingImageUrls?.[0]
  if (firstExisting) {
    // Keep an existing image reference when no new file is provided.
    formData.append('image', firstExisting)
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

    if (payload.imageFiles?.length) {
      // Forward-compatible request for multi-image category upload.
      payload.imageFiles.forEach((file) => formData.append('images', file))
    } else {
      appendExistingFallbackImage(formData, payload)
    }

    return productClient.post('/categories', formData).catch(async (error) => {
      if (!payload.imageFiles?.length || !isUnexpectedUploadFieldError(error)) {
        throw error
      }
      // Backward-compat fallback for current backend (`upload.single('image')`).
      const fallback = new FormData()
      appendCategoryPayloadFields(fallback, payload)
      fallback.append('image', payload.imageFiles[0])
      return productClient.post('/categories', fallback)
    })
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
    if (payload.imageFiles?.length) {
      // Forward-compatible request for multi-image category upload.
      payload.imageFiles.forEach((file) => formData.append('images', file))
    } else {
      appendExistingFallbackImage(formData, payload)
    }

    return productClient.patch(`/categories/${id}`, formData).catch(async (error) => {
      if (!payload.imageFiles?.length || !isUnexpectedUploadFieldError(error)) {
        throw error
      }
      // Backward-compat fallback for current backend (`upload.single('image')`).
      const fallback = new FormData()
      appendCategoryPayloadFields(fallback, payload)
      fallback.append('image', payload.imageFiles[0])
      return productClient.patch(`/categories/${id}`, fallback)
    })
  },
}