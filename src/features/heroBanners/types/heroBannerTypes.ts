export interface HeroBanner {
  id: string
  imageUrl: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateHeroBannerPayload {
  sortOrder?: number
  isActive?: boolean
  imageFile: File
}

export interface UpdateHeroBannerPayload {
  sortOrder?: number
  isActive?: boolean
  imageFile?: File
}

export interface HeroBannerPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface HeroBannersResponse {
  success: boolean
  data: HeroBanner[]
  pagination: HeroBannerPagination
}

export interface HeroBannerResponse {
  success: boolean
  data: HeroBanner
}
