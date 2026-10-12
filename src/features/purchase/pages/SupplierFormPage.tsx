import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { SUPPLIER_STATUSES, type SupplierStatus } from '../types/purchaseTypes'

export type SupplierFormPageProps = {
  base: PurchaseAreaBase
  mode: 'create' | 'edit'
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

const SupplierFormPage = ({ base, mode }: SupplierFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const paths = purchasePaths(base)
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [status, setStatus] = useState<SupplierStatus>('ACTIVE')

  useEffect(() => {
    if (mode !== 'edit' || !id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await purchaseApi.getSupplier(id)
        const supplier = response.data?.data
        if (!supplier) {
          if (!cancelled) setLoadError('Supplier not found.')
          return
        }
        if (cancelled) return
        setName(supplier.name)
        setCode(supplier.code ?? '')
        setContactName(supplier.contactName ?? '')
        setEmail(supplier.email ?? '')
        setPhone(supplier.phone ?? '')
        setAddress(supplier.address ?? '')
        setPaymentTerms(supplier.paymentTerms ?? '')
        setTaxNumber(supplier.taxNumber ?? '')
        setStatus(supplier.status)
      } catch (error) {
        if (!cancelled) setLoadError(purchaseErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [mode, id])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setSubmitError('Name must be at least 2 characters.')
      return
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const payload = {
        name: trimmedName,
        code: code.trim() || null,
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        paymentTerms: paymentTerms.trim() || null,
        taxNumber: taxNumber.trim() || null,
        status,
      }
      if (mode === 'edit' && id) {
        await purchaseApi.updateSupplier(id, payload)
        navigate(paths.supplierDetail(id))
      } else {
        await purchaseApi.createSupplier(payload)
        navigate(paths.suppliers)
      }
    } catch (error) {
      setSubmitError(purchaseErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'New supplier' : 'Edit supplier'

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>
        <span className="mx-1">/</span>
        <Link to={paths.suppliers} className="hover:text-slate-700">
          Suppliers
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{title}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading supplier...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link
            to={paths.suppliers}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Back to list
          </Link>
        </div>
      )}

      {!loading && !loadError && (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Contact details and payment terms for this vendor.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(paths.suppliers)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create supplier' : 'Save changes'}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold text-slate-900">Supplier details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="supplier-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="supplier-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Acme Supplies"
                  required
                />
              </div>
              <div>
                <label htmlFor="supplier-code" className={labelClass}>
                  Code
                </label>
                <input
                  id="supplier-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className={inputClass}
                  placeholder="ACME"
                />
              </div>
              <div>
                <label htmlFor="supplier-contact" className={labelClass}>
                  Contact name
                </label>
                <input
                  id="supplier-contact"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="supplier-phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="supplier-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="supplier-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="supplier-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="supplier-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="supplier-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as SupplierStatus)}
                  className={inputClass}
                >
                  {SUPPLIER_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="supplier-address" className={labelClass}>
                  Address
                </label>
                <input
                  id="supplier-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="supplier-terms" className={labelClass}>
                  Payment terms
                </label>
                <input
                  id="supplier-terms"
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  className={inputClass}
                  placeholder="Net 30"
                />
              </div>
              <div>
                <label htmlFor="supplier-tax" className={labelClass}>
                  Tax number
                </label>
                <input
                  id="supplier-tax"
                  value={taxNumber}
                  onChange={(event) => setTaxNumber(event.target.value)}
                  className={inputClass}
                  placeholder="VAT/TIN registration number"
                />
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  )
}

export default SupplierFormPage
