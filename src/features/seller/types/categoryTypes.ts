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