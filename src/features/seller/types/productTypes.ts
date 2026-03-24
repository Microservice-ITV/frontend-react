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