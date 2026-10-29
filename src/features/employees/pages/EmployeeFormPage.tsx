import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { adminUsersApi, type AdminUserDto } from '@/features/admin/api/adminUsersApi'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import {
  FormField,
  invalidTextInputClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionClass,
  textInputClass,
} from '../components/forms/FormField'
import { employeePaths, type EmployeeAreaBase } from '../config/employeePaths'
import {
  useDepartments,
  useDesignations,
  useEmployee,
  useEmployeeContracts,
  useEmployees,
  usePositions,
} from '../hooks/useEmployeeData'
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  GENDERS,
  GENDER_LABELS,
  type Currency,
  type EmploymentContractPayload,
  employeeDisplayName,
  type Employee,
  type EmployeePayload,
  type EmploymentStatus,
  type EmploymentType,
  type Gender,
} from '../types/employeeTypes'

export type EmployeeFormPageProps = {
  base: EmployeeAreaBase
}

type FormState = {
  user_id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone: string
  base_salary: string
  currency: string
  date_of_birth: string
  gender: Gender | ''
  address: string
  department_id: string
  position_id: string
  designation_id: string
  manager_id: string
  join_date: string
  employment_status: EmploymentStatus
  employment_type: EmploymentType
  next_of_kin_name: string
  next_of_kin_relationship: string
  next_of_kin_phone: string
}

const emptyForm: FormState = {
  user_id: '',
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  base_salary: '',
  currency: 'USD',
  date_of_birth: '',
  gender: '',
  address: '',
  department_id: '',
  position_id: '',
  designation_id: '',
  manager_id: '',
  join_date: new Date().toISOString().slice(0, 10),
  employment_status: 'active',
  employment_type: 'full_time',
  next_of_kin_name: '',
  next_of_kin_relationship: '',
  next_of_kin_phone: '',
}

const toDateInput = (value?: string | null): string => {
  if (!value) return ''
  return value.slice(0, 10)
}

const orNull = (value: string): string | null => (value.trim() ? value.trim() : null)

const EmployeeFormPage = ({ base }: EmployeeFormPageProps) => {
  const paths = employeePaths(base)
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const salaryDraft = (location.state as { salaryDraft?: { base_salary: string; currency: string } } | null)
    ?.salaryDraft

  const { employee, loading: loadingEmployee } = useEmployee(id)
  const { departments } = useDepartments()
  const { positions } = usePositions()
  const { designations } = useDesignations()
  const {
    contracts,
    loading: loadingContracts,
    error: contractsError,
  } = useEmployeeContracts(id)
  const { employees } = useEmployees()

  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [currencyError, setCurrencyError] = useState<string | null>(null)
  const [registeredUsers, setRegisteredUsers] = useState<AdminUserDto[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const loadCurrencies = async () => {
      setLoadingCurrencies(true)
      setCurrencyError(null)
      try {
        const response = await employeeApi.listCurrencies()
        const availableCurrencies = response.data.data.currencies
        if (!cancelled) {
          setCurrencies(availableCurrencies)
          if (!isEdit) {
            setForm((current) => ({
              ...current,
              currency: availableCurrencies.find((currency) => currency.code === 'USD')?.code
                ?? availableCurrencies[0]?.code
                ?? '',
            }))
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCurrencies([])
          setCurrencyError(employeeErrorMessage(err))
        }
      } finally {
        if (!cancelled) setLoadingCurrencies(false)
      }
    }

    void loadCurrencies()
    return () => {
      cancelled = true
    }
  }, [isEdit])

  useEffect(() => {
    if (isEdit) return

    let cancelled = false
    const loadRegisteredUsers = async () => {
      setLoadingUsers(true)
      setUsersError(null)
      try {
        const firstPage = await adminUsersApi.listUsers({ page: 1, per_page: 100 })
        const { users, pagination } = firstPage.data.data
        const laterPages = await Promise.all(
          Array.from({ length: Math.max(0, pagination.last_page - 1) }, (_, index) =>
            adminUsersApi.listUsers({ page: index + 2, per_page: 100 }),
          ),
        )
        if (!cancelled) {
          setRegisteredUsers([
            ...users,
            ...laterPages.flatMap((response) => response.data.data.users),
          ])
        }
      } catch (err) {
        if (!cancelled) {
          setRegisteredUsers([])
          setUsersError(adminUsersApi.getApiErrorMessage(err, 'Unable to load registered users'))
        }
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }

    void loadRegisteredUsers()
    return () => { cancelled = true }
  }, [isEdit])

  useEffect(() => {
    if (!employee) return
    setForm({
      user_id: employee.user_id ?? '',
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      base_salary: salaryDraft?.base_salary ?? '',
      currency: salaryDraft?.currency ?? 'USD',
      date_of_birth: toDateInput(employee.date_of_birth),
      gender: employee.gender ?? '',
      address: employee.address ?? '',
      department_id: employee.department_id ?? '',
      position_id: employee.position_id ?? '',
      designation_id: employee.designation_id ?? '',
      manager_id: employee.manager_id ?? '',
      join_date: toDateInput(employee.join_date),
      employment_status: employee.employment_status,
      employment_type: employee.employment_type,
      next_of_kin_name: employee.next_of_kin_name ?? '',
      next_of_kin_relationship: employee.next_of_kin_relationship ?? '',
      next_of_kin_phone: employee.next_of_kin_phone ?? '',
    })
  }, [employee, salaryDraft])

  useEffect(() => {
    if (!isEdit || !employee || loadingContracts) return
    const activeContract = contracts.find((contract) => contract.status === 'active')
    setForm((current) => ({
      ...current,
      base_salary: activeContract?.base_salary ?? salaryDraft?.base_salary ?? '',
      currency: activeContract?.currency ?? salaryDraft?.currency ?? current.currency,
    }))
  }, [contracts, employee, isEdit, loadingContracts, salaryDraft])

  const eligiblePositions = useMemo(() => {
    if (!form.department_id) return positions
    return positions.filter(
      (position) => position.department_id === form.department_id,
    )
  }, [positions, form.department_id])

  const availableUsers = useMemo(
    () => registeredUsers.filter((user) => !employees.some((employee) => employee.user_id === user.id)),
    [registeredUsers, employees],
  )

  const eligibleManagers = useMemo(
    () => employees.filter((manager) => manager.id !== id),
    [employees, id],
  )

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.base_salary.trim() && (!Number.isFinite(Number(form.base_salary)) || Number(form.base_salary) < 0)) {
      setFieldErrors({ base_salary: 'Enter a valid non-negative salary.' })
      return
    }
    if (form.base_salary.trim() && !form.currency) {
      setFieldErrors({ currency: 'Select a currency for the salary.' })
      return
    }
    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    const payload: EmployeePayload = {
      user_id: form.user_id || null,
      employee_code: form.employee_code.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: orNull(form.email),
      phone: orNull(form.phone),
      date_of_birth: orNull(form.date_of_birth),
      gender: form.gender || null,
      address: orNull(form.address),
      department_id: form.department_id || null,
      position_id: form.position_id || null,
      designation_id: form.designation_id || null,
      manager_id: form.manager_id || null,
      join_date: form.join_date,
      employment_status: form.employment_status,
      employment_type: form.employment_type,
      next_of_kin_name: orNull(form.next_of_kin_name),
      next_of_kin_relationship: orNull(form.next_of_kin_relationship),
      next_of_kin_phone: orNull(form.next_of_kin_phone),
    }

    try {
      let savedEmployee: Employee
      if (isEdit && id) {
        const response = await employeeApi.updateEmployee(id, payload)
        savedEmployee = response.data.data.employee
      } else {
        const response = await employeeApi.createEmployee(payload)
        savedEmployee = response.data.data.employee
      }

      const activeContract = contracts.find((contract) => contract.status === 'active')
      if (form.base_salary.trim() || activeContract) {
        const salaryPayload: Pick<EmploymentContractPayload, 'base_salary' | 'currency'> = {
          base_salary: form.base_salary.trim() ? Number(form.base_salary) : null,
          currency: form.currency || undefined,
        }
        try {
          if (activeContract) {
            await employeeApi.updateEmployeeContract(savedEmployee.id, activeContract.id, salaryPayload)
          } else if (form.base_salary.trim()) {
            const contractTypeByEmploymentType: Record<EmploymentType, EmploymentContractPayload['contract_type']> = {
              full_time: 'permanent',
              part_time: 'permanent',
              contract: 'fixed_term',
              intern: 'internship',
              freelance: 'consultancy',
            }
            await employeeApi.createEmployeeContract(savedEmployee.id, {
              ...salaryPayload,
              contract_type: contractTypeByEmploymentType[form.employment_type],
              start_date: form.join_date,
              status: 'active',
            })
          }
        } catch (contractError) {
          setError(`Employee details were saved, but the salary could not be saved: ${employeeErrorMessage(contractError)}`)
          if (!isEdit) {
            navigate(paths.employeeEdit(savedEmployee.id), {
              replace: true,
              state: { salaryDraft: { base_salary: form.base_salary, currency: form.currency } },
            })
          }
          return
        }
      }

      navigate(paths.employeeDetail(savedEmployee.id))
    } catch (err) {
      setError(employeeErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && loadingEmployee && !employee) {
    return <p className="text-sm text-slate-500">Loading employee…</p>
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">Employees</Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">{isEdit ? 'Edit' : 'New'}</span>
      </nav>

      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isEdit ? 'Edit employee' : 'New employee'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEdit ? 'Update employee details and assignment.' : 'Create a new employee record.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      {currencyError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Unable to load currencies: {currencyError}
        </div>
      )}
      {isEdit && contractsError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Unable to load the employee's contracts: {contractsError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={sectionClass}>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Personal Information</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {!isEdit && (
                <FormField label="Registered user" required
                  error={usersError ?? fieldErrors.user_id} className="sm:col-span-2"
                  hint={loadingUsers ? 'Loading registered users…' : 'Choose an existing account to populate the employee name and email.'}>
                  <select value={form.user_id}
                    onChange={(event) => {
                      const user = registeredUsers.find((candidate) => candidate.id === event.target.value)
                      update('user_id', user?.id ?? '')
                      if (user) {
                        const [firstName = '', ...lastName] = user.name.trim().split(/\s+/)
                        update('first_name', firstName); update('last_name', lastName.join(' ')); update('email', user.email)
                      } else {
                        update('first_name', ''); update('last_name', ''); update('email', '')
                      }
                    }}
                    className={textInputClass} required disabled={loadingUsers || Boolean(usersError)}>
                    <option value="">{loadingUsers ? 'Loading users…' : 'Select a registered user'}</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                  {!usersError && availableUsers.length === 0 && !loadingUsers && (
                    <p className="text-xs text-slate-500">No unassigned registered users are available.</p>
                  )}
                </FormField>
              )}
              <FormField label="Employee code" required error={fieldErrors.employee_code}>
                <input value={form.employee_code} onChange={(e) => update('employee_code', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.employee_code ? invalidTextInputClass : ''}`}
                  placeholder="EMP-001" required />
              </FormField>
              <FormField label="Join date" required error={fieldErrors.join_date}>
                <input type="date" value={form.join_date} onChange={(e) => update('join_date', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.join_date ? invalidTextInputClass : ''}`} required />
              </FormField>
              <FormField label="First name" required error={fieldErrors.first_name}>
                <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.first_name ? invalidTextInputClass : ''}`} required />
              </FormField>
              <FormField label="Last name" required error={fieldErrors.last_name}>
                <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.last_name ? invalidTextInputClass : ''}`} required />
              </FormField>
              <FormField label="Email" error={fieldErrors.email}>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.email ? invalidTextInputClass : ''}`} />
              </FormField>
              <FormField label="Phone" error={fieldErrors.phone}>
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.phone ? invalidTextInputClass : ''}`} />
              </FormField>
              <FormField label="Date of birth" error={fieldErrors.date_of_birth}>
                <input type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.date_of_birth ? invalidTextInputClass : ''}`} />
              </FormField>
              <FormField label="Gender" error={fieldErrors.gender}>
                <select value={form.gender} onChange={(e) => update('gender', e.target.value as Gender | '')} className={textInputClass}>
                  <option value="">Not specified</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>{GENDER_LABELS[gender]}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Address" className="sm:col-span-2" error={fieldErrors.address}>
                <textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={1}
                  className={`${textInputClass} ${fieldErrors.address ? invalidTextInputClass : ''}`} />
              </FormField>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Employment Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Department" error={fieldErrors.department_id}>
                <select value={form.department_id}
                  onChange={(e) => { update('department_id', e.target.value); update('position_id', '') }}
                  className={textInputClass}>
                  <option value="">Unassigned</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Position" error={fieldErrors.position_id}>
                <select value={form.position_id} onChange={(e) => update('position_id', e.target.value)} className={textInputClass}>
                  <option value="">Unassigned</option>
                  {eligiblePositions.map((position) => (
                    <option key={position.id} value={position.id}>{position.title}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Designation" error={fieldErrors.designation_id}>
                <select
                  value={form.designation_id}
                  onChange={(e) => update('designation_id', e.target.value)}
                  className={textInputClass}
                >
                  <option value="">None</option>
                  {designations
                    .filter((designation) => designation.status === 'active')
                    .map((designation) => (
                      <option key={designation.id} value={designation.id}>
                        {designation.name}
                      </option>
                    ))}
                </select>
              </FormField>
              <FormField label="Manager" error={fieldErrors.manager_id}>
                <select
                  value={form.manager_id}
                  onChange={(e) => update('manager_id', e.target.value)}
                  className={textInputClass}
                >
                  <option value="">Unassigned</option>
                  {eligibleManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {employeeDisplayName(manager)} ({manager.employee_code})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Salary" error={fieldErrors.base_salary}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.base_salary}
                  onChange={(e) => update('base_salary', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.base_salary ? invalidTextInputClass : ''}`}
                />
              </FormField>
              <FormField label="Currency" error={currencyError ?? fieldErrors.currency}>
                <select
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                  className={textInputClass}
                  disabled={loadingCurrencies || Boolean(currencyError)}
                >
                  {loadingCurrencies && <option value="">Loading currencies…</option>}
                  {!loadingCurrencies && <option value="">Select currency</option>}
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} — {currency.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Employment status" error={fieldErrors.employment_status}>
                <select value={form.employment_status}
                  onChange={(e) => update('employment_status', e.target.value as EmploymentStatus)} className={textInputClass}>
                  {EMPLOYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{EMPLOYMENT_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Employment type" error={fieldErrors.employment_type}>
                <select value={form.employment_type}
                  onChange={(e) => update('employment_type', e.target.value as EmploymentType)} className={textInputClass}>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>{EMPLOYMENT_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </FormField>

              <h2 className="mb-3 mt-2 text-sm font-semibold text-slate-800 sm:col-span-2">Next of Kin</h2>
              <FormField label="Next of Kin Name" error={fieldErrors.next_of_kin_name} className="sm:col-span-2">
                <input value={form.next_of_kin_name} onChange={(e) => update('next_of_kin_name', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.next_of_kin_name ? invalidTextInputClass : ''}`}
                  placeholder="Full name" />
              </FormField>
              <FormField label="Relationship" error={fieldErrors.next_of_kin_relationship}>
                <input value={form.next_of_kin_relationship} onChange={(e) => update('next_of_kin_relationship', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.next_of_kin_relationship ? invalidTextInputClass : ''}`}
                  placeholder="e.g., Spouse, Child, Parent" />
              </FormField>
              <FormField label="Next of Kin Phone" error={fieldErrors.next_of_kin_phone}>
                <input value={form.next_of_kin_phone} onChange={(e) => update('next_of_kin_phone', e.target.value)}
                  className={`${textInputClass} ${fieldErrors.next_of_kin_phone ? invalidTextInputClass : ''}`}
                  placeholder="Phone number" />
              </FormField>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={() => navigate(paths.root)} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={
              submitting
              || loadingCurrencies
              || Boolean(currencyError)
              || (isEdit && (loadingContracts || Boolean(contractsError)))
            }
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create employee'}
          </button>
        </div>
      </form>
    </div>
  )
}
export default EmployeeFormPage