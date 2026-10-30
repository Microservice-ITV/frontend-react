import { useCallback, useEffect, useRef, useState } from 'react'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import type {
  BankDetail,
  Department,
  Designation,
  Employee,
  EmployeeListParams,
  EmploymentContract,
  EmploymentHistory,
  Paginated,
  Position,
  SalaryGrade,
} from '../types/employeeTypes'

const REFERENCE_PAGE_SIZE = 200

type Resource<T> = {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const useResource = <T,>(loader: () => Promise<T>, key: string): Resource<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loaderRef.current())
    } catch (err) {
      setData(null)
      setError(employeeErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, key])

  return { data, loading, error, reload: load }
}

export const useEmployees = (params?: EmployeeListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<Employee>>(
    () => employeeApi.listEmployees(request).then((response) => response.data.data.employees),
    JSON.stringify(request),
  )
  return {
    employees: data?.data ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    reload,
  }
}

export const useEmployee = (id?: string) => {
  const { data, loading, error, reload } = useResource<Employee>(
    () =>
      id
        ? employeeApi.getEmployee(id).then((response) => response.data.data.employee)
        : Promise.resolve(null),
    id ?? '',
  )
  return { employee: data, loading, error, reload }
}

export const useDepartments = () => {
  const { data, loading, error, reload } = useResource<Paginated<Department>>(
    () =>
      employeeApi
        .listDepartments({ per_page: REFERENCE_PAGE_SIZE })
        .then((response) => response.data.data.departments),
    'departments',
  )
  return {
    departments: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const usePositions = () => {
  const { data, loading, error, reload } = useResource<Paginated<Position>>(
    () =>
      employeeApi
        .listPositions({ per_page: REFERENCE_PAGE_SIZE })
        .then((response) => response.data.data.positions),
    'positions',
  )
  return {
    positions: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useDesignations = () => {
  const { data, loading, error, reload } = useResource<Paginated<Designation>>(
    () =>
      employeeApi
        .listDesignations({ per_page: REFERENCE_PAGE_SIZE })
        .then((response) => response.data.data.designations),
    'designations',
  )
  return {
    designations: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useSalaryGrades = () => {
  const { data, loading, error, reload } = useResource<SalaryGrade[]>(
    () =>
      employeeApi
        .listSalaryGrades()
        .then((response) => response.data.data.salary_grades),
    'salary-grades',
  )
  return {
    salaryGrades: data ?? [],
    loading,
    error,
    reload,
  }
}

export const useEmployeeContracts = (employeeId?: string) => {
  const { data, loading, error, reload } = useResource<Paginated<EmploymentContract>>(
    () =>
      employeeId
        ? employeeApi
            .listEmployeeContracts(employeeId)
            .then((response) => response.data.data.contracts)
        : Promise.resolve(null),
    employeeId ?? '',
  )
  return {
    contracts: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useEmployeeHistory = (employeeId?: string) => {
  const { data, loading, error, reload } = useResource<Paginated<EmploymentHistory>>(
    () =>
      employeeId
        ? employeeApi
            .listEmployeeHistory(employeeId)
            .then((response) => response.data.data.history)
        : Promise.resolve(null),
    employeeId ?? '',
  )
  return {
    history: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useEmployeeBankDetail = (employeeId?: string, enabled = true) => {
  const { data, loading, error, reload } = useResource<BankDetail | null>(
    () =>
      employeeId && enabled
        ? employeeApi
            .getEmployeeBankDetail(employeeId)
            .then((response) => response.data.data.bank_details)
        : Promise.resolve(null),
    `${employeeId ?? ''}:${enabled ? 'on' : 'off'}`,
  )
  return {
    bankDetail: data,
    loading,
    error,
    reload,
  }
}

export const useMyEmployee = () => {
  const { data, loading, error, reload } = useResource<Employee>(
    () => employeeApi.getMyEmployee().then((response) => response.data.data.employee),
    'me',
  )
  return { employee: data, loading, error, reload }
}

export const useMyBankDetail = () => {
  const { data, loading, error, reload } = useResource<BankDetail | null>(
    () =>
      employeeApi
        .getMyBankDetail()
        .then((response) => response.data.data.bank_details),
    'me-bank',
  )
  return { bankDetail: data, loading, error, reload }
}
