import { useEffect, useState } from 'react'
import { productClient } from '@/lib/api/productClient'

type ProductRow = {
  id: string
  name?: string
  title?: string
}

type ProductsResponse = {
  success?: boolean
  data?: ProductRow[]
  pagination?: { totalPages: number }
}

const PAGE_SIZE = 100
const MAX_PAGES = 10

let cachedNames: Record<string, string> | null = null
let inflight: Promise<Record<string, string>> | null = null

const fetchProductNames = async (): Promise<Record<string, string>> => {
  const names: Record<string, string> = {}

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await productClient.get<ProductsResponse>('/products', {
      params: { page, limit: PAGE_SIZE },
    })
    const rows = response.data?.data ?? []
    for (const row of rows) {
      const label = row.name ?? row.title
      if (label) names[row.id] = label
    }
    const totalPages = response.data?.pagination?.totalPages ?? page
    if (rows.length === 0 || page >= totalPages) break
  }

  return names
}

export const productLabel = (
  names: Record<string, string>,
  productId: string,
): string => names[productId] ?? `${productId.slice(0, 8)}…`

export const useProductNames = (): Record<string, string> => {
  const [names, setNames] = useState<Record<string, string>>(cachedNames ?? {})

  useEffect(() => {
    if (cachedNames) return
    let alive = true

    inflight ??= fetchProductNames().catch((error) => {
      inflight = null
      throw error
    })

    void inflight
      .then((map) => {
        cachedNames = map
        if (alive) setNames(map)
      })
      .catch(() => {
        // keep whatever we have; labels fall back to short ids
      })

    return () => {
      alive = false
    }
  }, [])

  return names
}
