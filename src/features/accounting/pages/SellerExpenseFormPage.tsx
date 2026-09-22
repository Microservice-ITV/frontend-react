import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ReceiptText } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/Button'
import SearchableSelect, { type SearchableSelectOption } from '@/components/ui/SearchableSelect'
import { sellerRegistrationApi } from '@/features/seller/api/sellerRegistrationApi'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import type { CreateExpenseResponse, ExpenseAccount, ExpenseCategory } from '../types/expenseTypes'

const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const today = () => new Date().toISOString().slice(0, 10)
const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error ? error.message : fallback
}

type ShopOption = { id: string; name: string }

type FormValue = {
  shopId: string
  categoryId: string
  expenseAccountCode: string
  fundingAccountCode: string
  amount: string
  expenseDate: string
  description: string
}

const SellerExpenseFormPage = () => {
  const navigate = useNavigate()
  const authUser = useAppSelector((state) => state.auth.user)
  const [shops, setShops] = useState<ShopOption[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([])
  const [value, setValue] = useState<FormValue>({
    shopId: authUser?.active_shop_id ?? '',
    categoryId: '',
    expenseAccountCode: '',
    fundingAccountCode: '',
    amount: '',
    expenseDate: today(),
    description: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed' | 'succeeded'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreateExpenseResponse | null>(null)

  useEffect(() => {
    let active = true
    const loadOptions = async () => {
      if (!authUser?.id) {
        setStatus('failed')
        setError('Your authenticated seller account could not be resolved.')
        return
      }

      const [shopsResult, categoriesResult, accountsResult] = await Promise.allSettled([
        sellerRegistrationApi.listShopsForUser(authUser.id),
        accountingExpensesAdapter.listCategories(),
        accountingExpensesAdapter.listAccounts(),
      ])
      if (!active) return

      const shopOptions = shopsResult.status === 'fulfilled'
        ? shopsResult.value
          .filter((shop) => Boolean(shop.id))
          .map((shop) => ({ id: shop.id, name: shop.name }))
        : []
      const loadedCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
      const loadedAccounts = accountsResult.status === 'fulfilled' ? accountsResult.value : []

      setShops(shopOptions)
      setCategories(loadedCategories.filter((category) => category.status === 'ACTIVE'))
      setAccounts(loadedAccounts)
      setValue((previous) => ({
        ...previous,
        shopId: previous.shopId || authUser.active_shop_id || shopOptions[0]?.id || '',
      }))
      const optionErrors = [
        shopsResult.status === 'rejected' ? 'shops' : null,
        categoriesResult.status === 'rejected' ? 'expense categories' : null,
        accountsResult.status === 'rejected' ? 'accounting accounts' : null,
      ].filter((item): item is string => item !== null)
      if (optionErrors.length > 0) {
        setError(`Unable to load ${optionErrors.join(' and ')}. Other options are still available.`)
      }
      setStatus('succeeded')
    }
    void loadOptions()
    return () => { active = false }
  }, [authUser?.active_shop_id, authUser?.id])

  const expenseAccounts = useMemo(
    () => accounts.filter((account) => account.type === 'EXPENSE' && account.status === 'ACTIVE'),
    [accounts],
  )
  const fundingAccounts = useMemo(
    () => accounts.filter((account) => !['INCOME', 'EXPENSE'].includes(account.type) && account.status === 'ACTIVE'),
    [accounts],
  )
  const shopOptions: SearchableSelectOption[] = shops.map((shop) => ({ value: shop.id, label: shop.name }))
  const categoryOptions: SearchableSelectOption[] = categories.map((category) => ({ value: category.id, label: `${category.code} · ${category.name}` }))
  const expenseAccountOptions: SearchableSelectOption[] = expenseAccounts.map((account) => ({ value: account.code, label: `${account.code} · ${account.name}` }))
  const fundingAccountOptions: SearchableSelectOption[] = fundingAccounts.map((account) => ({ value: account.code, label: `${account.code} · ${account.name}` }))

  const update = <K extends keyof FormValue>(key: K, next: FormValue[K]) => {
    setValue((previous) => ({ ...previous, [key]: next }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const amount = Number(value.amount)
    if (!value.shopId) return setError('Select a shop before creating the expense.')
    if (!value.categoryId) return setError('Select an expense category.')
    if (!value.expenseAccountCode) return setError('Select an expense account.')
    if (!value.fundingAccountCode) return setError('Select a funding account.')
    if (value.expenseAccountCode === value.fundingAccountCode) return setError('Expense and funding accounts must be different.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Amount must be greater than 0.')

    setStatus('loading')
    try {
      const response = await accountingExpensesAdapter.create({
        shopId: value.shopId,
        amount,
        expenseDate: value.expenseDate || undefined,
        expenseAccountCode: value.expenseAccountCode,
        fundingAccountCode: value.fundingAccountCode,
        expenseCategoryId: value.categoryId,
        description: value.description.trim() || undefined,
      })
      setCreated(response)
      setStatus('succeeded')
    } catch (cause) {
      setStatus('failed')
      setError(errorMessage(cause, 'Unable to create expense.'))
    }
  }

  if (created) {
    return (
      <section className="space-y-6">
        <Link to="/seller/accounting/expenses" className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"><ArrowLeft size={15} />Back to expenses</Link>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 text-emerald-600" size={22} /><div><h1 className="text-lg font-bold text-emerald-950">Expense created</h1><p className="mt-1 text-sm text-emerald-800">{created.expense.expenseNo} was created with status {created.expense.status}.</p></div></div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-emerald-700">Amount</p><p className="font-semibold text-emerald-950">{created.expense.currency} {Number(created.expense.amount).toLocaleString()}</p></div><div><p className="text-xs text-emerald-700">Journal entry</p><p className="font-semibold text-emerald-950">{created.journalEntry.referenceId}</p></div><div><p className="text-xs text-emerald-700">Journal status</p><p className="font-semibold text-emerald-950">{created.journalEntry.status}</p></div></div>
        </div>
        <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => navigate('/seller/accounting/expenses/new')} className="w-auto px-4">Create another expense</Button><Link to="/seller/accounting/expenses" className="inline-flex items-center rounded px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">View expenses</Link></div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500"><Link to="/seller/overview" className="hover:text-slate-700">Dashboard</Link><span className="mx-1">/</span><Link to="/seller/accounting/overview" className="hover:text-slate-700">Accounting</Link><span className="mx-1">/</span><span className="text-slate-900">New Expense</span></nav>
      <div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ReceiptText size={22} className="text-orange-600" />Add Expense</h1><p className="mt-0.5 text-sm text-slate-600">Record a shop expense and its balanced journal entry.</p></div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {status === 'loading' && <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading expense options...</p>}
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Shop" required><SearchableSelect options={shopOptions} value={value.shopId} onChange={(next) => update('shopId', next)} emptyLabel="Select a shop" disabled={status === 'loading' || shops.length === 0} /></Field>
          <Field label="Expense Category" required><SearchableSelect options={categoryOptions} value={value.categoryId} onChange={(next) => update('categoryId', next)} emptyLabel="Select a category" disabled={status === 'loading'} /></Field>
          <Field label="Expense Account" required><SearchableSelect options={expenseAccountOptions} value={value.expenseAccountCode} onChange={(next) => update('expenseAccountCode', next)} emptyLabel="Select an expense account" disabled={status === 'loading'} /></Field>
          <Field label="Funding Account" required><SearchableSelect options={fundingAccountOptions} value={value.fundingAccountCode} onChange={(next) => update('fundingAccountCode', next)} emptyLabel="Select a funding account" disabled={status === 'loading'} /></Field>
          <Field label="Amount" required><input type="number" min="0.01" step="0.01" value={value.amount} onChange={(event) => update('amount', event.target.value)} className={inputClassName} placeholder="0.00" /></Field>
          <Field label="Currency" required><input value="MMK" readOnly className={`${inputClassName} cursor-not-allowed bg-slate-50 text-slate-500`} /></Field>
          <Field label="Expense Date" required><input type="date" value={value.expenseDate} onChange={(event) => update('expenseDate', event.target.value)} className={inputClassName} /></Field>
          <Field label="Description"><textarea rows={3} value={value.description} onChange={(event) => update('description', event.target.value)} className={`${inputClassName} resize-y`} placeholder="Optional description" /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5"><Link to="/seller/accounting/expenses" className="inline-flex items-center rounded px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</Link><Button type="submit" disabled={status === 'loading' || status === 'failed' && !authUser?.id} loading={status === 'loading'} className="w-auto px-5">Create Expense</Button></div>
      </form>
    </section>
  )
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => <label className="block text-sm font-medium text-slate-700"><span>{label}{required && <span className="ml-1 text-red-500">*</span>}</span><span className="mt-1.5 block">{children}</span></label>

export default SellerExpenseFormPage
