import type { AccountingIncomeLine } from '@/features/accounting/types/accountingTypes'

const normalizeShopId = (value: string) => value.trim().toLowerCase()

const extractShopId = (value?: string | null) => {
  if (!value) return null
  const match = value.match(/(?:^|[\s,(])shop(?:_id)?=([^,\s)]+)/i)
  return match?.[1]?.trim() ?? null
}

export const getShopIncomeTotal = (
  entries: AccountingIncomeLine[] | undefined,
  shopIds: string[],
  fromDate: string,
  toDate: string,
) => {
  const allowedShopIds = new Set(shopIds.map(normalizeShopId))

  return (entries ?? []).reduce((total, entry) => {
    if (entry.direction !== 'CREDIT' || entry.account.type !== 'INCOME') {
      return total
    }

    const entryDate = entry.journalEntry.entryDate.slice(0, 10)
    if (entryDate < fromDate || entryDate > toDate) return total

    const rawShopId =
      extractShopId(entry.memo ?? entry.journalEntry.narration) ??
      extractShopId(entry.journalEntry.narration)
    const shopId =
      rawShopId ?? (allowedShopIds.size === 1 ? [...allowedShopIds][0] : null)

    if (!shopId || !allowedShopIds.has(normalizeShopId(shopId))) return total
    return total + Number(entry.amount)
  }, 0)
}
