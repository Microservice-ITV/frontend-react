import type { AxiosError } from 'axios'
import { authClient } from '@/lib/api/authClient'
import { employeeClient } from '@/lib/api/employeeClient'
import type {
  BankDetail,
  BankDetailPayload,
  Currency,
  Department,
  DepartmentPayload,
  Designation,
  DesignationPayload,
  Employee,
  EmployeeAssignment,
  EmployeeAssignmentPayload,
  EmployeeListParams,
  EmployeePayload,
  EmploymentContract,
  EmploymentContractPayload,
  EmploymentHistory,
  Paginated,
  Position,
  PositionPayload,
  SalaryGrade,
  SalaryGradePayload,
} from '../types/employeeTypes'

type Envelope<T> = { success: boolean; data: T }

export const employeeErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<{
    error?: { code?: string; message?: string }
    message?: string
    errors?: Record<string, string[]>
  }>
  const validation = axiosError.response?.data?.errors
  if (validation) {
    const first = Object.values(validation)[0]
    if (Array.isArray(first) && first.length > 0) return first[0]
  }
  return (
    axiosError.response?.data?.error?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Something went wrong'
  )
}

export const employeeApi = {
  getProfileImage(userId: string) {
    return authClient.get<{
      data?: { users?: Array<{ id: string; profile_image?: string | null }> }
    }>('/users/avatars', { params: { ids: userId } })
  },

  // --- Currencies ---
  listCurrencies() {
    return employeeClient.get<Envelope<{ currencies: Currency[] }>>('/currencies')
  },

  // --- Self-service ---
  getMyEmployee() {
    return employeeClient.get<Envelope<{ employee: Employee }>>('/me/employee')
  },
  getMyBankDetail() {
    return employeeClient.get<Envelope<{ bank_details: BankDetail | null }>>(
      '/me/bank-details',
    )
  },
  updateMyBankDetail(payload: BankDetailPayload) {
    return employeeClient.put<Envelope<{ bank_details: BankDetail }>>(
      '/me/bank-details',
      payload,
    )
  },

  // --- Employees ---
  listEmployees(params?: EmployeeListParams) {
    return employeeClient.get<Envelope<{ employees: Paginated<Employee> }>>(
      '/employees',
      {
        params: {
          ...params,
          employment_status: params?.employment_status || undefined,
          employment_type: params?.employment_type || undefined,
        },
      },
    )
  },
  getEmployee(id: string) {
    return employeeClient.get<Envelope<{ employee: Employee }>>(
      `/employees/${id}`,
    )
  },
  createEmployee(payload: EmployeePayload) {
    return employeeClient.post<Envelope<{ employee: Employee }>>(
      '/employees',
      payload,
    )
  },
  updateEmployee(id: string, payload: Partial<EmployeePayload>) {
    return employeeClient.put<Envelope<{ employee: Employee }>>(
      `/employees/${id}`,
      payload,
    )
  },
  deleteEmployee(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/employees/${id}`,
    )
  },
  changeEmployeeStatus(
    id: string,
    payload: { status: string; reason?: string | null },
  ) {
    return employeeClient.patch<Envelope<{ employee: Employee }>>(
      `/employees/${id}/status`,
      payload,
    )
  },

  // --- Departments ---
  listDepartments(params?: {
    search?: string
    status?: string
    parent_id?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ departments: Paginated<Department> }>>(
      '/departments',
      { params },
    )
  },
  getDepartment(id: string) {
    return employeeClient.get<Envelope<{ department: Department }>>(
      `/departments/${id}`,
    )
  },
  createDepartment(payload: DepartmentPayload) {
    return employeeClient.post<Envelope<{ department: Department }>>(
      '/departments',
      payload,
    )
  },
  updateDepartment(id: string, payload: Partial<DepartmentPayload>) {
    return employeeClient.put<Envelope<{ department: Department }>>(
      `/departments/${id}`,
      payload,
    )
  },
  deleteDepartment(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/departments/${id}`,
    )
  },

  // --- Positions ---
  listPositions(params?: {
    search?: string
    status?: string
    department_id?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ positions: Paginated<Position> }>>(
      '/positions',
      { params },
    )
  },
  getPosition(id: string) {
    return employeeClient.get<Envelope<{ position: Position }>>(
      `/positions/${id}`,
    )
  },
  createPosition(payload: PositionPayload) {
    return employeeClient.post<Envelope<{ position: Position }>>(
      '/positions',
      payload,
    )
  },
  updatePosition(id: string, payload: Partial<PositionPayload>) {
    return employeeClient.put<Envelope<{ position: Position }>>(
      `/positions/${id}`,
      payload,
    )
  },
  deletePosition(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/positions/${id}`,
    )
  },

  // --- Designations ---
  listDesignations(params?: {
    search?: string
    status?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ designations: Paginated<Designation> }>>(
      '/designations',
      { params },
    )
  },
  createDesignation(payload: DesignationPayload) {
    return employeeClient.post<Envelope<{ designation: Designation }>>(
      '/designations',
      payload,
    )
  },
  updateDesignation(id: string, payload: Partial<DesignationPayload>) {
    return employeeClient.put<Envelope<{ designation: Designation }>>(
      `/designations/${id}`,
      payload,
    )
  },
  deleteDesignation(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/designations/${id}`,
    )
  },

  // --- Employee assignments ---
  listEmployeeAssignments(params?: {
    employee_id?: string
    position_id?: string
    designation_id?: string
    is_active?: boolean
    per_page?: number
  }) {
    return employeeClient.get<
      Envelope<{ assignments: Paginated<EmployeeAssignment> }>
    >('/employee-assignments', { params })
  },
  createEmployeeAssignment(payload: EmployeeAssignmentPayload) {
    return employeeClient.post<Envelope<{ assignment: EmployeeAssignment }>>(
      '/employee-assignments',
      payload,
    )
  },
  updateEmployeeAssignment(
    id: string,
    payload: Partial<EmployeeAssignmentPayload>,
  ) {
    return employeeClient.put<Envelope<{ assignment: EmployeeAssignment }>>(
      `/employee-assignments/${id}`,
      payload,
    )
  },
  deleteEmployeeAssignment(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/employee-assignments/${id}`,
    )
  },

  // --- Salary grades ---
  listSalaryGrades() {
    return employeeClient.get<Envelope<{ salary_grades: SalaryGrade[] }>>(
      '/salary-grades',
    )
  },
  getSalaryGrade(id: string) {
    return employeeClient.get<Envelope<{ salary_grade: SalaryGrade }>>(
      `/salary-grades/${id}`,
    )
  },
  createSalaryGrade(payload: SalaryGradePayload) {
    return employeeClient.post<Envelope<{ salary_grade: SalaryGrade }>>(
      '/salary-grades',
      payload,
    )
  },
  updateSalaryGrade(id: string, payload: Partial<SalaryGradePayload>) {
    return employeeClient.put<Envelope<{ salary_grade: SalaryGrade }>>(
      `/salary-grades/${id}`,
      payload,
    )
  },
  deleteSalaryGrade(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/salary-grades/${id}`,
    )
  },

  // --- Employment contracts ---
  listEmployeeContracts(employeeId: string, perPage = 50) {
    return employeeClient.get<Envelope<{ contracts: Paginated<EmploymentContract> }>>(
      `/employees/${employeeId}/contracts`,
      { params: { per_page: perPage } },
    )
  },
  createEmployeeContract(employeeId: string, payload: EmploymentContractPayload) {
    return employeeClient.post<Envelope<{ contract: EmploymentContract }>>(
      `/employees/${employeeId}/contracts`,
      payload,
    )
  },
  updateEmployeeContract(
    employeeId: string,
    contractId: string,
    payload: Partial<EmploymentContractPayload>,
  ) {
    return employeeClient.put<Envelope<{ contract: EmploymentContract }>>(
      `/employees/${employeeId}/contracts/${contractId}`,
      payload,
    )
  },

  // --- Employment history ---
  listEmployeeHistory(employeeId: string, perPage = 50) {
    return employeeClient.get<Envelope<{ history: Paginated<EmploymentHistory> }>>(
      `/employees/${employeeId}/history`,
      { params: { per_page: perPage } },
    )
  },

  // --- Bank details (restricted) ---
  getEmployeeBankDetail(employeeId: string) {
    return employeeClient.get<Envelope<{ bank_details: BankDetail | null }>>(
      `/employees/${employeeId}/bank-details`,
    )
  },
  updateEmployeeBankDetail(employeeId: string, payload: BankDetailPayload) {
    return employeeClient.put<Envelope<{ bank_details: BankDetail }>>(
      `/employees/${employeeId}/bank-details`,
      payload,
    )
  },
}