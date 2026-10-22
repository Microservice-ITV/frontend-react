import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import SellerOrdersPage from './SellerOrdersPage'
import { fetchSellerOrderPage, type SellerOrderPage } from '../api/sellerOrderApi'

vi.mock('@/app/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { id: 'seller-1', active_shop_id: 'shop-1' } },
  }),
}))
vi.mock('../api/sellerOrderApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('../api/sellerOrderApi')>(),
  fetchSellerOrderPage: vi.fn(),
  fetchCustomerAvatars: vi.fn().mockResolvedValue({}),
}))

afterEach(() => { cleanup(); vi.clearAllMocks() })

const result = (id: string, page = 1): SellerOrderPage => ({
  items: [{ orderId: id, customerId: 'buyer', status: 'CONFIRMED',
    items: [], totals: { total: 100, currency: 'MMK' } }],
  page, limit: 10, total: 25,
})

it('requests server pages and ignores responses superseded by a tab change', async () => {
  const requests: Array<{ resolve: (value: SellerOrderPage) => void; signal?: AbortSignal }> = []
  vi.mocked(fetchSellerOrderPage).mockImplementation((_params, signal) => new Promise((resolve) => {
    requests.push({ resolve, signal })
  }))
  render(<MemoryRouter><SellerOrdersPage /></MemoryRouter>)
  await waitFor(() => expect(requests).toHaveLength(1))
  await act(async () => requests[0].resolve(result('first-order')))
  expect(screen.getByText('Showing 1-10 of 25 results')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitFor(() => expect(requests).toHaveLength(2))
  expect(vi.mocked(fetchSellerOrderPage).mock.calls[1][0]).toMatchObject({ page: 2, limit: 10 })
  fireEvent.click(screen.getByRole('button', { name: 'To Ship' }))
  await waitFor(() => expect(requests).toHaveLength(3))
  expect(requests[1].signal?.aborted).toBe(true)
  expect(vi.mocked(fetchSellerOrderPage).mock.calls[2][0]).toMatchObject({ page: 1, statusFilter: 'to-ship' })
  await act(async () => requests[2].resolve(result('current-order')))
  await act(async () => requests[1].resolve(result('stale-order', 2)))
  expect(screen.getAllByText(/current-order/).length).toBeGreaterThan(0)
  expect(screen.queryByText(/stale-order/)).not.toBeInTheDocument()
})

it('debounces server search and cancels work on unmount', async () => {
  vi.mocked(fetchSellerOrderPage).mockResolvedValue(result('initial-order'))
  const view = render(<MemoryRouter><SellerOrdersPage /></MemoryRouter>)
  await waitFor(() => expect(fetchSellerOrderPage).toHaveBeenCalledTimes(1))
  fireEvent.change(screen.getByPlaceholderText('Search orders...'), { target: { value: 'shoe' } })
  expect(fetchSellerOrderPage).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(fetchSellerOrderPage).toHaveBeenCalledTimes(2))
  expect(vi.mocked(fetchSellerOrderPage).mock.calls[1][0]).toMatchObject({ search: 'shoe', page: 1 })
  const signal = vi.mocked(fetchSellerOrderPage).mock.calls[1][1]
  view.unmount()
  expect(signal?.aborted).toBe(true)
})
