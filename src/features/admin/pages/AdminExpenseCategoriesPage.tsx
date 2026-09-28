import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, ReceiptText, RefreshCw, Trash2 } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { adminAccountingApi, type ExpenseCategory } from '../api/adminAccountingApi'

type CategoryDraft = Omit<ExpenseCategory, 'id'>

const emptyDraft: CategoryDraft = { code: '', name: '', description: '', status: 'ACTIVE' }

type ExpenseCategoryFormProps = {
  initialValue: CategoryDraft
  onChange: (value: CategoryDraft) => void
}

const ExpenseCategoryForm = ({ initialValue, onChange }: ExpenseCategoryFormProps) => {
  const [value, setValue] = useState(initialValue)

  const update = (next: Partial<CategoryDraft>) => {
    const updated = { ...value, ...next }
    setValue(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">Code
        <input value={value.code} onChange={(event) => update({ code: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="OFFICE" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Name
        <input value={value.name} onChange={(event) => update({ name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Office supplies" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Description
        <textarea rows={3} value={value.description ?? ''} onChange={(event) => update({ description: event.target.value })} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Optional description" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Status
        <select value={value.status} onChange={(event) => update({ status: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </label>
    </div>
  )
}

const AdminExpenseCategoriesPage = () => {
  const { openModal } = useGlobalModal()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft)
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const draftRef = useRef<CategoryDraft>(emptyDraft)

  const loadCategories = async () => {
    setStatus('loading')
    setError(null)
    try {
      setCategories(await adminAccountingApi.getExpenseCategories())
      setStatus('succeeded')
    } catch {
      setStatus('failed')
      setError('Unable to load expense categories.')
    }
  }

  useEffect(() => { void loadCategories() }, [])

  const openCategoryModal = (category?: ExpenseCategory) => {
    const initialValue = category
      ? { code: category.code, name: category.name, description: category.description ?? '', status: category.status }
      : emptyDraft
    draftRef.current = initialValue
    openModal({
      title: category ? `Edit category · ${category.name}` : 'Add expense category',
      content: <ExpenseCategoryForm initialValue={initialValue} onChange={(next) => { draftRef.current = next }} />,
      primaryLabel: category ? 'Save changes' : 'Create category',
      primaryVariant: 'success',
      onPrimary: async () => {
        const draft = draftRef.current
        if (!draft.code.trim()) throw new Error('Category code is required.')
        if (!draft.name.trim()) throw new Error('Category name is required.')
        const payload = { ...draft, code: draft.code.trim(), name: draft.name.trim(), description: draft.description?.trim() || null }
        if (category) await adminAccountingApi.updateExpenseCategory(category.id, payload)
        else await adminAccountingApi.createExpenseCategory(payload)
        await loadCategories()
      },
    })
  }

  const removeCategory = async (category: ExpenseCategory) => {
    if (!window.confirm(`Delete expense category "${category.name}"?`)) return
    try {
      await adminAccountingApi.deleteExpenseCategory(category.id)
      await loadCategories()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete expense category.')
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/accounting/overview" className="hover:text-slate-700">Accounting</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Expense Categories</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ReceiptText size={22} className="text-orange-600" />Expense Categories</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage the accounting categories available when recording expenses.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button type="button" onClick={() => openCategoryModal()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Plus size={16} />Add category</button>
          <button type="button" onClick={() => void loadCategories()} disabled={status === 'loading'} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />Refresh</button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6"><h2 className="text-base font-bold text-slate-900">All expense categories</h2><p className="mt-0.5 text-xs text-slate-500">Active categories are available in the Expense form.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-175"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Code</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Name</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Description</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th></tr></thead><tbody>{status === 'loading' && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">Loading expense categories...</td></tr>}{status === 'succeeded' && categories.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No expense categories found.</td></tr>}{status === 'succeeded' && categories.map((category) => <tr key={category.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{category.code}</td><td className="px-4 py-3 text-sm text-slate-800">{category.name}</td><td className="px-4 py-3 text-xs text-slate-600">{category.description || '-'}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${category.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{category.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openCategoryModal(category)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Edit category"><Pencil size={14} /></button><button type="button" onClick={() => void removeCategory(category)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Delete category"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}

export default AdminExpenseCategoriesPage
