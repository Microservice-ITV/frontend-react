import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react'
import type { FinanceSummary } from '../types/financeTypes'

type Props = { summary: FinanceSummary }

const CARDS: {
  key: keyof FinanceSummary
  label: string
  icon: typeof TrendingUp
  color: string
  bg: string
}[] = [
  {
    key: 'totalIncome',
    label: 'Total Income',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    key: 'totalExpenses',
    label: 'Total Expenses',
    icon: TrendingDown,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    key: 'netProfit',
    label: 'Net Profit',
    icon: DollarSign,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    key: 'pendingAmount',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
]

const FinanceOverviewCards = ({ summary }: Props) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <Icon size={16} className={card.color} />
              </div>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {summary[card.key]}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default FinanceOverviewCards
