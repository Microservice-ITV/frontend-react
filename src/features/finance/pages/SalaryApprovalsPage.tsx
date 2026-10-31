import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  BadgeDollarSign,
  Check,
  Clock3,
  Search,
  X,
} from 'lucide-react'

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected'
type SalaryApproval = {
  id: string
  employee: string
  initials: string
  department: string
  period: string
  submitted: string
  baseSalary: number
  allowances: number
  deductions: number
  status: ApprovalStatus
}

const SEEDED_APPROVALS: SalaryApproval[] = [
  { id: 'SAL-2026-101', employee: 'Aung Min', initials: 'AM', department: 'Operations', period: 'October 2026', submitted: 'Oct 22, 2026', baseSalary: 850000, allowances: 75000, deductions: 25000, status: 'Pending' },
  { id: 'SAL-2026-102', employee: 'May Thu', initials: 'MT', department: 'Finance', period: 'October 2026', submitted: 'Oct 22, 2026', baseSalary: 720000, allowances: 50000, deductions: 20000, status: 'Pending' },
  { id: 'SAL-2026-103', employee: 'Ko Htet', initials: 'KH', department: 'Warehouse', period: 'October 2026', submitted: 'Oct 21, 2026', baseSalary: 950000, allowances: 90000, deductions: 40000, status: 'Pending' },
  { id: 'SAL-2026-098', employee: 'Ei Mon', initials: 'EM', department: 'Customer Support', period: 'October 2026', submitted: 'Oct 20, 2026', baseSalary: 680000, allowances: 45000, deductions: 15000, status: 'Approved' },
  { id: 'SAL-2026-097', employee: 'Nay Lin', initials: 'NL', department: 'Delivery', period: 'October 2026', submitted: 'Oct 19, 2026', baseSalary: 780000, allowances: 80000, deductions: 30000, status: 'Rejected' },
]

type FilterStatus = 'All' | ApprovalStatus
const amount = (value: number) => `MMK ${value.toLocaleString('en-US')}`
const netSalary = (approval: SalaryApproval) =>
  approval.baseSalary + approval.allowances - approval.deductions

const SalaryApprovalsPage = () => {
  const [approvals, setApprovals] = useState(SEEDED_APPROVALS)
  const [filter, setFilter] = useState<FilterStatus>('All')
  const [search, setSearch] = useState('')

  const pendingCount = approvals.filter((item) => item.status === 'Pending').length
  const pendingTotal = approvals
    .filter((item) => item.status === 'Pending')
    .reduce((sum, item) => sum + netSalary(item), 0)
  const approvedTotal = approvals
    .filter((item) => item.status === 'Approved')
    .reduce((sum, item) => sum + netSalary(item), 0)
  const visibleApprovals = useMemo(() => {
    const query = search.trim().toLowerCase()
    return approvals.filter((item) => {
      const matchesStatus = filter === 'All' || item.status === filter
      const matchesSearch = !query
        || [item.employee, item.id, item.department, item.period].some((value) =>
          value.toLowerCase().includes(query),
        )
      return matchesStatus && matchesSearch
    })
  }, [approvals, filter, search])

  const updateStatus = (id: string, status: ApprovalStatus) => {
    setApprovals((current) =>
      current.map((item) => item.id === id ? { ...item, status } : item),
    )
  }

  return (
    <section className="space-y-6">
      <Link
        to="/seller/finance"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={15} />
        Back to finance dashboard
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BadgeDollarSign size={22} className="text-emerald-600" />
            Salary Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review monthly salary requests before payroll processing.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
          <Clock3 size={14} />
          {pendingCount} awaiting review
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Pending salary total"
          value={amount(pendingTotal)}
          detail={`${pendingCount} requests awaiting review`}
          tone="amber"
          icon={Clock3}
        />
        <SummaryCard
          label="Approved this period"
          value={amount(approvedTotal)}
          detail="Net salary amount"
          tone="green"
          icon={BadgeCheck}
        />
        <SummaryCard
          label="Salary requests"
          value={String(approvals.length)}
          detail="October 2026 payroll"
          tone="blue"
          icon={BadgeDollarSign}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Payroll requests</h2>
            <p className="mt-1 text-xs text-slate-500">Seeded sample requests for October 2026</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or request..."
              aria-label="Search salary requests"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                filter === status
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Employee</th>
                <th className="px-3 py-3">Period</th>
                <th className="px-3 py-3">Submitted</th>
                <th className="px-3 py-3 text-right">Base salary</th>
                <th className="px-3 py-3 text-right">Allowances</th>
                <th className="px-3 py-3 text-right">Deductions</th>
                <th className="px-3 py-3 text-right">Net salary</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleApprovals.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                        {item.initials}
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-slate-900">{item.employee}</span>
                        <span className="block text-[11px] text-slate-500">{item.department} · {item.id}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{item.period}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{item.submitted}</td>
                  <td className="px-3 py-3 text-right text-xs text-slate-700">{amount(item.baseSalary)}</td>
                  <td className="px-3 py-3 text-right text-xs text-slate-700">{amount(item.allowances)}</td>
                  <td className="px-3 py-3 text-right text-xs text-slate-700">{amount(item.deductions)}</td>
                  <td className="px-3 py-3 text-right text-xs font-semibold text-slate-900">{amount(netSalary(item))}</td>
                  <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-3 py-3">
                    {item.status === 'Pending' ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'Approved')}
                          aria-label={`Approve ${item.employee}`}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(item.id, 'Rejected')}
                          aria-label={`Reject ${item.employee}`}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-50"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="block text-right text-[11px] text-slate-400">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {visibleApprovals.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-sm text-slate-500">
                    No salary requests match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        Demo data only. Approve and reject actions update this page locally and do not submit payroll or create accounting entries.
      </p>
    </section>
  )
}

const SummaryCard = ({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  tone: 'amber' | 'green' | 'blue'
  icon: typeof Clock3
}) => {
  const styles = {
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
        </div>
        <span className={`rounded-lg p-2 ${styles[tone]}`}><Icon size={17} /></span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  )
}

const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
  const styles: Record<ApprovalStatus, string> = {
    Pending: 'bg-amber-50 text-amber-700',
    Approved: 'bg-emerald-50 text-emerald-700',
    Rejected: 'bg-red-50 text-red-700',
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${styles[status]}`}>
      {status}
    </span>
  )
}

export default SalaryApprovalsPage
