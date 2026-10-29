export const EMPLOYMENT_STATUSES = [
  'active',
  'probation',
  'on_leave',
  'suspended',
  'resigned',
  'terminated',
] as const
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  probation: 'Probation',
  on_leave: 'On Leave',
  suspended: 'Suspended',
  resigned: 'Resigned',
  terminated: 'Terminated',
}

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'intern',
  'freelance',
] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
  freelance: 'Freelance',
}

export const GENDERS = ['male', 'female', 'other'] as const
export type Gender = (typeof GENDERS)[number]

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
}

export const CONTRACT_TYPES = [
  'permanent',
  'fixed_term',
  'probation',
  'internship',
  'consultancy',
] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: 'Permanent',
  fixed_term: 'Fixed Term',
  probation: 'Probation',
  internship: 'Internship',
  consultancy: 'Consultancy',
}

export const CONTRACT_STATUSES = [
  'draft',
  'active',
  'expired',
  'terminated',
] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
}

export const HISTORY_CHANGE_TYPES = [
  'hire',
  'transfer',
  'promotion',
  'demotion',
  'salary_change',
  'contract_renewal',
  'status_change',
  'termination',
] as const
export type HistoryChangeType = (typeof HISTORY_CHANGE_TYPES)[number]

export const HISTORY_CHANGE_TYPE_LABELS: Record<HistoryChangeType, string> = {
  hire: 'Hire',
  transfer: 'Transfer',
  promotion: 'Promotion',
  demotion: 'Demotion',
  salary_change: 'Salary Change',
  contract_renewal: 'Contract Renewal',
  status_change: 'Status Change',
  termination: 'Termination',
}

export const REFERENCE_STATUSES = ['active', 'inactive'] as const
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number]

export const REFERENCE_STATUS_LABELS: Record<ReferenceStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export interface Paginated<T> {
  current_page: number
  data: T[]
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  next_page_url: string | null
  prev_page_url: string | null
}

export interface Department {
  id: string
  code: string
  name: string
  parent_id: string | null
  manager_employee_id: string | null
  description: string | null
  status: ReferenceStatus
  created_at?: string
  updated_at?: string
  parent?: Pick<Department, 'id' | 'code' | 'name'> | null
  manager?: Pick<Employee, 'id' | 'full_name' | 'employee_code'> | null
}

export interface DepartmentPayload {
  code: string
  name: string
  parent_id?: string | null
  manager_employee_id?: string | null
  description?: string | null
  status?: ReferenceStatus
}

export interface Position {
  id: string
  code: string
  title: string
  department_id: string
  level: string | null
  description: string | null
  status: ReferenceStatus
  created_at?: string
  updated_at?: string
  employees_count?: number
  department?: Pick<Department, 'id' | 'code' | 'name'> | null
}

export interface PositionPayload {
  code: string
  title: string
  department_id: string
  level?: string | null
  description?: string | null
  status?: ReferenceStatus
}

export interface Designation {
  id: string
  name: string
  status: ReferenceStatus
  created_at?: string
  updated_at?: string
}

export interface DesignationPayload {
  name: string
  status?: ReferenceStatus
}

export interface EmployeeAssignment {
  id: string
  employee_id: string
  position_id: string
  designation_id: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  position?: Pick<Position, 'id' | 'code' | 'title'> | null
  designation?: Pick<Designation, 'id' | 'name'> | null
}

export interface EmployeeAssignmentPayload {
  employee_id: string
  position_id: string
  designation_id?: string | null
  start_date: string
  end_date?: string | null
  is_active?: boolean
}

export interface SalaryGrade {
  id: string
  code: string
  name: string
  min_salary: string | null
  max_salary: string | null
  currency: string | null
  created_at?: string
  updated_at?: string
}

export interface Currency {
  code: string
  name: string
  symbol: string | null
}

export interface SalaryGradePayload {
  code: string
  name: string
  min_salary?: number | null
  max_salary?: number | null
  currency?: string | null
}

export interface Employee {
  id: string
  user_id: string | null
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: Gender | null
  address: string | null
  department_id: string | null
  position_id: string | null
  designation_id: string | null
  manager_id: string | null
  join_date: string
  employment_status: EmploymentStatus
  employment_type: EmploymentType
  salary_grade_id: string | null
  next_of_kin_name?: string | null
  next_of_kin_relationship?: string | null
  next_of_kin_phone?: string | null
  created_at?: string
  updated_at?: string
  department?: Pick<Department, 'id' | 'code' | 'name'> | null
  position?: Pick<Position, 'id' | 'code' | 'title'> | null
  designation?: Pick<Designation, 'id' | 'name'> | null
  salary_grade?: Pick<SalaryGrade, 'id' | 'code' | 'name' | 'currency'> | null
  manager?: Pick<Employee, 'id' | 'full_name' | 'employee_code'> | null
}

export interface EmployeePayload {
  user_id?: string | null
  employee_code: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  gender?: Gender | null
  address?: string | null
  department_id?: string | null
  position_id?: string | null
  designation_id?: string | null
  manager_id?: string | null
  join_date: string
  employment_status?: EmploymentStatus
  employment_type?: EmploymentType
  salary_grade_id?: string | null
  next_of_kin_name?: string | null
  next_of_kin_relationship?: string | null
  next_of_kin_phone?: string | null
}

export interface EmploymentContract {
  id: string
  employee_id: string
  contract_type: ContractType
  status: ContractStatus
  start_date: string
  end_date: string | null
  probation_end_date: string | null
  base_salary: string | null
  currency: string | null
  working_hours_per_week: number | null
  terms: string | null
  signed_at: string | null
  created_at?: string
  updated_at?: string
}

export interface EmploymentContractPayload {
  contract_type: ContractType
  status?: ContractStatus
  start_date: string
  end_date?: string | null
  probation_end_date?: string | null
  base_salary?: number | null
  currency?: string | null
  working_hours_per_week?: number | null
  terms?: string | null
  signed_at?: string | null
}

export interface EmploymentHistory {
  id: string
  employee_id: string
  change_type: HistoryChangeType
  effective_date: string
  from_department_id: string | null
  to_department_id: string | null
  from_position_id: string | null
  to_position_id: string | null
  from_salary_grade_id: string | null
  to_salary_grade_id: string | null
  from_status: string | null
  to_status: string | null
  reason: string | null
  changed_by: string | null
  metadata: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface BankDetail {
  id: string
  employee_id: string
  bank_name: string
  account_holder_name: string
  account_number: string
  currency: string | null
  is_verified: boolean
  verified_at: string | null
  routing_number?: string | null
  sort_code?: string | null
  iban?: string | null
  swift_code?: string | null
  created_at?: string
  updated_at?: string
}

export interface BankDetailPayload {
  bank_name: string
  account_holder_name: string
  account_number: string
  routing_number?: string | null
  sort_code?: string | null
  iban?: string | null
  swift_code?: string | null
  currency?: string | null
}

export interface EmployeeListParams {
  search?: string
  department_id?: string
  position_id?: string
  manager_id?: string
  employment_status?: EmploymentStatus | ''
  employment_type?: EmploymentType | ''
  per_page?: number
}

export const employeeDisplayName = (
  employee: Pick<Employee, 'full_name' | 'first_name' | 'last_name'>,
): string => employee.full_name?.trim() || `${employee.first_name} ${employee.last_name}`.trim()