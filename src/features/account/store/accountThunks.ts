import { createAsyncThunk } from '@reduxjs/toolkit'
import { addressApi } from '../api/addressApi'
import type { UpsertAddressPayload, UserAddress } from '../types/addressTypes'

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
  }
  return fallback
}

export const fetchUserAddresses = createAsyncThunk<
  UserAddress[],
  string,
  { rejectValue: string }
>('account/fetchUserAddresses', async (userId, { rejectWithValue }) => {
  try {
    const res = await addressApi.list(userId)
    return res.data.data.addresses
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to load addresses.'))
  }
})

export const createUserAddress = createAsyncThunk<
  UserAddress,
  { userId: string; payload: UpsertAddressPayload },
  { rejectValue: string }
>('account/createUserAddress', async ({ userId, payload }, { rejectWithValue }) => {
  try {
    const res = await addressApi.create(userId, payload)
    return res.data.data.address
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to create address.'))
  }
})

export const updateUserAddress = createAsyncThunk<
  UserAddress,
  { userId: string; addressId: string; payload: UpsertAddressPayload },
  { rejectValue: string }
>('account/updateUserAddress', async ({ userId, addressId, payload }, { rejectWithValue }) => {
  try {
    const res = await addressApi.update(userId, addressId, payload)
    return res.data.data.address
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to update address.'))
  }
})

export const deleteUserAddress = createAsyncThunk<
  string,
  { userId: string; addressId: string },
  { rejectValue: string }
>('account/deleteUserAddress', async ({ userId, addressId }, { rejectWithValue }) => {
  try {
    await addressApi.delete(userId, addressId)
    return addressId
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to delete address.'))
  }
})

export const setDefaultUserAddress = createAsyncThunk<
  string,
  { userId: string; addressId: string },
  { rejectValue: string }
>('account/setDefaultUserAddress', async ({ userId, addressId }, { rejectWithValue }) => {
  try {
    await addressApi.setDefault(userId, addressId)
    return addressId
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to set default address.'))
  }
})