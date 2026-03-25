import { createAsyncThunk } from '@reduxjs/toolkit'
import { sellerCategoryApi, type CategoryReadItem } from '../api/sellerCategoryApi'
import type { Category } from '../types/categoryTypes'
import type { RootState } from '@/app/store'

const PAGE_LIMIT = 100

const mapCategoryToUi = (item: CategoryReadItem): Category => {
  const id = item.id ?? item._id ?? item.categoryId ?? ''
  return {
    id,
    name: item.name ?? item.title ?? 'Unnamed category',
    description: item.description ?? 'No description',
    slug: item.slug ?? '',
    parentId: item.parentId ?? item.parent_id ?? null,
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
    image: item.image ?? item.imageUrl ?? '',
  }
}

export const fetchSellerCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string; state: RootState }
>(
  'sellerCategories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      let pageCursor = 1
      let totalPages = 1
      const collected: CategoryReadItem[] = []

      do {
        const response = await sellerCategoryApi.listCategories({
          page: pageCursor,
          limit: PAGE_LIMIT,
        })

        const payload = response.data
        const items = payload.data ?? payload.items ?? []
        totalPages = payload.pagination?.totalPages ?? 1
        collected.push(...items)
        pageCursor += 1
      } while (pageCursor <= totalPages)

      return collected
        .map(mapCategoryToUi)
        .filter((item) => Boolean(item.id))
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load categories right now. Please try again.'
      return rejectWithValue(message)
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState()
      return state.sellerCategories.status !== 'loading'
    },
  },
)