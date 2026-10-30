import { useCallback, useEffect, useRef, useState } from 'react'
import { performanceErrorMessage } from '../api/performanceApi'
import { performanceApi } from '../api/performanceApi'
import type {
  BonusAward,
  BonusAwardListParams,
  BonusPolicy,
  EmployeeGoal,
  EmployeeGoalListParams,
  Kpi,
  Paginated,
  PerformanceCycle,
  PerformanceCycleListParams,
  PerformanceReview,
  PerformanceReviewListParams,
} from '../types/performanceTypes'

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
      setError(performanceErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, key])

  return { data, loading, error, reload: load }
}

export const usePerformanceCycles = (params?: PerformanceCycleListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listCycles(request)
      return response.data.data.performance_cycles
    },
    JSON.stringify(request),
  )

  return { performanceCycles: data?.data ?? [], loading, error, reload }
}

export const usePerformanceCycle = (id?: string) => {
  const { data, loading, error, reload } = useResource(
    async () => {
      if (!id) return null
      const response = await performanceApi.getCycle(id)
      return response.data.data.performance_cycle
    },
    `cycle:${id}`,
  )

  return { performanceCycle: data, loading, error, reload }
}

export const useKpis = (params?: { search?: string; is_active?: boolean }) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listKpis(request)
      return response.data.data.kpis
    },
    JSON.stringify(request),
  )

  return { kpis: data?.data ?? [], loading, error, reload }
}

export const usePerformanceReviews = (params?: PerformanceReviewListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listReviews(request)
      return response.data.data.performance_reviews
    },
    JSON.stringify(request),
  )

  return { performanceReviews: data?.data ?? [], loading, error, reload }
}

export const usePerformanceReview = (id?: string) => {
  const { data, loading, error, reload } = useResource(
    async () => {
      if (!id) return null
      const response = await performanceApi.getReview(id)
      return response.data.data.performance_review
    },
    `review:${id}`,
  )

  return { performanceReview: data, loading, error, reload }
}

export const useMyPerformanceReviews = () => {
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listMyReviews()
      return response.data.data.performance_reviews
    },
    'my-reviews',
  )

  return { performanceReviews: data?.data ?? [], loading, error, reload }
}

export const useEmployeeGoals = (params?: EmployeeGoalListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listGoals(request)
      return response.data.data.employee_goals
    },
    JSON.stringify(request),
  )

  return { employeeGoals: data?.data ?? [], loading, error, reload }
}

export const useMyEmployeeGoals = (params?: Omit<EmployeeGoalListParams, 'employee_id'>) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listMyGoals(request)
      return response.data.data.employee_goals
    },
    JSON.stringify(request),
  )

  return { employeeGoals: data?.data ?? [], loading, error, reload }
}

export const useBonusPolicies = (params?: { search?: string }) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listBonusPolicies(request)
      return response.data.data.bonus_policies
    },
    JSON.stringify(request),
  )

  return { bonusPolicies: (data?.data ?? []) as BonusPolicy[], loading, error, reload }
}

export const useBonusAwards = (params?: BonusAwardListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listBonusAwards(request)
      return response.data.data.bonus_awards
    },
    JSON.stringify(request),
  )

  return { bonusAwards: (data?.data ?? []) as BonusAward[], loading, error, reload }
}

export const useMyBonusAwards = () => {
  const { data, loading, error, reload } = useResource(
    async () => {
      const response = await performanceApi.listMyBonusAwards()
      return response.data.data.bonus_awards
    },
    'my-bonus-awards',
  )

  return { bonusAwards: (data?.data ?? []) as BonusAward[], loading, error, reload }
}

export type { PerformanceCycle, PerformanceReview, EmployeeGoal, Kpi, Paginated }
