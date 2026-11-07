import { QueryClient } from '@tanstack/react-query'

/** Shared client for storefront server-state cache (home first). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000, //	5 minutes
      gcTime: 30 * 60_000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
