import type { RootState } from '@/app/store'

export const selectAccountAddresses = (state: RootState) => state.account.addresses
export const selectAccountAddressesLoading = (state: RootState) => state.account.loading
export const selectAccountAddressesMutating = (state: RootState) => state.account.mutating
export const selectAccountAddressesError = (state: RootState) => state.account.error

export const selectDefaultAddress = (state: RootState) =>
  state.account.addresses.find((addr) => addr.is_default) ?? state.account.addresses[0] ?? null
