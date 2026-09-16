export interface Category {
    id: string
    name: string
    image?: string
    _count?: {
        products: number
    }
}

export interface CategoriesState {
    items: Category[]
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
}