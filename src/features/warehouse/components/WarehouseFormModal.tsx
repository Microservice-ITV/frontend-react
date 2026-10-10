import { useEffect, useState } from 'react'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import {
  WAREHOUSE_STATUSES,
  type Warehouse,
  type WarehouseStatus,
} from '../types/warehouseTypes'
import {
  FormField,
  invalidTextInputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from './forms/FormField'

export type WarehouseFormModalProps = {
  open: boolean
  warehouse: Warehouse | null
  onClose: () => void
  onSaved: () => void
}

const WarehouseFormModal = ({
  open,
  warehouse,
  onClose,
  onSaved,
}: WarehouseFormModalProps) => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<WarehouseStatus>('ACTIVE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(warehouse?.name ?? '')
    setCode(warehouse?.code ?? '')
    setAddress(warehouse?.address ?? '')
    setStatus(warehouse?.status ?? 'ACTIVE')
    setError(null)
    setNameError(null)
  }, [open, warehouse])

  const submit = async () => {
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters.')
      return
    }

    setNameError(null)
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: trimmedName,
        code: code.trim().toUpperCase() || null,
        address: address.trim() || null,
        status,
      }
      if (warehouse) {
        await warehouseApi.updateWarehouse(warehouse.id, payload)
      } else {
        await warehouseApi.createWarehouse(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(warehouseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalDrawer
      open={open}
      onClose={onClose}
      variant="modal"
      size="md"
      title={warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
      subtitle={
        warehouse
          ? 'Update warehouse details and availability.'
          : 'Create a new warehouse to hold stock.'
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            className={primaryButtonClass}
            disabled={saving}
          >
            {saving ? 'Saving…' : warehouse ? 'Save changes' : 'Create warehouse'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <FormField label="Warehouse name" required error={nameError ?? undefined}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Central Warehouse"
            className={`${textInputClass} ${nameError ? invalidTextInputClass : ''}`}
          />
        </FormField>

        <FormField label="Warehouse code" hint="Optional — short unique code, e.g. WH-CENTRAL.">
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. WH-CENTRAL"
            className={textInputClass}
          />
        </FormField>

        <FormField label="Address" hint="Optional — street, city or landmark.">
          <input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="e.g. 12th Street, Industrial Area"
            className={textInputClass}
          />
        </FormField>

        <FormField label="Status">
          <div className="flex gap-2">
            {WAREHOUSE_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`${secondaryButtonClass} ${
                  status === option
                    ? '!border-[var(--dni-primary)] !bg-[var(--dni-primary-soft)] !text-[var(--dni-primary-700)]'
                    : ''
                }`}
              >
                {option === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </FormField>
      </div>
    </ModalDrawer>
  )
}

export default WarehouseFormModal
