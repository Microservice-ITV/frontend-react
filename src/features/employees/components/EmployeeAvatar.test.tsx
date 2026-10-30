import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import EmployeeAvatar from './EmployeeAvatar'

afterEach(cleanup)

describe('EmployeeAvatar', () => {
  it('shows initials when there is no profile image', () => {
    render(<EmployeeAvatar name="Kyaw Moe Oo" />)
    expect(screen.getByLabelText('Kyaw Moe Oo initials')).toHaveTextContent('KM')
  })

  it('shows the profile image when a URL is provided', () => {
    render(<EmployeeAvatar name="Kyaw Moe Oo" imageUrl="https://example.test/photo.webp" />)
    expect(screen.getByRole('img', { name: 'Kyaw Moe Oo profile' })).toHaveAttribute(
      'src',
      'https://example.test/photo.webp',
    )
  })

  it('falls back to initials if the image cannot load', () => {
    render(<EmployeeAvatar name="Kyaw Moe Oo" imageUrl="https://example.test/missing.webp" />)
    fireEvent.error(screen.getByRole('img', { name: 'Kyaw Moe Oo profile' }))
    expect(screen.getByLabelText('Kyaw Moe Oo initials')).toHaveTextContent('KM')
  })
})
