import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ACCOUNT_TYPES, type AccountDefinitionDraft, type AccountingAccountDefinition } from '../types/accountTypes'

type Props = {
  initialValue: AccountDefinitionDraft
  accounts: AccountingAccountDefinition[]
  editingId?: string
  onChange: (value: AccountDefinitionDraft) => void
}

const ACCOUNT_TYPE_LABELS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
}

const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500'

const AccountDefinitionForm = ({ initialValue, accounts, editingId, onChange }: Props) => {
  const [value, setValue] = useState(initialValue)
  const parentOptions = accounts.filter((account) => account.id !== editingId && account.status === 'ACTIVE')
  const update = (next: AccountDefinitionDraft) => {
    setValue(next)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">Account definitions are maintained locally until the accounting service exposes a chart-of-accounts API.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-700">
          Account Code
          <input required value={value.code} onChange={(event) => update({ ...value, code: event.target.value })} placeholder="e.g. 1100" className={`${inputClassName} mt-1.5`} />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Account Name
          <input required value={value.name} onChange={(event) => update({ ...value, name: event.target.value })} placeholder="e.g. Cash" className={`${inputClassName} mt-1.5`} />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Account Type
          <span className="relative mt-1.5 block">
            <select required value={value.type} onChange={(event) => update({ ...value, type: event.target.value as AccountDefinitionDraft['type'] })} className={`${inputClassName} appearance-none pr-9`}>
              {ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{ACCOUNT_TYPE_LABELS[type]}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </span>
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Parent Account
          <span className="relative mt-1.5 block">
            <select value={value.parentCode ?? ''} onChange={(event) => update({ ...value, parentCode: event.target.value || null })} className={`${inputClassName} appearance-none pr-9`}>
              <option value="">No parent account</option>
              {parentOptions.map((account) => <option key={account.id} value={account.code}>{account.code} · {account.name}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </span>
        </label>
        <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
          Description
          <textarea value={value.description} onChange={(event) => update({ ...value, description: event.target.value })} placeholder="Describe how this account is used." rows={3} className={`${inputClassName} mt-1.5 resize-y`} />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Status
          <span className="relative mt-1.5 block">
            <select value={value.status} onChange={(event) => update({ ...value, status: event.target.value as AccountDefinitionDraft['status'] })} className={`${inputClassName} appearance-none pr-9`}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </span>
        </label>
      </div>
    </div>
  )
}

export default AccountDefinitionForm