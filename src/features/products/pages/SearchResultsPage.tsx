import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { searchProducts } from '@/features/products/store/productThunks'
import ProductGrid from '../components/ProductGrid'
import ProductSortBar from '../components/ProductSortBar'

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') ?? ''
    const dispatch = useAppDispatch()
    const [sort, setSort] = useState<string>('popular')
    
    // Fallback selectors in case your slice state uses slightly different naming conventions
    const searchResults = useAppSelector((s) => s.products.searchResults || [])
    const searchStatus = useAppSelector((s) => s.products.searchStatus || 'idle')
    const searchError = useAppSelector((s) => s.products.searchError || null)

    useEffect(() => {
        const trimmedQuery = query.trim()
        if (trimmedQuery) {
            dispatch(searchProducts({ query: trimmedQuery, sort }))
        }
    }, [dispatch, query, sort])

    return (
        // Note: Added pt-32 here so the search page doesn't get hidden under your fixed navbar!
        <div className="bg-[#f5f5f5] min-h-screen pt-32 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Search results for &ldquo;{query}&rdquo;
                    </h1>
                </div>

                <ProductSortBar sort={sort} onSortChange={setSort} />

                {searchStatus === 'loading' && (
                    <div className="py-20 text-center text-sm text-gray-500 font-medium">
                        Searching products...
                    </div>
                )}

                {searchStatus === 'failed' && (
                    <div className="py-20 text-center text-sm text-red-500 font-medium">
                        {searchError || 'Search failed. Please try again.'}
                    </div>
                )}

                {searchStatus === 'succeeded' && searchResults.length === 0 && (
                    <div className="py-20 text-center text-sm text-gray-500 font-medium">
                        No products found matching &ldquo;{query}&rdquo;
                    </div>
                )}

                {searchStatus === 'succeeded' && searchResults.length > 0 && (
                    <div>
                        <p className="text-sm text-gray-500 mb-6 bg-white p-3 rounded shadow-sm inline-block">
                            <span className="font-semibold text-emerald-600">{searchResults.length}</span> product{searchResults.length !== 1 ? 's' : ''} found
                        </p>
                        <ProductGrid products={searchResults} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchResultsPage