import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Landmark, Pencil } from 'lucide-react'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import { EmployeeStatusBadge } from '../components/EmployeeStatusBadge'
import {
  FormField,
  primaryButtonClass,
  sectionClass,
  textInputClass,
} from '../components/forms/FormField'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { employeePaths, type EmployeeAreaBase } from '../config/employeePaths'
import {
  useDepartments,
  useMyBankDetail,
  useMyEmployee,
  usePositions,
} from '../hooks/useEmployeeData'
import {
  EMPLOYMENT_TYPE_LABELS,
  GENDER_LABELS,
  employeeDisplayName,
  type BankDetailPayload,
} from '../types/employeeTypes'
import { formatDate } from '../utils/employeeFormat'

export type MyProfilePageProps = {
  base: EmployeeAreaBase
}

const Info = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="space-y-0.5">
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="text-sm text-slate-800">{value || '—'}</dd>
  </div>
)

const MyProfilePage = ({ base }: MyProfilePageProps) => {
  const paths = employeePaths(base)
  const { openModal } = useGlobalModal()
  const { employee, loading, error } = useMyEmployee()
  const { bankDetail, reload: reloadBank } = useMyBankDetail()
  const { departments } = useDepartments()
  const { positions } = usePositions()

  const openBankModal = () => {
    const payload: BankDetailPayload = {
      bank_name: bankDetail?.bank_name ?? '',
      account_holder_name: bankDetail?.account_holder_name ?? '',
      account_number: '',
      currency: bankDetail?.currency ?? null,
      routing_number: bankDetail?.routing_number ?? null,
      sort_code: bankDetail?.sort_code ?? null,
      iban: bankDetail?.iban ?? null,
      swift_code: bankDetail?.swift_code ?? null,
    }
    openModal({
      title: 'Bank details',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Bank name" required>
            <input
              defaultValue={payload.bank_name}
              onChange={(event) => {
                payload.bank_name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Account holder" required>
            <input
              defaultValue={payload.account_holder_name}
              onChange={(event) => {
                payload.account_holder_name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Account number" required>
            <input
              onChange={(event) => {
                payload.account_number = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Currency">
            <input
              maxLength={3}
              defaultValue={payload.currency ?? ''}
              onChange={(event) => {
                payload.currency = event.target.value.toUpperCase() || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Routing number">
            <input
              defaultValue={payload.routing_number ?? ''}
              onChange={(event) => {
                payload.routing_number = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Sort code">
            <input
              defaultValue={payload.sort_code ?? ''}
              onChange={(event) => {
                payload.sort_code = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="IBAN">
            <input
              defaultValue={payload.iban ?? ''}
              onChange={(event) => {
                payload.iban = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="SWIFT code">
            <input
              defaultValue={payload.swift_code ?? ''}
              onChange={(event) => {
                payload.swift_code = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Save',
      onPrimary: async () => {
        try {
          await employeeApi.updateMyBankDetail(payload)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reloadBank()
      },
    })
  }

  if (loading && !employee) {
    return <p className="text-sm text-slate-500">Loading profile…</p>
  }

  if (error && !employee) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
        No employee record is linked to your account.
      </div>
    )
  }

  const departmentName =
    employee.department?.name ??
    departments.find((item) => item.id === employee.department_id)?.name ??
    '—'
  const positionTitle =
    employee.position?.title ??
    positions.find((item) => item.id === employee.position_id)?.title ??
    '—'

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          HR
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">My profile</span>
      </nav>

      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {employeeDisplayName(employee)}
          </h1>
          <p className="text-sm text-slate-500">
            {employee.employee_code} · {positionTitle}
          </p>
        </div>
        <EmployeeStatusBadge status={employee.employment_status} size="md" />
      </div>

      <section className={sectionClass}>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Email" value={employee.email} />
          <Info label="Phone" value={employee.phone} />
          <Info
            label="Gender"
            value={employee.gender ? GENDER_LABELS[employee.gender] : '—'}
          />
          <Info label="Date of birth" value={formatDate(employee.date_of_birth)} />
          <Info label="Join date" value={formatDate(employee.join_date)} />
          <Info label="Department" value={departmentName} />
          <Info label="Position" value={positionTitle} />
          <Info
            label="Employment type"
            value={EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
          />
          <Info label="Address" value={employee.address} />
        </dl>
      </section>

      <section className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Landmark size={16} />
            Bank details
          </h2>
          <button type="button" className={primaryButtonClass} onClick={openBankModal}>
            <Pencil size={16} />
            {bankDetail ? 'Update' : 'Add'}
          </button>
        </div>
        {!bankDetail ? (
          <p className="text-sm text-slate-500">No bank details on file.</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Bank name" value={bankDetail.bank_name} />
            <Info label="Account holder" value={bankDetail.account_holder_name} />
            <Info label="Account number" value={bankDetail.account_number} />
            <Info label="Currency" value={bankDetail.currency} />
            <Info label="Routing number" value={bankDetail.routing_number} />
            <Info label="Sort code" value={bankDetail.sort_code} />
            <Info label="IBAN" value={bankDetail.iban} />
            <Info label="SWIFT code" value={bankDetail.swift_code} />
          </dl>
        )}
      </section>
    </div>
  )
}

export default MyProfilePage
