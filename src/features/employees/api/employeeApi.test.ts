import { describe, expect, it } from 'vitest'
import { employeeErrorMessage } from './employeeApi'

describe('employeeErrorMessage', () => {
  it('returns the first validation error message', () => {
    const error = {
      response: {
        data: {
          errors: {
            employee_code: ['The employee code has already been taken.'],
          },
        },
      },
    }

    expect(employeeErrorMessage(error)).toBe(
      'The employee code has already been taken.',
    )
  })

  it('falls back to the error envelope message', () => {
    const error = {
      response: { data: { error: { code: 'FORBIDDEN', message: 'Forbidden' } } },
    }

    expect(employeeErrorMessage(error)).toBe('Forbidden')
  })

  it('falls back to the top-level message', () => {
    const error = { response: { data: { message: 'Service unavailable' } } }
    expect(employeeErrorMessage(error)).toBe('Service unavailable')
  })

  it('falls back to the axios message', () => {
    expect(employeeErrorMessage({ message: 'Network Error' })).toBe('Network Error')
  })

  it('returns a generic message for unknown errors', () => {
    expect(employeeErrorMessage({})).toBe('Something went wrong')
  })
})
