import type { FlashDealStatus } from '../types/flashDealTypes'

const FLASH_DEAL_CHIP_STYLES: Record<FlashDealStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  SCHEDULED: 'bg-sky-100 text-sky-700 ring-sky-500/10',
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-500/10',
  ENDED: 'bg-violet-100 text-violet-700 ring-violet-500/10',
  CANCELLED: 'bg-rose-100 text-rose-700 ring-rose-500/10',
  PAUSED: 'bg-amber-100 text-amber-700 ring-amber-500/10',
}

export const getFlashDealChipStyle = (status: FlashDealStatus): string =>
  FLASH_DEAL_CHIP_STYLES[status] ?? FLASH_DEAL_CHIP_STYLES.DRAFT