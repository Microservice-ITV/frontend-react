import type { TopOrderedProduct } from '../types/topOrderedProductTypes'

// Replace this module with the GET /catalog/products/top-ordered response mapper.
export const topOrderedProductsMock: TopOrderedProduct[] = [
    {
        id: 'top-ordered-iphone-glass',
        name: 'iPhone Tempered Glass Protector',
        image: 'https://images.unsplash.com/photo-1609592424987-7c7d4b4d8a1b?auto=format&fit=crop&w=640&q=80',
        price: 8.9,
        currency: '$',
        totalOrdered: 37000,
    },
    {
        id: 'top-ordered-handheld-fan',
        name: 'Portable Handheld Fan',
        image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=640&q=80',
        price: 12.5,
        currency: '$',
        totalOrdered: 26000,
    },
    {
        id: 'top-ordered-baby-wipes',
        name: 'Gentle Baby Wet Wipes',
        image: 'https://images.unsplash.com/photo-1584839404042-8bcf6b0f6baf?auto=format&fit=crop&w=640&q=80',
        price: 6.9,
        currency: '$',
        totalOrdered: 22000,
    },
    {
        id: 'top-ordered-type-c-cable',
        name: 'Fast Charge Type-C Cable',
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=640&q=80',
        price: 9.9,
        currency: '$',
        totalOrdered: 21000,
    },
    
    {
        id: 'top-ordered-diaper',
        name: 'Comfort Care Baby Diapers',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77ebe?auto=format&fit=crop&w=640&q=80',
        price: 18.9,
        currency: '$',
        totalOrdered: 18000,
    },
]