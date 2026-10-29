import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmployeeStyleFormPage from './EmployeeStyleFormPage'

describe('EmployeeStyleFormPage', () => {
  it('renders the shared full-page form layout and saves', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn()
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <EmployeeStyleFormPage
        title="New department"
        content={<label>Name<input aria-label="Name" /></label>}
        primaryLabel="Create department"
        onPrimary={onPrimary}
        onCancel={onCancel}
        onComplete={onComplete}
      />,
    )

    expect(screen.getByRole('heading', { name: 'New department' })).toBeInTheDocument()
    expect(screen.getByText('Management')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Operations')
    await user.click(screen.getByRole('button', { name: 'Create department' }))

    await waitFor(() => {
      expect(onPrimary).toHaveBeenCalledOnce()
      expect(onComplete).toHaveBeenCalledOnce()
    })
  })

  it('surfaces save errors and keeps the form open for retry', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn().mockRejectedValue(new Error('Save failed'))

    render(
      <EmployeeStyleFormPage
        title="Edit position"
        content={<input aria-label="Position title" />}
        primaryLabel="Save changes"
        onPrimary={onPrimary}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
    expect(screen.getByRole('heading', { name: 'Edit position' })).toBeInTheDocument()
  })
})
