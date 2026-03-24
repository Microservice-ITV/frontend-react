import { useState, useRef } from 'react'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

type StatCardProps = {
  title: string
  value: string
  trend?: {
    value: string
    isPositive: boolean
  }
  icon: LucideIcon
  iconColor?: 'green' | 'blue' | 'orange'
  sparklineData?: number[]
}

const SPARKLINE_COLORS = {
  green: {
    stroke: 'stroke-emerald-500',
    fill: 'fill-emerald-500/20',
    dot: 'bg-emerald-500',
    dotHalo: 'bg-emerald-400/30',
  },
  blue: {
    stroke: 'stroke-blue-500',
    fill: 'fill-blue-500/20',
    dot: 'bg-blue-500',
    dotHalo: 'bg-blue-400/30',
  },
  orange: {
    stroke: 'stroke-orange-500',
    fill: 'fill-orange-500/20',
    dot: 'bg-orange-500',
    dotHalo: 'bg-orange-400/30',
  },
} as const

const StatCard = ({
  title,
  value,
  trend,
  icon: Icon,
  iconColor = 'green',
  sparklineData = [0, 20, 40, 30, 50, 60, 70, 55, 80, 90, 85, 95],
}: StatCardProps) => {
  const colorClasses = {
    green: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    orange: 'bg-orange-500/10 text-orange-600',
  }
  const colors = SPARKLINE_COLORS[iconColor]
  const min = Math.min(...sparklineData)
  const max = Math.max(...sparklineData)
  const range = max - min || 1
  const coords = sparklineData.map((v, i) => {
    const x = (i / (sparklineData.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 80
    return { x, y }
  })
  const points = coords.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPoints = `0,100 ${points} 100,100`
  const lastPoint = coords[coords.length - 1]

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const index = Math.round((xPercent / 100) * (coords.length - 1))
    const clampedIndex = Math.max(0, Math.min(index, coords.length - 1))
    setHoveredPoint(coords[clampedIndex])
  }

  const handleMouseLeave = () => setHoveredPoint(null)

  const displayPoint = hoveredPoint ?? lastPoint

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p
              className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp size={12} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={12} strokeWidth={2.5} />
              )}
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClasses[iconColor]}`}
        >
          <Icon size={16} />
        </div>
      </div>

      {/* Sparkline with area fill and hover dot */}
      <div className="relative mt-3 h-10 w-full">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <polygon
            points={areaPoints}
            className={colors.fill}
          />
          <polyline
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className={colors.stroke}
          />
        </svg>
        {/* Dot as HTML overlay - stays circular (SVG circles stretch to bars with preserveAspectRatio="none") */}
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${displayPoint.x}%`,
            top: `${displayPoint.y}%`,
          }}
        >
          <div className={`h-full w-full rounded-full ${colors.dotHalo}`} />
          <div
            className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${colors.dot}`}
          />
        </div>
      </div>
    </div>
  )
}

export default StatCard