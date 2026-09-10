export interface HomeFeature {
  id: string
  name: string
  slug: string
  iconUrl: string
  sortOrder: number
  isActive: boolean
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

export interface HomeFeaturePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface HomeQuickActionsResponse {
  success?: boolean
  data?: HomeFeature[]
  pagination?: HomeFeaturePagination
}

export interface HomeQuickActionsState {
  items: HomeFeature[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}