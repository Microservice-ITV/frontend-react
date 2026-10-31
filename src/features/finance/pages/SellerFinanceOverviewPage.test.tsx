import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { ROUTE_ACCESS } from '@/routes/routeAccessMap'
import SellerFinanceOverviewPage from './SellerFinanceOverviewPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('keeps the existing Finance Dashboard route capability unchanged', () => {
  expect(ROUTE_ACCESS.sellerFinanceOverview).toEqual([CAPABILITIES.FINANCE_DASHBOARD_VIEW])
})

it('preserves the existing overview metrics without embedding AR/AP', () => {
  render(<MemoryRouter><SellerFinanceOverviewPage /></MemoryRouter>)

  expect(screen.getByRole('heading', { name: 'Finance Overview' })).toBeInTheDocument()
  expect(screen.getByText('$12,450.00')).toBeInTheDocument()
  expect(screen.getByText('$3,280.00')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Receivables & Payables/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'AR/AP ledger' })).not.toBeInTheDocument()
})
