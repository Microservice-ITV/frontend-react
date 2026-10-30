export type EmployeeAreaBase = '/super-admin'

export const employeePaths = (base: EmployeeAreaBase) => ({
  root: `${base}/employees`,
  employees: `${base}/employees`,
  employeeNew: `${base}/employees/new`,
  employeeDetail: (id: string) => `${base}/employees/${id}`,
  employeeEdit: (id: string) => `${base}/employees/${id}/edit`,
  departments: `${base}/employees/departments`,
  positions: `${base}/employees/positions`,
  designations: `${base}/employees/designations`,
  salaryGrades: `${base}/employees/salary-grades`,
  myProfile: `${base}/employees/me`,
})

export type EmployeePaths = ReturnType<typeof employeePaths>
