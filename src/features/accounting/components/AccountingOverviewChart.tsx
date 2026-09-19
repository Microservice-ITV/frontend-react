import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AccountingChartPoint } from '../types/accountingTypes'

type Period = 'month' | 'lastMonth' | 'year'

type Props = { data: Record<Period, AccountingChartPoint[]> }

const PERIODS: { key: Period; label: string }[] = [
  { key: 'month', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'year', label: 'This Year' },
]

const formatAmount = (value: number) => `MMK ${value.toLocaleString()}`

const AccountingOverviewChart = ({ data }: Props) => {
  const [period, setPeriod] = useState<Period>('month')

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Income vs Expenses</h2>
          <p className="mt-0.5 text-xs text-slate-600">Revenue, expenses, and net income by period.</p>
        </div>
        <select
          aria-label="Chart period"
          value={period}
          onChange={(event) => setPeriod(event.target.value as Period)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
        >
          {PERIODS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </div>
      <div className="mt-5 h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data[period]} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} width={38} />
            <Tooltip formatter={(value) => formatAmount(Number(value))} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netIncome" name="Net Income" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AccountingOverviewChart