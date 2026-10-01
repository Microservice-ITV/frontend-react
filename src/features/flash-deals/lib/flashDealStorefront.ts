import type { FlashDealApiItem } from '@/lib/api/flashDealClient'

/** Deal windows are short, so the storefront re-reads the projection often. */
export const FLASH_DEAL_STOREFRONT_REFRESH_MS = 45_000

const toTime = (value: string | null | undefined): number | null => {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * A deal only renders on the storefront while `startAt <= now <= endAt`. The
 * read model also carries the status projection, so a deal can legitimately be
 * ACTIVE while its window has not opened yet — that is not an active deal and
 * must not be shown as one.
 */
export const isFlashDealLive = (
  item: FlashDealApiItem,
  now: number = Date.now(),
): boolean => {
  const start = toTime(item.startAt)
  const end = toTime(item.endAt)

  if (start == null && end == null) return true
  if (start != null && start > now) return false
  if (end != null && end <= now) return false

  return true
}

export const selectLiveFlashDeals = (
  items: FlashDealApiItem[] | undefined,
  now: number = Date.now(),
): FlashDealApiItem[] => (items ?? []).filter((item) => isFlashDealLive(item, now))
