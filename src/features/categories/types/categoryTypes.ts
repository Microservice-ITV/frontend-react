export interface Category {
    id: string
    name: string
    image?: string
}

export interface CategoriesState {
    items: Category[]
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
}