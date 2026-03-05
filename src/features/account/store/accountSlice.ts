import { createSlice } from '@reduxjs/toolkit'
import type { UserAddress } from '../types/addressTypes'
import {
  fetchUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
} from './accountThunks'

interface AccountState {
  addresses: UserAddress[]
  loading: boolean
  mutating: boolean
  error: string | null
}

const initialState: AccountState = {
  addresses: [],
  loading: false,
  mutating: false,
  error: null,
}

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    clearAccountAddresses(state) {
      state.addresses = []
      state.loading = false
      state.mutating = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.addresses = action.payload
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to load addresses.'
      })

      .addCase(createUserAddress.pending, (state) => {
        state.mutating = true
        state.error = null
      })
      .addCase(createUserAddress.fulfilled, (state, action) => {
        state.mutating = false
        const created = action.payload
        if (created.is_default) {
          state.addresses = state.addresses.map((addr) => ({ ...addr, is_default: false }))
        }
        state.addresses = [created, ...state.addresses]
      })
      .addCase(createUserAddress.rejected, (state, action) => {
        state.mutating = false
        state.error = action.payload ?? 'Failed to create address.'
      })

      .addCase(updateUserAddress.pending, (state) => {
        state.mutating = true
        state.error = null
      })
      .addCase(updateUserAddress.fulfilled, (state, action) => {
        state.mutating = false
        const updated = action.payload
        if (updated.is_default) {
          state.addresses = state.addresses.map((addr) => ({ ...addr, is_default: false }))
        }
        state.addresses = state.addresses.map((addr) =>
          addr.address_id === updated.address_id ? updated : addr,
        )
      })
      .addCase(updateUserAddress.rejected, (state, action) => {
        state.mutating = false
        state.error = action.payload ?? 'Failed to update address.'
      })

      .addCase(deleteUserAddress.pending, (state) => {
        state.mutating = true
        state.error = null
      })
      .addCase(deleteUserAddress.fulfilled, (state, action) => {
        state.mutating = false
        state.addresses = state.addresses.filter((addr) => addr.address_id !== action.payload)
      })
      .addCase(deleteUserAddress.rejected, (state, action) => {
        state.mutating = false
        state.error = action.payload ?? 'Failed to delete address.'
      })

      .addCase(setDefaultUserAddress.pending, (state) => {
        state.mutating = true
        state.error = null
      })
      .addCase(setDefaultUserAddress.fulfilled, (state, action) => {
        state.mutating = false
        const selectedId = action.payload
        state.addresses = state.addresses.map((addr) => ({
          ...addr,
          is_default: addr.address_id === selectedId,
        }))
      })
      .addCase(setDefaultUserAddress.rejected, (state, action) => {
        state.mutating = false
        state.error = action.payload ?? 'Failed to set default address.'
      })
  },
})

export const { clearAccountAddresses } = accountSlice.actions
export default accountSlice.reducer
