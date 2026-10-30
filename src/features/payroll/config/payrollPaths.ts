export type PayrollAreaRoot = '/super-admin/payroll' | '/payroll'

export const payrollPaths = (root: PayrollAreaRoot) => ({
  root,
  policies: `${root}/policies`,
  runs: `${root}/runs`,
  runDetail: (id: string) => `${root}/runs/${id}`,
  payslips: `${root}/payslips`,
  myPayslips: `${root}/payslips/me`,
  payments: `${root}/payments`,
})

export type PayrollPaths = ReturnType<typeof payrollPaths>
