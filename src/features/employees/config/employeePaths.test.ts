import { describe, expect, it } from 'vitest'
import { employeePaths } from './employeePaths'

describe('employeePaths', () => {
  const paths = employeePaths('/super-admin')

  it('builds the collection and detail paths', () => {
    expect(paths.root).toBe('/super-admin/employees')
    expect(paths.employeeNew).toBe('/super-admin/employees/new')
    expect(paths.employeeDetail('abc')).toBe('/super-admin/employees/abc')
    expect(paths.employeeEdit('abc')).toBe('/super-admin/employees/abc/edit')
  })

  it('builds the reference data paths', () => {
    expect(paths.departments).toBe('/super-admin/employees/departments')
    expect(paths.positions).toBe('/super-admin/employees/positions')
    expect(paths.salaryGrades).toBe('/super-admin/employees/salary-grades')
    expect(paths.myProfile).toBe('/super-admin/employees/me')
  })
})
