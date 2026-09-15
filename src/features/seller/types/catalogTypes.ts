export type CatalogEntityKey = 'brand' | 'color' | 'size'

export type CatalogItem = {
  id: string
  code: string
  name: string
  slug?: string
  createdAt: string
  updatedAt: string
  _count?: {
    products?: number
    variants?: number
  }
}

export type CatalogListResponse = {
  success?: boolean
  data?: CatalogItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CatalogDetailResponse = {
  success?: boolean
  data?: CatalogItem
}

export type CatalogCreatePayload = {
  name: string
  code: string
  slug?: string
}

export type CatalogUpdatePayload = Partial<CatalogCreatePayload>
