import { useState } from 'react'
import { Building2, ListChecks, ScrollText, FileText } from 'lucide-react'
import LeaveTypesPage from './LeaveTypesPage'
import LeavePoliciesPage from './LeavePoliciesPage'
import PositionLeaveAllocationTab from '../components/PositionLeaveAllocationTab'
import CompanyPoliciesTab from '../components/CompanyPoliciesTab'

type TabKey = 'allocations' | 'types' | 'policies' | 'company'

const TABS: Array<{ key: TabKey; label: string; icon: typeof ListChecks }> = [
  { key: 'allocations', label: 'Position Leave Allocation', icon: Building2 },
  { key: 'types', label: 'Leave Types', icon: ListChecks },
  { key: 'policies', label: 'Leave Policies', icon: ScrollText },
  { key: 'company', label: 'Company Policies', icon: FileText },
]

const LeaveSettingsPage = () => {
  const [tab, setTab] = useState<TabKey>('allocations')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Leave Settings</h1>
        <p className="text-sm text-slate-500">
          Configure leave types, policies, per-position allocations and company-wide policies.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white px-2 shadow-sm">
        {TABS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                tab === item.key
                  ? 'border-[var(--dni-primary)] text-[var(--dni-primary)]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'allocations' && <PositionLeaveAllocationTab />}
      {tab === 'types' && <LeaveTypesPage />}
      {tab === 'policies' && <LeavePoliciesPage />}
      {tab === 'company' && <CompanyPoliciesTab />}
    </div>
  )
}

export default LeaveSettingsPage
