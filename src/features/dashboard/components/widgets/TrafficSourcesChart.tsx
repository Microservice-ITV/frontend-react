import { useState, useRef, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

// TODO: Replace with real data from API.
const TRAFFIC_DATA = [
  { name: 'Direct', value: 35, color: '#0d9488' },
  { name: 'Organic', value: 28, color: 'var(--dni-primary-500)' },
  { name: 'Referral', value: 22, color: '#3b82f6' },
  { name: 'Social', value: 15, color: '#8b5cf6' },
]

const TrafficSourcesChart = () => {
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

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">Traffic Sources</h3>
        <p className="mt-0.5 text-xs text-slate-600">Where your visitors come from</p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center gap-4 sm:flex-row sm:items-stretch">
        <div ref={containerRef} className="relative h-48 w-48 shrink-0 sm:h-52 sm:w-52">
          {dimensions && (
          <ResponsiveContainer width={dimensions.width} height={dimensions.height}>
            <PieChart>
              <Pie
                data={TRAFFIC_DATA}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="none"
              >
                {TRAFFIC_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-bold text-slate-900">284K Visits</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2">
          {TRAFFIC_DATA.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600">{item.name}</span>
              <span className="ml-auto text-xs font-medium text-slate-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrafficSourcesChart