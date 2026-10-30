export type PerformanceAreaRoot = '/super-admin/performance' | '/performance' | '/payroll/performance'

export const performancePaths = (root: PerformanceAreaRoot) => ({
  root,
  cycles: `${root}/cycles`,
  cycleDetail: (id: string) => `${root}/cycles/${id}`,
  kpis: `${root}/kpis`,
  reviews: `${root}/reviews`,
  reviewDetail: (id: string) => `${root}/reviews/${id}`,
  bonusPolicies: `${root}/bonus-policies`,
  bonusAwards: `${root}/bonus-awards`,
  myPerformance: `${root}/me`,
})

export type PerformancePaths = ReturnType<typeof performancePaths>
