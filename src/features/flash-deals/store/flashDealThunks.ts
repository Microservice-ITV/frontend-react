import { createAsyncThunk } from '@reduxjs/toolkit'
import { flashDealAdminApi } from '../api/flashDealAdminApi'
import type { FlashDeal, CreateFlashDealPayload, UpdateFlashDealPayload, FlashDealsResponse } from '../types/flashDealTypes'

const extractErrorMessage = (error: unknown): string => {
  const err = error as {
    response?: {
      data?: {
        message?: string
        error?: { message?: string }
        statusCode?: number
      }
    }
    message?: string
  }
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error?.message ??
    (error instanceof Error ? error.message : 'Unknown error')
  )
}

export const fetchFlashDeals = createAsyncThunk<FlashDealsResponse, void | { page?: number; limit?: number; status?: string; slotTime?: string }, { rejectValue: string }>(
  'flashDeals/fetchFlashDeals',
  async (params, { rejectWithValue }) => {
    try {
      const query = (params ?? undefined) as { page?: number; limit?: number; status?: string; slotTime?: string } | undefined
      const response = await flashDealAdminApi.getAll(query)
      return response
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to load flash deals')
    }
  }
)

export const fetchFlashDealById = createAsyncThunk<FlashDeal, string, { rejectValue: string }>(
  'flashDeals/fetchFlashDealById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.getById(id)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to load flash deal')
    }
  }
)

export const createFlashDeal = createAsyncThunk<FlashDeal, CreateFlashDealPayload, { rejectValue: string }>(
  'flashDeals/createFlashDeal',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.create(payload)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to create flash deal')
    }
  }
)

export const updateFlashDeal = createAsyncThunk<FlashDeal, { id: string; payload: UpdateFlashDealPayload }, { rejectValue: string }>(
  'flashDeals/updateFlashDeal',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.update(id, payload)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to update flash deal')
    }
  }
)

export const deleteFlashDeal = createAsyncThunk<string, string, { rejectValue: string }>(
  'flashDeals/deleteFlashDeal',
  async (id, { rejectWithValue }) => {
    try {
      await flashDealAdminApi.delete(id)
      return id
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to delete flash deal')
    }
  }
)

export const publishFlashDeal = createAsyncThunk<FlashDeal, string, { rejectValue: string }>(
  'flashDeals/publishFlashDeal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.publish(id)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to publish flash deal')
    }
  }
)

export const activateFlashDeal = createAsyncThunk<FlashDeal, string, { rejectValue: string }>(
  'flashDeals/activateFlashDeal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.activate(id)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to activate flash deal')
    }
  }
)

export const pauseFlashDeal = createAsyncThunk<FlashDeal, string, { rejectValue: string }>(
  'flashDeals/pauseFlashDeal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.pause(id)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to pause flash deal')
    }
  }
)

export const cancelFlashDeal = createAsyncThunk<FlashDeal, string, { rejectValue: string }>(
  'flashDeals/cancelFlashDeal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.cancel(id)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to cancel flash deal')
    }
  }
)

export const updateFlashDealStock = createAsyncThunk<
  FlashDeal,
  { id: string; items: Array<{ itemId: string; allocatedQuantity: number }> },
  { rejectValue: string }
>(
  'flashDeals/updateFlashDealStock',
  async ({ id, items }, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.updateStock(id, { items })
      return response.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to update flash deal stock')
    }
  }
)