// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountingClient } from '@/lib/api/accountingClient'
import { shippingApi } from '../api/shippingApi'
import { useCheckoutDeliveryCompany } from './useCheckoutDeliveryCompany'

vi.mock('@/lib/api/accountingClient', () => ({
  accountingClient: {
    get: vi.fn(),
  },
}))

vi.mock('../api/shippingApi', () => ({
  shippingApi: {
    listActiveDeliveryCompanies: vi.fn(),
    districtRouteAvailability: vi.fn(),
  },
}))

const company = {
  id: 'dni-express',
  code: 'DNI',
  name: 'DNI Express',
  description: null,
  logoUrl: null,
  status: 'ACTIVE' as const,
}

const routes = [{
  shopId: 'shop-1',
  fromDistrictId: 'district-1',
  toDistrictId: 'district-2',
}]
const shopIds = ['shop-1']

function mockCompanies() {
  vi.mocked(shippingApi.listActiveDeliveryCompanies).mockResolvedValue({
    data: { data: { companies: [company] } },
  } as never)
}

function mockShopConfiguration() {
  vi.mocked(accountingClient.get).mockResolvedValue({
    data: { configurations: [{ deliveryCompanyId: company.id }] },
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  mockCompanies()
  mockShopConfiguration()
})

afterEach(() => {
  cleanup()
})

describe('useCheckoutDeliveryCompany', () => {
  it('keeps configured companies available when REAL_ROUTE has no district company list', async () => {
    vi.mocked(shippingApi.districtRouteAvailability).mockResolvedValue({
      data: {
        data: {
          calculationMethod: 'REAL_ROUTE',
          availableCompanyIds: null,
        },
      },
    } as never)

    const { result } = renderHook(() => useCheckoutDeliveryCompany(shopIds, routes))

    await waitFor(() => expect(result.current.routesReady).toBe(true))

    expect(result.current.unavailableCompanyIdsByShop['shop-1']).toEqual([])
    expect(result.current.companyByShopId['shop-1']).toBe(company.id)
  })

  it('still blocks configured companies without a CITY_ROUTE for the selected districts', async () => {
    vi.mocked(shippingApi.districtRouteAvailability).mockResolvedValue({
      data: {
        data: {
          calculationMethod: 'CITY_ROUTE',
          availableCompanyIds: [],
        },
      },
    } as never)

    const { result } = renderHook(() => useCheckoutDeliveryCompany(shopIds, routes))

    await waitFor(() => expect(result.current.routesReady).toBe(true))

    expect(result.current.unavailableCompanyIdsByShop['shop-1']).toEqual([company.id])
    expect(result.current.companyByShopId['shop-1']).toBeUndefined()
  })
})
