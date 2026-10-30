import { useState } from 'react'
import EmployeeStyleFormPage, { type EmployeeStyleFormOptions } from './EmployeeStyleFormPage'

export const useEmployeeStyleForm = () => {
  const [options, setOptions] = useState<EmployeeStyleFormOptions | null>(null)

  const formPage = options ? (
    <EmployeeStyleFormPage
      {...options}
      onCancel={() => setOptions(null)}
      onComplete={() => setOptions(null)}
    />
  ) : null

  return {
    showForm: setOptions,
    formPage,
  }
}
