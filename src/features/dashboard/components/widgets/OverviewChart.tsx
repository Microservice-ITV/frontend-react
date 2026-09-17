import { useState, useRef, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export type OverviewChartRow = {
  month: string
  users: number
  shops: number
  pending: number
}

type Metric = 'users' | 'shops' | 'pending'

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  metric: Metric
}

const CustomTooltip = ({ active, payload, label, metric }: CustomTooltipProps) => {
  if (!active || !payload?.length || !label) return null
  const value = payload[0]?.value ?? 0
  const labelText = metric === 'users' ? 'Revenue' : metric === 'shops' ? 'Orders' : 'Pending orders'
  const formattedValue = metric === 'users'
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : value.toLocaleString()
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-900">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
        <span className="h-2 w-2 shrink-0 rounded-full bg-(--dni-primary-500)" />
        {labelText}: {formattedValue}
      </p>
    </div>
  )
}

type OverviewChartProps = {
  data: OverviewChartRow[]
  title?: string
  description?: string
  metricLabels?: Partial<Record<Metric, string>>
}

const OverviewChart = ({
  data,
  title = 'Overview',
  description = 'Monthly registrations and shop applications for the current year',
  metricLabels,
}: OverviewChartProps) => {
  const [metric, setMetric] = useState<Metric>('users')
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setDimensions({ width: Math.round(width), height: Math.round(height) })
      }
    })
    observer.observe(el)
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }
    return () => observer.disconnect()
  }, [])

  const dataKey = metric
  const tickFormatter = (value: number) => value.toLocaleString()

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 gap-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(['users', 'shops', 'pending'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 ${
                metric === m
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {metricLabels?.[m] ?? (m === 'users' ? 'Users' : m === 'shops' ? 'Shops' : 'Pending')}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-56 min-w-0 flex-1 w-full sm:min-h-64">
        <div ref={containerRef} className="h-64 w-full" style={{ minWidth: 300 }}>
          {dimensions && (
          <ResponsiveContainer width={dimensions.width} height={dimensions.height}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" horizontal vertical={false} />
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--dni-primary-500)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--dni-primary-500)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              dy={8}
            />
            <YAxis
              dataKey={dataKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={tickFormatter}
              domain={[0, 'auto']}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
              content={<CustomTooltip metric={metric} />}
              position={{ y: 0 }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="var(--dni-primary-500)"
              strokeWidth={2}
              fill="url(#areaFill)"
              activeDot={{ r: 4, fill: 'var(--dni-primary-500)', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default OverviewChart