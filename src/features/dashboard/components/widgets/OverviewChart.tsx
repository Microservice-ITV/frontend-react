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

type Metric = 'revenue' | 'orders' | 'profit'

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  metric: Metric
}

// TODO: Replace with real data from API (e.g. useOverviewStats hook).
// Expected shape: { month: string, revenue: number, orders: number, profit: number }[]
const CHART_DATA = [
  { month: 'Jan', revenue: 12000, orders: 120, profit: 8000 },
  { month: 'Feb', revenue: 18000, orders: 180, profit: 12000 },
  { month: 'Mar', revenue: 25000, orders: 220, profit: 16000 },
  { month: 'Apr', revenue: 28000, orders: 250, profit: 18000 },
  { month: 'May', revenue: 32100, orders: 280, profit: 21000 },
  { month: 'Jun', revenue: 29000, orders: 260, profit: 19000 },
  { month: 'Jul', revenue: 35000, orders: 320, profit: 24000 },
  { month: 'Aug', revenue: 40000, orders: 380, profit: 28000 },
  { month: 'Sep', revenue: 45000, orders: 420, profit: 32000 },
  { month: 'Oct', revenue: 50000, orders: 480, profit: 36000 },
  { month: 'Nov', revenue: 55000, orders: 520, profit: 40000 },
  { month: 'Dec', revenue: 58000, orders: 580, profit: 44000 },
]

const formatValue = (metric: Metric, value: number): string => {
  if (metric === 'orders') return value.toLocaleString()
  return `$${value.toLocaleString()}`
}

const CustomTooltip = ({ active, payload, label, metric }: CustomTooltipProps) => {
  if (!active || !payload?.length || !label) return null
  const value = payload[0]?.value ?? 0
  const labelText = metric === 'revenue' ? 'Revenue' : metric === 'orders' ? 'Orders' : 'Profit'
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-900">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        {labelText}: {formatValue(metric, value)}
      </p>
    </div>
  )
}

const OverviewChart = () => {
  const [metric, setMetric] = useState<Metric>('revenue')
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
  const tickFormatter = (value: number) =>
    metric === 'orders' ? value.toString() : `$${value / 1000}k`
  const yDomain: [number, number | 'auto'] =
    metric === 'revenue' ? [0, 60000] : [0, 'auto']

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Overview</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            Monthly performance for the current year
          </p>
        </div>
        <div className="flex shrink-0 gap-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(['revenue', 'orders', 'profit'] as const).map((m) => (
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
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-56 min-w-0 flex-1 w-full sm:min-h-64">
        <div ref={containerRef} className="h-64 w-full" style={{ minWidth: 300 }}>
          {dimensions && (
          <ResponsiveContainer width={dimensions.width} height={dimensions.height}>
          <AreaChart
            data={CHART_DATA} // TODO: Replace with real data (e.g. data={overviewData})
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" horizontal vertical={false} />
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
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
              domain={yDomain}
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
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#areaFill)"
              activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
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