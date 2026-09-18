import { accountingClient } from '@/lib/api/accountingClient'
import type { AccountDefinitionDraft, AccountingAccountDefinition, AccountStatus, AccountType } from '../types/accountTypes'

type AccountingServiceAccount = {
  id: string
  code: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  status: AccountStatus
  description: string | null
  parent: { id: string; code: string; name: string } | null
}

const toUiType = (type: AccountingServiceAccount['type']): AccountType => type === 'INCOME' ? 'REVENUE' : type
const toServiceType = (type: AccountType): AccountingServiceAccount['type'] => type === 'REVENUE' ? 'INCOME' : type

const mapAccount = (account: AccountingServiceAccount): AccountingAccountDefinition => ({
  id: account.id,
  code: account.code,
  name: account.name,
  type: toUiType(account.type),
  parentCode: account.parent?.code ?? null,
  normalBalance: account.type === 'ASSET' || account.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT',
  description: account.description ?? '',
  status: account.status,
})

const toPayload = (draft: AccountDefinitionDraft) => ({
  code: draft.code,
  name: draft.name,
  type: toServiceType(draft.type),
  parentCode: draft.parentCode,
  description: draft.description,
  status: draft.status,
})

export const accountingAccountsAdapter = {
  async list(): Promise<AccountingAccountDefinition[]> {
    const response = await accountingClient.get<AccountingServiceAccount[]>('/accounts')
    return response.data.map(mapAccount)
  },

  async create(draft: AccountDefinitionDraft): Promise<AccountingAccountDefinition> {
    const response = await accountingClient.post<AccountingServiceAccount>('/accounts', toPayload(draft))
    return mapAccount(response.data)
  },

  async update(code: string, draft: AccountDefinitionDraft): Promise<AccountingAccountDefinition> {
    const response = await accountingClient.patch<AccountingServiceAccount>(`/accounts/${encodeURIComponent(code)}`, toPayload(draft))
    return mapAccount(response.data)
  },

  async toggleStatus(code: string): Promise<AccountingAccountDefinition> {
    const response = await accountingClient.patch<AccountingServiceAccount>(`/accounts/${encodeURIComponent(code)}/status`)
    return mapAccount(response.data)
  },
}