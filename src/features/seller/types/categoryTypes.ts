export type Category = {
  id: string
  name: string
  description: string
  slug: string
  parentId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  image: string
}

export type SellerCategoriesState = {
  items: Category[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}