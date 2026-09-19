export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export type NormalBalance = 'DEBIT' | 'CREDIT'

export type AccountingAccountDefinition = {
  id: string
  code: string
  name: string
  type: AccountType
  parentCode: string | null
  normalBalance: NormalBalance
  description: string
  status: AccountStatus
}

export type AccountDefinitionDraft = Omit<AccountingAccountDefinition, 'id' | 'normalBalance'>

export const NORMAL_BALANCE_BY_TYPE: Record<AccountType, NormalBalance> = {
  ASSET: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  REVENUE: 'CREDIT',
  EXPENSE: 'DEBIT',
}