import type {
  AdminDistanceRangeDto,
  AdminWeightRateDto,
  DeliveryPricingRuleDto,
  DeliveryQuoteDto,
} from '../api/adminShippingApi'

export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export type AdminPricingRulesState = {
  items: DeliveryPricingRuleDto[]
  status: AsyncStatus
  error: string | null
  total: number
  page: number
  pageSize: number
  mutationStatus: AsyncStatus
  mutationError: string | null
}

export type AdminWeightRatesState = {
  items: AdminWeightRateDto[]
  status: AsyncStatus
  error: string | null
  total: number
  page: number
  pageSize: number
  mutationStatus: AsyncStatus
  mutationError: string | null
}

export type AdminDistanceRangesState = {
  items: AdminDistanceRangeDto[]
  status: AsyncStatus
  error: string | null
  total: number
  page: number
  pageSize: number
  mutationStatus: AsyncStatus
  mutationError: string | null
}

export type AdminDeliveryQuotesState = {
  items: DeliveryQuoteDto[]
  status: AsyncStatus
  error: string | null
  total: number
  page: number
  pageSize: number
  mutationStatus: AsyncStatus
  mutationError: string | null
}
