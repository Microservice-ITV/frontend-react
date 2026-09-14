import { createAsyncThunk } from '@reduxjs/toolkit'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { promoCardApi } from '../api/promoCardApi'
import type { PromoCard, CreatePromoCardPayload, UpdatePromoCardPayload } from '../types/promoCardTypes'

const toViewModel = (card: PromoCard): PromoCard => ({
  ...card,
  imageUrl: card.imageUrl ? productServiceAssetUrl(card.imageUrl) : card.imageUrl,
})

const extractErrorMessage = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string; error?: { message?: string }; statusCode?: number } }; message?: string }
  console.log('Full error response:', JSON.stringify(err?.response?.data, null, 2))
  return err?.response?.data?.message ?? err?.response?.data?.error?.message ??
    (error instanceof Error ? error.message : 'Unknown error')
}

export const fetchPromoCards = createAsyncThunk<PromoCard[], void, { rejectValue: string }>(
  'promoCards/fetchPromoCards', async (_, { rejectWithValue }) => {
    try {
      const response = await promoCardApi.getAll()
      return (response.data ?? []).map(toViewModel)
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to load promo cards')
    }
  }
)

export const fetchPromoCardById = createAsyncThunk<PromoCard, string, { rejectValue: string }>(
  'promoCards/fetchPromoCardById', async (id, { rejectWithValue }) => {
    try {
      const response = await promoCardApi.getById(id)
      return toViewModel(response.data)
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to load promo card')
    }
  }
)

export const createPromoCard = createAsyncThunk<PromoCard, CreatePromoCardPayload, { rejectValue: string }>(
  'promoCards/createPromoCard', async (payload, { rejectWithValue }) => {
    try {
      const response = await promoCardApi.create(payload)
      return toViewModel(response.data)
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to create promo card')
    }
  }
)

export const updatePromoCard = createAsyncThunk<PromoCard, { id: string; payload: UpdatePromoCardPayload }, { rejectValue: string }>(
  'promoCards/updatePromoCard', async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await promoCardApi.update(id, payload)
      return toViewModel(response.data)
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to update promo card')
    }
  }
)

export const deletePromoCard = createAsyncThunk<string, string, { rejectValue: string }>(
  'promoCards/deletePromoCard', async (id, { rejectWithValue }) => {
    try {
      await promoCardApi.delete(id)
      return id
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error) || 'Failed to delete promo card')
    }
  }
)