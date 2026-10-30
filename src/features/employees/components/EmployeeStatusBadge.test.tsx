import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ContractStatusBadge,
  EmployeeStatusBadge,
  ReferenceStatusBadge,
} from './EmployeeStatusBadge'

describe('EmployeeStatusBadge', () => {
  it('renders the employment status label', () => {
    render(<EmployeeStatusBadge status="on_leave" />)
    expect(screen.getByText('On Leave')).toBeInTheDocument()
  })

  it('renders the contract status label', () => {
    render(<ContractStatusBadge status="expired" />)
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('renders the reference status label', () => {
    render(<ReferenceStatusBadge status="inactive" />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })
})
