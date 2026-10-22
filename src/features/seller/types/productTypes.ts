export type ProductStatus = 'active' | 'draft' | 'archived'

export type Product = {
  id: string
  title: string
  description: string
  categoryId: string
  categoryName: string
  status: ProductStatus
  /** Shop/catalog stock only. */
  shopStock: number
  /** Warehouse available (catalog mirror). */
  warehouseStock: number
  /** Same as shopStock; used by overview low-stock. */
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