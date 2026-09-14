import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import type {
  GqlGetActiveTimeSlotsData,
  GqlGetFlashDealsData,
  GqlGetFlashDealCampaignsData,
} from '../types/flashDealTypes'

// ─────────────────────────────────────────────
// GraphQL helper (mirrors productApi.ts pattern)
// ─────────────────────────────────────────────
type GraphQLErrorItem = { message?: string }
type GraphQLEnvelope<TData> = { data?: TData; errors?: GraphQLErrorItem[] }

async function postGraphQL<TData>(query: string, variables: Record<string, unknown>): Promise<TData> {
  const response = await ecommerceReadRestClient.post<GraphQLEnvelope<TData>>('/graphql', {
    query,
    variables,
  })

  const graphQLErrors = response.data?.errors ?? []
  if (graphQLErrors.length > 0) {
    const firstMessage = graphQLErrors[0]?.message || 'GraphQL request failed.'
    throw new Error(firstMessage)
  }

  const data = response.data?.data
  if (!data) {
    throw new Error('Empty GraphQL response.')
  }
  return data
}

// ─────────────────────────────────────────────
// GraphQL Queries
// ─────────────────────────────────────────────
const GET_ACTIVE_TIME_SLOTS = `
  query GetActiveTimeSlots {
    getActiveTimeSlots {
      slotId
      slotTime
      startTime
      endTime
      status
    }
  }
`

const GET_FLASH_DEALS = `
  query GetFlashDeals($slotId: ID!, $page: Int, $limit: Int) {
    getFlashDeals(slotId: $slotId, page: $page, limit: $limit) {
      items {
        productId
        variantId
        flashDealItemId
        originalPrice
        dealPrice
        discountPercent
        allocatedStock
        remainingStock
        soldStock
        soldPercent
        maxPerUser
        imageUrl
        title
        shopId
        shopName
        status
      }
      page
      limit
      total
      slot {
        slotId
        slotTime
        startTime
        endTime
        status
      }
    }
  }
`

const GET_FLASH_DEAL_CAMPAIGNS = `
  query GetFlashDealCampaigns {
    getFlashDealCampaigns {
      campaignId
      title
      description
      startTime
      endTime
      status
      slots {
        slotId
        slotTime
        startTime
        endTime
        status
        products {
          productId
          variantId
          flashDealItemId
          originalPrice
          dealPrice
          discountPercent
          allocatedStock
          remainingStock
          soldStock
          soldPercent
          maxPerUser
          imageUrl
          title
          shopId
          shopName
          status
        }
        totalProducts
        totalRemainingStock
        totalAllocatedStock
      }
      createdAt
      updatedAt
    }
  }
`

// ─────────────────────────────────────────────
// API methods
// ─────────────────────────────────────────────
export const flashDealApi = {
  /** Fetch all currently active time slots */
  getActiveTimeSlots: async () => {
    return postGraphQL<GqlGetActiveTimeSlotsData>(GET_ACTIVE_TIME_SLOTS, {})
  },

  /** Fetch flash deal products for a specific slot with pagination */
  getFlashDeals: async (slotId: string, page = 1, limit = 50) => {
    return postGraphQL<GqlGetFlashDealsData>(GET_FLASH_DEALS, { slotId, page, limit })
  },

  /** Fetch all flash deal campaigns (includes nested slots + products) */
  getFlashDealCampaigns: async () => {
    return postGraphQL<GqlGetFlashDealCampaignsData>(GET_FLASH_DEAL_CAMPAIGNS, {})
  },
}
