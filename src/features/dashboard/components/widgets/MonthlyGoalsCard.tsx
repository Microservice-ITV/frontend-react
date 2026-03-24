// TODO: Replace with real data from API.
const GOALS_DATA = [
  {
    label: 'Monthly Revenue',
    current: 48295,
    target: 55000,
    color: 'bg-emerald-500',
  },
  {
    label: 'New Customers',
    current: 2847,
    target: 3500,
    color: 'bg-emerald-500',
  },
  {
    label: 'Conversion Rate',
    current: 3.2,
    target: 5,
    suffix: '%',
    color: 'bg-blue-500',
  },
]

const MonthlyGoalsCard = () => {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">Monthly Goals</h3>
        <p className="mt-0.5 text-xs text-slate-600">Track progress toward targets</p>
      </div>

      <div className="mt-4 flex-1 space-y-5">
        {GOALS_DATA.map((goal) => {
          const percent = Math.min(
            Math.round((goal.current / goal.target) * 100),
            100
          )
          const suffix = goal.suffix ?? ''
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