export type ProductStatus = 'active' | 'draft' | 'archived'

export type Product = {
  id: string
  title: string
  description: string
  category: string
  status: ProductStatus
  stock: number
  price: string
  created: string
}

export type SellerProductsState = {
  items: Product[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  activeShopId: string | null
}