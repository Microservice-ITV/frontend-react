import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import SalaryApprovalsPage from './SalaryApprovalsPage'

afterEach(cleanup)

describe('SalaryApprovalsPage', () => {
  it('shows seeded salary requests and allows local review actions', () => {
    render(
      <MemoryRouter>
        <SalaryApprovalsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('3 awaiting review')).toBeInTheDocument()
    expect(screen.getByText('Aung Min')).toBeInTheDocument()
    expect(screen.getByText('MMK 2,650,000')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Approve Aung Min' }))

    expect(screen.getByText('2 awaiting review')).toBeInTheDocument()
    expect(screen.getAllByText('Approved')).toHaveLength(3)
    expect(screen.getByText(/Demo data only/)).toBeInTheDocument()
  })

  it('filters requests by status and search term', () => {
    render(
      <MemoryRouter>
        <SalaryApprovalsPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Rejected' }))
    expect(screen.getByText('Nay Lin')).toBeInTheDocument()
    expect(screen.queryByText('Aung Min')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search salary requests' }), {
      target: { value: 'May Thu' },
    })
    expect(screen.getByText('May Thu')).toBeInTheDocument()
    expect(screen.queryByText('Ko Htet')).not.toBeInTheDocument()
  })
})
