import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  AVAILABILITY_LABELS,
  WAREHOUSE_STATUS_LABELS,
  type AvailabilityStatus,
  type WarehouseStatus,
} from '../types/warehouseTypes'

export const AVAILABILITY_TONES: Record<AvailabilityStatus, BadgeTone> = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'danger',
}

export const WAREHOUSE_STATUS_TONES: Record<WarehouseStatus, BadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

type StockStatusBadgeProps = {
  status: AvailabilityStatus
  size?: 'sm' | 'md'
}

export const StockStatusBadge = ({ status, size = 'sm' }: StockStatusBadgeProps) => (
  <StatusBadge
    label={AVAILABILITY_LABELS[status]}
    tone={AVAILABILITY_TONES[status]}
    size={size}
  />
)

type WarehouseStatusBadgeProps = {
  status: WarehouseStatus
  size?: 'sm' | 'md'
}

export const WarehouseStatusBadge = ({
  status,
  size = 'sm',
}: WarehouseStatusBadgeProps) => (
  <StatusBadge
    label={WAREHOUSE_STATUS_LABELS[status]}
    tone={WAREHOUSE_STATUS_TONES[status]}
    size={size}
  />
)

export default StockStatusBadge
