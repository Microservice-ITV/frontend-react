import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  Cake,
  ClipboardList,
  Clock3,
  FileText,
  History,
  Landmark,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import {
  ContractStatusBadge,
  EmployeeStatusBadge,
} from '../components/EmployeeStatusBadge'
import {
  FormField,
  primaryButtonClass,
  secondaryButtonClass,
  sectionClass,
  textInputClass,
} from '../components/forms/FormField'
import EmployeeAvatar from '../components/EmployeeAvatar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { employeePaths, type EmployeeAreaBase } from '../config/employeePaths'
import {
  useDepartments,
  useEmployee,
  useEmployeeBankDetail,
  useEmployeeContracts,
  useEmployeeHistory,
  usePositions,
} from '../hooks/useEmployeeData'
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPE_LABELS,
  GENDER_LABELS,
  HISTORY_CHANGE_TYPE_LABELS,
  employeeDisplayName,
  type BankDetailPayload,
  type EmploymentContractPayload,
  type EmploymentStatus,
} from '../types/employeeTypes'
import { formatDate, formatMoney } from '../utils/employeeFormat'

export type EmployeeDetailPageProps = {
  base: EmployeeAreaBase
}

type TabKey = 'overview' | 'contracts' | 'history' | 'bank'

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="space-y-0.5">
    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="text-sm text-slate-800">{value || value === 0 ? value : '—'}</dd>
  </div>
)

const IconDetail = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
}) => (
  <div className="flex min-w-0 items-start gap-3 border-b border-slate-100 py-3 last:border-b-0">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      <Icon size={16} />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="break-words text-sm font-semibold text-slate-800">
        {value || value === 0 ? value : '—'}
      </p>
    </div>
  </div>
)

const EmployeeDetailPage = ({ base }: EmployeeDetailPageProps) => {
  const paths = employeePaths(base)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { openModal } = useGlobalModal()

  const { employee, loading, error, reload } = useEmployee(id)
  const { contracts, reload: reloadContracts } = useEmployeeContracts(id)
  const activeContract = contracts.find((contract) => contract.status === 'active')
  const { history } = useEmployeeHistory(id)
  const { bankDetail, loading: bankLoading, error: bankError, reload: reloadBank } =
    useEmployeeBankDetail(id)
  const { departments } = useDepartments()
  const { positions } = usePositions()

  const [tab, setTab] = useState<TabKey>('overview')
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    if (!employee?.user_id) {
      setProfileImage(null)
      return
    }

    let cancelled = false
    setProfileImage(null)
    employeeApi.getProfileImage(employee.user_id)
      .then((response) => {
        if (cancelled) return
        setProfileImage(
          response.data.data?.users?.find((user) => user.id === employee.user_id)?.profile_image ?? null,
        )
      })
      .catch(() => {
        if (!cancelled) setProfileImage(null)
      })

    return () => {
      cancelled = true
    }
  }, [employee?.user_id])

  const departmentName = useMemo(() => {
    if (!employee) return '—'
    if (employee.department?.name) return employee.department.name
    return departments.find((item) => item.id === employee.department_id)?.name ?? '—'
  }, [employee, departments])

  const positionTitle = useMemo(() => {
    if (!employee) return '—'
    if (employee.position?.title) return employee.position.title
    return positions.find((item) => item.id === employee.position_id)?.title ?? '—'
  }, [employee, positions])

  const designation = useMemo(() => employee?.designation?.name ?? '—', [employee])

  const managerName = useMemo(() => {
    if (!employee) return '—'
    return employee.manager?.full_name ?? '—'
  }, [employee])

  const openStatusModal = () => {
    if (!employee) return
    let status: EmploymentStatus = employee.employment_status
    let reason = ''
    openModal({
      title: 'Change employment status',
      content: (
        <div className="space-y-3">
          <FormField label="New status" required>
            <select
              defaultValue={status}
              onChange={(event) => {
                status = event.target.value as EmploymentStatus
              }}
              className={textInputClass}
            >
              {EMPLOYMENT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {EMPLOYMENT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Reason">
            <textarea
              rows={2}
              onChange={(event) => {
                reason = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Update status',
      onPrimary: async () => {
        try {
          await employeeApi.changeEmployeeStatus(employee.id, {
            status,
            reason: reason.trim() || null,
          })
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const openContractModal = () => {
    if (!id) return
    const payload: EmploymentContractPayload = {
      contract_type: 'permanent',
      start_date: new Date().toISOString().slice(0, 10),
      status: 'active',
    }
    openModal({
      title: 'Add contract',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Contract type" required>
            <select
              defaultValue={payload.contract_type}
              onChange={(event) => {
                payload.contract_type = event.target
                  .value as EmploymentContractPayload['contract_type']
              }}
              className={textInputClass}
            >
              {CONTRACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CONTRACT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select
              defaultValue={payload.status ?? 'active'}
              onChange={(event) => {
                payload.status = event.target
                  .value as EmploymentContractPayload['status']
              }}
              className={textInputClass}
            >
              {CONTRACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CONTRACT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Start date" required>
            <input
              type="date"
              defaultValue={payload.start_date}
              onChange={(event) => {
                payload.start_date = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="End date">
            <input
              type="date"
              onChange={(event) => {
                payload.end_date = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Probation end date">
            <input
              type="date"
              onChange={(event) => {
                payload.probation_end_date = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Base salary">
            <input
              type="number"
              step="0.01"
              min="0"
              onChange={(event) => {
                payload.base_salary = event.target.value
                  ? Number(event.target.value)
                  : null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Currency">
            <input
              maxLength={3}
              placeholder="USD"
              onChange={(event) => {
                payload.currency = event.target.value.toUpperCase() || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Working hours / week">
            <input
              type="number"
              min={1}
              max={168}
              onChange={(event) => {
                payload.working_hours_per_week = event.target.value
                  ? Number(event.target.value)
                  : null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Terms" className="sm:col-span-2">
            <textarea
              rows={2}
              onChange={(event) => {
                payload.terms = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Add contract',
      onPrimary: async () => {
        try {
          await employeeApi.createEmployeeContract(id, payload)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reloadContracts()
      },
    })
  }

  const openBankModal = () => {
    if (!id) return
    const payload: BankDetailPayload = {
      bank_name: bankDetail?.bank_name ?? '',
      account_holder_name: bankDetail?.account_holder_name ?? '',
      account_number: '',
      currency: bankDetail?.currency ?? null,
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
          <FormField label="Account number" required hint="Required to save.">
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
              onChange={(event) => {
                payload.routing_number = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Sort code">
            <input
              onChange={(event) => {
                payload.sort_code = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="IBAN">
            <input
              onChange={(event) => {
                payload.iban = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="SWIFT code">
            <input
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
          await employeeApi.updateEmployeeBankDetail(id, payload)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reloadBank()
      },
    })
  }

  if (loading && !employee) {
    return <p className="text-sm text-slate-500">Loading employee…</p>
  }

  if (error && !employee) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    )
  }

  if (!employee) return null

  const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
    { key: 'overview', label: 'Overview', icon: ClipboardList },
    { key: 'contracts', label: `Contracts (${contracts.length})`, icon: FileText },
    { key: 'history', label: `History (${history.length})`, icon: History },
    { key: 'bank', label: 'Bank details', icon: Landmark },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Employees
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">{employeeDisplayName(employee)}</span>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-indigo-50/70 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-24 w-24 shrink-0 rounded-full bg-white p-1.5 shadow-sm sm:h-28 sm:w-28">
              <EmployeeAvatar name={employeeDisplayName(employee)} imageUrl={profileImage} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {employeeDisplayName(employee)}
              </h1>
              <div className="my-2">
                <EmployeeStatusBadge status={employee.employment_status} size="md" />
              </div>
              <p className="text-sm text-slate-500">
                {employee.employee_code} <span className="mx-1.5">·</span> {positionTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 xl:shrink-0">
            <button type="button" className={secondaryButtonClass} onClick={openStatusModal}>
              <Pencil size={15} />
              Change status
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => navigate(paths.employeeEdit(employee.id))}
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-200/80 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <IconDetail icon={Landmark} label="Department" value={departmentName} />
          <IconDetail icon={BriefcaseBusiness} label="Position" value={positionTitle} />
          <IconDetail icon={CalendarDays} label="Join Date" value={formatDate(employee.join_date)} />
          <IconDetail icon={Cake} label="Date of Birth" value={formatDate(employee.date_of_birth)} />
          <IconDetail icon={Phone} label="Phone" value={employee.phone} />
        </div>
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white px-2 shadow-sm">
        {tabs.map((item) => (
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
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <section className={`${sectionClass} sm:p-6`}>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                <UserRound size={18} />
              </span>
              <h2 className="text-base font-semibold text-slate-900">Employee Information</h2>
            </div>
            <div className="grid gap-x-7 sm:grid-cols-2">
              <div>
                <IconDetail icon={FileText} label="Employee Code" value={employee.employee_code} />
                <IconDetail icon={BriefcaseBusiness} label="Designation" value={designation} />
                <IconDetail
                  icon={Clock3}
                  label="Employment Type"
                  value={EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
                />
                <IconDetail
                  icon={UserRound}
                  label="Gender"
                  value={employee.gender ? GENDER_LABELS[employee.gender] : '—'}
                />
                <IconDetail icon={MapPin} label="Address" value={employee.address} />
              </div>
              <div>
                <IconDetail icon={Landmark} label="Department" value={departmentName} />
                <IconDetail icon={UserRound} label="Manager" value={managerName} />
                <IconDetail
                  icon={CalendarDays}
                  label="Join Date"
                  value={formatDate(employee.join_date)}
                />
                <IconDetail
                  icon={BadgeDollarSign}
                  label="Salary"
                  value={formatMoney(activeContract?.base_salary, activeContract?.currency)}
                />
                <IconDetail icon={Mail} label="Email" value={employee.email} />
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CalendarDays size={19} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">Employment Type</p>
                    <p className="font-semibold text-slate-900">
                      {EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
                    </p>
                  </div>
                </div>
                <EmployeeStatusBadge status={employee.employment_status} />
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Joined on {formatDate(employee.join_date)}
              </p>
            </section>

            <section className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <ClipboardList size={16} />
                </span>
                <h2 className="text-sm font-semibold text-slate-900">Quick Summary</h2>
              </div>
              <div className="grid gap-x-3 sm:grid-cols-2">
                <IconDetail icon={Landmark} label="Department" value={departmentName} />
                <IconDetail icon={BriefcaseBusiness} label="Position" value={positionTitle} />
                <IconDetail
                  icon={CalendarDays}
                  label="Join Date"
                  value={formatDate(employee.join_date)}
                />
                <IconDetail
                  icon={BadgeDollarSign}
                  label="Salary"
                  value={formatMoney(activeContract?.base_salary, activeContract?.currency)}
                />
              </div>
            </section>

            <section className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <Mail size={16} />
                </span>
                <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <IconDetail icon={Mail} label="Email" value={employee.email} />
                <IconDetail icon={Phone} label="Phone" value={employee.phone} />
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === 'contracts' && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Employment contracts</h2>
            <button type="button" className={primaryButtonClass} onClick={openContractModal}>
              <Plus size={16} />
              Add contract
            </button>
          </div>
          {contracts.length === 0 ? (
            <p className="text-sm text-slate-500">No contracts recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '720px' }}>
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Start</th>
                    <th className="py-2 pr-3">End</th>
                    <th className="py-2 pr-3">Salary</th>
                    <th className="py-2 pr-3">Signed</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-slate-100 text-sm text-slate-700">
                      <td className="py-2 pr-3">{CONTRACT_TYPE_LABELS[contract.contract_type]}</td>
                      <td className="py-2 pr-3">
                        <ContractStatusBadge status={contract.status} />
                      </td>
                      <td className="py-2 pr-3">{formatDate(contract.start_date)}</td>
                      <td className="py-2 pr-3">{formatDate(contract.end_date)}</td>
                      <td className="py-2 pr-3">
                        {formatMoney(contract.base_salary, contract.currency)}
                      </td>
                      <td className="py-2 pr-3">{formatDate(contract.signed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section className={sectionClass}>
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Employment history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No history recorded.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1 border-l-2 border-slate-200 pl-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {HISTORY_CHANGE_TYPE_LABELS[entry.change_type]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(entry.effective_date)}
                    </span>
                  </div>
                  {entry.reason && <p className="text-sm text-slate-600">{entry.reason}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === 'bank' && (
        <section className={sectionClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Bank details</h2>
            <button type="button" className={primaryButtonClass} onClick={openBankModal}>
              <Pencil size={16} />
              {bankDetail ? 'Update' : 'Add'}
            </button>
          </div>
          {bankLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : bankError ? (
            <p className="text-sm text-rose-600">{bankError}</p>
          ) : !bankDetail ? (
            <p className="text-sm text-slate-500">No bank details on file.</p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Bank name" value={bankDetail.bank_name} />
              <DetailRow label="Account holder" value={bankDetail.account_holder_name} />
              <DetailRow label="Account number" value={bankDetail.account_number} />
              <DetailRow label="Currency" value={bankDetail.currency} />
              <DetailRow label="Routing number" value={bankDetail.routing_number} />
              <DetailRow label="Sort code" value={bankDetail.sort_code} />
              <DetailRow label="IBAN" value={bankDetail.iban} />
              <DetailRow label="SWIFT code" value={bankDetail.swift_code} />
              <DetailRow
                label="Verified"
                value={bankDetail.is_verified ? 'Yes' : 'No'}
              />
            </dl>
          )}
        </section>
      )}
    </div>
  )
}

export default EmployeeDetailPage
