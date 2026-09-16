type MonthlyGoalsCardProps = {
  activeShops: number
  totalShops: number
  activeUsers: number
  totalUsers: number
  pendingShops: number
  title?: string
  description?: string
  goalLabels?: [string, string, string]
}

const MonthlyGoalsCard = ({
  activeShops,
  totalShops,
  activeUsers,
  totalUsers,
  pendingShops,
  title = 'Platform Snapshot',
  description = 'Real-time database totals',
  goalLabels = ['Active Shops', 'Active Users', 'Pending Shops'],
}: MonthlyGoalsCardProps) => {
  const goals = [
    { label: goalLabels[0], current: activeShops, target: totalShops, color: 'bg-emerald-500' },
    { label: goalLabels[1], current: activeUsers, target: totalUsers, color: 'bg-blue-500' },
    { label: goalLabels[2], current: pendingShops, target: pendingShops, color: 'bg-orange-500' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-600">{description}</p>
      </div>

      <div className="mt-4 flex-1 space-y-5">
        {goals.map((goal) => {
          const percent = goal.target > 0
            ? Math.min(Math.round((goal.current / goal.target) * 100), 100)
            : 0
          const suffix = ''
          return (
            <div key={goal.label}>
              <div className="mb-1.5 flex items-end justify-between">
                <span className="text-sm font-medium text-slate-900">{goal.label}</span>
                <span className="text-xs text-slate-500">
                  Target: {goal.target.toLocaleString()}{suffix}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${goal.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {percent}%
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {goal.current.toLocaleString()}{suffix}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthlyGoalsCard