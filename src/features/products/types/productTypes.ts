// Product used in LIST (grid, cards)
export interface Product {
  id: string
  name: string
  price: number
  images: string[]
  categoryId: string
}

// Product used in DETAILS page
export interface ProductDetail {
  id: string
  name: string
  slug: string
  description?: string
  sku?: string
  stock?: number
  price: number
  images: string[]
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
    parentId: string | null
  }

  shop: {
    id: string
    name: string
    slug: string
  }
}

// Redux state
export interface ProductsState {
  items: Product[]
  selectedProduct: ProductDetail | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}